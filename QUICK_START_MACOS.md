# Quick Start Guide - macOS Testing

**Ready to Test**: All systems configured ✅
**Your System**: macOS 26.0.1 with Flutter 3.35.7

---

## 🎯 What You'll Test

| Component | Port | Status |
|-----------|------|--------|
| PostgreSQL | 5432 | ✅ Ready |
| Redis | 6379 | ✅ Ready |
| Backend API | 3000 | ✅ Ready |
| Tracking Web | 3001 | ✅ Ready |
| Admin Dashboard | 3002 | ✅ Ready |
| Flutter App (macOS) | N/A | ✅ Ready |

---

## 🚀 30-Second Quick Start

```bash
# 1. Start Docker Desktop (if not running)
open -a Docker

# 2. Run the auto-setup script
cd /Users/futurescapetechnology-priyanka/Desktop/OFDA/Stack-Dilivery
./START_TESTING.sh
```

**That's it!** The script will:
- ✅ Check all prerequisites
- ✅ Start PostgreSQL and Redis
- ✅ Install backend dependencies
- ✅ Run database migrations
- ✅ Seed demo data (10 drivers, 7 orders)

Then follow the on-screen instructions to start each service.

---

## 📱 Step-by-Step: Running Flutter App on macOS

### Option 1: macOS Desktop App (Recommended)

```bash
# From project root
cd /Users/futurescapetechnology-priyanka/Desktop/OFDA/Stack-Dilivery

# Get dependencies
flutter pub get

# Run on macOS
flutter run -d macos
```

**Expected**: 
- Build process takes 2-3 minutes (first time)
- App window opens on macOS
- You'll see the Stack Delivery driver app

---

### Option 2: Chrome Browser (Faster for Testing)

```bash
flutter run -d chrome
```

**Expected**: 
- Faster build than macOS
- Opens in Chrome browser
- Better for UI testing

---

### Option 3: iOS Simulator (If Xcode Installed)

```bash
# Open iOS Simulator
open -a Simulator

# Wait for simulator to boot, then:
flutter run -d iPhone
```

---

## 🧪 Complete Testing Flow

### Terminal 1: Backend API

```bash
cd apps/backend
npm run start:dev

# Wait for: "Application is running on: http://localhost:3000"
```

**Test it:**
```bash
curl http://localhost:3000/api/health
# Expected: {"status":"ok"}
```

---

### Terminal 2: Tracking Web

```bash
cd apps/tracking-web
npm install  # First time only
npm run dev

# Wait for: "Local: http://localhost:3001"
```

**Test it:**
```bash
open http://localhost:3001/track/660e8400-e29b-41d4-a716-446655440001
# Expected: Map with driver location
```

---

### Terminal 3: Admin Dashboard

```bash
cd apps/admin-dashboard
npm install  # First time only
npm run dev

# Wait for: "Local: http://localhost:3002"
```

**Test it:**
```bash
open http://localhost:3002/login
# Login: admin@stackdelivery.com / Admin@123
```

---

### Terminal 4: Flutter App

```bash
flutter run -d macos
# or
flutter run -d chrome
```

**Login Credentials** (when OTP UI is implemented):
- Phone: `+1234567890`
- OTP: `123456`

---

## ✅ Testing Checklist

### Infrastructure (5 minutes)
- [ ] Docker Desktop running
- [ ] PostgreSQL healthy: `docker-compose ps postgres`
- [ ] Redis healthy: `docker-compose ps redis`
- [ ] Demo data loaded: `docker-compose exec postgres psql -U postgres -d stack_delivery -c "SELECT COUNT(*) FROM drivers;"`
  - Expected: 10 drivers

---

### Backend API (10 minutes)

Run these commands in a separate terminal:

```bash
# 1. Health check
curl http://localhost:3000/api/health

# 2. Get available orders
curl http://localhost:3000/api/orders/available | jq

# 3. Create test order
curl -X POST http://localhost:3000/api/webhooks/test | jq

# 4. Get driver profile
curl http://localhost:3000/api/drivers/550e8400-e29b-41d4-a716-446655440001 | jq

# 5. Assign order
curl -X PUT http://localhost:3000/api/orders/660e8400-e29b-41d4-a716-446655440005/assign \
  -H "Content-Type: application/json" \
  -d '{"driverId": "550e8400-e29b-41d4-a716-446655440001"}' | jq

# 6. Optimize route (mock)
curl -X POST http://localhost:3000/api/routes/optimize \
  -H "Content-Type: application/json" \
  -d '{"driverId": "550e8400-e29b-41d4-a716-446655440001", "stops": [{"lat": 12.9716, "lng": 77.5946}, {"lat": 12.9352, "lng": 77.6245}]}' | jq
```

**All should return valid JSON responses** ✅

---

### Tracking Web (5 minutes)

```bash
# Open tracking page
open http://localhost:3001/track/660e8400-e29b-41d4-a716-446655440001
```

**Check:**
- [ ] Map loads with OpenStreetMap tiles
- [ ] Driver marker appears
- [ ] ETA countdown displays
- [ ] Status timeline shows (Accepted → Picked Up → etc.)

---

### Admin Dashboard (10 minutes)

```bash
# Open admin login
open http://localhost:3002/login
```

**Login:**
- Email: `admin@stackdelivery.com`
- Password: `Admin@123`

