# Stack Delivery - Food Delivery Management Platform

A comprehensive last-mile delivery management system for food delivery platforms. Built with **Flutter** (Driver App), **NestJS** (Backend API), and **Next.js** (Tracking Web & Admin Dashboard).

## Overview

Stack Delivery manages last-mile delivery for orders from third-party food platforms (Zomato, Swiggy, Uber Eats, etc.). The system handles driver assignment, route optimization, real-time tracking, multi-order stacking, and stakeholder notifications.

### Key Features

- **Driver Mobile App (Flutter)**: Accept orders, track routes, capture proof of delivery
- **Real-Time Tracking**: Live GPS tracking with customer-facing web page
- **Admin Dashboard**: Fleet management, analytics, exception handling
- **Route Optimization**: OptimoRoute integration for multi-stop delivery
- **Webhooks**: Ingest orders from third-party platforms
- **Mock APIs**: Test without paid subscriptions (OptimoRoute, ipstack)

---

## Quick Start

### 1. Start Infrastructure

```bash
# Start Docker Desktop, then:
docker-compose up -d postgres redis
```

### 2. Set Up Backend

```bash
cd apps/backend
npm install
npm run migration:run
npm run seed
npm run start:dev
```

Backend will be at: **http://localhost:3000**

### 3. Test APIs

```bash
curl http://localhost:3000/api/health
curl -X POST http://localhost:3000/api/webhooks/test
```

### 4. Run Flutter App

```bash
flutter clean
flutter pub get
flutter run -d macos
# For Android device:
# flutter run -d 10BD4Q0GXB000FC
# Login: +1234567890 / OTP: 123456
```

### 5. Run Admin Dashboard

```bash
cd apps/admin-dashboard
npm run build
PORT=3001 npm run dev
```

### 6. Run Tracking Web

```bash
cd apps/tracking-web
npm run dev
```

---

## Demo Credentials

### Driver App
- **Phone**: `+1234567890`
- **OTP**: `123456`
- **Driver**: John Doe (3 order capacity, online)

### Admin Dashboard
- **URL**: `http://localhost:3002/login`
- **Email**: `admin@stackdelivery.com`
- **Password**: `Admin@123`

See [DEMO_CREDENTIALS.md](./DEMO_CREDENTIALS.md) for all test accounts.

---

## Development Commands

### Flutter App
```bash
# Clean and rebuild
flutter clean
flutter pub get

# Run on macOS
flutter run -d macos

# Run on Android device
flutter run -d 10BD4Q0GXB000FC
```

### Backend
```bash
cd apps/backend

# Development mode
npm run start:dev

# Generate JWT secret
node scripts/generate-jwt-secret.js

# Export subscription orders for today
npm run export:subscription-orders-today
```

### Admin Dashboard
```bash
cd apps/admin-dashboard

# Build
npm run build

# Run on custom port
PORT=3001 npm run dev
```

### Database Operations
```bash
# Create database backup
docker-compose exec postgres pg_dump -U postgres -Fc stack_delivery > backup_$(date +%Y%m%d_%H%M%S).dump
```

---

## Order Status Flow

### Active Order Statuses (Running Orders)

1. **`created`** — Initial state when order is first created
2. **`pending`** — Awaiting assignment to a driver
3. **`assigned`** — Assigned to driver (not yet accepted)
4. **`accepted`** — Driver has accepted the order
5. **`confirmed`** — Restaurant has confirmed the order
6. **`processing`** — Restaurant is preparing the order
7. **`handover`** — Order is ready for pickup
8. **`picked_up`** — Driver has collected the order from restaurant
9. **`in_transit`** — Driver is en route to customer

### Completed Order Statuses

1. **`delivered`** — Successfully delivered to customer
2. **`canceled`** / **`cancelled`** — Order was cancelled
3. **`refund_requested`** — Customer requested a refund
4. **`refunded`** — Refund has been processed
5. **`refund_request_canceled`** — Refund request was cancelled

---

## Map Display Logic

The map display changes based on the order status:

| Status | Map Display |
|--------|-------------|
| `created` | Nothing displayed |
| `pending` | Nothing displayed |
| `assigned` | Driver's location → Restaurant → Delivery location |
| `accepted` | Driver's location → Restaurant → Delivery location |
| `confirmed` | Driver's location → Restaurant → Delivery location |
| `processing` | Driver's location → Restaurant → Delivery location |
| `handover` | Restaurant location → Delivery location |
| `picked_up` | Restaurant location → Delivery location |
| `in_transit` | Restaurant location → Delivery location |
| `delivered` | Restaurant location → Delivery location |
| `cancelled` | Delivery location → Restaurant location |
| `refund_requested` | Restaurant location → Delivery location |
| `refunded` | Restaurant location → Delivery location |
| `refund_request_canceled` | Restaurant location → Delivery location |

