# Stack Delivery API - cURL Commands Reference

This document contains all cURL commands for testing the Stack Delivery backend API.

**Base URL**: `http://localhost:3000/api`  
**Note**: Replace `YOUR_TOKEN` with actual JWT token obtained from login endpoints.  
**Note**: Replace `DRIVER_ID`, `ORDER_ID`, etc. with actual UUIDs from your database.

---

## Table of Contents

1. [Health & Configuration](#health--configuration)
2. [Authentication](#authentication)
3. [Driver Management](#driver-management)
4. [Order Management](#order-management)
5. [Route Optimization](#route-optimization)
6. [Tracking](#tracking)
7. [Geolocation](#geolocation)
8. [Shifts](#shifts)
9. [Assignments](#assignments)
10. [Webhooks](#webhooks)
11. [Notifications & Events](#notifications--events)
12. [Delivery Man API (Legacy)](#delivery-man-api-legacy)
13. [Metrics](#metrics)

---

## Health & Configuration

### GET /health
Health check endpoint.

```bash
curl -X GET http://localhost:3000/api/health
```

### GET /v1/config
Get application configuration.

```bash
curl -X GET http://localhost:3000/api/v1/config
```

---

## Authentication

### POST /auth/login
Admin login (default: admin/admin).

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin"
  }'
```

### POST /auth/driver/otp/request
Request OTP for driver authentication.

```bash
curl -X POST http://localhost:3000/api/auth/driver/otp/request \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919975008124"
  }'
```

**Note**: In development, OTP code is logged to server console.

### POST /auth/driver/otp/verify
Verify OTP and get driver token.

```bash
curl -X POST http://localhost:3000/api/auth/driver/otp/verify \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919975008124",
    "code": "123456"
  }'
```

### POST /v1/auth/delivery-man/login
Legacy password-based driver login.

```bash
curl -X POST http://localhost:3000/api/v1/auth/delivery-man/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919975008124",
    "password": "123456"
  }'
```

---

## Driver Management

### GET /drivers
List all drivers (with pagination).

```bash
curl -X GET "http://localhost:3000/api/drivers?page=1&pageSize=25"
```

### GET /drivers/me
Get current authenticated driver's profile.

```bash
curl -X GET http://localhost:3000/api/drivers/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### GET /drivers/:id
Get driver by ID.

```bash
curl -X GET http://localhost:3000/api/drivers/DRIVER_ID
```

### PATCH /drivers/:id
Update driver profile.

```bash
curl -X PATCH http://localhost:3000/api/drivers/DRIVER_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Driver Name",
    "phone": "+919975008125",
    "vehicleType": "bike",
    "capacity": 5,
    "latitude": 12.9716,
    "longitude": 77.5946,
    "zoneId": "zone-1"
  }'
```

### PATCH /drivers/:id/capacity
Update driver's capacity.

```bash
curl -X PATCH http://localhost:3000/api/drivers/DRIVER_ID/capacity \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "capacity": 5
  }'
```

### PATCH /drivers/:id/online
Update driver's online status.

```bash
curl -X PATCH http://localhost:3000/api/drivers/DRIVER_ID/online \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "online": true
  }'
```

---

## Order Management

### GET /orders
List all orders (admin/dispatcher/support only).

```bash
curl -X GET "http://localhost:3000/api/orders?page=1&pageSize=25" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### GET /orders/available
Get available orders for assignment.

```bash
curl -X GET "http://localhost:3000/api/orders/available?driverId=DRIVER_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### GET /orders/driver/:driverId/active
Get active orders for a specific driver.

```bash
curl -X GET http://localhost:3000/api/orders/driver/DRIVER_ID/active \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### GET /orders/:id
Get order by ID (admin/dispatcher/support only).

```bash
curl -X GET http://localhost:3000/api/orders/ORDER_ID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### GET /orders/:id/sla
Get SLA information for an order.

```bash
curl -X GET http://localhost:3000/api/orders/ORDER_ID/sla \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### PUT /orders/:id
Create or update an order (admin/dispatcher only).

```bash
curl -X PUT http://localhost:3000/api/orders/ORDER_ID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "externalRef": "ORDER-001",
    "pickup": {
      "lat": 12.9716,
      "lng": 77.5946,
      "address": "Restaurant Address, MG Road, Bengaluru"
    },
    "dropoff": {
      "lat": 12.9558,
      "lng": 77.6077,
      "address": "Customer Address, Prestige Tech Park, Bengaluru"
    },
    "paymentType": "cash_on_delivery",
    "status": "pending",
    "items": [
      {
        "name": "Pizza Margherita",
        "quantity": 1,
        "price": 299
      }
    ],
    "slaSeconds": 2700,
    "zoneId": "zone-1"
  }'
```

**PaymentType values**: `cash_on_delivery`, `prepaid`, `partial`

### PUT /orders/:id/assign
Assign an order to a driver (admin/dispatcher only).

```bash
curl -X PUT http://localhost:3000/api/orders/ORDER_ID/assign \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "driverId": "DRIVER_ID"
  }'
```

### PUT /orders/:id/status
Update order status.

```bash
curl -X PUT http://localhost:3000/api/orders/ORDER_ID/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "accepted"
  }'
```

**Status values**: `pending`, `assigned`, `accepted`, `picked_up`, `in_transit`, `delivered`, `cancelled`

---

## Route Optimization

### POST /routes/optimize
Optimize route for multiple delivery stops.

```bash
curl -X POST http://localhost:3000/api/routes/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "driverId": "DRIVER_ID",
    "stops": [
      {
        "lat": 12.9716,
        "lng": 77.5946,
        "orderId": "ORDER_ID_1"
      },
      {
        "lat": 12.9558,
        "lng": 77.6077,
        "orderId": "ORDER_ID_2"
      }
    ]
  }'
```

### GET /routes/driver/:driverId/latest
Get the latest route plan for a driver.

```bash
curl -X GET http://localhost:3000/api/routes/driver/DRIVER_ID/latest
```

---

## Tracking

### POST /track/:orderId
Record a tracking point for an order.

```bash
curl -X POST http://localhost:3000/api/track/ORDER_ID \
  -H "Content-Type: application/json" \
  -H "idempotency-key: unique-key-123" \
  -d '{
    "driverId": "DRIVER_ID",
    "lat": 12.9716,
    "lng": 77.5946,
    "speed": 30.5,
    "heading": 45.0,
    "ts": "2024-01-01T12:00:00.000Z"
  }'
```

### GET /track/:orderId/sse
Server-Sent Events stream for real-time order tracking.

```bash
curl -X GET http://localhost:3000/api/track/ORDER_ID/sse \
  -H "Accept: text/event-stream" \
  --no-buffer
```

**Note**: This endpoint streams events continuously. Use `--no-buffer` flag for real-time updates.

---

## Geolocation

### GET /geo/ip
Get geolocation information from IP address.

```bash
curl -X GET http://localhost:3000/api/geo/ip \ 
  -H "x-forwarded-for: 192.168.1.1"
```

### GET /geo/reverse
Reverse geocode coordinates to address.

```bash
curl -X GET "http://localhost:3000/api/geo/reverse?lat=12.9716&lng=77.5946"
```

---

## Shifts

### GET /shifts
Get all shifts for authenticated driver or all shifts if admin.

```bash
curl -X GET http://localhost:3000/api/shifts \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### GET /shifts/driver/:driverId
Get shifts for a specific driver.

```bash
curl -X GET http://localhost:3000/api/shifts/driver/DRIVER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### GET /shifts/:id
Get a specific shift by ID.

```bash
curl -X GET http://localhost:3000/api/shifts/SHIFT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### POST /shifts
Create a new shift.
```bash
curl -X POST http://localhost:3000/api/shifts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Evening Shift",
    "startTime": "16:00:00",
    "endTime": "00:00:00",
    "status": "active",
    "driverId": "DRIVER_ID"
  }'
```

### PUT /shifts/:id
Update a shift.

```bash
curl -X PUT http://localhost:3000/api/shifts/SHIFT_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Shift Name",
    "startTime": "08:00:00",
    "endTime": "16:00:00",
    "status": "active"
  }'
```

### DELETE /shifts/:id
Delete a shift.

```bash
curl -X DELETE http://localhost:3000/api/shifts/SHIFT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Assignments

### POST /assignments/assign
Assign an order to a driver.

```bash
curl -X POST http://localhost:3000/api/assignments/assign \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORDER_ID",
    "driverId": "DRIVER_ID"
  }'
```

**Note**: If `driverId` is not provided, uses the authenticated driver from token.

---

## Webhooks

### POST /webhooks/orders
Create an order from a third-party platform webhook.

```bash
curl -X POST http://localhost:3000/api/webhooks/orders \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: signature-here" \
  -H "x-platform-key: platform-key-here" \
  -d '{
    "platform": "zomato",
    "externalRef": "ZOMATO-12345",
    "pickup": {
      "lat": 12.9716,
      "lng": 77.5946,
      "address": "Pizza Hut, MG Road, Bengaluru"
    },
    "dropoff": {
      "lat": 12.9558,
      "lng": 77.6077,
      "address": "Prestige Tech Park, Bengaluru"
    },
    "items": [
      {
        "name": "Margherita Pizza",
        "quantity": 1,
        "price": 299
      }
    ],
    "paymentType": "cash",
    "customerPhone": "+919999999999",
    "customerName": "John Doe",
    "slaMinutes": 45
  }'
```

**PaymentType values**: `cash`, `online`

### POST /webhooks/test
Test endpoint to simulate a webhook call.

```bash
curl -X POST http://localhost:3000/api/webhooks/test \
  -H "Content-Type: application/json"
```

---

## Notifications & Events

### POST /events/delivery-completed
Broadcast delivery completed event.

```bash
curl -X POST http://localhost:3000/api/events/delivery-completed \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORDER_ID",
    "driverId": "DRIVER_ID",
    "pod": {
      "photoUrl": "https://example.com/photo.jpg",
      "signature": "https://example.com/signature.jpg"
    },
    "ts": "2024-01-01T12:00:00.000Z"
  }'
```

### GET /notifications/templates
Get notification templates.

```bash
curl -X GET http://localhost:3000/api/notifications/templates
```

### PUT /notifications/templates
Update notification templates.

```bash
curl -X PUT http://localhost:3000/api/notifications/templates \
  -H "Content-Type: application/json" \
  -d '{
    "delivery_completed": "Your order has been delivered",
    "order_assigned": "New order assigned to you"
  }'
