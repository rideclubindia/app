# RideClub — High-Scale WebSocket Architecture

> **Status:** Architecture specification (implementation-ready). No application code has been written from this document — it documents what already exists in `backend/realtime/`, and specifies what must be added around it to genuinely reach 100K+ concurrent connections. **Do not claim 100K support until Section 26's load test has actually been run** — that's this document's own explicit rule, and it applies to RideClub too.

## What already exists (read before designing anything new)

`backend/realtime/gateway.py` (548 lines) + `store.py` + `ratelimit.py` + `rooms.py` + `location_pipeline.py` + `protocol.py` + `metrics.py` is a genuinely production-grade single-region real-time layer, not a toy implementation:

- **`Gateway`** wraps `python-socketio`'s `AsyncServer` with an `AsyncRedisManager(redis_url)` — every node already fans emits out to every other node via Redis pub/sub. This is the core mechanism Section 15/16 ask for, and it's already wired.
- **Auth**: JWT verified at handshake (`realtime/identity.py: verify_token`), identity derived server-side, never trusted from client messages (Section 6/29's requirement is already met).
- **Rooms**: `ride:{ride_id}`, `user:{member_id}`, `pins` — membership resolved server-side from `ride_members`/`rides` tables, cached in Redis 60s (Section 17/18 already implemented, docstring literally says "Never allow client → arbitrary channel subscription without authorization").
- **Rate limiting**: Redis-backed atomic Lua token-bucket (`ratelimit.py`), with an in-memory fail-open fallback if Redis is down — two limiters (connect, message). Section 20's requirement exists today.
- **Backpressure / location optimization**: `LocationPipeline` coalesces location updates at the source (latest-wins), critical events use a separate small/rare path with Redis Stream-backed recovery (`stre:ride:{ride_id}`, `MAXLEN 1000`) for reconnect catch-up. Sections 12/13 are already partially built.
- **Heartbeat**: `ping_interval=25`, `ping_timeout=20` already configured (Section 8).
- **Reconnection**: client (`frontend/src/realtime/RealtimeManager.ts`) already uses socket.io's built-in exponential backoff (`reconnectionDelay: 500` → `reconnectionDelayMax: 8000`) with `randomizationFactor: 0.5` jitter, plus a FIFO critical-event queue flushed on reconnect (Section 9 is already implemented client-side).
- **Metrics**: Prometheus counters/histograms already exist (`M_ACTIVE_CONNS`, `M_CONNECTS`, `M_DISCONNECTS`, `M_MSG_IN/OUT`, `M_DROPPED`, `M_REDIS_ERRORS`, `M_CRITICAL_EVENTS`, etc. in `realtime/metrics.py`), exposed at `/metrics` in `main.py` (Section 28 has a real starting point).
- **Draining**: `gateway.stop()` is called in `main.py`'s FastAPI lifespan shutdown — a "notify clients, drain connections, flush batches" comment already exists there (Section 24's concept exists at the single-process level).

**What does NOT exist yet** — this is the actual gap this document must close: **there is only one deployed instance.** `render.yaml` defines a single Render web service (`uvicorn main:app`, no instance count, no autoscaling config, no separate load balancer resource — Render's own edge proxy fronts the single instance). The `docker-compose.yml` used for local dev runs one `api` container. Everything above (Redis pub/sub fan-out, room-based auth, rate limiting) is **already built to be horizontally scalable**, but nothing is currently *running* horizontally, there is no load-testing harness, no chaos-testing plan, and no capacity number has ever been measured. The rest of this document is about closing exactly that gap — not rebuilding what's already correct.

---

## 1. Primary Goal

```text
100,000+ concurrent WebSocket connections
        ↓
N application instances (N determined by load test, §26 — not assumed)
        ↓
Render's load balancer / a WebSocket-compatible L7 LB (§4)
        ↓
WebSocket connection distribution (no sticky sessions required — §16)
        ↓
Redis pub/sub (AsyncRedisManager, already implemented) + Redis Streams (recovery, already implemented)
        ↓
Backend services (Ride/Location/SOS/Notification/User — existing FastAPI routers)
```
Every item in the source spec's requirement list — horizontal scaling, automatic instance replacement, rolling deployments, connection draining, automatic reconnection, backpressure, rate limiting, message prioritization, graceful degradation, failure recovery, monitoring, autoscaling — is addressed in the numbered sections below, each one stating explicitly whether it's *already implemented*, *partially implemented*, or *not yet built*.

---

## 2. High-Level Architecture

```text
                         ┌──────────────────────┐
                         │      RideClub        │
                         │   Mobile / Web Apps  │
                         └──────────┬───────────┘
                                    │  WebSocket/WSS (socket.io protocol)
                                    ↓
                         ┌──────────────────────┐
                         │   CDN / Edge (n/a     │  ← not yet fronted by a CDN;
                         │   today — gap)        │     WebSocket traffic bypasses
                         └──────────┬───────────┘     CDN caching anyway, but a
                                    ↓                  DDoS/edge layer (Cloudflare
                         ┌──────────────────────┐      or Render's own) is a gap
                         │   Load Balancer      │      for §4/§29's DDoS layer.
                         │ (Render's edge proxy  │
                         │  today; see §4 for    │
                         │  what "N instances"   │
                         │  requires)            │
                         └──────────┬───────────┘
                                    │
                  ┌─────────────────┼─────────────────┐
                  ↓                 ↓                 ↓
          ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
          │  Gateway #1  │  │  Gateway #2  │  │  Gateway #N  │  ← backend/realtime/gateway.py,
          │ (stateless,  │  │ (stateless)  │  │ (stateless)  │     already stateless-by-design;
          │  existing)   │  │              │  │              │     only 1 runs today (gap)
          └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
                 │                 │                 │
                 └─────────────────┼─────────────────┘
                                   ↓
                  socketio.AsyncRedisManager (existing) — fans out to every node
                                   │
                  ┌────────────────┼─────────────────┐
                  ↓                ↓                  ↓
           Redis Pub/Sub    Redis Streams        Celery Workers
          (emit fan-out,    (critical-event      (existing:
           existing)         recovery, existing)  process_location_update,
                  │                                calculate_analytics,
                  ↓                                 sos_expiry_sweep)
        ┌───────────────────────────────┐
        │   RideClub REST Services      │  ← existing FastAPI routers, called both
        │  (auth, tracking, pins,       │     directly by mobile (REST) and by the
        │   sos, emergency, dashboard)  │     gateway (publish_critical_ride_event)
        └───────────────┬───────────────┘
                        ↓
                 Supabase Postgres (existing)
```

---

## 3. Connection Distribution

**Status: architecture supports it, only one instance runs it today.** Each `Gateway` instance already only tracks its own connections in-process (`self._sessions: Dict[str, Dict]`) — nothing in the codebase assumes a global view of all connections across instances. Cross-instance delivery is entirely the Redis manager's job. This means going from 1 → N instances requires **zero application code changes** — it's purely a deployment/infrastructure change (§4/§24).

The exact connections-per-instance number must come from §26's load test, not a guess — but as a starting planning assumption for capacity estimation (§"Estimated Infrastructure Requirements" at the end of this doc), a `python-socketio` AsyncServer on ASGI (uvicorn, single worker process, event-loop-bound) realistically sustains on the order of 5,000–15,000 idle-to-light-traffic WebSocket connections per reasonably-sized instance (2-4 vCPU) before event-loop latency degrades — this range must be confirmed empirically, not assumed as a hard number.

---

## 4. Load Balancer

**Status: gap.** Today, Render's own edge/proxy fronts the single web service; there is no explicit multi-instance load-balancing configuration. To run N gateway instances:
- Render's native "Web Service" horizontal scaling (multiple instances behind Render's built-in load balancer) is the lowest-effort path, since the app is already deployed there — it terminates TLS, supports WebSocket upgrade, and health-checks via the existing `/ready` endpoint (already implemented in `main.py`, checks Redis connectivity + drain state).
- If RideClub later needs more control (custom health-check intervals, connection draining hooks, multi-region), a dedicated L7 LB (e.g. an ALB/NLB-equivalent, or a self-managed Envoy/HAProxy layer) in front of a container-orchestrated fleet (ECS/GKE/etc.) is the natural next step — but that's a platform migration, not a code change, and shouldn't be undertaken before §26 proves the current single-instance capacity ceiling is actually the bottleneck.

