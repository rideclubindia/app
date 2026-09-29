# RideClub Real-Time Platform — Architecture

Production-grade, horizontally-scalable WebSocket infrastructure for **100,000+
concurrent users**, built on the existing stack (FastAPI + python-socketio +
Redis + Supabase Postgres) with **zero new runtime dependencies**.

---

## 1. Overall architecture

```text
                        100K+ concurrent users
                                 |
                          CDN / WAF (optional)
                                 |
                     Load Balancer (wss passthrough)
                    - no sticky sessions required
                                 |
        +------------------------+------------------------+
        |                        |                        |
    WS Node 1               WS Node 2                WS Node N
  (FastAPI+socket.io)     (FastAPI+socket.io)      (FastAPI+socket.io)
  AsyncRedisManager       AsyncRedisManager        AsyncRedisManager
        |                        |                        |
        +------------------------+------------------------+
                                 |
                          Redis (pub/sub + state)
        +------------------------+------------------------+
        |            |                 |                   |
   pub/sub fanout  presence       rate limits        event streams
        |            |                 |                   |
        +------------------------+------------------------+
                                 |
              +------------------+------------------+
              |                                     |
      Location Pipeline                     Critical Events
   (gate -> coalesce -> batch)            (seq -> stream -> PG)
              |                                     |
              +------------------+------------------+
                                 |
                    Supabase Postgres (+ PostGIS)
              ride_locations (batched) | ride_events (audit)
```

**Why Socket.IO (python-socketio) instead of raw WebSockets:**
- `socket.io-client` was already a frontend dependency (unused) and
  `python-socketio` was already mounted in the backend — the platform replaces
  the hollow stub with a production gateway instead of adding a new stack.
- Built-in rooms, ack callbacks, auto-reconnect with backoff/jitter, and
  `AsyncRedisManager` for multi-node fanout — all of which raw `ws` would
  require us to build and maintain.
- Fallback transports (polling) survive hostile mobile networks.

**Why Redis (not Kafka/NATS):** Redis is already required (Celery broker,
docker-compose). At the target scale the broker workload is bounded by design
(location fan-out is gated+coalesced; critical events are rare), so Redis
Pub/Sub + Streams covers fanout, recovery and rate limiting with one
technology. Kafka becomes interesting only when event retention/audit at
million-msg/s scale is required (see §Known limitations).

## 2. WebSocket lifecycle

```
handshake ──► verify JWT (HS256, JWT_SECRET, uid claim)
        │        ├─ invalid ──► ConnectionRefused (AUTH_FAILED)
        │        ├─ expired ──► ConnectionRefused (TOKEN_EXPIRED)
        │        └─ flood ────► ConnectionRefused (RATE_LIMITED)
        ├─► per-user device cap (default 5, oldest evicted)
        ├─► session registered in Redis (24h TTL) — recovery possible
        ├─► rooms restored from session record (re-authz per ride)
        ├─► CONNECTED ack {sessionId, restoredRooms, node}
        ▼
live events  ◄── ping/pong every 25s (socket.io) + idle sweep (30 min)
        ▼
disconnect ─► presence removed; session + rooms + seq survive for reconnect
```

- **Duplicate connections / multi-device**: allowed up to `RTC_MAX_DEVICES_PER_USER`;
  oldest session is disconnected when the cap is exceeded (newest wins).
- **Graceful shutdown / draining**: SIGTERM → readiness flips to 503 →
  `server` event (`SERVER_DRAINING`) broadcast → 2 s grace → connections
  closed. Clients reconnect (backoff) and land on healthy nodes.
- **Idle handling**: connections with no inbound traffic for
  `RTC_IDLE_TIMEOUT_S` (default 1800 s) are swept.

## 3. Authentication flow

1. Client logs in with Firebase Google sign-in (existing flow).
2. `/api/v1/auth/firebase-login` verifies the Firebase ID token and issues the
   backend JWT — now including a **`uid` claim** (verified Firebase UID).
3. The socket handshake carries `{ token, sessionId }` in the Socket.IO auth
   payload. The server verifies the JWT **only** — user id, role and ride
   membership are always derived server-side. Client-supplied user ids are
   never trusted anywhere in the pipeline.
4. Ride identity = `uid` mapped through the same deterministic-UUID function
   the app uses for `ride_members.user_id` (36-char ids pass through).
5. Mid-session expiry: client emits `auth:refresh` with a fresh token, or the
   manager re-mints via Firebase on `connect_error` and reconnects.

## 4. Reconnection / recovery flow

