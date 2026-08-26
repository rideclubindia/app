# Real-Time Platform — Load Testing Guide

Harness: `backend/loadtest/runner.py` — asyncio Socket.IO clients that connect,
join rides, push telemetry and echo-probe latency, while scraping the server's
`/metrics` endpoint for deltas.

## Prerequisites

- A running backend (local or deployed) with `REDIS_URL` configured.
- A valid backend JWT: log in via the app, then copy `localStorage.rie_token`,
  or mint one: `POST /api/v1/auth/firebase-login`.
- A ride UUID the JWT's user is a member of (create one in the app).

```bash
cd backend
pip install socketio httpx   # already in requirements.txt except httpx async use
python -m loadtest.runner --url https://api.rideclub.in \
    --token "<jwt>" --ride "<ride-uuid>" \
    --scenario locations --users 10000 --ramp 500 --duration 120
```

> One Python process saturates around 10–15K sockets — that is a harness
> limit, not a server limit. For 100K, run 8–10 processes across machines,
> each with a user slice, all pointed at the public LB URL.

## Scenario ladder (run in order, record results)

| Step | Scenario | Users | Notes |
|---|---|---|---|
| 1 | idle | 1K → 5K → 10K | baseline connections |
| 2 | heartbeat | 10K | echo RTT baseline |
| 3 | locations | 5K → 10K | telemetry pipeline |
| 4 | navigation | 10K | mixed load |
| 5 | rides | 5K, ramp 500 | join storms (authz + cache) |
| 6 | reconnect | 10K | churn / mass reconnect |
| 7 | F/G | — | kill a node / pause Redis mid-run |
| 8 | scale out | 25K → 50K → 100K | multi-process, production-like deploy |

## What to record per run

- P50 / P95 / P99 latency (echo RTT + connect time)
- error rate (`connect errors`, `dropped`)
- server deltas: `rtc_messages_in/out`, `rtc_loc_received/gated/broadcast/persisted`
- node CPU / RAM / FDs (`docker stats` / `kubectl top`)
- Redis CPU / memory / ops (`redis-cli info stats`)
- DB write rate (`rtc_loc_flush_batches_total` × batch size)

Results are written to `loadtest-results-<scenario>-<users>.json` for
regression comparison.

## Pass criteria before claiming 100K readiness

- 100K concurrent connections across N nodes, error rate < 0.1%
- echo P99 < 250 ms, location fan-out P95 < 500 ms at steady state
- node CPU < 70% at target load (headroom for spikes)
- zero unbounded memory growth over a 4h soak
- node kill: < 15s to full session recovery for affected clients
