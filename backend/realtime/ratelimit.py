"""Distributed rate limiting for the real-time gateway.

Implements a token-bucket algorithm backed by Redis (atomic Lua script) with a
per-process in-memory fallback when Redis is unavailable. Two limiters exist:

  * connect limiter  - handshakes per IP / per user (flood protection)
  * message limiter  - inbound messages per connection (flood protection)

All failures open (allow) but increment rtc_redis_errors_total; the in-memory
fallback keeps single-node protection active even during Redis outages.
"""

from __future__ import annotations

import time
from typing import Dict, Tuple

from realtime.metrics import M_REDIS_ERRORS, M_REDIS_LATENCY

# Lua token bucket: KEYS[1]=bucket key, ARGV capacity, refill_rate, now_ms, cost
_TOKEN_BUCKET_LUA = """
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local cost = tonumber(ARGV[4])
local bucket = redis.call('HMGET', key, 'tokens', 'ts')
local tokens = tonumber(bucket[1])
local ts = tonumber(bucket[2])
if tokens == nil then
  tokens = capacity
  ts = now
end
local elapsed = math.max(0, now - ts)
tokens = math.min(capacity, tokens + elapsed * refill_rate / 1000.0)
local allowed = 0
if tokens >= cost then
  tokens = tokens - cost
  allowed = 1
end
redis.call('HMSET', key, 'tokens', tokens, 'ts', now)
redis.call('PEXPIRE', key, math.ceil(capacity / refill_rate * 1000) + 60000)
return {allowed, math.floor(tokens)}
"""


class TokenBucketLimiter:
    def __init__(self, redis_client, capacity: float, refill_per_sec: float, prefix: str):
        self._redis = redis_client
        self._capacity = float(capacity)
        self._rate = float(refill_per_sec)
        self._prefix = prefix
        self._script = None
        self._mem: Dict[str, Tuple[float, float]] = {}

    async def allow(self, key: str, cost: float = 1.0) -> bool:
        full_key = f"{self._prefix}:{key}"
        now_ms = int(time.time() * 1000)
        if self._redis is not None:
            try:
                if self._script is None:
                    self._script = self._redis.register_script(_TOKEN_BUCKET_LUA)
                start = time.perf_counter()
                result = await self._script(
                    keys=[full_key],
                    args=[self._capacity, self._rate, now_ms, cost],
                )
                M_REDIS_LATENCY.observe((time.perf_counter() - start) * 1000)
                return bool(result[0])
            except Exception:
                M_REDIS_ERRORS.inc()
                self._redis = None  # degrade to in-memory for the process lifetime
        # In-memory fallback
        tokens, ts = self._mem.get(full_key, (self._capacity, now_ms))
        tokens = min(self._capacity, tokens + (now_ms - ts) * self._rate / 1000.0)
        allowed = tokens >= cost
        if allowed:
            tokens -= cost
        self._mem[full_key] = (tokens, now_ms)
        return allowed


class RateLimiterRegistry:
    """Central configuration point; instances are created by the gateway."""

    def __init__(self, redis_client):
        self.redis = redis_client
        # Handshakes: burst 15, sustained 3/s per key (IP or user)
        self.connect = TokenBucketLimiter(redis_client, 15, 3, "rl:conn")
        # Inbound messages: burst 40, sustained 20/s per connection
        self.messages = TokenBucketLimiter(redis_client, 40, 20, "rl:msg")
        # GPS pushes: burst 20, sustained 5/s per user (client batches anyway)
        self.location = TokenBucketLimiter(redis_client, 20, 5, "rl:loc")