```
disconnect (network switch, node crash, deployment)
   │
   ▼
socket.io auto-reconnect (0.5s → 8s exponential, 50% jitter)
   │
   ▼
handshake with same sessionId ──► rooms restored from Redis session record
   │                               (each re-authorized against ride_members)
   ▼
CONNECTED ack ──► client sends ride:sync {ride, lastSeq} per ride
   │
   ▼
server replays missed CRITICAL events from Redis Stream (XREAD after seq)
   │
   ▼
server sends ride:snap (latest locations from Redis cache) ──► live resumes
```

- Ephemeral data (positions) is **snapshot + latest-wins** — no replay needed.
- Critical data (SOS, ride updates) is **sequenced + streamed** — nothing missed.
- Duplicate/out-of-order delivery is handled by per-ride monotonic `seq` and
  event `eventId` (clients ignore older seqs; acks are idempotent).

## 5. Ride room architecture

| Room | Purpose | Authorization |
|---|---|---|
| `user:{member_id}` | personal events (future: notifications) | self only |
| `ride:{ride_id}` | live locations, ride events | approved member or owner (server-checked against `ride_members`/`rides`, cached 60 s) |
| `pins` | public incident feed (opt-in) | any authenticated user |

Joining emits a `ride:snap` snapshot so the map fills instantly. Leaving a
ride (or being removed) unsubscribes the socket and invalidates the membership
cache; kicked users are removed live by the gateway.

## 6. Navigation architecture (client)

- Navigation state, realtime state and UI state are separated:
  - `useLocationStore` (zustand) — GPS/UI state (unchanged)
  - `useRealtimeStore` — connection status only (tiny, isolated subscribers)
  - component state — maps/markers (unchanged)
- WS events never trigger app-wide re-renders: LiveRide merges `loc` payloads
  into its existing riders map and marker layer (same as the Supabase channel
  it sits beside).
- Client sends are adaptive (see §7) so navigation/GPS processing is never
  blocked by network work; sends are fire-and-forget with server acks.

## 7. Location-update pipeline

```
watchPosition fix (client)
   │  client gate: ≥3s while moving / ≥20s stationary / ≥8m moved
   ▼
loc:p batch (≤5 fixes) ──► WS (or REST /location/update fallback)
   │
   ▼  server
ownership from JWT ──► membership check (cached) ──► server gate:
   min 2s moving / 15s stationary, ≥5m moved (jitter suppression)
   │
   ├─► Redis loc:ride:{id} hash (snapshot source, TTL 2h)
   ├─► coalescer: latest-wins per (ride,rider), flush ≤1 broadcast / 1.5 s
   │        └─► emit loc to ride room ONLY (never global)
   └─► persistence queue (bounded 10k, drop-oldest)
            └─► batch upsert ride_locations every 5 s / 200 rows
                (thread executor — hot path never blocks on Postgres)
```

A user's location is **never broadcast globally**; it reaches only the rooms
of rides they belong to.

## 8. Redis architecture

| Mechanism | Used for |
|---|---|
| Pub/Sub (`AsyncRedisManager`) | emit fan-out across nodes — any node → any room |
| Keys with TTL | presence (90 s heartbeat), sessions (24 h), membership cache (60 s), latest locations (2 h) |
| `INCR` counters | per-ride event sequence numbers |
| Streams (`XADD`, MAXLEN 1000) | critical-event log for recovery replay |
| Lua token bucket | distributed rate limiting (connect/messages/location) |

Ephemeral vs critical is enforced structurally: locations live only in cache +
coalescer + batched writes; critical events always hit Stream + `ride_events`
table before fan-out.

## 9. Database interaction

- **Hot path (locations)**: batched upserts every 5 s (≤200 rows/batch) on a
  worker thread. At 50 K active riders that is ≤10 K upserts/min — a fraction
  of one Postgres connection's capacity. No per-fix writes.
- **Critical events**: single insert into `ride_events` per event (rare),
  executed off the event loop.
- **Membership**: one indexed query per (ride,user) with 60 s Redis caching;
  join storms hit the cache, not the DB.
- Requires unique index `uq_ride_locations_ride_user (ride_id, user_id)`
  (migration `supabase/migrations/20260826_realtime_platform_support.sql`).

## 10. Failure recovery

| Failure | Behaviour |
|---|---|
| Client network switch | socket.io reconnect + session/room restore + `ride:sync` replay |
| WS node crash | LB health check removes node; clients reconnect to other nodes; Redis state intact |
| Redis down | gateway degrades: in-memory rate limits, no recovery streams, direct emits (single-node); auto-recovers |
| Postgres down | locations keep flowing (cache + fan-out); persistence queue absorbs bursts, drops oldest under pressure; events error-logged |
| LB failure | clients reconnect with backoff+jitter (no thundering herd) |
| Deployment | draining via readiness probe + `SERVER_DRAINING` notice |

