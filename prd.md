One Food Delivery App 
Scope: Frontend-first PRD covering Delivery Partner App (Flutter), Customer Tracking Web, and Admin Dashboard (Next.js + Node.js). Integrations now include OptimoRoute, ipstack (IP geolocation), and OpenStreetMap (map tiles + geocoding).

1) Product Overview
Purpose
Manage last‑mile delivery for orders created on third‑party food platforms. Our system handles driver assignment, route optimization via OptimoRoute, real‑time tracking links, multi‑order stacking, and stakeholder notifications, with an Admin Dashboard for operations and analytics.
Target Users
Delivery Partners (Drivers) — accept, stack, and complete deliveries.


End Customers — receive live tracking link.


Admins / Dispatchers / Support — monitor fleet, resolve exceptions, manage drivers.


Platforms
Mobile App: Flutter (iOS/Android)


Customer Tracking: Public web page (Next.js route)


Admin Dashboard: Next.js (frontend) + Node.js (backend)


Key Integrations
OptimoRoute — stop sequencing & dynamic route optimization.


ipstack (https://ipstack.com/) — IP → geo, timezone, and locale inference to:


personalize tracking page (language, units),


estimate customer city for ETA tuning when GPS permissions are denied,


geo‑fence fraud/anomalies (delivery far from expected region).


OpenStreetMap (https://www.openstreetmap.org/) — map baselayer & geocoding:


Tiles: OSM raster/Vector tiles (respect usage policy; prefer a commercial/hosted tiles provider or self‑host tileserver),


Geocoding: Nominatim (or hosted provider) for reverse geocoding driver coordinates to human‑readable addresses on receipts and admin views.



2) Core Functionalities
2.1 Delivery Partner App (Flutter)
Auth & Profile
OTP login, KYC docs, vehicle type, online/offline.


Order Lifecycle
Push notification for new jobs; accept/reject.


Multi‑order stacking with capacity constraints (max N, weight/volume optional).


Pickup/drop details, customer phone (masked), payment type, SLAs.


Route Optimization
On accept (or stack change), call OptimoRoute with current stop set → return ordered stops + ETAs.


Show step‑by‑step navigation overlay on OSM map; re‑optimize on detours.


Live Tracking
Foreground/background location updates (5–10s cadence; adaptive on battery).


Tracking link generation/refresh; share via SMS/WhatsApp.


Proof of Delivery (POD)
Photo, signature, OTP-at-door (optional), notes; mark complete.


Earnings
Day/week payout, incentives, history, distance & time per task.


2.2 Customer Tracking (Public Link)
URL pattern: https://app.example.com/track/{orderId}.


On first load, ipstack lookup of client IP → personalize language/units/timezone.


OSM map showing driver live position, ETA, and status timeline (Accepted → Picked Up → Out for Delivery → Delivered).


Contact support CTA, safe‑number relay (no direct disclosure).


2.3 Admin Dashboard (Next.js + Node.js)
Auth & Roles
Admin, Dispatcher, Support; SSO/OIDC; RBAC.


Live Ops
Real‑time OSM map of all drivers, clusters, heatmaps.


Orders stream with SLA timers, exceptions (driver idle, route deviation, geofence breach).


Manual (re)assignment; broadcast messages.


Drivers
CRUD, online/offline, utilization, on‑time %, cancellation rate, KYC status.


Deliveries
Job timeline, POD, re‑send tracking link, refund/issue flags.


Analytics
Completion rate, average delivery time, route efficiency (optimized vs actual), cost per drop, region heatmaps.


Configurations
OptimoRoute keys & policies (max stack, re‑optimize thresholds),


ipstack key + fallback behavior,


OSM tileserver URL, Nominatim endpoint, rate limiting/backoff,


Notification templates (push/SMS/email), SLA rules, webhooks.



3) Non‑Functional Requirements
Performance: route optimization round‑trip < 3s; live location E2E < 2s ingest → broadcast.


Availability: ≥ 99.95%.


Security: TLS; JWT; PII minimization; signed tracking URLs; CSRF/SSR protections on web.


Compliance: Respect OSM tile/Nominatim usage; GDPR/DPDP; consent for location; data retention policy.


Observability: Traces for assignment & optimization cycles; metrics (ingest lag, ws fanout); audit logs.



4) Data Model (Essentials)
Driver: id, name, phone, vehicleType, status, capacity, lastLocation, ratings
Order: id, externalRef, pickup{lat,lng,address}, dropoff{lat,lng,address}, status, items[], paymentType, sla, trackingUrl
RoutePlan: id, driverId, stops[], sequence[], totalDistance, etaPerStop[] (from OptimoRoute)
TrackingPoint: orderId, driverId, lat, lng, speed, heading, ts
Notification: id, event, recipients[], payload, ts

5) API Contracts (Representative)
Assign Delivery
POST /api/deliveries/assign
{
  "orderId":"1234",
  "driverId":"D567",
  "pickup": {"lat":12.93,"lng":77.62},
  "dropoff": {"lat":12.95,"lng":77.60}
}
→ {"status":"assigned","routeId":"R890","trackingUrl":"https://app.example.com/track/1234"}

Optimize Route (proxy to OptimoRoute)
POST /api/routes/optimize
{
  "driverId":"D567",
  "stops":[{"lat":12.93,"lng":77.62},{"lat":12.95,"lng":77.60}]
}
→ {"sequence":[0,1],"polyline":"...","etaPerStop":[...],"distanceKm":8.4}

IP Geolocation (ipstack)
GET /api/geo/ip
Headers: X-Forwarded-For: <client-ip>
→ {"city":"Bengaluru","country_code":"IN","tz":"Asia/Kolkata","lang":"en-IN","approx":true}