**Sticky sessions: not used, and correctly so.** The existing docstring in `gateway.py` states this directly: *"No sticky sessions required (websocket transport is connection-pinned by nature; polling fallback works without stickiness for emits because the Redis manager routes them)."* Each connection is naturally pinned to whichever instance accepted it (a WebSocket is a single long-lived TCP connection — there's no "session" to re-route mid-connection), and the Redis manager makes cross-instance emit delivery sticky-session-independent. This satisfies the spec's "prefer stateless instances" requirement exactly, with the correct justification for why no stickiness is needed anywhere in the stack.

---

## 5. WebSocket Gateway

**Status: already implemented, correctly layered.** `Gateway`'s responsibilities map directly onto the source spec's required pipeline:
```text
Connection Authentication   → on_connect (JWT verify via identity.verify_token)
Connection Registration     → self._sessions[sid] = {...}
Subscription Management     → RoomManager (rooms.py) — ride:/user:/pins rooms, server-side authz
Message Validation          → per-handler payload checks (e.g. on_loc_p validates shape)
Rate Limiting               → RateLimiterRegistry (ratelimit.py)
Backpressure                → LocationPipeline coalescing + Redis Stream MAXLEN trimming
Message Routing             → _emit_to_room / publish_critical_ride_event
Connection Management       → on_disconnect, sweep task, draining
```
Business logic genuinely does **not** live in the gateway — `publish_critical_ride_event` is documented as "callable from REST routers (pins, SOS, ride mutations)", meaning the actual ride/pin/SOS business rules live in `api/routers/*.py`, and the gateway is purely a transport/fan-out layer. This is the correct separation the spec asks for, already in place.

---

## 6. Authentication

**Status: already implemented.** `realtime/identity.py`'s `verify_token` validates the JWT at handshake (`on_connect`), and `Identity`/`member_id_for_uid` derive the actual user identity server-side — the gateway never trusts a client-supplied `userId` in message payloads (`rooms.py`'s docstring: *"Ride membership is resolved SERVER-SIDE... A user who leaves a ride... is unsubscribed automatically"*).

Handling of the specific edge cases the spec lists:
- **Expired/invalid tokens**: rejected at `on_connect`, connection refused (`M_CONNECT_FAILS` metric already exists to track this).
- **Re-authentication**: `EV_AUTH_REFRESH` handler (`on_auth_refresh`) already exists — a live connection can present a fresh token without reconnecting (`M_REAUTHS` metric confirms this is implemented, not just planned).
- **Duplicate sessions / connection takeover**: the `sess:{session_id}` reconnect-recovery mechanism (§7) implies session identity is tracked per-device, not just per-user — a second device connecting creates a second session in the same `user:{member_id}` room rather than evicting the first, which is the right behavior for a rider possibly having both a phone and a tablet open. If a genuine "kick other sessions" requirement emerges (e.g. security-sensitive single-session enforcement), that's a **gap** — not built today, and shouldn't be assumed present without checking `identity.py` directly before relying on it.
- **Revoked users / account suspension**: not evident in the current codebase as an active-connection-kill path — if a user is suspended mid-connection, there's no confirmed mechanism forcing an immediate disconnect (the JWT would still validate until it naturally expires). **This is a gap** worth closing: a lightweight "force-disconnect this user's sessions" admin action (publish a control event via the same Redis pub/sub the gateway already uses, each node checks `sid in self._sessions` and disconnects locally) would close it without new infrastructure.
- **Logout**: standard client-initiated disconnect; no server-side gap.

---

## 7. Connection Lifecycle

