# RideClub — SOS Countdown & 24/7 Emergency Escalation Architecture

> **Status:** Architecture specification (implementation-ready). No application code has been written from this document yet.
> **Relationship to Crash Detection & Emergency Response Architecture.md**: that document owns everything up to `CRASH_SUSPECTED` (on-device sensors → signal processing → crash detection state machine, Phase 1 of which is already implemented as `frontend/src/lib/crashDetection/`). This document owns everything from `CRASH_SUSPECTED` (or a manual SOS press) onward — the countdown, escalation, and 24/7 monitoring/response pipeline. The two are separate architectures with one connecting point: a `CRASH_SUSPECTED` event from the crash engine becomes an `AUTOMATIC_CRASH_SOS`-triggered SOS event here.

RideClub's existing stack this design builds on and **replaces/extends**, not duplicates:
- **`backend/api/routers/sos.py`** currently exposes a single stateless `POST /dispatch` — no persistence, no countdown, no cancellation, fire-and-forget one Twilio SMS per call, rate-limited 5/hour, gated on `require_ride_access`. This is the "manual SOS, no escalation pipeline" precursor. This architecture turns that one-shot call into a **stateful SOS event** with a real lifecycle, while reusing its Twilio client wiring and its `require_ride_access` auth pattern rather than replacing them wholesale.
- **Realtime gateway**: existing Socket.IO gateway (`api/routers/websockets/gateway.py`, mounted at `/socket.io` in `main.py`) already supports ride-room broadcast — reused here for notifying ride-group members and pushing live countdown state to the rider's own device.
- **Supabase Postgres** — the SOS event store lives here, not a new database.
- **Crash Detection Engine** (`frontend/src/lib/crashDetection/`, Phase 1 complete) — the `CrashCandidateEvent` it emits on reaching `CRASH_SUSPECTED` is the automatic trigger input to §2's `AUTOMATIC_CRASH_SOS` path.

> **Important engineering principle (carried over from the crash-detection architecture):** RideClub does not have — and this design does not assume — a direct integration with any emergency-response/monitoring provider or local emergency-service dispatch system today. §8/§9/§10 are designed as a **pluggable adapter boundary** so that when/if RideClub contracts a real 24/7 monitoring provider, it's a configuration and adapter-implementation change, not a rearchitecture. Until such a provider exists, the "escalation" path degrades gracefully to notifying emergency contacts + ride group (already-available channels), and the architecture says so explicitly rather than presenting a fictional dispatch capability.

---

## 1. High-Level Emergency Flow

```text
┌─────────────────────────────┐
│       RideClub Mobile       │
│  Manual SOS  OR  Automatic  │
│  Crash Detection            │
│  (CrashCandidateEvent)      │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────────────┐
│         SOS Event Created            │
│  sosId · userId · rideId · timestamp │
│  location · triggerType · confidence │
│  (persisted server-side immediately, │
│   not just held client-side)         │
└──────────────┬───────────────────────┘
               ↓
┌─────────────────────────────┐
│   2-Minute Countdown         │
│   server-authoritative       │
│   "Are you safe?"            │
│   [ I'M OK ]  [ CANCEL SOS ] │
└──────────────┬───────────────┘
               │
        ┌──────┴───────┐
        ↓              ↓
   User cancels     No response by expiresAt
        │              │
        ↓              ↓
  SOS Resolved    SOS Escalation
                       │
                       ↓
        Emergency Response Adapter (§8)
                       │
          ┌────────────┴────────────┐
          ↓                          ↓
  Provider configured?        No provider configured
          │                          │
          ↓                          ↓
  Monitoring Provider          Degraded escalation:
  (human monitoring)           notify emergency contacts
          │                    + ride group directly
          ↓                    (existing Twilio/Socket.IO
  Contact rider /               paths), flag event as
  escalate per protocol         "unmonitored" for audit
          │                          │
          └────────────┬─────────────┘
                       ↓
          Local Emergency Services (where a real
          integration exists) + Emergency Contacts
```

---

## 2. SOS Trigger Sources