```

---

## Delivery Man API (Legacy)

### GET /v1/delivery-man/all-orders
Get all orders for authenticated driver with pagination.

```bash
curl -X GET "http://localhost:3000/api/v1/delivery-man/all-orders?offset=1&limit=10&status=all" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### GET /v1/delivery-man/dm-shift
Get shift information for authenticated driver.

```bash
curl -X GET http://localhost:3000/api/v1/delivery-man/dm-shift \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### GET /v1/delivery-man/notifications
Get notifications for authenticated driver.

```bash
curl -X GET "http://localhost:3000/api/v1/delivery-man/notifications?offset=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### GET /v1/delivery-man/wallet-payment-list
Get wallet payment list for authenticated driver.

```bash
curl -X GET http://localhost:3000/api/v1/delivery-man/wallet-payment-list \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### GET /v1/delivery-man/get-withdraw-method-list
Get withdrawal method list.

```bash
curl -X GET http://localhost:3000/api/v1/delivery-man/get-withdraw-method-list \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### GET /v1/delivery-man/message/list
Get message/conversation list.

```bash
curl -X GET "http://localhost:3000/api/v1/delivery-man/message/list?offset=1&limit=10&type=customer" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### GET /v1/delivery-man/order/:orderId
Get order details for authenticated driver.

```bash
curl -X GET http://localhost:3000/api/v1/delivery-man/order/ORDER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Metrics