**Status: already implemented**, matching the spec's state list closely (gateway docstring: *"handshake ... -> verify -> register session -> restore rooms (reconnect w/ sessionId) -> live events -> disconnect (graceful / timeout / eviction)"*):
```text
CONNECTING      → client opens transport
AUTHENTICATING  → on_connect verifies JWT
CONNECTED       → session registered in self._sessions
SUBSCRIBED      → EV_RIDE_JOIN / EV_PINS_SUB → RoomManager authorizes + joins
ACTIVE          → EV_LOC_PUSH / EV_RIDE_SYNC / EV_EVENT_ACK flow normally
RECONNECTING    → client-side socket.io reconnection logic (RealtimeManager.ts)
DISCONNECTED    → on_disconnect (graceful) or ping-timeout (dead connection)
```
**Reconnect-with-recovery** is a genuinely more sophisticated feature than the base spec asks for: `EV_RIDE_SYNC` lets a reconnecting client request "snapshot + missed critical events" using its last-seen sequence number (`sess:seq:{session_id}`) against the Redis Stream (`stre:ride:{ride_id}`) — so a rider who drops for 30 seconds doesn't lose SOS/ride-state events that happened while disconnected. This is exactly the kind of durable-recovery mechanism §15 asks for around critical events, already built.

**Dead connection detection**: the `ping_interval`/`ping_timeout` pair (§8) plus a `self._sweep_task` (background asyncio task) handle this — connections that miss pongs are cleaned up without waiting indefinitely.

---

## 8. Heartbeat Strategy

