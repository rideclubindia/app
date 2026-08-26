I want you to architect and implement an **advanced, production-grade real-time WebSocket architecture** for this entire application, specifically designed to support **at least 100,000 concurrently connected users** with high reliability, low latency, and horizontal scalability.

### Primary requirement

The application needs real-time functionality for a large number of users who may simultaneously:

* Start and continue a ride
* Use live navigation
* Share/update their live location
* Create a ride
* Join or leave a ride
* View ride-related real-time updates
* Receive important ride/navigation events
* Update ride status
* Receive safety-related real-time events where applicable

This is **not just a single-screen optimization**. Design the WebSocket infrastructure as a reusable real-time platform for the **whole application**, while initially optimizing it for the ride + navigation experience.

The target is:

**100,000+ concurrent WebSocket connections**, with the ability to scale beyond this without redesigning the architecture.

---

## 1. First analyze the existing application

Before modifying anything:

* Inspect the entire codebase.
* Identify the current frontend architecture.
* Identify the backend architecture.
* Identify authentication mechanisms.
* Identify database usage.
* Identify existing APIs.
* Identify ride creation/joining flows.
* Identify navigation/location update flows.
* Identify existing polling, REST requests, Firebase listeners, SSE, or other real-time mechanisms.
* Identify where real-time communication is currently required.
* Identify bottlenecks and architectural weaknesses.
* Do not blindly introduce WebSockets everywhere.

Create a clear architecture based on the application's existing technology stack.

---

## 2. Design a production-grade WebSocket architecture

Implement WebSockets using an architecture suitable for **100K+ concurrent connections**.

The architecture must support:

```text
100K+ Concurrent Users
        |
        v
Load Balancer
        |
        v
WebSocket Gateway / Edge Layer
        |
        +-------------------+
        |                   |
        v                   v
WebSocket Node 1      WebSocket Node N
        |                   |
        +---------+---------+
                  |
                  v
                Redis
                  |
        +---------+---------+
        |                   |
        v                   v
 Ride Services        Navigation Services
        |                   |
        +---------+---------+
                  |
                  v
        Database / Persistent Storage
```

Do not assume a single WebSocket server can handle the entire workload.

The implementation must be **horizontally scalable**.

---

## 3. WebSocket connection architecture

Create a dedicated real-time connection architecture with:

* Connection lifecycle management
* Authentication during connection establishment
* Authorization
* Connection heartbeat
* Ping/pong handling
* Automatic reconnect
* Exponential backoff
* Connection timeout handling
* Idle connection handling
* Graceful disconnect
* Graceful server shutdown
* Connection draining during deployments
* Duplicate connection handling
* Multi-device handling
* Session recovery
* Connection state management

Do not keep critical application state only in the memory of an individual WebSocket server.

---

## 4. Horizontal scaling

The architecture must work when running multiple WebSocket instances.

For example:

```text
                    Load Balancer
                         |
        +----------------+----------------+
        |                |                |
        v                v                v
    WS Node 1         WS Node 2        WS Node 3
        |                |                |
        +----------------+----------------+
                         |
                    Redis Pub/Sub
                         |
        +----------------+----------------+
        |                |                |
    Ride Service    Navigation       Notification
```

If User A is connected to WebSocket Node 1 and User B is connected to WebSocket Node 8, they must still be able to communicate through the distributed messaging layer.

Do not create architecture that depends on sticky sessions unless there is a strong technical reason.

If sticky sessions are required, clearly explain why and implement them correctly.

---

## 5. Redis / distributed event system

Introduce a suitable distributed messaging mechanism such as:

* Redis Pub/Sub
* Redis Streams
* Redis Cluster
* Kafka
* NATS
* Or another appropriate event-broker architecture

Choose the technology based on the application's actual requirements.

Explain the choice.

Do not introduce unnecessary infrastructure simply for complexity.

The architecture must distinguish between:

### Ephemeral real-time events

Examples:

* GPS updates
* Navigation position
* Typing/status indicators
* Temporary ride-state updates

and:

### Critical persistent events

Examples:

* Ride created
* Ride accepted
* Ride joined
* Ride cancelled
* Ride completed
* Safety events
* Important transactional state changes

Critical events must not depend solely on transient WebSocket delivery.

---

## 6. Location update optimization

Live location is potentially the largest source of traffic.

Do NOT blindly send every GPS update to every connected user.

Design an efficient location pipeline with:

* Adaptive update frequency
* Distance-based updates
* Time-based updates
* Significant-location-change detection
* Batching where appropriate
* Compression
* Delta updates where appropriate
* Room-based broadcasting
* Geographic filtering
* User/ride relevance filtering

For example:

```text
User GPS Update
      |
      v
Should this update be sent?
      |
   +--+--+
   |     |
  No    Yes
   |     |
Ignore    v
      Determine relevant users
             |
             v
      Broadcast only to
      required subscribers
```

A user's location should **never be broadcast globally**.

---