### GET /metrics
Get system metrics (admin/support only).

```bash
curl -X GET http://localhost:3000/api/metrics \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## Quick Test Script

Save this as `test-api.sh` and make it executable:

```bash
#!/bin/bash

BASE_URL="http://localhost:3000/api"

echo "=== Testing Health Check ==="
curl -X GET "${BASE_URL}/health"
echo -e "\n\n"

echo "=== Testing Config ==="
curl -X GET "${BASE_URL}/v1/config"
echo -e "\n\n"

echo "=== Testing Driver OTP Request ==="
curl -X POST "${BASE_URL}/auth/driver/otp/request" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919975008124"}'
echo -e "\n\n"

echo "=== Testing Driver OTP Verify ==="
curl -X POST "${BASE_URL}/auth/driver/otp/verify" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919975008124", "code": "123456"}'
echo -e "\n\n"

echo "=== Testing Admin Login ==="
curl -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin"}'
echo -e "\n\n"

echo "=== Testing Geo IP ==="
curl -X GET "${BASE_URL}/geo/ip"
echo -e "\n\n"

echo "=== Testing Geo Reverse ==="
curl -X GET "${BASE_URL}/geo/reverse?lat=12.9716&lng=77.5946"
echo -e "\n\n"

echo "=== Testing Routes Optimize ==="
curl -X POST "${BASE_URL}/routes/optimize" \
  -H "Content-Type: application/json" \
  -d '{
    "driverId": "test-driver-id",
    "stops": [
      {"lat": 12.9716, "lng": 77.5946, "orderId": "order-1"},
      {"lat": 12.9558, "lng": 77.6077, "orderId": "order-2"}
    ]
  }'
echo -e "\n\n"

echo "=== Testing Webhooks Test ==="
curl -X POST "${BASE_URL}/webhooks/test" \
  -H "Content-Type: application/json"
echo -e "\n\n"
```

Make it executable and run:
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## Notes

1. **Authentication Tokens**: 
   - Get driver token from `/auth/driver/otp/verify` or `/v1/auth/delivery-man/login`
   - Get admin token from `/auth/login`
   - Include token in `Authorization: Bearer YOUR_TOKEN` header

2. **UUIDs**: 
   - Replace `DRIVER_ID`, `ORDER_ID`, `SHIFT_ID` with actual UUIDs from your database
   - UUIDs are in format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

3. **Base URL**: 
   - Default: `http://localhost:3000/api`
   - Change if your server runs on a different host/port

4. **SSE Endpoint**: 
   - `/track/:orderId/sse` streams events continuously
   - Use `--no-buffer` flag with curl for real-time updates
   - Press Ctrl+C to stop

5. **Error Responses**: 
   - 401: Unauthorized (missing/invalid token)
   - 403: Forbidden (insufficient permissions)
   - 404: Resource not found
   - 400: Bad request (validation errors)

6. **Testing Workflow**:
   - Start with health check
   - Login to get token
   - Use token for authenticated endpoints
   - Create orders, assign to drivers, track delivery

---

**Last Updated**: 2024-01-01  
**Base URL**: `http://localhost:3000/api`  
**Swagger Docs**: `http://localhost:3000/api/docs`

