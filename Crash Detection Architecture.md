# RideClub — Crash Detection & Emergency Response Architecture

Design and implement a **production-ready high-level architecture** for RideClub's mobile crash detection and emergency response system.

The goal is to continuously monitor smartphone motion sensors during an active ride and detect potential crashes while minimizing false positives, battery consumption, and unnecessary emergency alerts.

## Core Detection Pipeline

Design the architecture around this flow:

```text
┌───────────────────────┐
│   Active Ride Mode    │
└───────────┬───────────┘
            ↓
┌───────────────────────────────────────┐
│          Device Motion Sensors        │
│                                       │
│  Accelerometer     Gyroscope          │
│       │                │              │
│       └───────┬────────┘              │
│               ↓                       │
│      Target: Up to 120 Hz             │
│      Device-dependent sampling        │
└───────────────┬───────────────────────┘
                ↓
┌───────────────────────────────────────┐
│          Signal Processing             │
│                                       │
│ • Noise filtering                     │
│ • Sensor normalization                │
│ • Gravity compensation                │
│ • Acceleration analysis               │
│ • Rotation analysis                   │
│ • Motion-state detection              │
│ • Sensor fusion                       │
└───────────────┬───────────────────────┘
                ↓
┌───────────────────────────────────────┐
│       Crash Detection Engine           │
│                                       │
│ • G-force / acceleration spike       │
│ • Sudden motion reduction             │
│ • Rotation / orientation change       │
│ • Post-impact inactivity              │
│ • GPS speed / movement context        │
│ • Confidence scoring                  │
└───────────────┬───────────────────────┘
                ↓
        ┌───────┴────────┐
        │                │
        ↓                ↓
  Normal Event      Crash Candidate
        │                │
        ↓                ↓
    Continue       Multi-signal
     Riding          validation
                         │
                         ↓
                 Crash Suspected
                         │
                         ↓
              Emergency Confirmation
                         │
                         ↓
                 10–30 sec Countdown
                    /           \
                   /             \
                  ↓               ↓
            User responds    No response
                  │               │
                  ↓               ↓
             Cancel alert    Emergency Protocol
                                  │
                    ┌─────────────┼─────────────┐
                    ↓             ↓             ↓
              Emergency      Ride Group     Backend/Event
               Contacts        Members          Record
                    │             │             │
                    └─────────────┼─────────────┘
                                  ↓
                         Location + Time
                         + Crash Telemetry
```

# Architecture Requirements

## 1. Mobile Sensor Layer

Create a dedicated sensor abstraction layer.

It should:

* Access accelerometer data.
* Access gyroscope data.
* Request the highest reliable sampling rate supported by the device.
* Target up to 120 Hz where supported.
* Dynamically fall back to lower rates when necessary.
* Avoid assuming every device supports 120 Hz.
* Clearly separate Android and iOS sensor implementations.
* Provide a normalized sensor data format to the detection engine.

Example normalized event:

```json
{
  "timestamp": 0,
  "accelerometer": {
    "x": 0,
    "y": 0,
    "z": 0
  },
  "gyroscope": {
    "x": 0,
    "y": 0,
    "z": 0
  },
  "samplingRate": 120
}
```

## 2. Signal Processing Layer

Create a processing pipeline between raw sensors and crash detection.

The pipeline should support:

```text
Raw Sensor Data
      ↓
Validation
      ↓
Noise Filtering
      ↓
Gravity Compensation
      ↓
Acceleration Magnitude
      ↓
Angular Velocity
      ↓
Motion State
      ↓
Sensor Fusion
```

Calculate useful signals such as:

* Total acceleration magnitude
* Linear acceleration
* Angular velocity
* Rotation change
* Motion intensity
* Impact duration
* Post-impact movement
* Stationary duration

Do not rely on a single sensor reading.

## 3. Crash Detection Engine

Design the crash detection engine as a modular component.

It should combine multiple indicators:

```text
Impact Detection
      +
Rotation Change
      +
Sudden Motion Reduction
      +
Post-impact Inactivity
      +
GPS Context
      ↓
Crash Confidence Score
```

Avoid implementing:

```text
High G-force = Crash
```

Instead, use multiple signals and configurable thresholds.

Example:

```text
Impact Score
Motion Stop Score
Rotation Score
GPS Context Score
        ↓
Weighted Confidence
        ↓
Crash Confidence
```

