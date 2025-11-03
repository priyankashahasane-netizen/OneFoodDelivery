# Gap Analysis vs. `prd.md`

This document compares the requirements from `prd.md` with the currently committed Flutter driver application. It highlights delivered capabilities, missing functionality, and dependencies per surface.

## Summary

- **Present codebase**: Flutter delivery driver app only (`lib/feature/*`). All web, admin, and backend services outlined in `prd.md` are absent.
- **Integrations**: App constants target legacy StackFood APIs and Google Maps; no OptimoRoute, ipstack, or OpenStreetMap wiring exists.
- **Realtime/notifications**: Relies on Firebase Cloud Messaging for push. No Redis pub/sub, SSE, or WebSocket fanout infrastructure is present.

## Delivery Partner App (Flutter)

| Requirement (`prd.md`) | Status | Notes / References |
| --- | --- | --- |
| OTP login & KYC capture | ❌ | `lib/feature/auth` implements password login only (`SignInViewScreen`). Registration collects documents but no OTP flow. |
| Online/offline toggle with capacity settings | ⚠️ | Active status toggle exists (`ProfileController.updateActiveStatus`), but no capacity or stack limits.
| Multi-order stacking with OptimoRoute sequencing | ❌ | `OrderController` pulls orders via REST and sorts locally; no OptimoRoute integration or capacity logic.
| Route optimization on accept/stack change | ❌ | No calls to OptimoRoute API; `OrderLocationScreen` renders static Google Map positions.
| Step-by-step navigation on OSM map | ❌ | Uses `google_maps_flutter` (`OrderLocationScreen`); no OSM tiles, no navigation instructions.
| Adaptive live location updates (5–10 s) | ⚠️ | `ProfileController.startLocationRecord` pushes Geolocator readings every 10s via existing API, but no adaptive cadence or battery heuristics.
| Tracking link generation & sharing via SMS/WhatsApp | ❌ | No tracking URL creation or share workflows.
| Proof of delivery: photo, signature, OTP at door | ⚠️ | Photo upload and OTP verification exist (`VerifyDeliverySheetWidget`), but no customer signature capture or optional OTP toggle.
| Earnings dashboard with incentives, history | ⚠️ | `cash_in_hand` and `home` modules cover wallet balances and counts; incentive-specific UI minimal.

## Customer Tracking Web

- **Missing entirely**: No Next.js project or web assets beyond Flutter web shell. No `/track/{orderId}` route, SSE/WebSocket subscription, or ipstack personalization.

## Admin Dashboard (Next.js + Node.js)

- **Missing entirely**: No admin UI code, no Next.js project, no RBAC or analytics views.

## Backend Services (Node.js)

- **Missing entirely**: No Node/NestJS service. The Flutter app still targets production StackFood endpoints (`lib/util/app_constants.dart`).
- **Required integrations absent**: No OptimoRoute, ipstack, or OpenStreetMap adapters. No Redis, PostgreSQL schemas, or orchestration per PRD sequence diagram.

## Data & Eventing Gaps

- No server-side job queue, assignment engine, or tracking ingest pipeline (current app expects existing StackFood backend to handle these).
- No audit logging, observability hooks, or SLA timers described in PRD.

## Supporting Infrastructure

- CI/CD, Docker, Kubernetes assets referenced in PRD are absent.
- Configuration management for API keys (OptimoRoute, ipstack, OSM) does not exist.

## Next Steps (from plan)

1. Scaffold the new backend (`apps/backend/`) with required modules and integrations.
2. Build the public tracking site (`apps/tracking-web/`).
3. Build the admin dashboard (`apps/admin-dashboard/`).
4. Update the Flutter driver app to target the new backend and deliver missing features.