Reverse Geocoding (OpenStreetMap/Nominatim)
GET /api/geo/reverse?lat=12.93&lng=77.62
→ {"address":"MG Road, Bengaluru, KA, India"}

Tracking Stream
GET /api/track/:orderId/sse  // or WebSocket at /ws/track/:orderId
→ event: position { lat,lng, speed, eta }

Delivery Completed Event
POST /api/events/delivery-completed
{
  "orderId":"1234","driverId":"D567","pod":{"photoUrl":"...","signature":"..."},"ts":"..."
}
→ fanout notifications: customer, admin, support


6) Eventing & Notifications
Assignment → Driver (push)


Picked Up / Out for Delivery → Customer (SMS/push)


Delivered → Customer + Admin + Support


Exceptions → Dispatcher (dashboard alert + push/email)



7) Tech Stack
Flutter (Riverpod/Bloc), Next.js (App Router), Node.js (NestJS/Express), PostgreSQL, Redis (caching, pub/sub), WebSockets/SSE, FCM, Twilio/Email.


OptimoRoute, ipstack, OpenStreetMap (tiles + Nominatim).


CI/CD: GitHub Actions, Docker, Kubernetes, Nginx/Ingress.



📊 Visuals
A) System Architecture Diagram
flowchart LR
  subgraph Food_Platforms[3rd‑Party Food Ordering Platforms]
    Zom[Orders via Webhook/API]
  end

  Zom -->|order.created| Ingest[Order Ingest Service]

  Ingest --> Queue[(Jobs Queue)]
  Queue --> Dispatch[Dispatch & Assignment Engine]

  subgraph Optimo[OptimoRoute]
    OptAPI[Optimize Stops/Sequence]
  end

  Dispatch -- driver/stop set --> OptAPI
  OptAPI -- optimized sequence/ETAs --> Dispatch

  Dispatch -->|assign| DriverApp[Flutter Driver App]
  DriverApp -->|loc updates| TrackIngest[Tracking Ingest]
  TrackIngest --> RedisPub[Redis Pub/Sub]

  subgraph Realtime[Realtime API]
    WS[WebSocket/SSE Fanout]
  end

  RedisPub --> WS

  subgraph Customer[Tracking Web (Next.js)]
    TrackPage[Public Tracking Page]
  end

  WS --> TrackPage

  TrackPage -->|on load IP| IPStack[ipstack]
  DriverApp -. map tiles .-> OSM[OpenStreetMap Tiles]
  TrackPage -. map tiles .-> OSM
  AdminUI -. map tiles .-> OSM

  subgraph Admin[Admin Dashboard (Next.js + Node.js)]
    AdminUI[Next.js UI]
    AdminAPI[Node.js API]
  end

  Dispatch <---> AdminAPI
  AdminUI --> AdminAPI
  AdminAPI --> Nomin[OSM Nominatim Geocoder]

  Dispatch --> Notify[Notification Service]
  Notify --> CustomerNotifs[Customer SMS/Push]
  Notify --> AdminAlerts[Admin/Support Alerts]

  DB[(PostgreSQL)]
  Ingest --> DB
  Dispatch --> DB
  TrackIngest --> DB
  AdminAPI --> DB

B) Delivery Lifecycle — API Flow (Sequence)
sequenceDiagram
  participant FP as Food Platform
  participant ING as Ingest API
  participant DSP as Dispatch Engine
  participant OPT as OptimoRoute
  participant DRV as Driver App
  participant RT as Realtime/Tracking
  participant TPG as Tracking Page (Next.js)
  participant GEO as ipstack/Nominatim
  participant NTF as Notification Svc

  FP->>ING: order.created(payload)
  ING->>DSP: enqueue(order)
  DSP->>OPT: optimize(stops/current driver state)
  OPT-->>DSP: sequence + ETAs
  DSP->>DRV: push(assign job + route)
  DRV->>RT: gps update (5–10s)
  RT-->>TPG: position/ETA via WS/SSE
  TPG->>GEO: ip lookup (ipstack) & reverse geocode (Nominatim)
  GEO-->>TPG: tz/lang/address
  DRV->>DSP: status updates (picked_up / out_for_delivery)
  DSP->>NTF: notify customer (SMS/push + tracking link)
  DRV->>DSP: complete(order + POD)
  DSP->>NTF: delivered → notify all stakeholders

C) Tracking Link Page — State Flow
flowchart TD
  A[Open /track/:orderId] --> B{Has GPS permission?}
  B -- Yes --> C[Watch position & subscribe WS]
  B -- No --> D[ipstack IP lookup]
  D --> E[Set tz/lang/units]
  C --> F[Render OSM map + driver marker]
  E --> F
  F --> G[ETA + status timeline]
  G --> H[Support CTA / Re-send link]


8) Acceptance Criteria (Key)
Driver can accept multiple concurrent deliveries; OptimoRoute returns updated sequence ≤ 3s.


Customer sees live driver marker on OSM map with ETA updating ≤ 2s latency.


Tracking page adapts language/timezone using ipstack when user denies GPS.


Admin can reassign in-flight orders; map reflects changes in ≤ 5s.


On completion, all stakeholders receive notifications; POD stored & viewable.



9) Implementation Notes (Engineering)
Use clean architecture in Flutter (presentation/domain/data); WebSocket reconnect/backoff.


Next.js: server actions for tracking page bootstrapping (ipstack call at edge if possible), React Query for client hydration.


Node.js: NestJS modules: orders, drivers, assignments, routes (OptimoRoute), geo (ipstack, Nominatim), tracking, notifications.


Rate-limit geocoding; cache reverse‑geocode by tile/key; batch ipstack lookups via edge middleware.


Respect OSM and Nominatim usage policies; prefer hosted providers or self‑host where volume is high.