Use configurable thresholds so they can later be tuned without rewriting the architecture.

## 4. Detection State Machine

Design the crash detector as an explicit state machine.

Required states:

```text
IDLE
  ↓
MONITORING
  ↓
IMPACT_DETECTED
  ↓
VALIDATING
  ↓
CRASH_SUSPECTED
  ↓
COUNTDOWN
  ├── USER_CANCELLED → MONITORING
  └── TIMEOUT → EMERGENCY_TRIGGERED
```

Also handle:

```text
False Positive
Sensor Failure
GPS Unavailable
App Backgrounded
Ride Ended
Phone Restarted
Low Battery
Permission Revoked
```

## 5. Emergency Countdown

When crash confidence crosses the configured threshold:

Display a highly visible emergency confirmation screen.

Example:

```text
┌─────────────────────────────┐
│                             │
│       POSSIBLE CRASH        │
│                             │
│       Are you OK?           │
│                             │
│          10                 │
│                             │
│   [ I'M OK ]                │
│                             │
│   Emergency alert will be   │
│   sent if there is no       │
│   response.                 │
│                             │
└─────────────────────────────┘
```

Countdown should be configurable within a safe range, such as 10–30 seconds.

The user must be able to cancel the emergency response immediately.

## 6. Emergency Protocol

If the countdown expires without user confirmation:

Collect:

```text
Crash timestamp
Last known GPS location
Current/last known speed
Ride ID
User ID
Crash confidence
Peak acceleration
Rotation data
Post-impact inactivity duration
Device information
Sensor sampling rate
```

Then trigger the configured emergency workflow.

Possible recipients:

```text
Emergency Contacts
Ride Group
Ride Leader
RideClub Backend
```

Do not expose unnecessary sensitive information.

## 7. Location Architecture

Use the location system as supporting context rather than the primary crash detector.

Example:

```text
Motion Sensors
      +
GPS
      ↓
Crash Detection Context
```

The system should continue handling sensor detection if GPS is temporarily unavailable.

Store the last known valid location so an emergency event can still contain useful location information.

## 8. Background Execution

Design specifically for real-world mobile restrictions.

The architecture must account for:

* Android background execution
* Android foreground services where appropriate
* iOS background execution limitations
* Screen locked state
* App minimized state
* Battery optimization
* Sensor availability
* Permission changes
* Phone restart
* Ride start/stop lifecycle

Do not assume the application can freely execute indefinitely in the background on both platforms.

Clearly identify which components run:

```text
Foreground
Background
Native OS service
Backend
```

## 9. Battery Management

Design the system so that high-frequency monitoring is only active during:

```text
Active Ride
```

Outside an active ride:

```text
Sensors OFF
Crash Detection OFF
High-frequency processing OFF
```

Consider:

* Adaptive sampling
* Sensor batching where appropriate
* Lightweight local processing
* Avoiding unnecessary network requests
* Local-first detection
* Uploading telemetry only when required

## 10. Privacy & Security

Crash detection should process sensor information locally whenever possible.

Clearly define:

```text
Device-only data
↓
Temporary event data
↓
Emergency event data
↓
Backend-stored data
```

Minimize storage of raw sensor streams.

Prefer storing derived crash metrics rather than continuously uploading raw 120 Hz sensor data.

Include:

* Encryption in transit
* Encryption at rest
* Access control
* Data retention policy
* User consent
* Emergency-contact authorization
* Audit logging

## 11. Backend Architecture

Design a backend event pipeline:

```text
Mobile App
    ↓
Crash Event API
    ↓
Authentication
    ↓
Crash Event Service
    ↓
┌───────────────┬────────────────┐
↓               ↓                ↓
Database    Notification     Emergency
             Service           Service
```

Store crash events separately from normal ride telemetry.

Example:

```json
{
  "eventId": "uuid",
  "rideId": "uuid",
  "userId": "uuid",
  "timestamp": "ISO-8601",
  "location": {
    "latitude": 0,
    "longitude": 0
  },
  "confidence": 0.0,
  "peakAcceleration": 0.0,
  "rotationChange": 0.0,
  "stationaryDuration": 0,
  "status": "EMERGENCY_TRIGGERED"
}
```

## 12. Reliability & False Positive Protection

