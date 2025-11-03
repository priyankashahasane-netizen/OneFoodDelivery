# Demo Credentials & Quick Start

**Project**: Stack Delivery Platform
**Date**: 2025-10-31
**Status**: Ready for Testing

---

## 🚀 Quick Start Commands

```bash
# 1. Start Docker services
docker-compose up -d postgres redis

# 2. Set up and start backend
cd apps/backend
npm install
npm run migration:run
npm run seed
npm run start:dev

# 3. Run Flutter app (in new terminal)
cd /Users/futurescapetechnology-priyanka/Desktop/OFDA/Stack-Dilivery
flutter pub get
flutter run
```

---

## 📱 Driver Login Credentials (Flutter App)

Use these credentials to log into the Flutter mobile app:

### Demo Account (Primary)
- **Name**: Demo Driver
- **Phone**: `9975008124` (or `+919975008124`)
- **Password**: `Pri@0110`
- **Status**: Offline
- **Capacity**: 5 orders
- **Vehicle**: Bike
- **Use for**: Testing login, authentication, and basic app functionality

### Primary Test Driver
- **Name**: John Smith
- **Phone**: `+1234567890`
- **OTP**: `123456`
- **Status**: Online
- **Capacity**: 5 orders
- **Vehicle**: Motorcycle
- **Use for**: Testing full order workflow, multi-order stacking

### Secondary Test Driver
- **Name**: Maria Garcia
- **Phone**: `+1234567891`
- **OTP**: `123456`
- **Status**: Offline
- **Capacity**: 3 orders
- **Vehicle**: Scooter
- **Use for**: Testing offline mode, going online/offline

### Alternate Test Driver
- **Name**: Rajesh Kumar
- **Phone**: `+919876543210`
- **OTP**: `123456`
- **Status**: Online
- **Capacity**: 2 orders
- **Vehicle**: Bicycle
- **Use for**: Testing capacity limits

**Note**: All drivers use OTP `123456` in development mode.

---

## 🖥️ Admin Dashboard Credentials

Access at: `http://localhost:3002/login`

### Admin Account
- **Email**: `admin@stackdelivery.com`
- **Password**: `Admin@123`
- **Permissions**: Full access to all features
- **Use for**: System administration, configuration, analytics

### Dispatcher Account
- **Email**: `dispatcher@stackdelivery.com`
- **Password**: `Dispatch@123`
- **Permissions**: Live ops, order assignment, driver management
- **Use for**: Daily operations, order monitoring

---

## 🔗 Application URLs

| Service | URL | Description |
|---------|-----|-------------|
| Backend API | `http://localhost:3000` | Main NestJS API server |
| API Docs (Swagger) | `http://localhost:3000/api/docs` | Interactive API documentation |
| Health Check | `http://localhost:3000/api/health` | Server health status |
| Tracking Web | `http://localhost:3001` | Customer tracking pages |
| Admin Dashboard | `http://localhost:3002` | Operations dashboard |
| PostgreSQL | `localhost:5432` | Database (user: postgres, pass: postgres) |
| Redis | `localhost:6379` | Cache and pub/sub |

---

## 📦 Sample Orders (After Running Seed)

After running `npm run seed`, you'll have these test orders:

### Pending Orders (Available for Assignment)
1. **ZOMATO-12345**: Pizza Hut → Prestige Tech Park (45 min SLA)
2. **SWIGGY-67890**: McDonald's → Sobha Apartments (30 min SLA)

### Assigned Orders
3. **UBER-23456**: Domino's → Columbia Asia Hospital (Driver: John Smith)
4. **DUNZO-34567**: KFC → Mantri Square Mall (Driver: Rajesh Kumar)

### Active Deliveries
5. **ZOMATO-45678**: Subway → Wipro Office (Picked Up, Driver: John Smith)
6. **SWIGGY-56789**: Burger King → Bangalore Palace (Picked Up, Driver: Chen Wei)
7. **UBER-67890**: Starbucks → Orion Mall (Out for Delivery, Driver: Sarah Johnson)
8. **DUNZO-78901**: Taco Bell → Infosys Campus (Out for Delivery, Driver: Emily Brown)

### Completed Orders
9. **ZOMATO-89012**: China Bowl → Sapphire Apartments (Delivered)
10. **SWIGGY-90123**: Biryani House → Embassy Tech Village (Delivered)

### Cancelled
11. **UBER-01234**: French Fries Shop → IISc (Cancelled)

---

## 🧪 Test Tracking URLs

After seeding, you can test live tracking with these URLs:

- `http://localhost:3001/track/ORDER-3` (Assigned order)
- `http://localhost:3001/track/ORDER-5` (Picked up)
- `http://localhost:3001/track/ORDER-7` (Out for delivery)
- `http://localhost:3001/track/ORDER-9` (Delivered)

**Note**: Replace `ORDER-X` with actual UUIDs from the database if needed.

