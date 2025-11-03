# Testing Guide - Stack Delivery Platform

**Created**: 2025-10-31
**Status**: Ready for Testing

---

## Prerequisites

Before you begin testing, ensure you have:

- **Docker Desktop** installed and running (for PostgreSQL and Redis)
- **Node.js** v18+ installed
- **Flutter** SDK 3.29.3+ installed (for mobile app testing)
- **Postman** or **curl** for API testing

---

## Quick Start - Getting Everything Running

### Step 1: Start Docker Services

```bash
# Start PostgreSQL and Redis
cd /Users/futurescapetechnology-priyanka/Desktop/OFDA/Stack-Dilivery
docker-compose up -d postgres redis
```

### Step 2: Set Up Backend

```bash
# Navigate to backend
cd apps/backend

# Install dependencies
npm install

# Run migrations to create database schema
npm run migration:run

# Seed demo data (creates 10 drivers, 11 orders, route plans, tracking points)
npm run seed

# Start the backend server
npm run start:dev
```

**Backend will be running at**: `http://localhost:3000`

### Step 3: Start Tracking Web (Optional)

```bash
# In a new terminal
cd apps/tracking-web

# Install dependencies
npm install

# Start the tracking web app
npm run dev
```

**Tracking Web will be at**: `http://localhost:3001`

### Step 4: Start Admin Dashboard (Optional)

```bash
# In a new terminal
cd apps/admin-dashboard

# Install dependencies
npm install

# Start the admin dashboard
npm run dev
```

**Admin Dashboard will be at**: `http://localhost:3002`

### Step 5: Run Flutter App

```bash
# In a new terminal
cd /Users/futurescapetechnology-priyanka/Desktop/OFDA/Stack-Dilivery

# Get Flutter dependencies
flutter pub get

# Run on iOS simulator or Android emulator
flutter run

# Or for a specific device
flutter run -d <device-id>
```

---

## Demo User Credentials

### 📱 Driver Accounts (for Flutter App)

| Driver Name | Phone Number | OTP Code | Status | Capacity | Vehicle |
|-------------|--------------|----------|--------|----------|---------|
| John Smith | `+1234567890` | `123456` | Online | 5 orders | Motorcycle |
| Maria Garcia | `+1234567891` | `123456` | Offline | 3 orders | Scooter |
| Rajesh Kumar | `+919876543210` | `123456` | Online | 2 orders | Bicycle |

**Note**: The OTP is hardcoded to `123456` for all demo drivers in development mode.

### 🖥️ Admin/Dispatcher Accounts (for Admin Dashboard)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@stackdelivery.com` | `Admin@123` |
| Dispatcher | `dispatcher@stackdelivery.com` | `Dispatch@123` |

---

## Testing Scenarios

### Scenario 1: Driver Login and View Orders

**Platform**: Flutter Mobile App

1. **Open the Flutter app**
2. **Login**:
   - Enter phone: `+1234567890`
   - Request OTP
   - Enter OTP: `123456`
   - Verify login success
3. **View Dashboard**:
   - Should see driver profile (John Smith)
   - Should see "Online" status
4. **View Available Orders**:
   - Navigate to Orders tab
   - Should see 2 pending orders available for assignment
5. **Accept an Order**:
   - Tap on any pending order
   - Review order details
   - Tap "Accept Order"
   - Verify order moves to "Active Orders"

---

### Scenario 2: Multi-Order Stacking

**Platform**: Flutter Mobile App

1. **Login as John Smith** (`+1234567890`)
2. **View Capacity**:
   - Profile should show capacity: 5 orders
   - Currently active: varies
3. **Accept Multiple Orders**:
   - Accept order 1 (pending order)
   - Accept order 2 (if capacity allows)
   - Verify both orders appear in "Active Orders"
4. **View Route Optimization**:
   - Should see optimized stop sequence
   - Should see ETAs for each stop

---

### Scenario 3: Order Lifecycle - Complete Delivery

**Platform**: Flutter Mobile App

1. **Login as John Smith**
2. **Navigate to Active Orders**
3. **Select an "Assigned" Order**:
   - Tap "Mark as Picked Up"
   - Verify status changes to "Picked Up"
4. **Navigate to Customer Location**:
   - View map with directions
   - Location tracking should be active
5. **Mark as Out for Delivery**:
   - Tap "Out for Delivery"
   - Verify status update
6. **Complete Delivery**:
   - Tap "Deliver Order"
   - Capture POD photo
   - Enter OTP (optional): any 6-digit code
   - Submit POD
   - Verify order marked as "Delivered"

---

### Scenario 4: Live Tracking (Customer View)

**Platform**: Tracking Web Page

1. **Get a tracking URL** from an active order:
   - Example: `http://localhost:3001/track/ORDER-7`