## 7. Rooms / channels / subscriptions

Implement a scalable subscription model.

For example:

```text
ride:{rideId}
user:{userId}
navigation:{sessionId}
region:{regionId}
```

Users should subscribe only to the resources they actually need.

Example:

```text
User
 |
 +-- user:{userId}
 |
 +-- ride:{rideId}
 |
 +-- navigation:{navigationSessionId}
```

When a user leaves a ride, automatically unsubscribe them from the relevant room.

---

## 8. Message protocol

Create a consistent WebSocket message protocol.

For example:

```json
{
  "type": "ride.location.updated",
  "version": 1,
  "eventId": "unique-event-id",
  "timestamp": 1234567890,
  "payload": {}
}
```

Design:

* Event naming conventions
* Message versions
* Event IDs
* Timestamps
* Correlation IDs
* Request IDs
* Error format
* Acknowledgement mechanism
* Schema validation
* Backward compatibility

Avoid sending unnecessary payload data.

Prefer compact payloads for high-frequency events.

---

## 9. Reliability

The system must handle:

* WebSocket disconnects
* Internet switching
* Mobile network changes
* Server crashes
* Load balancer failures
* Redis failures
* Temporary database failures
* Client reconnects
* Duplicate messages
* Out-of-order messages
* Missed events
* Network latency
* Deployment restarts

Implement appropriate:

* Sequence numbers
* Event IDs
* Idempotency
* Acknowledgements
* Retry mechanisms
* Recovery mechanisms
* Snapshot + delta synchronization

For example:

```text
Client disconnects
       |
       v
Reconnect
       |
       v
Authenticate
       |
       v
Recover session
       |
       v
Request missed events
       |
       v
Receive latest state
       |
       v
Resume real-time updates
```

---

## 10. Authentication and security

The WebSocket layer must integrate with the application's existing authentication system.

Implement:

* Secure authentication
* Token validation
* Token expiration handling
* Authorization
* Room-level authorization
* Rate limiting
* Connection limiting
* Message-size limits
* Input validation
* Schema validation
* Abuse prevention
* Origin validation where appropriate
* Protection against connection flooding
* Protection against message flooding

Never trust client-provided:

* User IDs
* Ride IDs
* Permissions
* Driver/passenger roles
* Location ownership
* Administrative privileges

Validate everything server-side.

---

## 11. Performance requirements

Design for:

### Minimum target

**100,000 concurrent WebSocket connections**

But architect the system so it can scale toward:

**250K → 500K → 1M+ connections**

without fundamentally redesigning the application.

Target:

* Very low event propagation latency
* Minimal CPU overhead
* Minimal memory per connection
* Efficient serialization
* Efficient network usage
* Efficient Redis/broker usage
* No unnecessary database queries
* No blocking operations inside WebSocket handlers

Do not claim that latency will be "zero."

Instead, establish measurable latency targets and provide instrumentation to verify them.

---

## 12. Avoid database overload

A major requirement is:

**Do not write every WebSocket event directly to the database.**

For high-frequency events such as GPS:

```text
GPS Update
    |
    +--> WebSocket / Real-time pipeline
    |
    +--> Temporary state/cache
    |
    +--> Periodic persistence if required
```

Use:

* Redis/cache for short-lived state
* Database for durable state
* Batch writes where appropriate
* Asynchronous persistence
* Queue-based processing when appropriate

Avoid:

```text
GPS update
   ↓
Database write
   ↓
WebSocket broadcast
```

for every location update.

---

## 13. Backpressure

Implement backpressure handling.

If a client cannot consume messages fast enough:

```text
Producer
   |
   v
Message Queue
   |
   v
Slow Client
```

The server must not allow one slow client to consume unlimited memory.

Implement appropriate:

* Queue limits
* Message dropping policies for non-critical events
* Latest-location replacement
* Priority handling
* Connection termination when necessary

For example, if five GPS updates are waiting for a slow client, it may be better to deliver the newest location instead of sending every outdated location.

Critical events must use a different delivery strategy from disposable location updates.

---

## 14. Client-side architecture

Build a reusable frontend WebSocket manager.

Do NOT create independent WebSocket connections for every screen/component.

Prefer:

```text
Application
     |
     v
WebSocket Manager
     |
     +-- Connection
     +-- Authentication
     +-- Reconnect
     +-- Subscriptions
     +-- Event routing
     +-- State synchronization
```

Screens/components should subscribe to the manager instead of opening their own sockets.

Implement:

* Singleton/shared connection
* Subscription management
* Automatic reconnect
* Event listeners
* Connection state
* Offline handling
* Online recovery
* Message queueing where appropriate
* Cleanup on unmount
* Authentication refresh

---

## 15. Navigation architecture

Navigation must remain responsive even when real-time traffic is high.

Do not allow WebSocket processing to block:

* Map rendering
* GPS processing
* Navigation
* User interactions
* UI animations

Use appropriate client-side throttling/debouncing and state management.

Separate:

```text
Navigation State
Real-Time State
UI State
Persistent Application State
```

Do not cause the entire application to re-render every time a GPS coordinate changes.

---

## 16. Observability

Build complete observability into the architecture.

Track:

### WebSocket metrics

* Active connections
* Connections/sec
* Disconnects/sec
* Reconnect rate
* Authentication failures
* Messages/sec
* Messages per connection
* Incoming bandwidth
* Outgoing bandwidth
* Connection duration
* Event latency

### Infrastructure metrics

* CPU
* RAM
* Network
* Redis latency
* Redis memory
* Database connections
* Database latency
* Queue depth
* Event processing latency

### Application metrics

* Ride creation latency
* Ride join latency
* Navigation update latency
* Location propagation latency
* Failed events
* Dropped events
* Reconnection recovery time

Add structured logging and distributed tracing where appropriate.

Every important event should be traceable using a correlation/request ID.

---

## 17. Load testing

Do not simply claim that the system supports 100K users.

Create a load-testing strategy.

Test progressively:

```text
1K
5K
10K
25K
50K
75K
100K
150K+
```

Test scenarios such as:

### Scenario A

100K connected users but mostly idle.

### Scenario B

100K connected users with periodic heartbeats.

### Scenario C

50K users actively navigating.

### Scenario D

Large numbers of users simultaneously updating location.

### Scenario E

Large numbers of users creating/joining rides.

### Scenario F

Server instance failure during peak traffic.

### Scenario G

Redis/broker degradation.

### Scenario H

Mass reconnect after network interruption.

Measure actual:

* P50 latency
* P95 latency
* P99 latency
* Error rate
* CPU
* Memory
* Network throughput
* Redis throughput
* Database load
* Event loss
* Reconnect recovery

---

## 18. Infrastructure architecture

Design the deployment for horizontal scaling.

Consider:

```text
                    CDN
                     |
               Load Balancer
                     |
          +----------+----------+
          |          |          |
        WS-1       WS-2       WS-N
          |          |          |
          +----------+----------+
                     |
                Redis Cluster
                     |
        +------------+------------+
        |            |            |
     Ride API    Navigation    Event Workers
        |            |            |
        +------------+------------+
                     |
                  Database
```

Use autoscaling where appropriate.

The architecture must support:

* Multiple availability zones
* Health checks
* Rolling deployments
* Graceful shutdown
* Connection draining
* Automatic replacement of unhealthy instances
* Horizontal scaling

Avoid single points of failure.

---

## 19. Capacity planning

Calculate and document estimated capacity.

Do not just say "this can handle 100K."

Estimate:

* Connections per WebSocket instance
* Memory per connection
* CPU requirements
* Messages/sec
* Location updates/sec
* Redis operations/sec
* Network bandwidth
* Database throughput
* Load-balancer capacity

Show the assumptions used for the calculations.

Clearly identify what must be benchmarked rather than guessed.

---

## 20. Architecture documentation

Create documentation explaining:

1. Overall architecture
2. WebSocket lifecycle
3. Authentication flow
4. Reconnection flow
5. Ride room architecture
6. Navigation architecture
7. Location-update pipeline
8. Redis/event-broker architecture
9. Database interaction
10. Failure recovery
11. Scaling strategy
12. Security model
13. Monitoring
14. Load testing
15. Deployment architecture

Include architecture diagrams where useful.

---

## 21. Implementation requirements

Before writing code:

1. Inspect the existing project.
2. Identify the existing backend/frontend stack.
3. Identify existing real-time mechanisms.
4. Identify reusable infrastructure.
5. Identify potential conflicts.
6. Propose the architecture.
7. Explain the major design decisions.
8. Then implement it.

Do not rewrite unrelated parts of the application.

Do not introduce unnecessary dependencies.

Do not duplicate existing functionality.

Follow the project's existing coding conventions.

Keep the implementation modular and production-ready.

---

## 22. Important architectural rule

Do NOT optimize only for:

> "100K WebSocket connections."

Optimize for:

> **100K concurrent users performing realistic application activities without cascading failures, excessive latency, database overload, memory exhaustion, or a single-server bottleneck.**

The system must degrade gracefully under extreme load.

A temporary increase in traffic must not bring down the entire application.

---

## 23. Final deliverables

After implementation, provide:

* Final architecture
* Technologies selected and why
* Modified files
* New files
* WebSocket connection flow
* Event/message definitions
* Redis/broker architecture
* Scaling strategy
* Security strategy
* Failure/recovery strategy
* Performance optimizations
* Load-testing setup
* Capacity assumptions
* Monitoring/metrics
* Deployment requirements
* Environment variables required
* Local development instructions
* Production deployment instructions
* Known limitations
* Remaining bottlenecks
* Recommended next improvements

Most importantly, **do not tell me that it supports 100K users merely because the code is implemented**. Explain what has actually been implemented, what has been benchmarked, what remains infrastructure-dependent, and what load-test results are required before claiming production readiness.