**Manual SOS**
```text
Rider → Press SOS → Confirmation (long-press or press-and-hold, not a bare tap —
                     see §21) → SOS Countdown
```
The existing `/dispatch` endpoint's request shape (`ride_id`, `lat`, `lng`, `message`, `emergency_contact_*`) becomes the *input* to the new `POST /api/sos` create-event call (§14), not a separate parallel path — manual SOS and automatic SOS converge into the same SOS Event Service immediately after trigger.

**Automatic SOS**
```text
Crash Detection Engine → CrashCandidateEvent (state: CRASH_SUSPECTED, confidence,
peakAccelMagnitudeG, rotationChangeDegPerSec, stationaryDurationMs)
      ↓
Emergency Manager (mobile, Phase 3 of the crash-detection architecture) maps this
1:1 into an SOS Event Service call with triggerType = AUTOMATIC_CRASH_SOS and
crashContext populated from the CrashCandidateEvent fields
      ↓
SOS Countdown
```

`triggerType` is a first-class, immutable field on the SOS event (`MANUAL_SOS | AUTOMATIC_CRASH_SOS`) — it changes UI copy ("Possible crash detected" vs. "SOS activated"), changes the default countdown length if configured differently per-source (§4), and is always visible to a monitoring operator (§9) so they know whether a human explicitly asked for help or an algorithm inferred it.

---

## 3. SOS State Machine

```text
                    ┌────────┐
              ┌────►│  IDLE  │
              │     └───┬────┘
              │         │ trigger (manual press or CrashCandidateEvent)
              │         ▼
              │  ┌────────────────┐
              │  │ SOS_INITIATED  │  (event persisted server-side, expiresAt computed)
              │  └───────┬────────┘
              │          ▼
              │  ┌─────────────────┐
              │  │ COUNTDOWN_ACTIVE │
              │  └────┬────────┬────┘
              │       │        │
              │  user cancels  │ now >= expiresAt (server-determined, §4)
              │       ▼        ▼
              │ ┌───────────┐ ┌─────────────────────┐
              │ │ RESOLVED  │ │  ESCALATION_PENDING   │
              │ │(via       │ └──────────┬────────────┘
              │ │USER_      │            ▼
              │ │CANCELLED) │ ┌─────────────────────┐
              │ └───────────┘ │  MONITORING_ACTIVE    │  (event handed to adapter, §8)
              │                └──────────┬────────────┘
              │                           ▼
              │                ┌─────────────────────┐
              │                │ RESPONSE_IN_PROGRESS │
              │                └──────────┬────────────┘
              │           ┌────────────────┼────────────────┐
              │           ▼                ▼                ▼
              │   RIDER_REACHED  EMERGENCY_SERVICES_  FALSE_ALARM
              │           │        CONTACTED               │
              └───────────┴────────────────┴────────────────┘
                                    ▼
                                RESOLVED
```

Cross-cutting states/conditions (attach to the active state as a flag, not a state fork, since e.g. `NETWORK_UNAVAILABLE` can happen *during* `COUNTDOWN_ACTIVE` and must not reset the countdown):
```text
NETWORK_UNAVAILABLE            — mobile keeps a locally-ticking countdown UI in sync with the last-known
                                   expiresAt; the server clock is authoritative once connectivity returns (§4/§13).
GPS_UNAVAILABLE                — event proceeds using the last-known valid location (§6), flagged as stale.
APP_BACKGROUND / PHONE_LOCKED  — countdown continues server-side regardless (§4); mobile shows a persistent
                                   notification (Android) / uses whatever foreground-service context the
                                   crash-detection architecture's §9 already established for the active ride.
LOW_BATTERY                    — no behavior change to the SOS pipeline itself; this is a safety-critical
                                   path and is never throttled for battery (mirrors the crash-detection
                                   architecture's §10 stance).
MONITORING_SERVICE_UNAVAILABLE — see §9's provider health-check + degraded-escalation fallback.
DUPLICATE_SOS                  — a new trigger arriving while an SOS is already SOS_INITIATED/
                                   COUNTDOWN_ACTIVE/escalated for the same rideId+userId is coalesced into
                                   the existing event (idempotency key = rideId+userId+status-in-progress),
                                   not a second parallel event — see §19.
```