2. **Open tracking URL in browser**
3. **Verify tracking page shows**:
   - Order status (e.g., "Out for Delivery")
   - Driver location on map
   - ETA countdown
   - Status timeline
4. **Wait for location updates**:
   - Driver marker should update every 5-10 seconds
   - ETA should refresh

---

### Scenario 5: Admin - View Live Operations

**Platform**: Admin Dashboard

1. **Login to Admin Dashboard**: `http://localhost:3002/login`
   - Email: `admin@stackdelivery.com`
   - Password: `Admin@123`
2. **Navigate to Live Ops**:
   - View real-time map with all online drivers
   - See driver markers (should see 5+ online drivers)
3. **View Orders Stream**:
   - See all orders with statuses
   - SLA timers counting down
4. **Click on a Driver**:
   - View driver details
   - See active orders assigned

---

### Scenario 6: Admin - Manually Reassign Order (Not Implemented Yet)

**Platform**: Admin Dashboard

1. **Login to Admin Dashboard**
2. **Navigate to Orders page**
3. **Find an "Assigned" order**
4. **Click "Reassign"** button (to be implemented)
5. **Select a different driver**
6. **Confirm reassignment**
7. **Verify**:
   - Order moved to new driver
   - Previous driver's active orders updated
   - Notifications sent

**Status**: ⚠️ Feature pending implementation

---

### Scenario 7: Webhook - Third-Party Order Ingestion

**Platform**: Backend API (Postman/curl)

1. **Send a webhook request**:

```bash
curl -X POST http://localhost:3000/api/webhooks/orders \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "zomato",
    "externalRef": "ZOMATO-99999",
    "pickup": {
      "lat": 12.9716,
      "lng": 77.5946,
      "address": "Test Restaurant, Bengaluru"
    },
    "dropoff": {
      "lat": 12.9558,
      "lng": 77.6077,
      "address": "Test Customer, Bengaluru"
    },
    "items": [
      {"name": "Test Pizza", "quantity": 1, "price": 299}
    ],
    "paymentType": "cash",
    "customerPhone": "+919999999999",
    "customerName": "Test Customer",
    "slaMinutes": 30
  }'
```

2. **Expected Response**:

```json
{
  "success": true,
  "orderId": "uuid-here",
  "trackingUrl": "http://localhost:3001/track/uuid",
  "status": "pending",
  "message": "Order received and queued for assignment"
}
```

3. **Verify in Flutter App**:
   - New order should appear in "Available Orders"
   - Driver can accept it

---

### Scenario 8: Test Webhook (Simplified)

**Platform**: Backend API

1. **Use the test endpoint**:

```bash
curl -X POST http://localhost:3000/api/webhooks/test
```

2. **This will automatically create a test order**
3. **Check Flutter app** for the new order

---

## API Endpoints Quick Reference

### Base URL
```
http://localhost:3000/api
```

### Authentication

#### Driver OTP Login
```bash
# Request OTP
POST /api/auth/driver/otp/request
{
  "phone": "+1234567890"
}

# Verify OTP
POST /api/auth/driver/otp/verify
{
  "phone": "+1234567890",
  "otp": "123456"
}

# Response includes JWT token
```

### Orders

```bash
# Get available orders
GET /api/orders/available

# Get driver's active orders
GET /api/orders/driver/:driverId/active

# Get order details
GET /api/orders/:orderId

# Update order status
PUT /api/orders/:orderId/status
{
  "status": "picked_up" | "out_for_delivery" | "delivered"
}
```

### Assignments

```bash
# Assign order to driver
POST /api/assignments/assign
{
  "orderId": "uuid",
  "driverId": "uuid"
}
```

### Routes (OptimoRoute Integration)

```bash
# Optimize route
POST /api/routes/optimize
{
  "driverId": "uuid",
  "stops": [
    {"lat": 12.93, "lng": 77.62, "type": "pickup"},
    {"lat": 12.95, "lng": 77.60, "type": "dropoff"}
  ]
}

# Get driver's latest route
GET /api/routes/driver/:driverId/latest
```

### Tracking

```bash
# Record location
POST /api/tracking/:orderId
{
  "latitude": 12.9716,
  "longitude": 77.5946,
  "speed": 30.5,
  "heading": 180
}

# Get live tracking (SSE)
GET /api/tracking/:orderId/sse
```

### Drivers

```bash
# Get current driver profile
GET /api/drivers/me
Authorization: Bearer <jwt-token>

# Update online status
PUT /api/drivers/:driverId/online
{
  "online": true
}

# Update capacity
PUT /api/drivers/:driverId/capacity
{
  "capacity": 5
}
```

### Webhooks

