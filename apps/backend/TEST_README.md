# Backend API Tests

This directory contains comprehensive test suites for the Stack Delivery backend API, aligned with PRD requirements.

## Test Structure

### Unit Tests (`.spec.ts` files)

Tests are organized by module:

- **Auth** (`modules/auth/`)
  - `driver-auth.controller.spec.ts` - OTP login, password login, driver auto-creation
  
- **Orders** (`modules/orders/`)
  - `orders.controller.spec.ts` - Order listing, assignment, status updates
  - `orders.service.spec.ts` - Order business logic, available orders filtering

- **Routes** (`modules/routes/`)
  - `routes.controller.spec.ts` - Route optimization endpoint
  - `routes.service.spec.ts` - OptimoRoute integration, performance (≤ 3s)

- **Tracking** (`modules/tracking/`)
  - `tracking.controller.spec.ts` - SSE streaming, location ingestion (≤ 2s latency)

- **Geo** (`modules/geo/`)
  - `geo.controller.spec.ts` - IP lookup (ipstack), reverse geocoding (Nominatim)

- **Webhooks** (`modules/webhooks/`)
  - `webhooks.controller.spec.ts` - Order webhook processing
  - `webhooks.service.spec.ts` - Webhook payload handling, duplicate detection

### Integration Tests

- **PRD Acceptance Criteria** (`modules/integration-tests/`)
  - `prd-acceptance.spec.ts` - End-to-end flows matching PRD acceptance criteria

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run specific test file
npm test -- orders.controller.spec.ts
```

## PRD Alignment

All tests are aligned with the Product Requirements Document (`prd.md`):

### API Contracts (Section 5)
- ✅ POST /api/auth/driver/otp/request
- ✅ POST /api/auth/driver/otp/verify
- ✅ POST /api/deliveries/assign (PUT /api/orders/:id/assign)
- ✅ POST /api/routes/optimize
- ✅ GET /api/geo/ip
- ✅ GET /api/geo/reverse
- ✅ GET /api/track/:orderId/sse
- ✅ POST /api/track/:orderId
- ✅ POST /api/webhooks/orders

### Acceptance Criteria (Section 8)
- ✅ Multi-order stacking with OptimoRoute optimization ≤ 3s
- ✅ Live tracking latency ≤ 2s (E2E ingest → broadcast)
- ✅ Tracking page personalization via ipstack
- ✅ Route re-optimization on deviation
- ✅ Order assignment generates tracking URL

### Performance Requirements (Section 3)
- ✅ Route optimization round-trip < 3s
- ✅ Live location E2E < 2s ingest → broadcast

## Test Coverage

Current coverage includes:
- ✅ Controller endpoints (request/response validation)
- ✅ Service business logic
- ✅ Integration with external services (OptimoRoute, ipstack, Nominatim)
- ✅ Error handling and edge cases
- ✅ Performance requirements
- ✅ PRD acceptance criteria flows

## Notes

- Tests use Jest with NestJS testing utilities
- External services (OptimoRoute, ipstack, Nominatim) are mocked
- Redis and database are mocked for unit tests
- Integration tests verify end-to-end flows
- Performance tests enforce PRD requirements (≤ 3s optimization, ≤ 2s tracking)