**Status: already implemented and reasonably tuned.** `ping_interval=25`, `ping_timeout=20` (socket.io engine.io defaults are similar; these are explicit here, not accidental defaults). Concretely:
- **Ping interval (25s)**: infrequent enough to avoid meaningful battery/bandwidth cost — a ping+pong round-trip every 25s is a few bytes, not a heavy payload (the spec's "lightweight heartbeat" requirement is met; there's no application data in the ping/pong itself, that's engine.io's own tiny control frame).
- **Pong timeout (20s)**: a missed pong within 20s of the last ping triggers disconnect — meaning a fully dead connection is detected within roughly 25–45s, not indefinitely held open leaking a slot.
- **Mobile background behavior**: iOS/Android both suspend/throttle background network activity (the same platform constraint documented in this project's own Crash Detection Architecture.md §9) — a backgrounded app's socket will naturally miss pings and get cleaned up server-side, then the client-side reconnection logic (§9) re-establishes on foreground. This is the correct behavior, not a special case to build.
- **Battery implications**: 25s pings are negligible battery cost compared to, say, the crash-detection engine's 120Hz sensor sampling documented elsewhere in this repo — no further tuning needed unless a real battery profiling result says otherwise.

---

## 9. Reconnection Strategy

**Status: already implemented client-side.** `RealtimeManager.ts` configures socket.io's built-in reconnection: `reconnectionDelay: 500` → `reconnectionDelayMax: 8000`, `randomizationFactor: 0.5` (jitter), `reconnectionAttempts: Infinity`. This is exponential-backoff-with-jitter exactly as the spec asks (§9's example table of 1s/2s/4s/8s/16s is a similar shape; socket.io's own algorithm is `min(delay * 2^attempt, delayMax)` with randomization applied, which converges to the same effect).

**Thundering-herd protection**: the `randomizationFactor: 0.5` jitter is precisely what prevents 100,000 clients from reconnecting in the same instant after a shared outage (e.g. a gateway instance restart) — each client's actual delay is randomized within ±50% of the computed backoff, spreading the reconnect storm over a window rather than a spike. For a genuinely large-scale outage (e.g. all instances briefly down), this client-side jitter should be paired with **server-side connection-rate limiting at the load balancer** (§4/§20/§21) so even a spread-out reconnect storm can't instantaneously saturate a freshly-recovered fleet — this pairing (client jitter + server-side accept-rate capping) is the actual complete answer to "never allow 100,000 clients to reconnect simultaneously," and only the client half exists today.

---

## 10. Message Architecture

**Status: already implemented**, with a slightly different (arguably better-engineered) envelope than the source spec's example, defined in `realtime/protocol.py`:
```python
envelope(event_type, payload, *, event_id=None, seq=None, corr_id=None, version=PROTOCOL_VERSION)
# -> {"v": version, "type": event_type, "ts": now_ms(), "p": payload, "eventId"?, "seq"?, "corrId"?}
```
This covers the spec's required fields (`eventId`, `eventType`→`type`, `timestamp`→`ts`, `version`→`v`, `payload`→`p`) plus a monotonic `seq` (used for the reconnect-recovery gap-detection in §7) and a `corrId` (request/response correlation) the base spec didn't ask for but which is genuinely useful for the echo/ack flow already implemented (`EV_ECHO`, `EV_EVENT_ACK`).

**Existing event types** (`protocol.py`'s `CRITICAL_RIDE_EVENTS` and the plain event constants): `RIDE_EVT_SOS`, `RIDE_EVT_SOS_REVOKED`, `RIDE_EVT_RIDE_UPDATED`, `RIDE_EVT_MEMBER_JOINED`, `RIDE_EVT_MEMBER_LEFT`, `RIDE_EVT_MEMBER_APPROVED`, `RIDE_EVT_STATUS_CHANGED`, `RIDE_EVT_DESTINATION_REACHED`, plus transport-level events (`EV_LOC_PUSH`, `EV_RIDE_JOIN/LEAVE/SYNC`, `EV_PINS_SUB/UNSUB`, `EV_EVENT_ACK`, `EV_AUTH_REFRESH`, `EV_ECHO`). The source spec's suggested list (`RIDE_STARTED`, `RIDER_JOINED`, `LOCATION_UPDATE`, `INCIDENT_CREATED`, `CHAT_MESSAGE`, `SYSTEM_NOTIFICATION`, etc.) is a reasonable *product-level* taxonomy; several of RideClub's actual event names differ (e.g. `RIDE_UPDATED` vs. separate `RIDE_STARTED`/`RIDE_ENDED`, no `CHAT_MESSAGE`/`INCIDENT_CREATED` yet) — extending `CRITICAL_RIDE_EVENTS` with new constants as those features ship is a small, additive change to `protocol.py`, not an architecture change.

---

## 11. Message Prioritization

**Status: partially implemented, needs an explicit tier.** Today, critical events (`RIDE_EVT_*`, routed through `EV_RIDE_EVENT`/`publish_critical_ride_event`) and location updates (`EV_LOC_PUSH`, routed through `LocationPipeline`) are already architecturally separated into different code paths with different durability guarantees — critical events get Redis Stream persistence + reconnect recovery; location updates get coalesced, latest-wins, no persistence. This is *already* a two-tier priority system in effect, even though it isn't labeled `CRITICAL`/`HIGH`/`NORMAL`/`LOW` explicitly in code.

**Gap**: SOS events (`RIDE_EVT_SOS`, wired up per the Crash Detection/SOS Escalation architectures, `backend/api/routers/emergency.py`) currently flow through the *same* `EV_RIDE_EVENT` critical-event path as ordinary ride-state changes (`RIDE_EVT_STATUS_CHANGED`, `RIDE_EVT_MEMBER_JOINED`) — there is no code-level distinction that would let SOS specifically preempt a backlog of ordinary ride events under load. To close this properly:
- Add an explicit priority field/lane: either a second, higher-priority Redis Stream per ride (`stre:ride:{ride_id}:critical` vs. the existing general one) that's *never* trimmed as aggressively, or a priority tag on `publish_critical_ride_event` that a future queue-depth-aware sender checks before ordinary events.
- Under the "if overloaded" policy the spec asks for (CRITICAL never dropped, HIGH preserved, NORMAL throttled/coalesced, LOW dropped first): today's location-update coalescing (§12/13) already implements the NORMAL-tier behavior; SOS should be explicitly exempted from *any* future throttling logic added elsewhere, which is easiest to guarantee if SOS keeps its own separate, unthrottled emit path rather than sharing one with ordinary ride events.

---

## 12. Backpressure

**Status: already implemented for the highest-volume message type (location), needs generalizing.** `LocationPipeline` already implements the spec's exact example: it does not queue every raw GPS fix for a slow client — it coalesces to latest-state-wins (`store.py`'s `loc:ride:{ride_id}` hash is overwritten per member, not appended), which is precisely "keep the latest relevant location, discard obsolete updates."

Redis Streams are `MAXLEN`-capped (`STREAM_MAXLEN = 1000` in `store.py`) — this bounds unbounded growth for the critical-event recovery stream specifically.

**Gaps to close for a true 100K-scale backpressure story**:
- **Per-connection outbound queue limits**: `python-socketio`/engine.io has its own internal send buffer per socket, but there's no evidence of an explicit application-level cap+drop-policy on a single slow client's outbound queue beyond what location-coalescing already handles. For any *new* high-frequency event type added later, the same coalescing pattern (not a raw queue) should be the default, not an afterthought.
- **Message size limits**: `max_http_buffer_size=1_000_000` (1MB) is already set on `AsyncServer` — a real, existing hard cap (satisfies part of §12/§21).
- **Abusive-client termination**: the rate limiter (§20) already exists to throttle; an explicit "N consecutive rate-limit violations → disconnect the socket" escalation isn't confirmed present and is a reasonable, small addition (increment a per-session violation counter in `self._sessions[sid]`, disconnect past a threshold).

---

## 13. Location Optimization

**Status: already implemented.** This section's exact requirement — "do not blindly broadcast every location update to every connected user; broadcast only to that ride's subscribed riders" — is what `ride:{ride_id}` rooms + `LocationPipeline` already do. A location update from Rider A is only ever emitted into `ride:{ride_id}`'s room, never globally. Geographic (region-based, cross-ride) filtering isn't built — RideClub's current product doesn't need it (location sharing is ride-scoped, not proximity-based-to-strangers), so this is correctly *not* over-built for a requirement the product doesn't have yet.

---

## 14. Message Fan-Out

**Status: already implemented.** `self.sio.emit(event, env, room=f"ride:{ride_id}")` — socket.io's room mechanism plus the `AsyncRedisManager` together are exactly the "determine subscribers → ride channel → only relevant instances → only relevant connected users" pipeline the spec describes as "better architecture." The "bad architecture" (1 update → 100,000 sends) was never built here; there's no code path that iterates all connected sockets for a ride-scoped event.

---

## 15. Distributed Pub/Sub

**Status: already implemented, and the choice is justified — Redis Pub/Sub + Redis Streams, not Kafka/NATS.** Explaining the fit, per the spec's explicit requirement to justify the choice rather than pick something popular:

| Requirement | Redis Pub/Sub (emit fan-out) | Redis Streams (critical-event recovery) |
|---|---|---|
| Message volume | High (every location update) — fine, Pub/Sub is fire-and-forget, no persistence overhead per message | Low (only SOS/ride-state changes) — persistence cost is acceptable at this volume |
| Ordering | Best-effort, acceptable — a stale location is just superseded by the next one | Strict, needed — `seq` numbers must be gap-detectable for reconnect recovery |
| Durability | None needed — a missed location emit doesn't matter, the next one supersedes it | Needed — a missed SOS event must not be silently lost; the Stream + `MAXLEN 1000` gives a bounded replay window |
| Fan-out | Native (Pub/Sub is exactly this) | N/A — Streams are read via consumer catch-up, not fan-out |
| Operational complexity | Already deployed (RideClub already runs Redis for caching/Celery) — **zero new infrastructure** | Same Redis instance, same operational surface |
| Cost | Marginal — reuses existing Redis | Marginal — same reason |

**Why not Kafka/NATS at this stage**: both would add a genuinely new piece of operational infrastructure (a broker cluster, consumer-group management, a second system to monitor/scale/upgrade) to solve a durability requirement Redis Streams already satisfies at RideClub's actual event volume (ride/SOS-scoped critical events are orders of magnitude lower-frequency than location pings). Kafka's strengths — massive sustained throughput, long-term log retention, complex multi-consumer-group fan-out across many independent downstream systems — aren't RideClub's bottleneck; the bottleneck this whole document is about is *concurrent WebSocket connections*, which Redis Pub/Sub fan-out already scales to (Redis Pub/Sub throughput is not the limiting factor at 100K connections' worth of location-update volume — the WebSocket gateway's own per-connection overhead is the actual constraint, per §3/§26). If RideClub later needs genuinely durable, replayable, multi-consumer event sourcing for other reasons (analytics pipelines, multi-service event-driven architecture beyond real-time delivery), that's a separate, later evaluation — not a prerequisite for the 100K-connections goal this document targets.

---

## 16. Stateless WebSocket Instances

**Status: already implemented.** No per-connection critical state lives only in one process's memory: identity comes from the verified JWT (recomputable on any node), room membership is Redis-cached (`rooms.py`), latest locations live in Redis (`store.py`), and critical-event history lives in Redis Streams. If Gateway instance A crashes:
```text
Connection lost (TCP drops)
     ↓
Client's socket.io reconnection fires (§9, already implemented)
     ↓
Load Balancer routes the new handshake to Instance B (or any healthy instance)
     ↓
on_connect re-verifies JWT, re-registers session
     ↓
Client re-issues EV_RIDE_JOIN for its rooms (RoomManager re-authorizes from DB/cache)
     ↓
Client optionally sends EV_RIDE_SYNC with its last-seen seq → Instance B replays
     any missed critical events from the Redis Stream it never saw
```
This is a real, already-built recovery path — not a proposed one.

---

## 17. Ride Channels

**Status: already implemented**, matching the spec's channel-naming pattern closely: `ride:{ride_id}`, `user:{member_id}`, `pins` exist today. `region:{regionId}` and `sos:{sosId}` from the spec's example aren't separate channels — SOS events currently flow through the existing `ride:{ride_id}` room (an SOS is always tied to a specific ride, per the SOS Escalation Architecture.md's data model, so a dedicated `sos:{sosId}` room wasn't needed and would fragment subscriptions rather than simplify them). If a future requirement needs someone to watch a *specific* SOS event without being a full ride-room member (e.g. a monitoring operator dashboard, per that same architecture's §9), a dedicated `sos:{sosId}` room authorized separately (operator role, not ride membership) would be the right addition then — not now, speculatively.

