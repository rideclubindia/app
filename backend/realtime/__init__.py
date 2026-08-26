"""RideClub Real-Time Platform.

Production-grade, horizontally-scalable WebSocket layer built on
python-socketio + Redis (pub/sub fanout, presence, rate limiting, event
streams) with batched Postgres persistence.

Modules:
    protocol   - wire protocol constants, envelope + compact location codecs
    metrics    - dependency-free Prometheus text metrics registry
    identity   - JWT verification and ride-member identity resolution
    ratelimit  - distributed token-bucket rate limiting (Redis, in-mem fallback)
    store      - Redis-backed presence / session / membership / location state
    location_pipeline - GPS gating, coalescing and batched persistence
    rooms      - authorized room (ride/user) subscription management
    gateway    - Socket.IO server, connection lifecycle and event handlers
"""
