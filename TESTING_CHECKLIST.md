# Testing Summary Checklist - Stack Delivery

**System**: macOS
**Date**: 2025-10-31
**Status**: Ready for Testing

---

## ✅ Pre-Flight Checks

### System Requirements
- [x] **Node.js**: v20.19.5 ✅ (Required: 18+)
- [x] **npm**: 10.8.2 ✅
- [x] **Flutter**: 3.35.7 ✅ (Required: 3.29.3+)
- [ ] **Docker Desktop**: NOT RUNNING ⚠️ (NEEDS TO BE STARTED)

---

## 🚀 Phase 1: Infrastructure Setup

### Step 1: Start Docker Desktop

**Action Required:**
```bash
# Open Docker Desktop application
open -a Docker

# Wait 30 seconds for Docker to start
# You should see the Docker icon in the menu bar
```

**Verification:**
```bash
docker info
# Expected: Docker Server info displayed
```

### Step 2: Start PostgreSQL and Redis

```bash
cd /Users/futurescapetechnology-priyanka/Desktop/OFDA/Stack-Dilivery

# Start database services
docker-compose up -d postgres redis

# Wait 30 seconds for services to be healthy
sleep 30

# Verify
docker-compose ps
```

**Expected Output:**
```
NAME       STATUS              PORTS
postgres   Up (healthy)        0.0.0.0:5432->5432/tcp
redis      Up (healthy)        0.0.0.0:6379->6379/tcp
```

**Checklist:**
- [ ] Docker Desktop running
- [ ] PostgreSQL healthy (port 5432)
- [ ] Redis healthy (port 6379)

---

## 🔧 Phase 2: Backend Setup (Port 3000)

### Step 1: Install Backend Dependencies

```bash
cd apps/backend

# Install packages
npm install
```

**Expected**: ~200 packages installed in 2-3 minutes

### Step 2: Run Database Migrations

```bash
npm run migration:run
```

**Expected Output:**
```
✅ Migration has been executed successfully
```

### Step 3: Seed Demo Data

```bash
npm run seed
```

**Expected Output:**
```
🌱 Starting database seeding...
✅ Created 10 drivers
✅ Created 7 orders
✅ Created 2 route plans
✅ Created 25 tracking points
🎉 Database seeding completed successfully!
```

### Step 4: Start Backend Server

**IMPORTANT**: Open a NEW terminal tab (⌘+T) and run:

```bash
cd apps/backend
npm run start:dev
```

**Expected Output:**
```
[Nest] Application is running on: http://localhost:3000
```

**Keep this terminal running!** ✅

**Checklist:**
- [ ] Backend dependencies installed
- [ ] Migrations executed
- [ ] Demo data seeded (10 drivers, 7 orders)
- [ ] Backend running on port 3000

---

## 🧪 Phase 3: Backend API Testing

**Open a NEW terminal tab** (keep backend running)

### Test 1: Health Check ✅

```bash
curl http://localhost:3000/api/health
```

**Expected:**
```json
{"status":"ok"}
```

- [ ] Health check passes

---

### Test 2: Swagger Documentation ✅

```bash
open http://localhost:3000/api-docs
```

**Expected**: Interactive API docs in browser

- [ ] Swagger docs accessible

---

### Test 3: Get Available Orders ✅

```bash
curl http://localhost:3000/api/orders/available | jq
```

**Expected**: Array with 2 pending orders

- [ ] Get available orders works

---

### Test 4: Create Test Order ✅

```bash
curl -X POST http://localhost:3000/api/webhooks/test | jq
```

**Expected**: Order created with tracking URL

- [ ] Create test order works

---

### Test 5: Get Driver Profile ✅

```bash
curl http://localhost:3000/api/drivers/550e8400-e29b-41d4-a716-446655440001 | jq
```

**Expected**: John Doe's profile returned

- [ ] Get driver profile works

---

### Test 6: Assign Order to Driver ✅

```bash
curl -X PUT http://localhost:3000/api/orders/660e8400-e29b-41d4-a716-446655440005/assign \
  -H "Content-Type: application/json" \
  -d '{"driverId": "550e8400-e29b-41d4-a716-446655440001"}' | jq
```

**Expected**: Order status = "assigned"

- [ ] Assign order works

---

### Test 7: Route Optimization (Mock) ✅

```bash
curl -X POST http://localhost:3000/api/routes/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "driverId": "550e8400-e29b-41d4-a716-446655440001",
    "stops": [
      {"lat": 12.9716, "lng": 77.5946},
      {"lat": 12.9352, "lng": 77.6245}
    ]
  }' | jq
```

**Expected**: `"mock": true` in response

- [ ] Route optimization (mock) works

---

### Test 8: Record Location ✅