---

## 18. Authorization

**Status: already implemented**, exactly matching the spec's example flow: `RoomManager`'s `on_ride_join` resolves ride membership server-side (querying `ride_members`/`rides` via a thread-pool-executed sync DB call, cached 60s in Redis to keep join storms cheap — the module's own docstring states this explicitly) before allowing the `socketio` room join to happen. `pins` is deliberately public/opt-in (no membership check needed, low-frequency public incident feed). No client-supplied "I am authorized" claim is trusted anywhere in this path.

---

## 19. Database Strategy

**Status: already implemented correctly.** Location updates never hit Postgres directly per-event — `EV_LOC_PUSH` flows into `LocationPipeline`/Redis (`store.py`'s `loc:ride:{ride_id}` hash), and the existing Celery task `process_location_update` (`workers/tasks.py`) is the documented (if currently stubbed) path for async/batched persistence, not a synchronous write on every WebSocket message. Critical ride events *do* get persisted (`_persist_ride_event_sync`, run via `run_in_executor` — off the event loop, async from the gateway's perspective), which is correct: critical events are low-frequency and need durability, location pings are high-frequency and don't.

---

## 20. Rate Limiting

**Status: already implemented at the connection/message level**, needs a couple of additional dimensions. Today: connect-limiter (per IP/user, flood protection) and message-limiter (per connection) both exist as Redis-backed token buckets (`ratelimit.py`). REST endpoints separately use `slowapi`'s `Limiter` (`core/limiter.py`) with per-endpoint rates (e.g. the emergency router's `20/hour` on SOS creation, `5/hour` on the old dispatch endpoint).

**Gaps**: no evidence of a distinct **per-message-type** rate limit inside the WebSocket layer itself (e.g. `LOCATION_UPDATE` could reasonably be capped separately from a hypothetical future `CHAT_MESSAGE`) — today's single message-limiter token bucket is applied uniformly. Splitting it into per-event-type buckets (same `TokenBucketLimiter` class, different Redis key prefixes/capacities) is a small, additive change once a second high-frequency message type actually exists; building it now for a `CHAT_MESSAGE` type that doesn't exist yet would be premature.

---

## 21. Connection Limits