---

## 🔑 API Authentication

### Driver Authentication Flow

```bash
# Step 1: Request OTP
curl -X POST http://localhost:3000/api/auth/driver/otp/request \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890"}'

# Step 2: Verify OTP (get JWT token)
curl -X POST http://localhost:3000/api/auth/driver/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890", "otp": "123456"}'

# Response:
{
  "access_token": "eyJhbGciOiJIUzI1...",
  "driver": {...}
}
```

### Using JWT Token

```bash
# Example: Get driver profile
curl http://localhost:3000/api/drivers/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

---

## 🧪 Quick API Tests

### Test 1: Health Check
```bash
curl http://localhost:3000/api/health
# Expected: {"status":"ok","info":{"database":{"status":"up"}...}}
```

### Test 2: Get Available Orders
```bash
curl http://localhost:3000/api/orders/available
# Expected: Array of 2 pending orders
```

### Test 3: Create Order via Webhook
```bash
curl -X POST http://localhost:3000/api/webhooks/test
# Expected: {"success":true,"orderId":"...","trackingUrl":"..."}
```

### Test 4: Get Driver Profile
```bash
# First, get JWT token (see API Authentication above)
# Then:
curl http://localhost:3000/api/drivers/me \
  -H "Authorization: Bearer YOUR_TOKEN"
# Expected: Driver object with id, name, phone, etc.
```

---

## 📊 Database Access

If you need to inspect or modify data directly:

```bash
# Connect to PostgreSQL
docker exec -it stack-delivery-postgres psql -U postgres -d stack_delivery

# Useful queries:
\dt                                    # List all tables
SELECT * FROM drivers;                 # View all drivers
SELECT * FROM orders WHERE status='pending';  # View pending orders
SELECT COUNT(*) FROM tracking_points;  # Count tracking data
\q                                     # Quit
```

---

## 🐛 Common Issues

### Issue: "Cannot connect to database"
```bash
# Solution: Restart Docker
docker-compose restart postgres
docker ps  # Verify it's running
```

### Issue: "No orders showing in app"
```bash
# Solution: Reseed database
cd apps/backend
npm run seed
```

### Issue: "OTP verification fails"
**Solution**: OTP is hardcoded to `123456` for all demo users in development.

### Issue: "Flutter app can't reach backend"
**Solution**: Update base URL in `lib/util/app_constants.dart`:
```dart
// For Android emulator
static const String baseUrl = 'http://10.0.2.2:3000';

// For iOS simulator
static const String baseUrl = 'http://localhost:3000';

// For physical device (use your computer's IP)
static const String baseUrl = 'http://192.168.x.x:3000';
```

---

## 📝 Testing Checklist

- [ ] Backend server starts successfully
- [ ] Database migrations run without errors
- [ ] Seed script creates 10 drivers and 11 orders
- [ ] Driver can log in with `+1234567890` / `123456`
- [ ] Available orders appear in Flutter app
- [ ] Driver can accept an order
- [ ] Order status can be updated (picked up → delivered)
- [ ] Tracking page shows live driver location
- [ ] Admin can log in to dashboard
- [ ] Webhook endpoint creates new orders
- [ ] API health check returns "ok"

---

## 🚧 Pending Features

These features are documented in [GAP_ANALYSIS.md](./GAP_ANALYSIS.md) but not yet implemented:

- ⏳ Multi-order stacking UI in Flutter
- ⏳ Route optimization integration in Flutter
- ⏳ Turn-by-turn navigation overlay
- ⏳ Tracking link sharing via SMS/WhatsApp
- ⏳ Signature capture for POD
- ⏳ Earnings dashboard with real data
- ⏳ Admin manual reassignment feature
- ⏳ Broadcast messages to drivers
- ⏳ Analytics and reporting module

---

## 📚 Documentation

- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)**: Detailed testing scenarios
- **[GAP_ANALYSIS.md](./GAP_ANALYSIS.md)**: Feature comparison with PRD
- **[prd.md](./prd.md)**: Product requirements document
- **[README.md](./README.md)**: Project overview (if exists)

---

## 🆘 Need Help?

1. Check logs:
   ```bash
   # Backend logs
   cd apps/backend && npm run start:dev

   # Docker logs
   docker-compose logs -f postgres redis
   ```

2. Verify services:
   ```bash
   docker ps  # Should show postgres and redis running
   curl http://localhost:3000/api/health  # Should return "ok"
   ```

3. Reset everything:
   ```bash
   docker-compose down -v  # Stop and remove all data
   docker-compose up -d postgres redis  # Restart fresh
   cd apps/backend
   npm run migration:run
   npm run seed
   npm run start:dev
   ```

---

**All set! Start testing with the credentials above.** 🎉

For detailed testing scenarios, see [TESTING_GUIDE.md](./TESTING_GUIDE.md).