```bash
curl -X POST http://localhost:3000/api/tracking/660e8400-e29b-41d4-a716-446655440001 \
  -H "Content-Type: application/json" \
  -d '{
    "driverId": "550e8400-e29b-41d4-a716-446655440001",
    "latitude": 12.9716,
    "longitude": 77.5946,
    "speed": 25,
    "heading": 45
  }' | jq
```

**Expected**: `"success": true`

- [ ] Record location works

---

### Test 9: IP Geolocation (Mock) ✅

```bash
curl http://localhost:3000/api/geo/ip -H "X-Forwarded-For: 103.21.58.12" | jq
```

**Expected**: Mock Bengaluru geolocation

- [ ] IP geolocation (mock) works

---

### Test 10: Reverse Geocoding ✅

```bash
curl "http://localhost:3000/api/geo/reverse?lat=12.9716&lng=77.5946" | jq
```

**Expected**: Address returned

- [ ] Reverse geocoding works

---

## 🌐 Phase 4: Tracking Web (Port 3001)

**Open a NEW terminal tab**

### Start Tracking Web

```bash
cd apps/tracking-web
npm install  # First time only
npm run dev
```

**Expected:**
```
▲ Next.js 14.x.x
- Local: http://localhost:3001
✓ Ready in 3.5s
```

**Checklist:**
- [ ] Server starts on port 3001
- [ ] No errors in console

---

### Test: View Tracking Page

```bash
open http://localhost:3001/track/660e8400-e29b-41d4-a716-446655440001
```

**Expected Elements:**
- [ ] Map displays with OSM tiles
- [ ] Driver marker shows
- [ ] ETA displays
- [ ] Status timeline shows
- [ ] SSE stream works (check Network tab)

---

## 💼 Phase 5: Admin Dashboard (Port 3002)

**Open a NEW terminal tab**

### Start Admin Dashboard

```bash
cd apps/admin-dashboard
npm install  # First time only
npm run dev
```

**Expected:**
```
▲ Next.js 14.x.x
- Local: http://localhost:3002
✓ Ready in 4.2s
```

**Checklist:**
- [ ] Server starts on port 3002

---

### Test: Admin Login

```bash
open http://localhost:3002/login
```

**Credentials:**
- Email: `admin@stackdelivery.com`
- Password: `Admin@123`

**After Login, Test Pages:**