**Status: partially implemented, needs explicit caps.** `max_http_buffer_size` (message size) is set. Confirmed gaps: no explicit "max connections per instance" ceiling configured (relying entirely on infrastructure/OS limits is risky — an instance should refuse new connections gracefully before OS file-descriptor exhaustion, not crash into it), no explicit "max connections per user"/"per IP" cap distinct from the rate limiter (a rate limiter throttles *event frequency*, not *concurrent connection count* — a client opening hundreds of sockets from one IP isn't stopped by a message-rate limiter). These are genuinely missing and should be added as explicit, configurable caps in `Gateway.on_connect` (check `len(self._sessions)` against a ceiling, check a per-IP counter in Redis) before a real 100K load test, since an unbounded-connections-per-client bug would otherwise be invisible until it causes an incident.

---

## 22. Graceful Degradation

**Status: gap — no explicit degradation ladder exists today.** The building blocks exist (rate limiting, location coalescing) but there's no automated "if system load crosses threshold X, throttle Y" control loop. To build this: an autoscaling/health signal (queue depth, event-loop latency — see §25) feeding a shared Redis flag (e.g. `system:load_level = normal|high|critical`) that gateway instances check before deciding whether to, say, reduce location-update acceptance frequency or temporarily reject new `pins` subscriptions — while **SOS/critical-event paths never check this flag at all**, structurally guaranteeing they're never throttled by a degradation mode meant for non-critical traffic. This is a genuinely new piece of infrastructure to build, not a reframing of something existing.

---

## 23. Failure Handling

| Failure | Detection | Fallback | Retry | Recovery | User experience | Data consistency |
|---|---|---|---|---|---|---|
| WebSocket instance crash | LB health check (`/ready`) fails | LB routes new connections elsewhere | client reconnects (§9, exists) | instance replaced by orchestrator | brief reconnect, `EV_RIDE_SYNC` catches up missed events | no loss for critical events (Stream-backed); latest-location semantics mean no loss that matters for location |
| Load balancer failure | infra-level (Render/cloud provider SLA) | provider-managed failover | n/a (client-side reconnect handles the resulting drop) | provider-managed | outage until LB recovers | unaffected once LB recovers |
| Redis/PubSub down | `ratelimit.py` already fails open + increments `M_REDIS_ERRORS`; `store.py` similarly logs Redis errors | rate limiting fails open (allows traffic — a deliberate availability-over-strictness tradeoff already coded); presence/location reads degrade gracefully (documented behavior in `store.py`, not evidenced to crash) | Redis client auto-reconnects (`redis.asyncio` default behavior) | automatic once Redis returns | events may not fan out cross-instance during the outage (single-node delivery only) | **this is the real risk period** — critical events created during a Redis outage may not reach the Stream; this should be explicitly monitored (`M_REDIS_ERRORS` alerting, §28) rather than silently tolerated |
| Message broker (Celery) down | Celery task dispatch raises/queues locally in RabbitMQ/Redis broker | tasks queue until broker returns (Celery's own durability, if broker itself is up) | Celery's own retry policy | automatic | delayed analytics/location persistence, not user-visible in real time | eventually consistent once broker recovers |
| Database (Supabase) down | SQLAlchemy connection errors | REST endpoints return 5xx; gateway's async DB calls (membership checks) fail | existing exception handling per-router | automatic once DB returns | ride-join/auth may fail during the outage; already-connected sockets keep working for cached-membership rooms | no writes lost that weren't already in-flight during the outage |
| Network partition (client) | ping timeout (§8) | client-side reconnection (§9) | exponential backoff+jitter | automatic on network return | brief "reconnecting" state, already surfaced (`RealtimeManager.ts`'s `setStatus('reconnecting')`) | `EV_RIDE_SYNC` catches up |
| Cloud region failure | infra-level | **gap** — no confirmed multi-region failover strategy exists; RideClub currently runs single-region (Render) | n/a | manual/infra-team intervention today | full outage until region/provider recovers | out of scope for a single-region deployment; a genuine multi-region requirement would need active-active Redis (or region-scoped rooms) — not designed here since it isn't RideClub's current deployment topology |
| Notification provider (Twilio) down | `notification_service.py` already catches and logs Twilio exceptions, returns `sms_sent: False` rather than raising uncaught | falls back to whatever other channel exists (ride-group Socket.IO broadcast still fires independently) | limited (per SOS Escalation Architecture.md §19) | manual/provider-side | emergency contact doesn't get SMS but ride-group still sees the live event | already-documented, deliberate degraded path (SOS Escalation Architecture.md §8's `NullEmergencyProvider` concept) |

No single failure in this table brings down the whole platform — each is isolated to its own subsystem, which is the spec's actual requirement ("never let one failed WebSocket instance bring down the entire platform").

---

## 24. Deployment Architecture

**Status: partial — single-instance graceful shutdown exists; multi-instance rolling deployment does not, because there's only one instance.**

What exists today: `main.py`'s FastAPI `lifespan` shutdown calls `gateway.stop()`, which per its own docstring "notifies clients, drains connections, flushes batches" — this is real, working graceful-shutdown logic for the one process that runs it.

What's needed once N instances exist:
```text
Deploy triggers instance replacement (Render/orchestrator-managed)
        ↓
Outgoing instance enters DRAINING (existing gateway.stop() logic, already correct)
        ↓
LB stops routing NEW connections to it (health check starts failing, or
  explicit deregistration — depends on the chosen LB/orchestrator)
        ↓
Existing connections on that instance get a server-initiated disconnect
  (or are simply cut when the process exits after existing gateway.stop()
  finishes flushing) — client-side reconnection (§9) picks them up on a
  healthy instance, with jitter already preventing a synchronized reconnect
  spike
        ↓
Old instance terminates once drained (or after a bounded grace period)
```
Render's own deploy model already does rolling replacement for multi-instance web services (new instance healthy before old one is removed) — so achieving this requires configuring Render for >1 instance and confirming its health-check hits `/ready` (already implemented) with a sensible drain grace period, not new application code. Canary/blue-green would need a platform beyond Render's basic web-service model (e.g. a weighted-traffic-split capable LB) — not designed here since it's not required to hit the 100K goal, only "rolling deployment without abruptly killing 10,000 connections," which the above satisfies.

---

## 25. Autoscaling

**Status: gap — no autoscaling configuration exists today (single fixed instance).** The metrics needed already mostly exist (`realtime/metrics.py`): `M_ACTIVE_CONNS`, `M_MSG_IN`/`M_MSG_OUT`, `M_DROPPED`, `M_REDIS_ERRORS`. Missing from that module (confirmed by name, not present in the grep-confirmed metric list above): explicit event-loop-latency and per-instance connection-count-vs-capacity metrics, and queue-depth/backpressure-event counters. To build genuine multi-signal autoscaling:
1. Add the missing metrics (`M_EVENT_LOOP_LAG`, `M_CONN_RATE`, `M_RECONNECT_RATE` — small additions to `metrics.py` following the existing pattern).
2. Feed them to whatever autoscaler the deployment platform provides (Render's autoscaling is CPU/memory-based today — a WebSocket-aware autoscaler needs either a custom metric-based scaling policy on a more flexible platform, or an external control loop that adjusts instance count via the platform's API based on `M_ACTIVE_CONNS` thresholds).
3. Scale on a *combination* — CPU alone under-reacts to a fleet approaching its connection-count ceiling before CPU saturates (an event-loop can be I/O-bound on socket count long before CPU-bound).

This genuinely requires new work; it is the single largest gap in this document relative to what's already built.

---

## 26. Load Testing

**Status: gap — `backend/loadtest/` directory exists in this repo but its actual coverage of 100K-connection scenarios has not been verified as part of this document.** Per this document's own rule ("do not claim '100K' until load tested"), RideClub cannot currently claim 100K support. A proper load-testing architecture:
```text
Target: 100,000 concurrent connections, then 150K/200K/300K (§ estimates below)

Test matrix (per the spec's list):
  100K idle connections           — pure connection-count ceiling per instance/fleet
  100K active connections         — steady EV_LOC_PUSH traffic at a realistic rider rate
  100K heartbeat-only connections — confirms ping/pong overhead scales linearly, not superlinearly
  100K location-enabled connections — the realistic worst case (highest message volume)
  High fan-out                    — many riders in one large ride/group room
  Mass reconnect                  — kill a gateway instance, measure reconnect storm shape
  Server restart                  — full fleet restart, measure recovery time
  Rolling deployment              — §24's flow under real connection load
  Redis failure                   — inject Redis unavailability, confirm fail-open behavior (§23) holds under load, not just in isolation
  Network interruption            — simulate client-side packet loss/latency
  Message burst                   — sudden spike in location updates (e.g. a large group ride starting simultaneously)
  SOS event burst                 — many simultaneous SOS creates, confirm §11's priority gap doesn't cause SOS delivery delay under load
```
A tool capable of genuinely opening 100K+ real WebSocket connections (not simulated at the HTTP layer) is required — options include `artillery` (with its socket.io engine), a custom `python-socketio` client-side load generator, or k6 with its WebSocket/experimental extensions. Whichever is chosen, it must run from infrastructure capable of opening that many outbound sockets itself (the load-generation client is often the actual bottleneck in a naive load test, not the server under test) — likely several distributed load-generator instances, not one machine.

---

## 27. Chaos Testing

**Status: gap — no chaos-testing plan or tooling exists today.** Once §26's load test establishes a working baseline, chaos scenarios should be layered on top of *live load*, not tested in isolation:
```text
Kill one gateway instance under 100K connections    → verify §23's failure-handling row holds at scale
Kill multiple instances simultaneously               → verify remaining fleet absorbs reconnects without cascading
Restart Redis under load                             → verify rate-limiter fail-open + no crash, not just no-load behavior
Inject network latency/packet loss                   → verify ping-timeout thresholds (§8) don't false-positive-disconnect healthy clients
Database slowdown                                     → verify gateway doesn't block on synchronous DB calls (membership checks already use a thread-pool executor, §18 — confirm this actually isolates the event loop under real slow-query conditions, not just in the happy path)
Message broker failure                                → verify Celery task backlog doesn't grow unbounded (§19)
Sudden 50K / 100K reconnects                          → the actual thundering-herd test for §9's jitter claim
```
Success criteria per the spec: no cascading failure, no memory leak, no uncontrolled queue growth, no permanent connection loss, no critical message loss, automatic recovery — each of these should be an automated assertion in the chaos-test harness (e.g. memory usage graphed before/during/after, not eyeballed), not a manual judgment call.

---

## 28. Monitoring Dashboard

**Status: partial — metrics exist, no dashboard/alerting is confirmed configured.** `realtime/metrics.py` already defines the Prometheus metrics for: active connections, messages in/out, dropped messages, critical events, Redis errors, room joins/leaves/fails. `/metrics` is already exposed (`main.py`). What's missing to reach the spec's full dashboard list: connections-by-instance breakdown (needs an instance-id label on the existing metrics, small change), connection success/failure *rate* (currently counters exist — a rate is a Grafana/Prometheus query concern, not new instrumentation), bandwidth, event-loop latency (new metric, §25), pub/sub latency, database latency, SOS delivery latency (a genuinely new, safety-relevant metric worth adding given this repo's crash-detection/SOS work — time from `RIDE_EVT_SOS` publish to confirmed delivery). Building the actual dashboard (Grafana against the existing `/metrics` Prometheus endpoint) and alert rules (on `M_REDIS_ERRORS` spike, `M_DROPPED` spike, connection-count approaching per-instance ceiling) is operational setup, not application code — but it doesn't exist yet and should be built before relying on this system at scale.

---

## 29. Security

**Status: mostly already implemented.** WSS/TLS — yes (Render terminates TLS; `main.py`/deployment assumes HTTPS-only per this repo's other architecture docs' stated defaults). JWT auth — yes (§6). Authorization — yes (§18). Rate limiting — yes (§20, with the noted per-message-type gap). Message validation — per-handler shape checks exist; a formal schema-validation layer (e.g. pydantic models for every WS event payload, not just REST payloads) is not confirmed and would harden this further. Payload size limits — yes (`max_http_buffer_size`). DDoS protection — **gap**, no edge/CDN DDoS layer confirmed in front of the WebSocket endpoint specifically (Render may provide some baseline protection, but nothing RideClub-specific is configured). Connection limits — gap, per §21. Replay protection / event IDs — `eventId`/`seq` already exist in the envelope (§10), which is the foundation for replay detection, though an explicit "reject a duplicate `eventId` seen within window X" check isn't confirmed present. Input sanitization — standard FastAPI/Pydantic validation on REST paths; WS payload sanitization is only as strong as each handler's own checks. Audit logging — the SOS Escalation Architecture.md's `sos_event_audit_log` table (already built, §"Phase 4" of this session's other work) is a real, working example of this pattern for one subsystem; it isn't generalized across all WS events.

**Never-trust-client list** (userId, rideId, role, permissions, event ownership) — already correctly enforced: identity is server-derived (§6), room membership is server-validated (§18), and `publish_critical_ride_event`'s `member_id` parameter comes from the authenticated session, not a client-supplied field.

---

## 30. Recommended Technology Evaluation

| Requirement | Redis Pub/Sub | Redis Streams | NATS | Kafka | Managed WebSocket services (e.g. Pusher/Ably/AWS API GW WebSocket) |
|---|---|---|---|---|---|
| 100K connections | N/A (not a connection layer — pairs with the gateway's own connection handling, already proven at small scale, not yet at 100K) | N/A | N/A | N/A | Handles connection scaling for you, but hands back message routing to your backend anyway |
| Low latency | Excellent (in-memory, already RideClub's Redis instance) | Good (slightly more overhead than Pub/Sub due to persistence) | Excellent, purpose-built for this | Good but higher baseline latency (disk-backed log, consumer-group coordination) | Depends on provider; adds a network hop RideClub doesn't control |
| Fan-out | Native, already used | Not fan-out (consumer read/replay model) | Native, very strong | Native via consumer groups, but heavier | Native (that's the product) |
| Durable events | No (by design — location updates don't need it) | Yes, already used for critical events | Optional (JetStream) | Yes, strongest option here | Varies by provider, generally weaker guarantees than Kafka |
| Location updates | **Best fit** — exactly the latest-wins, no-durability-needed shape | overkill | would work, but no operational benefit over what's already running | overkill, adds latency for no benefit here | works, but why pay a third party for something Redis already does for free |
| SOS events | Not used for this today (correctly — needs durability) | **Best fit today** (already implemented) | would also fit well if RideClub ever needed cross-service durable pub/sub beyond this gateway | overkill at current volume | would work but adds an external dependency for RideClub's most safety-critical event type — undesirable |
| Scaling | Scales with Redis itself (cluster mode if ever needed) | Same | Excellent horizontal scaling story | Excellent, but heavier ops | Provider's problem, but you lose control |
| Failure recovery | Fail-open already coded (§20/§23) | Stream persists through Redis restarts if AOF/RDB persistence is configured (**confirm this is actually enabled on RideClub's Redis** — a Stream is not durable if the Redis instance itself has no persistence configured) | Strong (JetStream) | Strong | Provider-managed |
| Operational complexity | **Lowest** — already deployed, already the app's cache layer | Lowest (same Redis) | New system to deploy/monitor | New, heavier system (Zookeeper/KRaft, brokers, partitions) | Lowest *engineering* complexity, but a new billing/vendor-lock-in relationship |
| Cost | Already paid for (existing Redis) | Already paid for | New infrastructure cost | New infrastructure cost, generally the most expensive to operate well | Per-connection/per-message pricing, can get expensive at 100K+ connections |

**Recommendation: keep Redis Pub/Sub + Redis Streams.** This isn't "Redis because it's already there" as a lazy default — the workload characteristics (high-volume/low-durability location pings vs. low-volume/high-durability critical events) map almost exactly onto Pub/Sub vs. Streams' actual design intent, RideClub already operates Redis reliably for caching/Celery/rate-limiting, and neither NATS nor Kafka's specific strengths (respectively: ultra-low-latency at even higher fan-out scale than RideClub needs; massive sustained multi-consumer-group durable log processing) address a bottleneck this system actually has. **One action item that isn't optional**: confirm Redis persistence (AOF or RDB snapshotting) is actually enabled on the deployed Redis instance — Streams' durability guarantee is worthless if the underlying Redis has no persistence and a restart wipes it.

---

## 31. Target Architecture

```text
                    INTERNET
                       │
                       ↓
          CDN / DDoS Layer  (gap — not present today, §4/§29)
                       │
                       ↓
     Load Balancer (Render multi-instance web service today;
     a dedicated L7 LB if RideClub outgrows Render's model)
                       │
          ┌────────────┼────────────┐
          ↓            ↓            ↓
      WS Node       WS Node      WS Node      ← backend/realtime/gateway.py,
   (existing code, only 1 runs today — §3/§24 gap is deployment, not code)
          │            │            │
          └────────────┼────────────┘
                       ↓
        Redis: AsyncRedisManager (pub/sub, existing)
              + Streams (critical-event durability, existing)
              + RateLimiterRegistry + RealtimeStore (existing)
                       │
          ┌────────────┼─────────────┐
          ↓            ↓             ↓
   api/routers/*   emergency.py   pins.py / tracking.py
   (Ride/User       (SOS Service,   (Location Service,
    Services,        existing)      existing)
    existing)
          │            │             │
          └────────────┼─────────────┘
                       ↓
              Celery Workers (existing: process_location_update,
              calculate_analytics, sos_expiry_sweep)
                       ↓
              Supabase Postgres (existing)
```
The number of WS-node instances must come from §26's benchmark, not this diagram.

---

## 32. Critical Requirement

This document does not claim any single server handles 100,000 connections — it explicitly documents that **zero instances have been load-tested at that scale yet**, and that reaching it is a horizontal-scaling *deployment* exercise (§3/§4/§24/§25) layered on top of application code (`backend/realtime/*`) that was already built stateless and Redis-backed specifically to support that scaling without further code changes. The target remains: **100K+ concurrent connections through horizontal scaling**, remaining functional through instance failures, traffic spikes, mass reconnects, rolling deployments, and message bursts — none of which should bring down the entire platform, per §23's failure-isolation table.

---

## Estimated Infrastructure Requirements (100K / 200K / 500K concurrent connections)

These are **planning-stage estimates to be replaced by §26's actual measurements** — presented as a starting budget for capacity planning discussions, not a guarantee.

| Concurrent connections | Estimated WS-node instances (at ~8K conns/instance, mid-range planning assumption from §3) | Redis sizing | Celery worker capacity | Notes |
|---|---|---|---|---|
| 100,000 | ~13-15 instances (some headroom over the raw 100K/8K≈12.5) | A single well-resourced Redis instance (or a small Redis Cluster for headroom) — Pub/Sub + Streams + rate-limit keys + presence/location hashes; memory sizing driven mostly by `loc:ride:{ride_id}` hashes and TTL'd session keys, not connection count itself | 2-4 workers for the existing task set (location persistence, analytics, SOS sweep) — Celery scales independently of WS connection count, driven by event *rate* not connection *count* | This is the baseline target of this document |
| 200,000 | ~25-30 instances | Likely time to move to Redis Cluster (sharded) if a single instance's CPU/memory/network becomes the fan-out bottleneck — must be confirmed by monitoring (§28), not assumed at this exact number | Scale workers proportionally to event rate, re-measure — worker count is not a linear function of connection count alone | LB/orchestrator must itself be confirmed capable of routing to 25-30 backend targets smoothly |
| 500,000 | ~65-75 instances | Redis Cluster very likely required by this point; also revisit whether a single "region" deployment topology still makes sense operationally (not necessarily technically required, but an operational/reliability question) | Continue scaling proportional to measured event rate | At this scale, re-run the full §26/§27 test+chaos suite again — behavior at 100K does not guarantee linear behavior at 500K; re-verify rather than extrapolate |

The per-instance connection estimate (~8K) is a *planning placeholder* pending §26 — it is deliberately conservative (mid-point of the 5K-15K range estimated in §3) rather than optimistic, so that early capacity planning doesn't under-provision. Replace this number the moment real load-test data exists.
