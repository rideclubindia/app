# RideClub — Crash Detection & Emergency Response Architecture

> **Status:** Architecture specification (implementation-ready). No application code has been written from this document yet.
> **Scope:** Mobile app only — sensor capture, on-device signal processing, crash detection state machine, emergency countdown/protocol, and the minimal backend surface needed to receive and fan out a crash event. This is a **safety-assistance system**, not a certified accident-detection or life-safety system. All user-facing and internal terminology uses "possible crash" / "crash candidate" / "crash confidence" / "emergency confirmation" — never "detected crash" or "confirmed accident."

RideClub's existing stack this design builds on:
- **Mobile shell**: Capacitor-wrapped React/TypeScript SPA (`@capacitor/core`, `@capacitor/android`; no iOS platform added yet — see §9).
- **Backend**: FastAPI (`backend/api/routers/sos.py` already dispatches a manual SOS SMS via Twilio, gated on `require_ride_access` and rate-limited to 5/hour), SQLAlchemy + Supabase Postgres, Redis-backed realtime gateway (Socket.IO) for ride-group presence.
- **Existing primitives to reuse, not replace**: the `sos.dispatch` endpoint's Twilio path and `require_ride_access` auth check; the realtime gateway for ride-group notification; the ride lifecycle (`Active Ride Mode` already exists as a concept in `Navigation.tsx`/`LiveRide.tsx`).

---

## 1. High-Level Architecture Diagram

```text
┌──────────────────────────────────────────────────────────────────────┐
│                            MOBILE APP (Capacitor)                    │
│                                                                        │
│  UI Layer (React)                                                     │
│   • Ride screen, Emergency Confirmation screen, Settings              │
│        ↑ state                    │ commands                          │
│  Ride State (existing: LiveRide/Navigation active-ride context)        │
│        │ ride start/stop                                              │
│        ↓                                                              │
│  Emergency Manager  ←──────────────┐                                  │
│        │        ↑ crash suspected  │ cancel / confirm                 │
│        │        │                  │                                  │
│  Crash Detection Engine (state machine)                                │
│        ↑ processed signals                                            │
│  Signal Processing Layer                                              │
│        ↑ normalized samples                                           │
│  Sensor Abstraction Layer (native module: Android/iOS)                 │
│        ↑ raw accel/gyro                                               │
│  Device Motion Sensors                                                │
│                                                                        │
│  Location Manager ───────────────────────────────────────────────────┤
│  Local Storage (event queue, replay buffer)                           │
│  Network Layer ───────────────────────────────────────────────────┐   │
└─────────────────────────────────────────────────────────────────┼───┘
                                                                   ↓
┌──────────────────────────────────────────────────────────────────────┐
│                                BACKEND                                │
│  API Gateway → Auth → Crash Event Service                             │
│                          │                                            │
│           ┌──────────────┼──────────────┐                            │
│           ↓              ↓              ↓                            │
│       Database   Notification Svc   Emergency Contact Svc             │
│                          │              │                            │
│                          ↓              ↓                            │
│                   Ride Group (Socket.IO)   Twilio SMS (existing)      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Diagram (Mobile)

```text
┌───────────────────────────────────────────────────────────────┐
│ UI Layer                                                       │
│  - EmergencyCountdownScreen (full-screen, always-on-top style) │
│  - RideActiveIndicator (subtle "crash detection armed" chip)   │
│  - SettingsCrashSensitivity (advanced/optional)                │
└───────────────────────────────┬─────────────────────────────────┘
                                 │ subscribes to EmergencyManager state
┌───────────────────────────────┴─────────────────────────────────┐
│ Emergency Manager                                                │
│  - Owns COUNTDOWN state, timer, cancel handler                   │
│  - Builds EmergencyEventPayload from CrashDetectionEngine output  │
│  - Delegates dispatch to Network Layer (with offline queue)       │
└───────┬───────────────────────────────────────────────┬──────────┘
        │ crash candidate + confidence                  │ last known location
┌───────┴──────────────────┐                    ┌────────┴───────────┐
│ Crash Detection Engine    │                    │ Location Manager    │
│  - State machine (§4)     │                    │  - GPS + fused speed │
│  - Confidence scorer      │                    │  - last-known cache  │
└───────┬──────────────────┘                    └──────────────────────┘
        │ processed signal frame