1. **Live Ops** (http://localhost:3002/live-ops)
   - [ ] Map with driver markers loads
   - [ ] Active orders list displays

2. **Orders** (http://localhost:3002/orders)
   - [ ] Orders table shows 7+ orders
   - [ ] Filters work
   - [ ] Order details clickable

3. **Drivers** (http://localhost:3002/drivers)
   - [ ] Drivers table shows 10 drivers
   - [ ] Online/offline status visible
   - [ ] Driver details clickable

4. **Exceptions** (http://localhost:3002/exceptions)
   - [ ] Exception alerts page loads

---

## 📱 Phase 6: Flutter App (macOS)

### Step 1: Check Flutter Setup

```bash
cd /Users/futurescapetechnology-priyanka/Desktop/OFDA/Stack-Dilivery

# Check Flutter doctor
flutter doctor -v
```

**Expected**: All macOS development dependencies ✅

---

### Step 2: Get Flutter Dependencies

```bash
flutter pub get
```

**Expected:**
```
Resolving dependencies...
Got dependencies!
```

**Checklist:**
- [ ] Dependencies installed

---

### Step 3: List Available Devices

```bash
flutter devices
```

**Expected Output (macOS):**
```
macOS (desktop) • macos • darwin-arm64 • macOS 14.x.x
Chrome (web)    • chrome
```

**Checklist:**
- [ ] macOS device detected

---

### Step 4: Build and Run Flutter App

**Option A: Run on macOS Desktop**

```bash
flutter run -d macos
```

**Option B: Run on iOS Simulator** (if Xcode installed)

```bash
# Open iOS Simulator
open -a Simulator

# Wait for simulator to boot, then:
flutter run -d iPhone
```

**Option C: Run on Chrome** (Web)

```bash
flutter run -d chrome
```

**Expected**: App builds and launches (2-3 minutes first time)

**Checklist:**
- [ ] App builds without errors
- [ ] App launches on macOS/Simulator/Chrome

---

### Step 5: Test Flutter App Features

#### ⚠️ IMPORTANT NOTE
The Flutter app API integration is NOT YET COMPLETE. Some features will not work:
- ❌ OTP Login UI (not implemented)
- ❌ New API endpoints (needs migration)
- ⚠️ Some features use old StackFood endpoints

#### What You Can Test (If Old Login Works):

**Login Screen:**
- [ ] Login screen appears
- [ ] Can enter phone number
- [ ] Can request OTP (may not work)

**Dashboard** (after login):
- [ ] Dashboard loads
- [ ] Bottom navigation works
- [ ] Profile tab accessible

**Orders** (limited functionality):
- [ ] Orders screen loads
- [ ] Can view order list
- [ ] Can tap on order details

**What WON'T Work Yet:**
- ❌ Logging in with new OTP system
- ❌ Accepting orders from new backend
- ❌ Route optimization integration
- ❌ Real-time tracking updates

---

## 📊 Phase 7: Database Inspection

### Connect to PostgreSQL

```bash
docker-compose exec postgres psql -U postgres -d stack_delivery
```

### Run SQL Queries

```sql
-- View all drivers
SELECT id, name, phone, vehicle_type, capacity, online
FROM drivers
ORDER BY online DESC, name;
-- Expected: 10 rows

-- View all orders
SELECT id, external_ref, status, driver_id
FROM orders
ORDER BY created_at DESC;
-- Expected: 7+ rows

-- View available orders
SELECT id, external_ref, status
FROM orders
WHERE status = 'pending' AND driver_id IS NULL;
-- Expected: 2 rows

-- Exit
\q
```

**Checklist:**
- [ ] 10 drivers seeded
- [ ] 7+ orders seeded
- [ ] 2 available orders exist
- [ ] Route plans exist
- [ ] Tracking points exist

---

## 📊 MASTER CHECKLIST

### Infrastructure ✅
- [ ] Docker running
- [ ] PostgreSQL healthy (port 5432)
- [ ] Redis healthy (port 6379)

### Backend API (Port 3000) ✅
- [ ] Health check passes
- [ ] Swagger docs accessible
- [ ] Get available orders works
- [ ] Create test order works
- [ ] Get driver profile works
- [ ] Assign order works
- [ ] Route optimization (mock) works
- [ ] Record location works
- [ ] IP geolocation (mock) works
- [ ] Reverse geocoding works

### Tracking Web (Port 3001) ✅
- [ ] Server starts
- [ ] Tracking page loads
- [ ] Map displays
- [ ] Driver marker shows
- [ ] ETA displays
- [ ] Status timeline shows

### Admin Dashboard (Port 3002) ✅
- [ ] Server starts
- [ ] Login works
- [ ] Live Ops loads
- [ ] Orders page loads
- [ ] Drivers page loads
- [ ] Exceptions page loads

### Flutter App ⚠️
- [ ] App builds
- [ ] App launches on macOS
- [ ] UI elements render
- [ ] ⚠️ Login (limited - needs migration)
- [ ] ⚠️ Dashboard (limited - needs migration)

### Database ✅
- [ ] 10 drivers seeded
- [ ] 7 orders seeded
- [ ] 2 route plans seeded
- [ ] 25 tracking points seeded

---

## 🎯 Quick Test Commands (Copy-Paste Ready)

### Start All Services (Run in Separate Terminals)

**Terminal 1: Backend**
```bash
cd apps/backend && npm run start:dev
```

**Terminal 2: Tracking Web**
```bash
cd apps/tracking-web && npm run dev
```

**Terminal 3: Admin Dashboard**
```bash
cd apps/admin-dashboard && npm run dev
```

**Terminal 4: Flutter App**
```bash
flutter run -d macos
```

---

## 🔑 Quick Reference

### Service URLs
- **Backend API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api-docs
- **Tracking Web**: http://localhost:3001
- **Admin Dashboard**: http://localhost:3002

### Demo Credentials

**Admin Dashboard:**
- Email: `admin@stackdelivery.com`
- Password: `Admin@123`

**Driver App** (when OTP works):
- Phone: `+1234567890`
- OTP: `123456`

### Key IDs for Testing

**Driver IDs:**
- John Doe: `550e8400-e29b-41d4-a716-446655440001`
- Jane Smith: `550e8400-e29b-41d4-a716-446655440002`

**Order IDs:**
- Available: `660e8400-e29b-41d4-a716-446655440005`
- Available: `660e8400-e29b-41d4-a716-446655440006`

---

## 🐛 Troubleshooting

### Docker Not Running
```bash
open -a Docker
# Wait 30 seconds
docker info
```

### Port Already in Use
```bash
# Find process on port 3000
lsof -i :3000
# Kill it
kill -9 <PID>
```

### Flutter Build Issues
```bash
flutter clean
flutter pub get
flutter run -d macos
```

### Backend Won't Start
```bash
cd apps/backend
rm -rf node_modules package-lock.json
npm install
npm run start:dev
```

---

## ✅ Success Criteria

**Minimum to Pass Testing:**
- ✅ All 3 infrastructure services running
- ✅ Backend API responding (10/10 tests pass)
- ✅ Tracking web page loads
- ✅ Admin dashboard accessible
- ⚠️ Flutter app builds and launches (full features pending)

**Status**: **Ready for Testing** 🚀

Start with **Phase 1: Infrastructure Setup** and work through each phase sequentially!