```bash
# Receive order from third-party platform
POST /api/webhooks/orders
{...} # See Scenario 7 for payload

# Test webhook
POST /api/webhooks/test
```

### Geolocation

```bash
# IP geolocation (ipstack)
GET /api/geo/ip
Headers: X-Forwarded-For: <client-ip>

# Reverse geocoding (Nominatim)
GET /api/geo/reverse?lat=12.93&lng=77.62
```

---

## Database Seed Data Summary

After running `npm run seed`, the database will contain:

### Drivers (10 total)
- **5 Online**: John Smith, Rajesh Kumar, Sarah Johnson, Chen Wei, Emily Brown, Priya Sharma, Michael Chen
- **3 Offline**: Maria Garcia, Ahmed Ali, Carlos Rodriguez

### Orders (11 total)
- **2 Pending**: Available for assignment
- **2 Assigned**: Assigned to drivers
- **2 Picked Up**: Driver has picked up food
- **2 Out for Delivery**: Driver en route to customer
- **2 Delivered**: Completed orders
- **1 Cancelled**: Cancelled order

### Route Plans (3 total)
- Sample optimized routes for assigned orders

### Tracking Points (30 total)
- GPS trails for completed and active deliveries

---

## Troubleshooting

### Backend Won't Start

**Error**: "Cannot connect to database"

**Solution**:
```bash
# Ensure Docker is running
docker ps

# Restart database
docker-compose restart postgres

# Check connection
docker exec -it stack-delivery-postgres psql -U postgres -d stack_delivery
```

### Seed Script Fails

**Error**: "Relations do not exist"

**Solution**:
```bash
# Run migrations first
npm run migration:run

# Then seed
npm run seed
```

### Flutter App Can't Connect to Backend

**Error**: "Network error" or "Connection refused"

**Solution**:
1. Check backend is running: `curl http://localhost:3000/api/health`
2. Update `lib/util/app_constants.dart` if needed:
   ```dart
   static const String baseUrl = 'http://10.0.2.2:3000'; // Android emulator
   // OR
   static const String baseUrl = 'http://localhost:3000'; // iOS simulator
   ```
3. For physical devices, use your computer's IP:
   ```dart
   static const String baseUrl = 'http://192.168.x.x:3000';
   ```

### No Orders Showing in Flutter App

**Solution**:
1. Ensure backend is running
2. Check seed data was created:
   ```bash
   docker exec -it stack-delivery-postgres psql -U postgres -d stack_delivery -c "SELECT COUNT(*) FROM orders;"
   ```
3. Verify API endpoint: `curl http://localhost:3000/api/orders/available`

### Tracking Page Not Updating

**Solution**:
1. Check WebSocket/SSE connection in browser DevTools (Network tab)
2. Ensure driver app is sending location updates
3. Verify Redis is running: `docker ps | grep redis`

---

## Known Issues & Limitations

### ⚠️ Features Pending Implementation

1. **Multi-Order Stacking UI** - Backend supports, Flutter UI needs update
2. **Route Optimization Integration** - Flutter doesn't call `/api/routes/optimize` yet
3. **Turn-by-Turn Navigation** - OptimoRoute data available, but navigation UI missing
4. **Tracking Link Sharing** - No SMS/WhatsApp integration yet
5. **Signature Capture POD** - Only photo/OTP implemented
6. **Earnings Dashboard** - Placeholder UI, no data binding
7. **ipstack Personalization** - Tracking page doesn't call ipstack on load
8. **Manual Reassignment** - Admin UI doesn't have reassignment feature
9. **Broadcast Messages** - No admin UI for mass notifications
10. **Analytics Dashboard** - No metrics/reporting UI

### 🔑 API Keys Needed

For full functionality, you need:

1. **OptimoRoute API Key** - For route optimization
   - Get a trial key: https://optimoroute.com/
   - Add to `.env`: `OPTIMOROUTE_API_KEY=your_key_here`

2. **ipstack API Key** - For IP geolocation
   - Get a free key: https://ipstack.com/
   - Add to `.env`: `IPSTACK_API_KEY=your_key_here`

**Note**: Without these keys, some features will use mock/fallback data.

---

## Next Steps After Testing

1. **Report Issues**: Document any bugs or unexpected behavior
2. **Prioritize Features**: Decide which pending features to implement
3. **Performance Testing**: Test with 100+ concurrent drivers
4. **Security Audit**: Review authentication, authorization, and data handling
5. **Production Deployment**: Set up staging and production environments

---

## Support & Feedback

For questions or issues:
- Check [GAP_ANALYSIS.md](./GAP_ANALYSIS.md) for detailed feature status
- Review [prd.md](./prd.md) for expected behavior
- Open an issue with details of any problems encountered

---

**Happy Testing! 🚀**