┌───────┴──────────────────┐
│ Signal Processing Layer   │
│  - Filter, gravity comp.  │
│  - Magnitude, ang. vel.   │
└───────┬──────────────────┘
        │ normalized sensor event (120Hz target)
┌───────┴──────────────────┐
│ Sensor Abstraction Layer  │
│  - Android: SensorManager native plugin │
│  - iOS: CoreMotion native plugin        │
└───────────────────────────┘
```

---

## 3. Data-Flow Diagram

```text
Sensor Event (raw, per-axis, timestamped)
   → Signal Processing (filter → gravity-compensate → magnitude/angular velocity → motion state)
   → Crash Detection Engine (impact score, motion-stop score, rotation score, GPS-context score → weighted confidence)
   → threshold crossed? ── no → discard/rolling-window only, back to MONITORING
                        └─ yes → VALIDATING (short window, re-checks signals settle rather than spike-and-noise)
   → still above threshold after validation → CRASH_SUSPECTED
   → Emergency Manager shows Emergency Confirmation screen → COUNTDOWN (10–30s, configurable)
   → user taps "I'M OK" → USER_CANCELLED → back to MONITORING (log false-positive-avoided event locally)
   → timeout → EMERGENCY_TRIGGERED
        → build EmergencyEventPayload (crash telemetry + last known location + ride/user IDs)
        → Network Layer: internet available? yes → POST to Crash Event API
                                              no  → enqueue in Local Storage, retry on connectivity change
        → Backend: Crash Event Service persists event, fans out to Notification Service (emergency contacts SMS via existing Twilio path) and Ride Group (Socket.IO broadcast to ride room)
```

---

## 4. Crash Detection State Machine

```text
                 ┌────────────────────────────────────────────┐
                 │                    IDLE                     │◄───────────────┐
                 └───────────────────┬──────────────────────────┘                │
                          ride starts │                                          │ ride ends
                                      ▼                                          │
                 ┌────────────────────────────────────────────┐                │
     ┌──────────►│                MONITORING                   │────────────────┘
     │           │  (sensors sampling, rolling signal window)   │
     │           └───────────────────┬──────────────────────────┘
     │ scores decay under threshold  │ impact score spikes above T1
     │ within validation window      ▼
     │           ┌────────────────────────────────────────────┐
     └───────────┤              IMPACT_DETECTED                │
                 │  (single-frame trigger; starts validation)   │
                 └───────────────────┬──────────────────────────┘
                                     ▼
                 ┌────────────────────────────────────────────┐
                 │                VALIDATING                    │
                 │  (short window, e.g. 1.5–3s: does motion      │
                 │   actually drop + rotation settle + no        │
                 │   further legitimate-riding signal?)          │
                 └───────┬───────────────────────┬──────────────┘
             signals don't │                       │ multi-signal confidence
             corroborate    │                       │ crosses T2
                     ▼      │                       ▼
              back to MONITORING          ┌────────────────────────────────┐
                                          │        CRASH_SUSPECTED          │
                                          └───────────────┬──────────────────┘
                                                          ▼
                                          ┌────────────────────────────────┐
                                          │           COUNTDOWN             │
                                          │   (10–30s, user-visible UI)     │
                                          └───────┬─────────────────┬──────┘
                                   user taps "I'M OK" │             │ timeout
                                                      ▼             ▼
                                          ┌───────────────┐  ┌──────────────────────┐
                                          │ USER_CANCELLED│  │  EMERGENCY_TRIGGERED  │
                                          │ → MONITORING  │  │  (protocol §6 fires)  │
                                          └───────────────┘  └──────────────────────┘