---

## 4. Two-Minute Countdown — Server-Authoritative

The mobile app **never** decides expiry on its own. On SOS creation the backend computes and returns:
```json
{ "sosId": "uuid", "status": "COUNTDOWN_ACTIVE", "createdAt": "ISO-8601", "expiresAt": "ISO-8601" }
```
`expiresAt = createdAt + 120s` (configurable per-deployment, not hardcoded — mirrors the crash-detection architecture's stance on tunable thresholds). The mobile UI renders a local countdown purely as a **display** derived from `expiresAt - now()`, resyncing against the server value on every reconnect/poll — the display can drift a second or two on a flaky connection, but it is never the thing that decides whether escalation happens.

Expiry itself is determined by the backend via a scheduled sweep (a lightweight worker task — RideClub already runs a Celery worker per `backend/docker-compose.yml` — checking `status = COUNTDOWN_ACTIVE AND expiresAt <= now()` and transitioning to `ESCALATION_PENDING`), not by trusting a client-sent "time's up" call. This means:
- Screen lock, app backgrounding, OS-level app suspension, or the user simply not reopening the app **do not pause or extend** the countdown — it is a wall-clock deadline owned by the server.
- If the mobile app reopens mid-countdown, it fetches current `status`/`expiresAt` from `GET /api/sos/{sosId}` and resumes the correct display instantly rather than restarting a client-side timer from zero.

---

## 5. SOS Cancellation

Two related but distinct actions, both requiring a confirmation step to prevent an accidental-tap resolution of a genuine emergency:
- **"I'm OK"** — a soft confirmation for the common case (rider is fine, e.g. a hard-braking false positive on automatic SOS).
- **"Cancel SOS"** — an explicit cancel, same underlying transition, different UI framing for a manually-triggered SOS the rider wants to withdraw.

Both route through a confirmation sheet:
```text
Cancel emergency response?
[ Keep SOS Active ]   [ Yes, I'm Safe ]
```
Only "Yes, I'm Safe" calls `PATCH /api/sos/{sosId}` with `{ "status": "user_cancelled", "cancelledAt": <device ts>, "method": "i_am_ok" | "cancel_button" }`. The backend records both the device-reported timestamp and its own server-received timestamp (they can legitimately differ under poor connectivity, and both are kept — not reconciled into one — for the audit timeline in §20) plus computed `sosDurationMs`. `COUNTDOWN_ACTIVE → RESOLVED` (via `USER_CANCELLED`) is only valid while `status = COUNTDOWN_ACTIVE`; a cancellation request arriving after the backend has already moved the event to `ESCALATION_PENDING` or later does **not** silently revert it — see §19's "user cancels after escalation" handling, which requires an explicit human-in-the-loop close via the monitoring operator, not an automatic mobile-side cancel.

---

## 6. Location System

```text
GET current location (accuracy, timestamp, altitude/speed/heading where available)
        │
GPS unavailable?
        │
        ├── NO  → use current fix
        └── YES → use last-known valid location, keep attempting acquisition,
                   and mark the location as stale in every place it's displayed
```
Every location surfaced to a human (rider's own countdown screen, monitoring operator console §9, emergency-contact notification §11) must render one of:
- `"Current location, ±{accuracy}m"` — fresh fix
- `"Last known location, {ageMinutes}m ago, ±{accuracy}m"` — stale fix

Never render an unqualified "location" with no accuracy/recency context — this is a direct, non-negotiable requirement from the source spec (§6) and matters operationally: a monitoring operator or emergency contact acting on a 20-minute-stale location needs to know that before dispatching help to the wrong spot.

The SOS event's `location` field is captured once at creation and then **updated in place** as fresher fixes arrive during `COUNTDOWN_ACTIVE`/escalation (§12), with the full location history retained as a timeline (§20), not overwritten and lost.

---

## 7. Emergency Information (Emergency Profile)

```text
User Profile (existing: name, phone, account data)
        ↓
Emergency Profile (new, separate table — see §15)
   • Emergency contacts (already partially modeled via SOSDispatchRequest's
     emergency_contact_name/phone fields today; promote to a proper
     emergency_contacts table keyed by userId, not inlined per-request)
   • Blood group — only if voluntarily provided
   • Known allergies — only if voluntarily provided
   • Relevant medical information — only if voluntarily provided
   • Emergency notes
   • Preferred hospital — if configured
        ↓
Access-controlled Emergency Service (§16 RBAC: readable only by an
authenticated monitoring operator handling that specific SOS event, or by
the backend process assembling an emergency-contact notification — never
exposed via any ride-group-facing API or UI)
```
This is a genuinely separate data model from the SOS event itself (§15) — an SOS event *references* an emergency profile by `userId`, it does not embed medical fields inline, so that the vastly more common "just show location + rider name" access path never accidentally carries medical data through logs, caches, or a ride-group broadcast payload.

---

## 8. Emergency Response Center Integration

```text
RideClub Backend
        ↓
Emergency Response Adapter (interface)
        ↓
┌─────────────────────────────────────┐
│ Concrete implementation, chosen by   │
│ config — NOT hardcoded to one vendor │
└─────────────────────────────────────┘
```
Adapter interface (methods, not a specific vendor's API shape):
```text
createEmergencyEvent(sosEvent) -> providerEventId
updateLocation(providerEventId, location)
updateEmergencyStatus(providerEventId, status)
cancelEmergency(providerEventId, reason)
acknowledgeEvent(providerEventId)          // provider confirms an operator has seen it
closeEmergency(providerEventId, resolution)
```
**Until a real monitoring-provider contract exists**, the concrete implementation is a `NullEmergencyProvider` / `DegradedEscalationAdapter` that:
- Immediately marks the event `MONITORING_SERVICE_UNAVAILABLE` (not silently pretending a provider is watching),
- Falls through to directly notifying emergency contacts (§11) and the ride group (existing Socket.IO broadcast) using RideClub's own already-available channels,
- Flags the event in the audit timeline as "escalated without human monitoring provider" so this is never confused, in a support/compliance review, with an event that was actually triaged by a monitoring operator.

This satisfies the source requirement directly: *"Do not assume RideClub itself has direct access to emergency-service dispatch systems unless an actual integration/provider exists."*

---

## 9. 24/7 Monitoring Workflow

```text
SOS → backend confirms expiration (§4's scheduled sweep) → create escalation event
   → Emergency Response Adapter.createEmergencyEvent() → (if a real provider is
     configured) monitoring operator receives event, reviewing:
        rider identity · GPS location (with accuracy/recency, §6) · ride info
        · crash context (confidence/peak accel/rotation/stationary duration,
          only present for AUTOMATIC_CRASH_SOS) · emergency profile · contacts
   → operator follows their own configured response procedure
   → rider contacted / emergency services contacted if required / emergency
     contacts notified where appropriate
   → event resolved (RIDER_REACHED | EMERGENCY_SERVICES_CONTACTED | FALSE_ALARM)
```
**Provider health monitoring & fallback** (explicitly required by the source spec — "do not make the architecture dependent on an assumption that an operator will always be available"):
- The adapter's `createEmergencyEvent()` call has a bounded timeout; on timeout or an explicit provider-side error, the event transitions to `MONITORING_SERVICE_UNAVAILABLE` rather than hanging in `ESCALATION_PENDING` indefinitely.
- On that transition, the §8 degraded path fires automatically (contacts + ride group notified directly) — the rider's safety-relevant outcome does not depend on provider uptime, only the "professional monitoring" layer does.
- A periodic health-check (adapter-level `ping()`, run by the same worker doing the countdown sweep) tracks provider availability so a *known-down* provider is skipped immediately on the next SOS rather than timing out fresh each time.

---

## 10. Emergency Service Escalation

```text
Monitoring Operator → assess event → False Alarm → resolve
                                   → Emergency → Local Emergency Services,
                                                  with location + relevant details
```
The **mechanism** for "contacting local emergency services" is explicitly a configuration surface, not a hardcoded number/workflow — required because RideClub is a rider-safety product, not a single-country dispatch system:
```text
config per deployment region:
  country / region
  applicable local emergency number(s)
  whether a direct API integration with a local emergency-dispatch system exists
  fallback: operator manually places a call using locale-appropriate emergency number
```
Absent an actual regional integration, the architecture's honest default is: **the monitoring operator (a human, per §9) is responsible for knowing/using the correct local emergency number for the event's location** — RideClub's system provides them the location and context to do so, it does not itself dial anything, unless and until a specific regional integration is built and configured.

---

## 11. Emergency Contacts

Reuses and formalizes the existing per-request `emergency_contact_name`/`emergency_contact_phone` fields from `sos.py` into a proper `emergency_contacts` table (up to N contacts per user, ordered by priority). Notification channels, in order of what's already available in this codebase vs. what would need new integration:
```text
SMS            — already available (Twilio, extracted from sos.py into a shared
                  NotificationService per the crash-detection architecture's §6)
Push Notification — available if the app already has a push channel configured;
                  reuse it, don't stand up a second one
Phone Call     — requires a voice-capable provider integration; not assumed present
Email          — requires transactional email provider; not assumed present
```
Notification content is deliberately minimal (name, "possible emergency"/"SOS activated" framing matching `triggerType`, map link, timestamp, ride name, status) and **never** includes emergency-profile medical fields — those stay behind the §7/§16 access boundary, available only to an authenticated monitoring operator or, where legally/contractually appropriate, directly to responding emergency services via the operator.

---

## 12. Live Location Updates

```text
Mobile Location Manager → Emergency Event → Backend → Monitoring Provider (if configured)
```
Frequency is adaptive and configurable per phase, not fixed globally:
```text
Normal ride (no active SOS):     existing low-frequency tracking (unchanged)
SOS_INITIATED / COUNTDOWN_ACTIVE: elevated frequency (e.g. every 5-10s) — the
                                   rider might cancel any second, and a fresher
                                   location makes that resolution cheaper for
                                   everyone if it does escalate
Escalated (MONITORING_ACTIVE+):   highest configured frequency, balanced against
                                   battery/network per §12's own adaptive rules —
                                   this is the one phase where "as fresh as
                                   reasonably possible" outweighs battery economy
```
This intentionally diverges from the crash-detection architecture's §10 battery-conservation stance: once actually escalated, location freshness for a real responder matters more than battery life, whereas the *crash-detection engine itself* stays local-first/battery-conscious right up until an event exists.

---

## 13. Offline Emergency Handling

```text
SOS Trigger → Local SOS Event (created client-side, given a client-generated
              idempotency key so a later server sync doesn't double-create it)
      → Countdown starts locally using a client-computed provisional expiresAt
        (createdAt + configured duration — this is the one case where a local
        timer is legitimate, because there's no server to be authoritative yet)
      → Network available?
           YES → POST to backend immediately, backend becomes authoritative,
                  client discards its provisional timer in favor of the
                  server-returned expiresAt
           NO  → queue locally (persisted, not in-memory — survives app
                  restart, same pattern as the crash-detection architecture's
                  §13 offline outbox), keep the local countdown running,
                  retry POST on connectivity-change with backoff
```
**If the device remains completely offline through the entire countdown** (explicitly required to be defined by the source spec): the local countdown still expires on-device using its provisional timer, the mobile app transitions its *local* view of the event to "escalation pending — will send once connected" and keeps retrying; no escalation, notification, or provider contact can happen until the event actually reaches the backend, so this is a real, disclosed limitation — the mobile UI must say so plainly (e.g. "No connection — emergency alert will be sent as soon as your phone reconnects") rather than implying help is already on the way.

---

## 14. Backend Architecture

```text
RideClub App
      ↓
API (REST for create/patch, existing Socket.IO gateway for live countdown/status push)
      ↓
Authentication (existing get_current_user / require_ride_access)
      ↓
SOS Event Service (new: api/routers/sos.py evolves from the current single
                    /dispatch endpoint into POST /api/sos, PATCH /api/sos/{id},
                    GET /api/sos/{id}; the Celery worker already in
                    backend/workers/ gains an expiry-sweep task)
      ↓
┌────────────────┬─────────────────────┬────────────────────┐
↓                ↓                     ↓                    ↓
SOS Database   Location Service    Notification Service   (all converge into)
(new table,    (updates the SOS      (shared with crash-       ↓
§15)           event's location      detection architecture, Emergency Response
               field, §6/§12)        reused from sos.py's       Adapter (§8)
                                      Twilio wiring)              ↓
                                                            Monitoring/Response
                                                            Provider (or degraded
                                                            fallback, §8/§9)
```

---

## 15. Data Model

```json
{
  "sosId": "uuid",
  "userId": "uuid",
  "rideId": "uuid",
  "triggerType": "MANUAL_SOS | AUTOMATIC_CRASH_SOS",
  "status": "SOS_INITIATED | COUNTDOWN_ACTIVE | RESOLVED | ESCALATION_PENDING | MONITORING_ACTIVE | RESPONSE_IN_PROGRESS",
  "createdAt": "ISO-8601",
  "expiresAt": "ISO-8601",
  "cancelledAt": null,
  "cancellationMethod": null,
  "escalatedAt": null,

  "location": {
    "latitude": 0, "longitude": 0, "accuracy": 0,
    "timestamp": "ISO-8601", "isStale": false,
    "altitude": null, "speedKph": null, "headingDeg": null
  },

  "crashContext": {
    "confidence": 0, "peakAcceleration": 0,
    "rotationChange": 0, "stationaryDuration": 0
  },

  "emergencyProfileRef": { "userId": "uuid", "available": true },

  "response": { "provider": null, "providerEventId": null, "operatorId": null, "status": "PENDING" },

  "resolution": { "outcome": "RIDER_REACHED | EMERGENCY_SERVICES_CONTACTED | FALSE_ALARM | USER_CANCELLED | null", "resolvedAt": null }
}
```
`crashContext` is only populated when `triggerType = AUTOMATIC_CRASH_SOS`, sourced directly from the crash-detection architecture's `CrashCandidateEvent` shape (§7 of that document) — same field names, no translation layer needed between the two systems.

Separate table, **not embedded**, per §7/§16:
```text
emergency_profiles
  user_id (fk, pk)
  blood_group, allergies, medical_notes, preferred_hospital  (all nullable — voluntary)
  updated_at

emergency_contacts
  id, user_id (fk), name, phone, priority_order, created_at

sos_events   (the model above, flattened into columns + a jsonb location/crashContext blob)

sos_event_audit_log   (§16/§20 — append-only: who/what accessed or changed an event, when)
```

---

## 16. Security & Privacy

```text
Encryption in transit    — HTTPS only (existing deployment default, render.yaml)
Encryption at rest       — same Supabase Postgres instance already used elsewhere;
                            emergency_profiles specifically should use column-level
                            encryption or a restricted-role view, since it's the one
                            table in this whole architecture holding voluntary medical data
Strict RBAC              — rider (own events only) / ride-group member (location +
                            status only, no emergency_profiles access) / monitoring
                            operator (full event + emergency_profiles, only for events
                            actively assigned to them) / admin (audit-only, break-glass)
Emergency-profile access — never joined into any ride-group-facing or general SOS-status
controls                   API response; a separate, explicitly-authorized endpoint only
Audit logging            — every read of emergency_profiles and every SOS status
                            transition writes to sos_event_audit_log (operatorId,
                            action, sosId, timestamp) — matches the source spec's
                            literal example: "Operator X accessed emergency profile
                            at 15:42:10 for SOS ID XXXXX"
Data minimization         — notification payloads (§11) never carry medical fields;
                            ride-group broadcasts never carry emergency_profiles
Retention policies        — sos_events retained longer than ordinary ride telemetry
                            (liability/compliance reasons, mirrors the crash-detection
                            architecture's §11 stance); exact windows are a product/
                            legal decision, not an engineering default to invent here
Secure API authentication — existing get_current_user/JWT pattern; monitoring-operator
                            access (once a real provider/ops surface exists) needs its
                            own separate authenticated role, not the rider-facing JWT
Token expiration          — existing app-wide session/token expiry policy applies
Rate limiting             — SOS creation itself should NOT be rate-limited the way
                            the old /dispatch endpoint was (5/hour) — a rider in a
                            genuine repeated-emergency situation must never be
                            throttled; instead, rate-limit at the notification-fanout
                            layer (e.g. cap duplicate SMS sends per contact per hour)
                            and rely on §3's DUPLICATE_SOS coalescing to prevent
                            accidental floods from retries
Event integrity validation — an SOS event's status can only move forward through
                            the state machine (§3) via defined transitions; the API
                            rejects any PATCH attempting an invalid transition
                            (e.g. RESOLVED -> COUNTDOWN_ACTIVE) rather than silently
                            accepting it
```

---

## 17. Mobile Architecture

```text
UI Layer                → SOS button, countdown screen, cancellation confirmation sheet
SOS Controller           → thin layer translating a manual press or an incoming
                            CrashCandidateEvent into a "create SOS" intent
Emergency State Manager  → single source of truth for current SOS state on-device;
                            everything else (UI, notifications, countdown display)
                            reads from here, nothing else holds its own copy of "are
                            we currently in an SOS" — this directly satisfies the
                            source spec's explicit requirement
Countdown Manager        → resolves display countdown from server expiresAt (§4),
                            or a provisional local timer only while fully offline (§13)
Crash Detection Engine   → existing Phase 1 implementation; feeds the SOS Controller,
                            does not itself know anything about SOS/escalation
Location Manager         → existing pattern from Navigation.tsx, extended with the
                            adaptive-frequency behavior from §12
Offline Queue            → persisted outbox, shared implementation pattern with the
                            crash-detection architecture's §13 (don't build two)
API / WebSocket Layer    → REST for create/patch/get, existing Socket.IO client
                            connection for live status push (operator acknowledged,
                            ride-group notified, etc.) without polling
```

---

## 18. Platform Requirements

**Android** — background execution, foreground services, location permissions, sensor permissions (for the crash-detection engine feeding this), battery optimization, notification permissions, device reboot, locked-screen behavior: all identical constraints and the same foreground-service approach already specified in the crash-detection architecture's §8/§9 — an active SOS should extend/reuse that same foreground service (a ride already in one, or an SOS started standalone getting its own), not add a second competing one.

**iOS** — background execution, Core Motion (crash-context source only), Core Location (this document's primary dependency — the countdown/escalation pipeline cares about location far more than motion), location permissions, background location (needs the "when in use" → "always" upgrade path handled thoughtfully, prompted contextually rather than at install), notification behavior, app suspension, locked-screen behavior, system restrictions: same honest limitation as the crash-detection architecture's §9 — iOS does not guarantee indefinite background execution, so an SOS that's escalated while the app is suspended relies on the **backend's own server-authoritative countdown** (§4) to keep progressing regardless of what the device is doing, which is exactly why §4 insists on server authority rather than a client-side timer.

---

## 19. Reliability & Failure Handling

| Scenario | Detection | Fallback | Retry | User feedback | Server state | Final resolution |
|---|---|---|---|---|---|---|
| App killed | server sweep finds no more app activity, but doesn't need it | countdown is server-owned regardless | N/A | none possible until reopened | continues normally | escalates on schedule if not cancelled before kill |
| Phone restarted | app reboot-receiver (Android) re-checks for an in-progress SOS on next launch | resumes display from `GET /api/sos/{id}` | N/A | "SOS still active" banner on relaunch | unaffected | unaffected |
| Phone locked | n/a — doesn't block server countdown | full-screen/lock-screen notification where platform allows | N/A | high-visibility notification | unaffected | unaffected |
| Battery critically low | OS-level, not app-detected | SOS pipeline never throttles for battery (§16 rate-limit note only applies elsewhere) | N/A | none special | unaffected | unaffected |
| GPS unavailable | Location Manager reports no fix | use last-known location, marked stale (§6) | keep attempting acquisition | location shown as "last known, Xm ago" | event still created/escalates | unaffected |
| Internet unavailable | Network Layer | local provisional countdown (§13) | backoff retry on connectivity-change | "will send when reconnected" | event doesn't exist server-side until synced | escalation only possible after sync |
| Backend unavailable | API call failure/timeout | same offline-queue path as "internet unavailable" | backoff retry | same as above | N/A until reachable | delayed escalation, timestamped honestly |
| Monitoring provider unavailable | adapter health-check/timeout (§9) | degraded direct-notify fallback (§8) | periodic provider health re-check | rider sees normal escalation UI regardless (this is an internal fallback) | `MONITORING_SERVICE_UNAVAILABLE` flag set, audit-logged | resolved via degraded path, flagged for follow-up |
| Notification delivery failure | Twilio/push API error response | log + surface in audit log; try next contact in priority order | limited retry (not infinite — avoid spamming a bad number) | none to rider (backend-internal) | event unaffected, notification attempt logged | escalation still proceeds via other channels/contacts |
| Duplicate SOS | idempotency key (rideId+userId+in-progress-status) at create time | coalesce into existing event, don't create a second | N/A | rider sees the existing event's state, not a fresh countdown | single event, updated not duplicated | single resolution |
| Accidental trigger | rider self-reports via "I'm OK" | confirmation sheet (§5) exists specifically for this | N/A | immediate resolution once confirmed | `RESOLVED` via `USER_CANCELLED` | closed, duration logged |
| Cancel after escalation | PATCH arrives after `status` already left `COUNTDOWN_ACTIVE` | **not** auto-applied — requires monitoring-operator (or, absent a provider, an ops/admin) review to close as `FALSE_ALARM`/`RIDER_REACHED`, since a stranger could otherwise silently cancel a real emergency from a compromised session | N/A | rider sees "cancellation requested — awaiting confirmation" not an immediate resolve | stays in current escalated state until explicitly closed | requires human close, logged as "cancel requested by rider during escalation" |
| Location becomes unavailable mid-escalation | Location Manager | continues with last-known, staleness grows | keeps attempting | staleness shown to monitoring operator too | location field's `isStale`/timestamp updates, not blanked | unaffected |

---

## 20. Audit & Event Timeline

Every `sos_events` row has a companion append-only timeline (`sos_event_audit_log`, §15/§16), each entry `{ timestamp, actor, action, detail }`. Example rendering:
```text
15:40:01 — SOS initiated (trigger=AUTOMATIC_CRASH_SOS, confidence=0.81)
15:40:02 — GPS acquired (±8m)
15:40:03 — Countdown started (expiresAt=15:42:03)
15:41:30 — Location updated (±6m)
15:42:03 — Countdown expired
15:42:04 — Backend escalation created
15:42:06 — Monitoring provider acknowledged   [or: "No provider configured — degraded
                                                escalation to emergency contacts + ride group"]
15:42:30 — Operator contacted rider           [or: "Emergency contact notified via SMS"]
15:43:15 — Emergency services contacted
15:50:00 — Event resolved (outcome=RIDER_REACHED, by=operator:X)
```
Both device-reported and server-received timestamps are retained separately wherever they can differ (§5) — this timeline is the debugging/support/security/compliance record the source spec requires, and it is only as trustworthy as being explicit about which clock produced which entry.

---

## 21. Safety & UX Requirements

The SOS screen (trigger button and the active countdown screen) must be: extremely clear, high-contrast, operable under stress, large touch targets, minimal cognitive load, accessible (screen-reader labeled, not icon-only), and visible on the lock/always-on screen where platform permissions allow (Android notification with full-screen-intent for an active countdown; iOS critical-alert-style notification where entitlement/permissions allow).

Concretely for **manual trigger**: require a deliberate action (press-and-hold ~1.5s with clear progress feedback, not a bare single tap) so it's fast enough to use in a real emergency but resistant to an in-pocket accidental press — this directly satisfies the source spec's "prevent accidental activation while still allowing rapid activation" requirement without contradicting itself, since a held-press is both fast (under 2 seconds) and deliberate.