## 11. Scaling strategy

- Stateless gateway nodes — add replicas behind the LB; Redis manager handles
  cross-node fan-out. **No sticky sessions needed** (websocket connections are
  inherently pinned; polling fallback works because emits route via Redis).
- Scale trigger: sustained `rtc_active_connections` > 25 K/node or handler
  p95 > 50 ms → add a node.
- Redis: single master up to ~100 K users with headroom; move to Redis Cluster
  (or sentinel failover) beyond ~200–300 K or if pub/sub bandwidth saturates.
- Postgres: batched writes keep DB load flat as connections grow; Supabase
  pooler connection count is bounded by the small executor pool per node.

## 12. Security model

- JWT verified on every handshake; `TOKEN_EXPIRED` distinct from `AUTH_FAILED`.
- Identity, roles and ride membership resolved **server-side only**.
- Room-level authorization on join, on location push, and on sync.
- Rate limits: connect (burst 15 / 3 s⁻¹ per IP and per user), messages
  (burst 40 / 20 s⁻¹ per connection), location (burst 20 / 5 s⁻¹ per user).
- 1 MB max packet size; payload shape validated; batch length capped (20).
- Origins restricted via `ALLOWED_ORIGINS` (shared by HTTP and WS).
- Abuse: sustained flooding → drops + counters; idle sweeper removes zombies.

## 13. Monitoring

`GET /metrics` (Prometheus text format) exposes:
- connections: `rtc_active_connections`, `rtc_connects_total`,
  `rtc_disconnects_total`, `rtc_connect_failures_total`
- traffic: `rtc_messages_in/out_total`, `rtc_bytes_in/out_total`,
  `rtc_messages_dropped_total`
- pipeline: `rtc_loc_received/gated/broadcast/coalesced/persisted_total`,
  `rtc_loc_flush_batches_total`, `rtc_loc_pending`
- latency: `rtc_handler_duration_ms`, `rtc_event_roundtrip_ms`,
  `rtc_redis_op_ms`, `rtc_loc_flush_duration_ms`
- reliability: `rtc_redis_errors_total`, `rtc_db_errors_total`

`GET /readyz` for LB/K8s readiness (draining + Redis check). Structured JSON
application logs; every critical event carries `eventId`/`seq` usable as a
correlation id end-to-end.

## 14. Load testing

Harness: `backend/loadtest/runner.py` (asyncio socket.io clients + `/metrics`
scraping). Scenarios map to the spec:

| Scenario | Command |
|---|---|
| A — idle connections | `--scenario idle --users 100000` (split across machines) |
| B — heartbeats | `--scenario heartbeat --users 100000` |
| C — navigation mix | `--scenario navigation --users 50000` |
| D — location storm | `--scenario locations --users 50000` |
| E — ride join storms | `--scenario rides --users 20000 --ramp 500` |
| F — node failure | kill a node mid-run; watch reconnect + recovery counters |
| G — Redis degradation | `docker pause redis` mid-run; verify degraded mode + recovery |
| H — mass reconnect | `--scenario reconnect --users 20000` (5 % churn/tick) |

Each run prints P50/P95/P99, error rate, and server metric deltas, and writes
`loadtest-results-*.json` for regression comparison. **Run the staged ladder
(1K → 5K → 10K → 25K → 50K → 75K → 100K) against a production-like
deployment before claiming capacity.**

## 15. Deployment architecture

- **Local dev**: `docker compose up` (api + worker + PostGIS + redis), or
  `uvicorn main:app` with `REDIS_URL` unset → degraded single-node mode.
- **Render (current)**: single service works today; add a Redis add-on and set
  `REDIS_URL` before running >1 instance.
- **Kubernetes (k8s/deployment.yaml)**: 3+ replicas, readiness `/readyz`,
  liveness `/health`, `terminationGracePeriodSeconds: 30` for draining.
  Scale replicas for 100 K (see capacity below). Use an ingress/LB with
  websocket support (e.g. NGINX ingress with `proxy-read-timeout ≥ 60s`) or a
  cloud LB with websocket target groups.
- **Redis HA**: managed Redis with replication + automatic failover.
- Rolling deploys rely on readiness + draining; no maintenance window needed.

---

## Capacity planning (estimates — benchmark before trusting)

Assumptions: 100 K connected users; 50 K in rides; 20 K actively moving;
client gate 1 fix / 3 s; server coalescer 1 broadcast / 1.5 s per active rider.