Cross-cutting states (can interrupt from MONITORING / VALIDATING / COUNTDOWN):
  SENSOR_FAILURE     — sensor stream stops or errors → degrade to GPS-only heuristic (speed-drop) or, if
                        that's also unavailable, surface a non-blocking "crash detection unavailable" chip
                        and stay in MONITORING without engine coverage; ride is not blocked.
  GPS_UNAVAILABLE    — detection continues on motion signals alone; GPS-context score is simply omitted
                        from the weighted confidence (weights re-normalize, not zeroed-out silently).
  APP_BACKGROUNDED   — see §8; on Android the foreground service keeps MONITORING alive; on iOS the
                        engine best-effort continues via CoreMotion background delivery, degraded.
  RIDE_ENDED         — force-transition to IDLE from any state except COUNTDOWN/EMERGENCY_TRIGGERED
                        (an in-flight emergency is not silently cancelled by the ride ending).
  PHONE_RESTARTED    — engine boots to IDLE; if a ride was active and an EMERGENCY_TRIGGERED event was
                        queued-but-unsent before restart, Local Storage's queue is flushed on next launch.
  LOW_BATTERY        — engine stays active (safety-critical), but non-essential adaptive-sampling backs
                        off (see §9); never disable detection purely for battery unless the OS forces it.
  PERMISSION_REVOKED — engine transitions to SENSOR_FAILURE-equivalent degraded state; UI surfaces a
                        clear "crash detection is off — re-enable motion permissions" prompt.
```

---

## 5. Mobile Architecture (Layered)

```text
UI Layer            → React components; only reads EmergencyManager state, never touches sensors directly.
Ride State           → existing active-ride context (Navigation.tsx/LiveRide.tsx); arms/disarms MONITORING.
Sensor Layer          → native module per platform, exposes one async iterator/callback API to JS.
Signal Processing     → pure functions/TS (or shared native, see §9), stateless where possible.
Crash Detection       → the state machine + confidence scorer; pure, testable, replay-driven (§14).
Emergency Manager     → owns COUNTDOWN UI trigger, cancel/timeout, payload assembly.
Location Manager      → wraps existing geolocation usage (Navigation.tsx already does watchPosition);
                        adds a "last known valid fix" cache independent of active display needs.
