# Pending Items Checklist

## Status Summary

✅ **Completed:**
- Backend infrastructure (NestJS with OptimoRoute, ipstack, OSM)
- Tracking web (Next.js with SSE/WebSocket)
- Admin dashboard (Next.js with auth, live map, orders management)
- CI/CD, Docker, Kubernetes deployment configs
- Database migrations infrastructure
- Health checks and monitoring

⚠️ **Partially Complete:**
- Flutter driver app updates (some features added, but not fully integrated)

❌ **Still Pending:**

## Critical Pending Items

### 1. Flutter App Integration with New Backend ⚠️ HIGH PRIORITY
- **Issue**: `lib/util/app_constants.dart` still references old StackFood API endpoints
- **Action Required**: 
  - Update all API endpoints to point to new backend (`http://localhost:3000`)
  - Remove old `/api/v1/` paths, use new `/api/` paths
  - Update authentication to use OTP endpoints

### 2. OTP Login Flow in Flutter ⚠️ HIGH PRIORITY
- **Status**: Backend endpoints exist (`/api/auth/driver/otp/request`, `/api/auth/driver/otp/verify`)
- **Missing**: Flutter `SignInViewScreen` still uses password login
- **Action Required**: 
  - Implement OTP request flow (send phone number → receive OTP)
  - Implement OTP verification flow
  - Update UI to show OTP input instead of password

### 3. Driver Capacity Field ⚠️ MEDIUM PRIORITY
- **Status**: Backend support exists (pending Phase 3 todo)
- **Missing**: 
  - UI in Profile screen to set/edit capacity
  - Backend endpoint to update capacity
  - Capacity validation when accepting orders
- **Action Required**: 
  - Add capacity field to driver profile UI
  - Add capacity update endpoint in backend
  - Display current capacity in profile

### 4. Multi-Order Stacking ⚠️ HIGH PRIORITY
- **Status**: Backend has OptimoRoute integration, but Flutter app doesn't use it
- **Missing**: 
  - UI to display multiple active orders simultaneously
  - Capacity checks before accepting additional orders
  - Visual indication of "stacked" orders
  - Backend call to OptimoRoute when order accepted or stack changes
- **Action Required**:
  - Modify `acceptOrder()` to check capacity
  - Call `/api/routes/optimize` after accepting order
  - Update order list UI to show stacked orders
  - Implement "Accept & Stack" vs "Accept Only" logic

### 5. Route Optimization on Accept/Stack Change ❌ HIGH PRIORITY
- **Status**: Backend endpoint exists (`POST /api/routes/optimize`)
- **Missing**: Flutter app doesn't call this endpoint
- **Action Required**:
  - After accepting order, call optimization endpoint
  - Store and display optimized route sequence
  - Show step-by-step instructions from OptimoRoute response
  - Re-optimize when driver manually changes order sequence

### 6. Step-by-Step Navigation Overlay ❌ MEDIUM PRIORITY
- **Status**: OSM map is implemented, but no navigation UI
- **Missing**:
  - Navigation instructions overlay
  - Turn-by-turn directions
  - Current step indicator
  - Next step preview
- **Action Required**:
  - Parse OptimoRoute response for navigation steps
  - Create navigation overlay widget
  - Update map to highlight current route segment
  - Show distance/time to next stop

### 7. Customer Signature Capture ❌ LOW PRIORITY
- **Status**: POD has photo and OTP verification
- **Missing**: Signature canvas/widget
- **Action Required**:
  - Add signature capture widget (use `signature` package)
  - Integrate with POD flow
  - Upload signature as image to backend

### 8. Earnings Dashboard Enhancements ❌ LOW PRIORITY
- **Status**: Basic wallet/balance UI exists
- **Missing**:
  - Incentive breakdown display
  - Historical earnings charts
  - Distance/time per delivery metrics
  - Weekly/monthly summaries
- **Action Required**:
  - Add earnings history API endpoint
  - Create earnings analytics screen
  - Display incentives separately from base pay

## Backend API Endpoints Needed

### Driver Capacity
- `PUT /api/drivers/:id/capacity` - Update driver capacity
- Add `capacity` field to driver entity (if not already present)

### Route Optimization
- ✅ `POST /api/routes/optimize` - Already exists
- ✅ `GET /api/routes/driver/:driverId/latest` - Already exists
- May need: `GET /api/routes/driver/:driverId/active` - Get active route plan

### Earnings
- `GET /api/drivers/:id/earnings` - Get earnings history
- `GET /api/drivers/:id/earnings/summary` - Get summary stats

## Flutter App Endpoints to Update

Current endpoints in `app_constants.dart` that need updating:

| Old Endpoint | New Endpoint | Status |
|-------------|--------------|--------|
| `/api/v1/auth/delivery-man/login` | `/api/auth/driver/otp/verify` | ❌ Not updated |
| `/api/v1/delivery-man/current-orders` | `/api/orders/driver/active` | ❌ Not updated |
| `/api/v1/delivery-man/latest-orders` | `/api/orders/available` | ❌ Not updated |
| `/api/v1/delivery-man/accept-order` | `/api/assignments/assign` | ❌ Not updated |
| `/api/v1/delivery-man/update-order-status` | `/api/orders/:id/status` | ❌ Not updated |
| `/api/v1/delivery-man/record-location-data` | `/api/tracking/ingest` | ❌ Not updated |

## Testing Checklist

- [ ] OTP login flow works end-to-end
- [ ] Driver can set capacity in profile
- [ ] Driver can accept multiple orders (within capacity)
- [ ] OptimoRoute optimization is called on accept
- [ ] Route sequence is displayed in app
- [ ] Navigation instructions appear on map
- [ ] Tracking link sharing works
- [ ] POD with signature capture works
- [ ] All API calls use new backend endpoints
- [ ] Backend health checks pass
- [ ] SSE/WebSocket tracking works in browser

## Recommended Implementation Order

1. **Update API endpoints** (Quick win, unblocks everything)
2. **Implement OTP login** (Critical for driver onboarding)
3. **Add capacity field** (Required for stacking)
4. **Multi-order stacking** (Core feature)
5. **Route optimization integration** (Enhances stacking)
6. **Navigation overlay** (Nice to have)
7. **Signature capture** (Nice to have)
8. **Earnings enhancements** (Nice to have)


