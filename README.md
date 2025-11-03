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
flutter pub get
flutter run
# Login: +1234567890 / OTP: 123456
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