Local Storage         → replay buffers (dev/test only, see §14) + emergency-event outbox queue (prod).
Network Layer         → POST to Crash Event API with retry/backoff; queue-on-offline via outbox.
```

Each layer only depends on the one below it; the Crash Detection Engine has **zero** direct dependency on Network Layer or backend — it can run, and trigger a full local COUNTDOWN, with the device in airplane mode (§13).

---

## 6. Backend Architecture

```text
API Gateway (existing FastAPI app, main.py)
   → Authentication (existing get_current_user / require_ride_access dependency)
   → Crash Event Service (new router, e.g. api/routers/crash_events.py)
        → Database (new crash_events table, separate from ride telemetry — see §11 data model)
        → Notification Service (reuses backend/api/routers/sos.py's Twilio path — do not duplicate
          the Twilio client wiring; extract it into a shared `services/notification_service.py` that
          both `sos.dispatch` and the new crash-event path call)
        → Ride Group Service (reuses the existing Socket.IO gateway/`sio` instance already mounted at
          /socket.io — broadcast a `crash:suspected` or `crash:emergency` event to the ride's room)
   → Monitoring/Logging (existing logging.basicConfig JSON logger + /metrics Prometheus endpoint already
     in main.py — add crash-event-specific counters here, not a new observability stack)
```

Note: this reuses three things that already exist in the codebase rather than introducing parallel infrastructure — the Twilio SMS path, the Socket.IO ride-room gateway, and the JSON-logging/Prometheus setup in `main.py`.

---

## 7. Data Models

**Mobile-side normalized sensor event** (in-memory only, never persisted at full rate):
```json
{
  "timestamp": 0,
  "accelerometer": { "x": 0, "y": 0, "z": 0 },
  "gyroscope": { "x": 0, "y": 0, "z": 0 },
  "samplingRate": 120
}
```

**Emergency event payload** (mobile → backend, and the only sensor-derived data that leaves the device):
```json
{
  "eventId": "uuid",
  "rideId": "uuid",
  "userId": "uuid",
  "timestamp": "ISO-8601",
  "location": { "latitude": 0, "longitude": 0, "accuracyMeters": 0, "ageSeconds": 0 },
  "speedKph": 0,
  "confidence": 0.0,
  "peakAcceleration": 0.0,
  "rotationChange": 0.0,
  "stationaryDurationSec": 0,
  "device": { "platform": "android|ios", "osVersion": "string", "samplingRateAchieved": 0 },
  "status": "CRASH_SUSPECTED | EMERGENCY_TRIGGERED | USER_CANCELLED"
}
```
`ageSeconds` on location matters: if the last known fix is stale (GPS was unavailable at impact time), responders need to know it's not current.

**Backend `crash_events` table** — deliberately separate from ride-telemetry tables (ride path points, speed logs) per §12's requirement that crash events are stored distinctly:
```text
crash_events
  id (uuid, pk)
  ride_id (fk → rides)
  user_id (fk → users)
  occurred_at (timestamptz)
  latitude, longitude, location_accuracy_m, location_age_s
  speed_kph
  confidence (float)
  peak_acceleration, rotation_change (float)
  stationary_duration_s (int)
  device_platform, device_os_version, sampling_rate_achieved
  status (enum: crash_suspected, emergency_triggered, user_cancelled)
  created_at, updated_at
```
No raw sensor stream column — by design (§10).

---

## 8. API Boundaries

```text
POST /api/crash-events
  auth: existing get_current_user + require_ride_access(ride_id)
  rate limit: per-user, generous but bounded (e.g. 10/hour) — this is a safety path, don't starve it,
              but still bound it against a runaway false-positive loop hammering the endpoint.
  body: EmergencyEventPayload (status = CRASH_SUSPECTED or EMERGENCY_TRIGGERED)
  → 201, { eventId }
  side effects on status=EMERGENCY_TRIGGERED:
    - persist crash_events row
    - call NotificationService.send_emergency_sms(...) for each configured emergency contact
      (reusing sos.py's Twilio integration, not a new one)
    - emit Socket.IO event to the ride's room so other ride-group members/leader see it live

PATCH /api/crash-events/{eventId}
  body: { status: "user_cancelled" }
  → allows a late-arriving cancellation (e.g. device regains connectivity after the countdown already
    expired locally but the user tapped "I'M OK" before this device's own network layer flushed) to
    correct a queued/in-flight event before or shortly after emergency contacts are notified.
```

No endpoint accepts raw sensor streams — that boundary is intentional (§10).

---

## 9. Android / iOS Considerations

**Android**
- Sensors: `SensorManager` with `TYPE_LINEAR_ACCELERATION` + `TYPE_GYROSCOPE`, requested at `SENSOR_DELAY_FASTEST`; actual delivered rate is OEM-dependent (commonly 100–200Hz on modern devices, but must be measured, not assumed — the abstraction layer reports `samplingRateAchieved` back up, it never assumes 120Hz).
- Background execution: a **foreground service** (with a persistent, honest notification — "RideClub is monitoring for crashes") is required to keep sensor sampling and the detection engine alive while the app is backgrounded or the screen is locked during an active ride. This is the only reliable way to survive Doze/App Standby on modern Android.
- Battery optimization: request the user exempt RideClub from aggressive battery optimization for the duration of a ride (standard `ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` prompt at ride-start, not app-install time — ask when the need is obvious).
- Permissions: `BODY_SENSORS` is not required for accelerometer/gyroscope (those are not "body sensors" in Android's permission model), but foreground-service and (if targeting Android 14+) the specific foreground service type (`FOREGROUND_SERVICE_LOCATION` or a health/safety-appropriate type) must be declared.

**iOS**
- Sensors: `CoreMotion`'s `CMMotionManager` (`startDeviceMotionUpdates`, which already gives gravity-compensated user acceleration + rotation rate — some of §2's "gravity compensation" work is native-provided on iOS, not reinvented in the shared layer).
- Background execution: iOS is far more restrictive — `CMMotionManager` background delivery requires the app to have an active background mode justification (e.g. Core Location's "location" background mode, since a ride is already using continuous location). Sustained 120Hz background motion sampling for an indefinite ride duration is **not guaranteed** by iOS the way a foreground service guarantees it on Android — this must be documented as a platform limitation, not silently assumed away.
- Fallback posture: when iOS suspends motion delivery in the background, the engine degrades to GPS-speed-drop heuristics only (still useful — a sudden speed-to-zero transition is itself a weak crash signal) until the app returns to foreground.
- Permissions: Motion & Fitness usage description (`NSMotionUsageDescription`) required in Info.plist.

**Cross-platform note**: RideClub currently has `@capacitor/android` installed but no iOS platform folder yet (confirmed — no `@capacitor/ios` in `package.json`). This architecture should be built Android-first with the sensor abstraction's interface designed so an iOS native module slots in later without changing the Signal Processing/Detection Engine contract.

---

## 10. Battery Strategy

- High-frequency sampling (§2's target 120Hz) is active **only** while `Ride State` is `ACTIVE` — armed by the same transition that already starts `Navigation.tsx`'s live tracking, not a separate toggle the user has to remember.
- Outside an active ride: sensors off, detection engine in `IDLE`, no foreground service running (Android), no background motion registration (iOS).
- Adaptive sampling: if the engine has been in `MONITORING` for an extended period with a consistently low motion-intensity signal (e.g. stopped at a long light, or parked mid-ride) and speed ≈ 0, drop sampling rate (e.g. to 20–30Hz) until motion resumes — a stationary phone doesn't need 120Hz to catch a crash that, by definition, requires an impact to occur.
- Sensor batching: on Android, use `SensorManager.registerListener`'s `maxReportLatencyUs` batching where the detection engine's validation-window logic can tolerate it, reducing wake-ups.
- Local-first: confidence scoring runs entirely on-device; no network round-trip is on the critical path between impact and countdown — this is also a battery win (no radio wake for every processed frame) and a safety win (§13).
- Low battery: detection stays on (it's the safety-critical path), but non-essential adaptive-sampling backs off further and telemetry upload (§14, dev-only) is disabled.

---

## 11. Privacy & Security Architecture

```text
Device-only data        → raw 120Hz accel/gyro stream. Never leaves the device. Not written to disk in
                           production builds (only in an opt-in debug/replay build, §14).
Temporary event data     → rolling signal window (last few seconds of processed magnitude/rotation),
                           held in memory only, discarded once VALIDATING resolves either direction.
Emergency event data     → the EmergencyEventPayload (§7) — derived metrics + one location fix, not a
                           trajectory. Queued in Local Storage only when offline, encrypted at rest
                           (platform keystore/keychain-backed storage, not plaintext SharedPreferences/
                           UserDefaults), deleted once successfully delivered.
Backend-stored data      → the crash_events row (§7). No raw sensor stream ever reaches the backend.
Shared with contacts     → name, "possible crash" framing, Google Maps link (reusing sos.py's existing
                           `maps_link` pattern), timestamp. Not raw telemetry, not the full payload.
```

- **Encryption in transit**: HTTPS only (already the deployment default per `render.yaml`); no plaintext fallback for the crash-event POST.
- **Encryption at rest**: crash_events table lives in the same Supabase Postgres instance already used for the rest of the app — no new storage tier, but access should be scoped (see below).
- **Access control**: a crash event is readable by its own user, ride-group members (already gated by `require_ride_access`), and emergency contacts only via the outbound SMS (they never get API access) — no admin-wide unscoped read unless the existing admin-role pattern is extended deliberately.
- **Data retention**: define a retention window (e.g. crash_events older than N months with status `user_cancelled` are eligible for purge; `emergency_triggered` events are retained longer for safety/liability reasons) — this is a product/legal decision to finalize, not an engineering default to invent silently.
- **User consent**: crash detection must be an explicit opt-in surfaced at ride-start (or in ride settings), not a silent always-on background capability — the user needs to know their phone is sampling motion at 120Hz and may trigger an automated emergency contact/SMS flow.
- **Emergency-contact authorization**: reuse whatever consent flow already exists for manual SOS (`sos.py` already requires `emergency_contact_phone` to be supplied per-dispatch) — crash-triggered dispatch should draw from the same verified emergency-contact list, not a separate unverified one.
- **Audit logging**: every `EMERGENCY_TRIGGERED` and every `USER_CANCELLED`-after-`CRASH_SUSPECTED` is logged server-side (already have the JSON logger in `main.py` — extend it, don't build a parallel audit system) for later false-positive-rate analysis and any liability review.

---

## 12. Reliability & False-Positive Protection

The **VALIDATING** state (§4) is the primary defense, not a single-frame threshold. Concretely:
- A single high-G spike (pothole, speed breaker, phone dropped) enters `IMPACT_DETECTED` but must be corroborated within the validation window by at least one more independent signal (motion actually stopping, not just spiking; rotation settling into a non-riding orientation; GPS speed dropping toward zero) before advancing to `CRASH_SUSPECTED`.
- Explicitly modeled non-crash scenarios and how each is rejected:
  - **Potholes/speed breakers**: sharp vertical spike, but speed and orientation continue normally afterward → motion-stop score stays low → rejected in VALIDATING.
  - **Hard braking/aggressive acceleration**: high linear deceleration/acceleration but low rotation-change and no post-event inactivity → rejected.
  - **Phone dropped (off bike, in pocket)**: can look like free-fall + impact, but subsequent motion doesn't match "stationary rider on ground" (phone may keep moving in a pocket/bag) and GPS speed doesn't necessarily drop — weighted low unless truly stationary follows.
  - **Rough roads / motorcycle vibration**: this is why raw acceleration is filtered (§2) before scoring — sustained vibration is a frequency-domain pattern the noise filter is tuned to suppress, distinct from a single discrete impact event.
  - **Phone removed from mount mid-ride**: motion pattern differs from an impact (gradual, human-handling motion vs. sharp discrete spike) — should not trigger `IMPACT_DETECTED` at all under correctly-tuned thresholds.
  - **Normal stopping**: deceleration is present but gradual, not spike-shaped, and rotation stays consistent with upright riding — rejected well before `IMPACT_DETECTED`.
- All thresholds (impact G-force floor, validation-window duration, confidence weights, countdown length) are **configuration values**, not hardcoded constants — tunable server-side or via app config without a rebuild, so false-positive rate can be improved post-launch from real usage data (aggregated `USER_CANCELLED` events are the feedback signal).

---

## 13. Offline-First Emergency Detection

```text
Sensors → Local Detection Engine → Crash Suspected → Countdown → Emergency Event
                                                                        │
                                                          Internet available?
                                                             │
                                              ┌──────────────┴──────────────┐
                                              │ YES                          │ NO
                                              ▼                              ▼
                                     Send immediately              Queue in Local Storage outbox
                                                                              │
                                                                   Retry on connectivity-change
                                                                   listener (exponential backoff,
                                                                   capped), survives app restart
                                                                   (persisted, not in-memory only)
```

The entire path from raw sensor to a fully-populated, locally-displayed Emergency Confirmation countdown requires **zero network access** — this is the core safety guarantee, since a crash on a remote road is exactly when connectivity is least reliable. Only the final "notify emergency contacts/ride group" step is network-dependent, and that step degrades to queue-and-retry rather than failing silently.

If the platform exposes a genuine emergency-calling mechanism (e.g. Android's `ACTION_CALL_EMERGENCY` equivalents, or a carrier-level emergency SMS path distinct from app-level Twilio SMS), that is a **separate, platform-native mechanism** from RideClub's own contact/ride-group notification — this document does not conflate the two. Whether to invoke platform emergency services automatically (vs. only notifying personal emergency contacts) is a product/legal decision requiring explicit scoping before implementation, not an assumed default.

---

## 14. Observability & Testing Strategy

**Runtime telemetry (dev/internal builds, and minimal aggregate counters in production):**
```text
Sensor sampling rate achieved (vs. requested)
Sensor availability (up/down transitions)
Detection latency (impact → confidence-threshold-crossed)
Peak acceleration, peak angular velocity per event
Crash confidence score distribution
False-positive rate (USER_CANCELLED after CRASH_SUSPECTED, as a fraction of rides)
Countdown cancellation count
Emergency trigger count
Battery impact (foreground-service runtime vs. ride duration, sampled)
```
These feed the existing Prometheus `/metrics` endpoint pattern already in `main.py` — extend it, don't stand up a parallel observability stack.

**Replayable sensor-data format** — this is the key testing enabler, since the architecture must never require a real crash to validate:
```json
{
  "scenario": "pothole | hard_braking | speed_breaker | sharp_turn | phone_drop | sudden_stop | normal_parking | simulated_impact | simulated_crash_sequence",
  "samples": [
    { "t": 0, "accel": {"x":0,"y":0,"z":0}, "gyro": {"x":0,"y":0,"z":0} }
  ]
}
```
A recorded or hand-authored session in this format is fed directly into the Signal Processing → Crash Detection Engine pipeline (bypassing the Sensor Abstraction Layer entirely), letting the state machine and confidence scorer be validated with ordinary unit/integration tests — no physical device motion required, and no real crash ever required. This should be the primary test harness for tuning thresholds in §12 before any field testing.

**Required test scenarios** (each as a recorded/synthetic sample set): normal riding, hard braking, pothole, speed breaker, sharp turn, phone drop, sudden stop, normal parking, simulated impact (isolated spike, no follow-through), simulated crash sequence (full impact → motion-stop → rotation-change → inactivity chain) — validating both that the crash sequence correctly reaches `EMERGENCY_TRIGGERED` and that every non-crash scenario is rejected in `VALIDATING` or never leaves `MONITORING`.

---

## 15. Technology Recommendation

- **Native sensor abstraction layer, even inside the existing Capacitor/React app.** Do not attempt 120Hz-target accelerometer/gyroscope sampling through a generic web `DeviceMotionEvent`-style JS API — browser/WebView motion event delivery is throttled, batched, and rate-inconsistent in ways that defeat the sampling-rate requirements in §1 and §9. This needs a genuine Capacitor plugin with native Android (Kotlin/Java, `SensorManager`) and, later, iOS (Swift, `CoreMotion`) implementations, exposing a single normalized-event stream to the JS layer via the existing Capacitor plugin bridge (event listener pattern, matching how `@capacitor/screen-orientation` is already consumed in this codebase's `useOrientationLock` hook).
- **Signal Processing and Crash Detection Engine live in TypeScript**, not native — they're pure/stateless-ish computation over the normalized event stream, benefit hugely from the replay-based testing in §14 (trivial to unit-test in TS/Jest, much more friction to unit-test inside two separate native codebases), and only need to run at the JS-bridge-delivered rate, not raw sensor rate. Only the sampling itself needs to be native; the math on top of it doesn't.
- **Emergency Manager and Location Manager**: TypeScript, reusing existing patterns already in `Navigation.tsx` (its `watchPosition`/heading-smoothing logic is directly relevant prior art for the Location Manager's "last known valid fix" cache).
- **Backend**: extend the existing FastAPI app with one new router (`crash_events.py`) and one new service module, reusing the existing Twilio integration, Socket.IO gateway, and Supabase Postgres — no new backend service/infrastructure is justified by this feature's scope.

---

## 16. Recommended Implementation Phases

1. **Phase 1 — Replay harness + detection engine (no native code, no UI)**: build the Signal Processing + Crash Detection Engine + state machine in TypeScript against the replayable sensor-data format (§14), with the full false-positive scenario suite (§12) as the acceptance bar. This validates the hardest, most safety-critical logic before touching any platform code.
2. **Phase 2 — Android native sensor plugin**: build the Capacitor Android plugin exposing normalized 120Hz-target accel/gyro events; wire it into Phase 1's engine running against real device data (still no emergency UI yet — log-only mode).
3. **Phase 3 — Emergency Manager + Countdown UI + local-only trigger**: build the Emergency Confirmation screen and countdown, wire cancel/timeout, but stop at "would have triggered emergency" logging — no real SMS/backend calls yet, to validate real-world false-positive rate safely before it can page anyone.
4. **Phase 4 — Backend crash-event pipeline**: `crash_events` table/migration, `crash_events.py` router, extraction of the shared Twilio notification service from `sos.py`, Socket.IO ride-room broadcast.
5. **Phase 5 — End-to-end wiring + offline queue**: connect Phase 3's trigger to Phase 4's API with the offline outbox (§13), foreground service (Android, §9), battery-optimization exemption prompt.
6. **Phase 6 — Field validation + threshold tuning**: internal dogfooding on real rides, using the observability data (§14) to tune thresholds/weights before any wider rollout; iOS native module (§9) can start in parallel once Android's contract is proven.