| Metric | Estimate | Basis |
|---|---|---|
| Connections per node | **20–30 K** | uvicorn/uvloop + socket.io overhead; benchmark per node type |
| Nodes for 100 K | **4–6** (plus 1 spare) | connections/node |
| Memory per connection | ~40–80 KB app + engineio buffers | measured in prior socket.io deployments; **must benchmark** |
| Node RAM for 25 K conns | 2–4 GB | above × overhead |
| Inbound location msgs | ~6.7 K/s (20 K riders ÷ 3 s) | client gate |
| Outbound location msgs | ~13 K/s (20 K riders ÷ 1.5 s, avg room size ~2–4) | coalescer × room size |
| Redis pub/sub bandwidth | ~2–6 MB/s | compact `loc` envelopes (~150–300 B) |
| Redis ops | ~15–30 K/s | gate cache, presence, rate limits |
| DB writes | ≤10 K upserts/min | 50 K riders ÷ 5 s flush |
| LB | must support 100 K concurrent WSS conns, ~50 K new conns/min during reconnect storms | cloud LB limits vary — verify |

**Must be benchmarked, not guessed:** per-node connection ceiling (memory +
FD limits — raise `ulimit -n`/`fs.file-max`), CPU per 10 K msg/s, Redis pub/sub
saturation point, reconnect-storm behaviour, p99 under peak fan-out.

---

## What is actually implemented vs. what is proven

**Implemented (code):** authenticated gateway, rooms + server-side
authorization, adaptive location pipeline (gate → coalesce → batch persist),
critical-event sequencing + Redis-stream recovery, session restore,
multi-node fan-out via Redis manager, rate limiting, backpressure (source
coalescing + bounded queues), draining/graceful shutdown, metrics + readiness,
client singleton manager with reconnect/recovery/REST-fallback, load-test
harness, migrations, docs.

**Not yet proven (requires infrastructure + load tests):**
- 100 K concurrent connections — requires 4–6 deployed nodes + managed Redis;
  run the §14 ladder and record P50/P95/P99, error rates, node CPU/RAM.
- Redis Cluster failover behaviour under traffic.
- Reconnect-storm handling at LB level.
- Long-run soak (memory growth, FD leaks).

**Recently added** (see `WebSocket Architecture.md` at the repo root for the
full audit this came from):
- A dedicated SOS priority stream (`store.append_sos_event`/
  `gateway.publish_sos_event`, `stre:sos:{ride_id}`, `SOS_STREAM_MAXLEN=20000`)
  so SOS/emergency events never share the general critical-event stream's
  trim window with ordinary ride churn.
- A local per-node event-loop-lag gauge (`rtc_event_loop_lag_ms`) and
  load-level gauge (`rtc_load_level`) feeding a graceful-degradation lever
  that widens the location-coalescing window under high/critical lag — the
  existing k8s HPA (`backend/k8s/hpa.yaml`) still only scales on CPU/memory,
  so this local lever is a stopgap until a custom-metrics-based HPA is wired
  up, not a replacement for one.
- Explicit per-instance (`RTC_MAX_CONNECTIONS_PER_INSTANCE`, default 30000)
  and per-IP (`RTC_MAX_CONNECTIONS_PER_IP`, default 200) connection caps in
  `on_connect` — distinct from the existing handshake-frequency rate
  limiter, which throttles connect *rate*, not concurrent *count*.
- Abusive-session auto-disconnect: a session that keeps hitting the message
  rate limiter past `RTC_MAX_MESSAGE_VIOLATIONS` (default 20) is disconnected
  outright rather than left consuming handler time on every rejected message.
- A cross-node control channel (`gateway.broadcast_control` /
  `Gateway._control_loop`, Redis pub/sub channel `rtc:control`) — this is
  what actually wires up `handle_kick` (previously documented as intended,
  callable, but never invoked from anywhere) and adds
  `force_disconnect_user` for the revoked/suspended-user case the base spec
  calls for. A REST router (e.g. a future admin suspend-user action) calls
  `broadcast_control("disconnect_user", member_id=...)`; every node
  subscribed to the channel disconnects that user's sessions if it holds any.
  No-ops safely in degraded (Redis-unavailable) single-node mode.

**Known limitations / next improvements**
1. python-socketio per-node ceiling is lower than Go/NGINX njs equivalents —
   if a single node must hold >50 K sockets, consider a Rust/Go edge gateway.
2. Recovery streams are per-ride Redis Streams with MAXLEN 1000 — sufficient
   for ride lifetimes; long-running audit needs the DB (already written).
3. No presence UI yet (Redis presence is tracked; surface "rider online" in UI).
4. Groups/chat/support still use Supabase Realtime — the manager is ready to
   carry them (`user:{id}` rooms) but they were not migrated (out of scope).
5. Consider protobuf/msgpack for the wire if bandwidth becomes the bottleneck.
6. Multi-region: pin rides to a region + regional Redis; this design extends
   but does not yet implement cross-region routing.
