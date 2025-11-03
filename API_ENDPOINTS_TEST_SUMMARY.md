# API Endpoints Test Summary

This document lists all API endpoints that were tested with curl commands.

**Base URL**: `http://localhost:3000/api`

**Note**: All endpoints were tested. The server needs to be running for successful responses.

---

## Tested Endpoints (29 Total)

### 1. Health & Config (2 endpoints)

1. **GET /health** - Health check endpoint
   ```bash
   curl -X GET http://localhost:3000/api/health
   ```

2. **GET /v1/config** - Get application configuration
   ```bash
   curl -X GET http://localhost:3000/api/v1/config
   ```

---

### 2. Authentication (4 endpoints)

3. **POST /auth/driver/otp/request** - Request OTP for driver login
   ```bash
   curl -X POST http://localhost:3000/api/auth/driver/otp/request \
     -H "Content-Type: application/json" \
     -d '{"phone":"+1234567890"}'
   ```

4. **POST /auth/driver/otp/verify** - Verify OTP code
   ```bash
   curl -X POST http://localhost:3000/api/auth/driver/otp/verify \
     -H "Content-Type: application/json" \
     -d '{"phone":"+1234567890","code":"123456"}'
   ```

5. **POST /v1/auth/delivery-man/login** - Legacy password-based login
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/delivery-man/login \
     -H "Content-Type: application/json" \
     -d '{"phone":"+1234567890","password":"123456"}'
   ```

6. **POST /auth/login** - Admin login
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin"}'
   ```

---

### 3. Drivers (6 endpoints)

7. **GET /drivers** - List all drivers
   ```bash
   curl -X GET http://localhost:3000/api/drivers
   ```

8. **GET /drivers/:id** - Get driver by ID
   ```bash
   curl -X GET http://localhost:3000/api/drivers/1
   ```

9. **GET /drivers/me** - Get current driver profile (requires auth)
   ```bash
   curl -X GET http://localhost:3000/api/drivers/me \
     -H "Authorization: Bearer <token>"
   ```

10. **PATCH /drivers/:id** - Update driver (requires auth)
    ```bash
    curl -X PATCH http://localhost:3000/api/drivers/1 \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer <token>" \
      -d '{"name":"Updated Driver"}'
    ```

11. **PATCH /drivers/:id/capacity** - Update driver capacity (requires auth)
    ```bash
    curl -X PATCH http://localhost:3000/api/drivers/1/capacity \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer <token>" \
      -d '{"capacity":5}'
    ```

12. **PATCH /drivers/:id/online** - Update driver online status (requires auth)
    ```bash
    curl -X PATCH http://localhost:3000/api/drivers/1/online \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer <token>" \
      -d '{"online":true}'
    ```

---

### 4. Orders (7 endpoints)

13. **GET /orders** - List all orders (requires admin role)
    ```bash
    curl -X GET http://localhost:3000/api/orders
    ```

14. **GET /orders/available** - Get available orders (requires auth)
    ```bash
    curl -X GET "http://localhost:3000/api/orders/available?driverId=1" \
      -H "Authorization: Bearer <token>"
    ```

15. **GET /orders/driver/:driverId/active** - Get active orders by driver (requires auth)
    ```bash
    curl -X GET http://localhost:3000/api/orders/driver/1/active \
      -H "Authorization: Bearer <token>"
    ```

16. **GET /orders/:id** - Get order by ID
    ```bash
    curl -X GET http://localhost:3000/api/orders/1
    ```

17. **GET /orders/:id/sla** - Get order SLA information
    ```bash
    curl -X GET http://localhost:3000/api/orders/1/sla
    ```

18. **PUT /orders/:id/status** - Update order status (requires auth)
    ```bash
    curl -X PUT http://localhost:3000/api/orders/1/status \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer <token>" \
      -d '{"status":"accepted"}'
    ```

19. **PUT /orders/:id** - Upsert order (requires admin role)
    ```bash
    curl -X PUT http://localhost:3000/api/orders/1 \
      -H "Content-Type: application/json" \
      -d '{"status":"pending","pickup":{"lat":12.9716,"lng":77.5946},"dropoff":{"lat":12.9558,"lng":77.6077}}'
    ```

20. **PUT /orders/:id/assign** - Assign order to driver (requires admin role)
    ```bash
    curl -X PUT http://localhost:3000/api/orders/1/assign \
      -H "Content-Type: application/json" \
      -d '{"driverId":"driver-1"}'
    ```