The architecture must prioritize avoiding unnecessary emergency alerts.

Consider common non-crash scenarios:

* Potholes
* Speed breakers
* Hard braking
* Aggressive acceleration
* Phone dropped
* Phone mounted incorrectly
* Rough roads
* Motorcycle vibration
* Phone being removed from mount
* Rider stopping normally

Implement a validation window after an impact before triggering the emergency countdown.

## 13. Offline-First Emergency Detection

Crash detection itself should NOT depend on an internet connection.

Architecture:

```text
Sensors
   ↓
Local Detection Engine
   ↓
Crash Suspected
   ↓
Countdown
   ↓
Emergency Event
   ↓
Internet available?
   │
   ├── YES → Send immediately
   │
   └── NO → Queue locally
                  ↓
             Retry when
             connectivity returns
```

If the platform permits an appropriate emergency communication mechanism, clearly separate that from RideClub's own notification system.

## 14. Observability & Testing

Design a telemetry/debugging layer for development and controlled testing.

Track:

```text
Sensor sampling rate
Sensor availability
Detection latency
Peak acceleration
Peak angular velocity
Crash confidence
False-positive events
Countdown cancellations
Emergency triggers
Battery impact
```

Create a replayable sensor-data format so recorded test sessions can be fed back into the detection engine without physically recreating crashes.

Never require real crashes for testing.

Test against simulated/recorded scenarios:

```text
Normal riding
Hard braking
Pothole
Speed breaker
Sharp turn
Phone drop
Sudden stop
Normal parking
Simulated impact
Simulated crash sequence
```

# Architecture Deliverables

Produce the following:

### 1. System Architecture Diagram

Show:

```text
Mobile Sensors
      ↓
Sensor Abstraction
      ↓
Signal Processing
      ↓
Crash Detection Engine
      ↓
State Machine
      ↓
Emergency Countdown
      ↓
Emergency Protocol
      ↓
Backend / Notifications / Ride Group
```

### 2. Mobile Architecture

Separate:

```text
UI Layer
Ride State
Sensor Layer
Signal Processing
Crash Detection
Emergency Manager
Location Manager
Local Storage
Network Layer
```

### 3. Backend Architecture

Show:

```text
API Gateway
Authentication
Crash Event Service
Database
Notification Service
Emergency Contact Service
Ride Group Service
Monitoring / Logging
```

### 4. Data Flow Diagram

Show the complete lifecycle:

```text
Sensor Event
→ Processing
→ Detection
→ Validation
→ Crash Confidence
→ Countdown
→ User Response
→ Emergency Event
→ Backend
→ Notifications
```

### 5. State Machine Diagram

Clearly define every crash detection state and transition.

### 6. Failure Scenarios

Document what happens when:

* GPS is unavailable
* Internet is unavailable
* Sensors are unavailable
* App is backgrounded
* Phone is locked
* Battery is low
* User cancels
* False positive occurs
* Ride ends
* App crashes
* Phone restarts

### 7. Platform Considerations

Provide separate considerations for:

```text
Android
iOS
```

including sensor APIs, sampling limitations, background execution, permissions, battery optimization, and lifecycle constraints.

### 8. Security & Privacy Architecture

Clearly identify what data is:

```text
Processed locally
Stored temporarily
Sent to backend
Stored permanently
Shared with emergency contacts
```

### 9. Technology Recommendation

Recommend an implementation architecture suitable for RideClub's existing mobile application.

Prefer a **native sensor abstraction layer** even if the main application uses a cross-platform framework such as React Native/Expo.

Explain where native Android/iOS modules are required.

### 10. Important Engineering Principle

Do NOT present this system as a guaranteed crash detector.

Use terminology such as:

* Potential Crash
* Crash Candidate
* Crash Confidence
* Emergency Confirmation
* Possible Crash Detected

The architecture should be designed as a **safety-assistance system**, not as a certified accident-detection or life-safety system.

Finally, provide:

1. High-level architecture diagram
2. Component diagram
3. Data-flow diagram
4. Crash state machine
5. Mobile architecture
6. Backend architecture
7. Data models
8. API boundaries
9. Android/iOS considerations
10. Battery strategy
11. Privacy/security strategy
12. Testing strategy
13. Recommended implementation phases

Keep the architecture implementation-ready but **do not start writing the actual application code yet**.