---

## Database Connection Strings

### PostgreSQL Connection URLs

**Node.js/Backend:**
```bash
DATABASE_URL=postgres://futurescapetechnology-priyanka:12345678@localhost:5432/stack_delivery
```

**JDBC (Java/Spring):**
```
jdbc:postgresql://localhost:5432/stack_delivery?user=postgres&password=postgres
```

**Standard PostgreSQL:**
```
postgres://postgres:postgres@localhost:5432/stack_delivery
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [SETUP_AND_TEST.md](./SETUP_AND_TEST.md) | Complete setup guide & testing scenarios |
| [DEMO_CREDENTIALS.md](./DEMO_CREDENTIALS.md) | All demo accounts & API references |
| [GAP_ANALYSIS.md](./GAP_ANALYSIS.md) | PRD comparison & missing features |
| [AUDIT_SUMMARY.md](./AUDIT_SUMMARY.md) | Code audit results & roadmap |
| [prd.md](./prd.md) | Product requirements document |

---

## Architecture

### Stack
- **Mobile**: Flutter 3.29.3 (iOS/Android)
- **Backend**: NestJS 10.x + TypeScript
- **Web**: Next.js 14 (App Router)
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Maps**: OpenStreetMap (Leaflet)
- **Integrations**: OptimoRoute, ipstack, Nominatim

### Services
- `apps/backend/` - NestJS API server (port 3000)
- `apps/tracking-web/` - Customer tracking page (port 3001)
- `apps/admin-dashboard/` - Admin UI (port 3002)
- `lib/` - Flutter driver app

---

## Project Status

**Overall Completion**: 65%

### ✅ Complete
- Backend API (25+ endpoints)
- Database schema & migrations
- Real-time tracking (SSE/WebSocket)
- Admin dashboard UI
- Webhook ingestion system
- Mock API responses
- Demo data seeding

### ⚠️ In Progress
- Flutter API migration
- OTP login UI
- Multi-order stacking
- Route optimization integration
- Notification service

See [GAP_ANALYSIS.md](./GAP_ANALYSIS.md) for detailed status.

---

## API Endpoints

**Base URL**: `http://localhost:3000/api`

### Key Endpoints
- `POST /auth/driver/otp/request` - Request OTP
- `POST /auth/driver/otp/verify` - Verify OTP & login
- `GET /orders/available` - Get unassigned orders
- `PUT /orders/:id/assign` - Assign order to driver
- `POST /routes/optimize` - Optimize route (OptimoRoute)
- `POST /tracking/:orderId` - Record driver location
- `GET /tracking/:orderId/sse` - Live tracking stream
- `POST /webhooks/orders` - Third-party order webhook
- `GET /health` - Health check

Full API reference in [SETUP_AND_TEST.md](./SETUP_AND_TEST.md).

---

## Testing

### Backend
```bash
cd apps/backend
npm run test
```

### Flutter
```bash
flutter test
```

### End-to-End
See [SETUP_AND_TEST.md](./SETUP_AND_TEST.md) for detailed testing scenarios.

---

## Deployment

### Docker Compose
```bash
docker-compose up -d
```

### Kubernetes
```bash
kubectl apply -f k8s/
```

See deployment configs in `/k8s` and `/docker-compose.prod.yml`.

---

## Environment Variables

### Backend (.env)
```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/stack_delivery
# Alternative: postgres://futurescapetechnology-priyanka:12345678@localhost:5432/stack_delivery
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
OPTIMOROUTE_API_KEY=your-key (optional - uses mock)
IPSTACK_API_KEY=your-key (optional - uses mock)
```

See [apps/backend/.env.example](./apps/backend/.env.example) for full list.

---

## Contributing

1. Read [GAP_ANALYSIS.md](./GAP_ANALYSIS.md) for missing features
2. Check out a feature branch
3. Implement & test
4. Submit PR with documentation updates

---

## Support

- **Setup Issues**: See [SETUP_AND_TEST.md](./SETUP_AND_TEST.md)
- **Demo Accounts**: See [DEMO_CREDENTIALS.md](./DEMO_CREDENTIALS.md)
- **Backend Logs**: `docker-compose logs -f backend`
- **Database Access**: `docker-compose exec postgres psql -U postgres -d stack_delivery`

---

## License

Proprietary - All Rights Reserved

---

## Flutter Version

This project uses **Flutter 3.29.3**

For help with Flutter development:
- [Lab: Write your first Flutter app](https://flutter.dev/docs/get-started/codelab)
- [Cookbook: Useful Flutter samples](https://flutter.dev/docs/cookbook)
- [Online documentation](https://flutter.dev/docs)