**Test Pages:**
- [ ] Live Ops: http://localhost:3002/live-ops (map with drivers)
- [ ] Orders: http://localhost:3002/orders (7+ orders)
- [ ] Drivers: http://localhost:3002/drivers (10 drivers)
- [ ] Exceptions: http://localhost:3002/exceptions

---

### Flutter App (15 minutes)

**Build and Launch:**
```bash
flutter run -d macos
# or
flutter run -d chrome
```

**What Works:**
- [ ] App builds without errors
- [ ] App launches and UI renders
- [ ] Navigation works (bottom tabs)
- [ ] Screens load (Dashboard, Orders, Profile)

**What Doesn't Work Yet** ⚠️
- ❌ OTP Login (UI not implemented)
- ❌ Accept orders from new backend (needs API migration)
- ❌ Route optimization display (needs integration)
- ❌ Live tracking updates (needs WebSocket)

**Known Issue**: The Flutter app still uses old API endpoints. You'll see errors in the console when trying to fetch data. This is expected and documented in GAP_ANALYSIS.md.

---

## 🎯 Success Criteria

### ✅ Minimum Passing Grade

- [x] All 3 services start (Backend, Tracking, Admin)
- [x] Backend API responds to all 10 test endpoints
- [x] Tracking page displays map and driver
- [x] Admin dashboard login works
- [x] Flutter app builds and launches

### 🏆 Full Success

Everything above PLUS:
- [ ] Flutter app can login (needs OTP UI implementation)
- [ ] Flutter app displays orders from new backend
- [ ] Flutter app can accept and track orders
- [ ] End-to-end flow works (create order → assign → track → deliver)

**Current Status**: **Phase 1 Complete** (Backend, Infrastructure, Docs) ✅
**Next Phase**: Flutter API Migration (P0 Critical)

---

## 🐛 Common Issues & Fixes

### Docker Won't Start
```bash
open -a Docker
# Wait 30 seconds
docker info
```

### Port Already in Use
```bash
lsof -i :3000  # Find process
kill -9 <PID>  # Kill it
```

### Flutter Build Fails
```bash
flutter clean
flutter pub get
flutter run -d macos
```

### Backend Database Error
```bash
# Reset database
docker-compose down -v
docker-compose up -d postgres redis
cd apps/backend
npm run migration:run
npm run seed
```

### macOS Permission Issues
```bash
# If macOS blocks the app:
# System Settings → Privacy & Security → Allow apps downloaded from
# Click "Open Anyway" when prompted
```

---

## 📊 Expected Results

### Backend API Responses

**Health Check:**
```json
{"status": "ok"}
```

**Available Orders:**
```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440005",
    "externalRef": "ZOMATO-2025-005",
    "status": "pending",
    "pickup": {"lat": 12.9279, "lng": 77.6271, "address": "Cafe Coffee Day..."},
    "dropoff": {"lat": 12.9698, "lng": 77.5946, "address": "Cubbon Park..."}
  }
]
```

**Route Optimization (Mock):**
```json
{
  "success": true,
  "sequence": [0, 1],
  "distanceKm": 8.4,
  "etaPerStop": [300, 900],
  "mock": true
}
```

---

## 📸 Screenshots You Should See

### 1. Backend Running
```
[Nest] Application is running on: http://localhost:3000
[Nest] Swagger: http://localhost:3000/api-docs
```

### 2. Tracking Page
- Map with OpenStreetMap tiles
- Blue driver marker
- "ETA: 15 minutes" countdown
- Status: "Out for Delivery"

### 3. Admin Dashboard
- Login page with email/password fields
- After login: Sidebar with Live Ops, Orders, Drivers, Exceptions
- Live Ops: Map with 6 green driver markers

### 4. Flutter App (macOS)
- Native macOS window
- Bottom navigation: Home, Orders, Profile
- List of orders (or login screen)

---

## 🔗 Quick Links

| Resource | URL |
|----------|-----|
| API Docs | http://localhost:3000/api-docs |
| Health Check | http://localhost:3000/api/health |
| Tracking Example | http://localhost:3001/track/660e8400-e29b-41d4-a716-446655440001 |
| Admin Login | http://localhost:3002/login |

---

## 📚 Documentation Index

1. **TESTING_CHECKLIST.md** - Complete testing checklist (this file)
2. **SETUP_AND_TEST.md** - Detailed setup guide with all scenarios
3. **DEMO_CREDENTIALS.md** - All demo accounts and API references
4. **GAP_ANALYSIS.md** - What's missing and what's next
5. **README.md** - Project overview

---

## 🎓 Next Steps After Testing

1. **If Everything Works**: Start Phase 1 implementation (Flutter API migration)
2. **If Issues Found**: Document them and check troubleshooting section
3. **Want to Contribute**: Read GAP_ANALYSIS.md for missing features

---

## 💡 Pro Tips

1. **Use Multiple Terminals**: One for each service (Backend, Tracking, Admin, Flutter)
2. **Keep Backend Running**: All other services depend on it
3. **Check Logs**: Look for errors in each terminal
4. **Use Browser DevTools**: Check Network tab for API calls
5. **Database Inspection**: Use `docker-compose exec postgres psql -U postgres -d stack_delivery`

---

**Ready to start? Run:**

```bash
cd /Users/futurescapetechnology-priyanka/Desktop/OFDA/Stack-Dilivery
./START_TESTING.sh
```

**Then open 4 terminals and start testing!** 🚀