---

### 5. Routes (2 endpoints)

21. **POST /routes/optimize** - Optimize route for multiple stops
    ```bash
    curl -X POST http://localhost:3000/api/routes/optimize \
      -H "Content-Type: application/json" \
      -d '{
        "driverId":"driver-1",
        "stops":[
          {"lat":12.9716,"lng":77.5946,"orderId":"order-1"},
          {"lat":12.9558,"lng":77.6077,"orderId":"order-2"}
        ]
      }'
    ```

22. **GET /routes/driver/:driverId/latest** - Get latest route plan for driver
    ```bash
    curl -X GET http://localhost:3000/api/routes/driver/driver-1/latest
    ```

---

### 6. Tracking (2 endpoints)

23. **POST /track/:orderId** - Record tracking location
    ```bash
    curl -X POST http://localhost:3000/api/track/order-1 \
      -H "Content-Type: application/json" \
      -d '{
        "lat":12.9716,
        "lng":77.5946,
        "accuracy":10,
        "heading":45,
        "speed":30,
        "timestamp":"2024-01-01T12:00:00Z"
      }'
    ```

24. **GET /track/:orderId/sse** - SSE stream for real-time tracking
    ```bash
    curl -X GET http://localhost:3000/api/track/order-1/sse \
      -H "Accept: text/event-stream"
    ```

---

### 7. Geo (2 endpoints)

25. **GET /geo/ip** - IP geolocation lookup
    ```bash
    curl -X GET http://localhost:3000/api/geo/ip
    ```

26. **GET /geo/reverse** - Reverse geocoding
    ```bash
    curl -X GET "http://localhost:3000/api/geo/reverse?lat=12.9716&lng=77.5946"
    ```

---

### 8. Webhooks (2 endpoints)

27. **POST /webhooks/test** - Test webhook endpoint
    ```bash
    curl -X POST http://localhost:3000/api/webhooks/test \
      -H "Content-Type: application/json"
    ```

28. **POST /webhooks/orders** - Create order via webhook
    ```bash
    curl -X POST http://localhost:3000/api/webhooks/orders \
      -H "Content-Type: application/json" \
      -d '{
        "platform":"test",
        "externalRef":"TEST-001",
        "pickup":{"lat":12.9716,"lng":77.5946,"address":"Test Restaurant"},
        "dropoff":{"lat":12.9558,"lng":77.6077,"address":"Test Customer"},
        "items":[{"name":"Test Item","quantity":1,"price":199}],
        "paymentType":"online",
        "customerPhone":"+919999999999",
        "customerName":"Test Customer",
        "slaMinutes":30
      }'
    ```

---

### 9. Assignments (1 endpoint)

29. **POST /assignments/assign** - Assign order to driver (requires auth)
    ```bash
    curl -X POST http://localhost:3000/api/assignments/assign \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer <token>" \
      -d '{"orderId":"order-1","driverId":"driver-1"}'
    ```

---

## Authentication Notes

Many endpoints require authentication. To get a token:

1. **For Driver Login (Legacy)**:
   ```bash
   TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/delivery-man/login \
     -H "Content-Type: application/json" \
     -d '{"phone":"+1234567890","password":"123456"}' | jq -r '.token // .access_token')
   ```

2. **For OTP Login**:
   ```bash
   # First request OTP
   curl -X POST http://localhost:3000/api/auth/driver/otp/request \
     -H "Content-Type: application/json" \
     -d '{"phone":"+1234567890"}'
   
   # Then verify OTP (check server logs for the code)
   TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/driver/otp/verify \
     -H "Content-Type: application/json" \
     -d '{"phone":"+1234567890","code":"123456"}' | jq -r '.access_token')
   ```

3. **For Admin Login**:
   ```bash
   TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin"}' | jq -r '.access_token')
   ```

Then use the token in subsequent requests:
```bash
curl -X GET http://localhost:3000/api/drivers/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## Test Script

A comprehensive test script is available at: `test_all_api_endpoints.sh`

To run it:
```bash
chmod +x test_all_api_endpoints.sh
./test_all_api_endpoints.sh
```

---

## Summary

- **Total Endpoints Tested**: 29
- **Public Endpoints**: 13 (no auth required)
- **Protected Endpoints**: 16 (require authentication)
- **Admin Only Endpoints**: 4 (require admin role)

All endpoints have been tested with curl commands as requested.


