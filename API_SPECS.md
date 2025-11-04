# Stack Delivery API Specification

**Version**: 0.1.0  
**Base URL**: `http://localhost:3000/api`  
**Swagger Documentation**: `http://localhost:3000/api/docs`

> **OpenAPI Specification**: This API is fully documented in OpenAPI 3.0 format. See [`openapi.yaml`](./openapi.yaml) for the complete specification that can be used with Swagger UI, Postman, and other API tools.

## Table of Contents

1. [Authentication](#authentication)
2. [Health & Configuration](#health--configuration)
3. [Authentication Endpoints](#authentication-endpoints)
4. [Driver Management](#driver-management)
5. [Order Management](#order-management)
6. [Route Optimization](#route-optimization)
7. [Tracking](#tracking)
8. [Geolocation](#geolocation)
9. [Shifts](#shifts)
10. [Assignments](#assignments)
11. [Webhooks](#webhooks)
12. [Notifications & Events](#notifications--events)
13. [Delivery Man API (Legacy)](#delivery-man-api-legacy)
14. [Metrics](#metrics)

---

## Authentication

Most endpoints require authentication using JWT Bearer tokens. Include the token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Token Types

- **Driver Token**: Obtained via OTP or password login
- **Admin Token**: Obtained via admin login
- **Role-based Access**: Some endpoints require specific roles (`admin`, `dispatcher`, `support`)

---

## Health & Configuration

### GET /health

Health check endpoint for monitoring system status.

**Authentication**: None (Public)

**Response**:
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "redis": { "status": "up" }
  }
}
```

---

### GET /v1/config

Get application configuration for mobile apps.

**Authentication**: None (Public)

**Response**:
```json
{
  "business_name": "Stack Delivery",
  "logo": "",
  "address": "",
  "phone": "",
  "email": "",
  "currency_symbol": "$",
  "cash_on_delivery": true,
  "digital_payment": true,
  "country": "US",
  "default_location": {
    "lat": "0",
    "lng": "0"
  },
  "demo": false,
  "maintenance_mode": false,
  "toggle_dm_registration": true,
  "disbursement_type": "manual",
  "firebase_otp_verification": false
}
```

---

## Authentication Endpoints

### POST /auth/login

Admin login endpoint.

**Authentication**: None (Public)

**Request Body**:
```json
{
  "username": "admin",
  "password": "admin"
}
```

**Response**:
```json
{
  "ok": true,
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "expiresAt": "2024-01-01T13:00:00.000Z"
}
```

**Error Response**:
```json
{
  "ok": false
}
```

---

### POST /auth/driver/otp/request

Request OTP code for driver authentication.

**Authentication**: None (Public)

**Request Body**:
```json
{
  "phone": "+919975008124"
}
```

**Response**:
```json
{
  "ok": true
}
```

**Note**: In development, the OTP code is logged to the server console.

---

### POST /auth/driver/otp/verify

Verify OTP code and get driver authentication token.

**Authentication**: None (Public)

**Request Body**:
```json
{
  "phone": "+919975008124",
  "code": "123456"
}
```

**Response**:
```json
{
  "ok": true,
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "driverId": "uuid-here",
  "expiresIn": 3600,
  "expiresAt": "2024-01-01T13:00:00.000Z"
}
```

**Error Response**:
```json
{
  "ok": false,
  "message": "Invalid OTP code"
}
```

---

### POST /v1/auth/delivery-man/login

Legacy password-based driver login (for backward compatibility).

**Authentication**: None (Public)

**Request Body**:
```json
{
  "phone": "+919975008124",
  "password": "123456"
}
```

**Response**:
```json
{
  "ok": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "expiresAt": "2024-01-01T13:00:00.000Z",
  "delivery_man": {
    "id": "uuid-here",
    "phone": "+919975008124",
    "name": "Driver Name"
  }
}
```

---

## Driver Management

### GET /drivers

List all drivers with pagination.

**Authentication**: None (Public)

**Query Parameters**:
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "phone": "+919975008124",
      "vehicleType": "bike",
      "capacity": 5,
      "online": true,
      "latitude": 12.9716,
      "longitude": 77.5946,
      "zoneId": "zone-1",
      "createdAt": "2024-01-01T12:00:00.000Z",
      "updatedAt": "2024-01-01T12:00:00.000Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 10
}
```

---

### GET /drivers/me

Get current authenticated driver's profile.

**Authentication**: Required (JWT Bearer)

**Response**:
```json
{
  "id": "uuid",
  "name": "John Doe",
  "phone": "+919975008124",
  "vehicleType": "bike",
  "capacity": 5,
  "online": true,
  "latitude": 12.9716,
  "longitude": 77.5946,
  "zoneId": "zone-1",
  "metadata": {},
  "createdAt": "2024-01-01T12:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

---

### GET /drivers/:id

Get driver by ID.

**Authentication**: None (Public)

**Path Parameters**:
- `id` (string, required): Driver UUID

**Response**: Driver object (same format as `/drivers/me`)

---

### PATCH /drivers/:id

Update driver profile.

**Authentication**: Required (JWT Bearer) - Drivers can only update themselves

**Path Parameters**:
- `id` (string, required): Driver UUID

**Request Body**:
```json
{
  "name": "Updated Name",
  "phone": "+919975008125",
  "vehicleType": "car",
  "capacity": 10,
  "latitude": 12.9716,
  "longitude": 77.5946,
  "zoneId": "zone-2"
}
```

**Response**: Updated driver object

---

### PATCH /drivers/:id/capacity

Update driver's capacity (number of orders they can carry).

**Authentication**: Required (JWT Bearer) - Drivers can only update themselves

**Path Parameters**:
- `id` (string, required): Driver UUID

**Request Body**:
```json
{
  "capacity": 5
}
```

**Response**: Updated driver object

---

### PATCH /drivers/:id/online

Update driver's online/offline status.

**Authentication**: Required (JWT Bearer) - Drivers can only update themselves

**Path Parameters**:
- `id` (string, required): Driver UUID

**Request Body**:
```json
{
  "online": true
}
```

**Response**:
```json
{
  "message": "You are now online",
  "online": true,
  "active": 1
}
```

---

## Order Management

### GET /orders

List all orders with pagination.

**Authentication**: Required (JWT Bearer)  
**Roles**: `admin`, `dispatcher`, `support`

**Query Parameters**:
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "externalRef": "ORDER-001",
      "status": "assigned",
      "pickup": {
        "lat": 12.9716,
        "lng": 77.5946,
        "address": "Restaurant Address"
      },
      "dropoff": {
        "lat": 12.9558,
        "lng": 77.6077,
        "address": "Customer Address"
      },
      "paymentType": "cash_on_delivery",
      "assignedDriverId": "driver-uuid",
      "assignedAt": "2024-01-01T12:00:00.000Z",
      "slaSeconds": 2700,
      "createdAt": "2024-01-01T12:00:00.000Z",
      "updatedAt": "2024-01-01T12:00:00.000Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 10
}
```

---

### GET /orders/available

Get available orders for assignment.

**Authentication**: Required (JWT Bearer)

**Query Parameters**:
- `driverId` (string, optional): Filter by driver ID

**Response**: Array of order objects

---

### GET /orders/driver/:driverId/active

Get active orders for a specific driver.

**Authentication**: Required (JWT Bearer)

**Path Parameters**:
- `driverId` (string, required): Driver UUID

**Response**: Array of active order objects

---

### GET /orders/:id

Get order by ID.

**Authentication**: Required (JWT Bearer)  
**Roles**: `admin`, `dispatcher`, `support`

**Path Parameters**:
- `id` (string, required): Order UUID

**Response**: Order object

---

### GET /orders/:id/sla

Get SLA information for an order.

**Authentication**: Required (JWT Bearer)  
**Roles**: `admin`, `dispatcher`, `support`

**Path Parameters**:
- `id` (string, required): Order UUID

**Response**:
```json
{
  "dueAt": "2024-01-01T12:45:00.000Z",
  "remainingSeconds": 1800
}
```

---

### PUT /orders/:id

Create or update an order.

**Authentication**: Required (JWT Bearer)  
**Roles**: `admin`, `dispatcher`

**Path Parameters**:
- `id` (string, required): Order UUID

**Request Body**:
```json
{
  "externalRef": "ORDER-001",
  "pickup": {
    "lat": 12.9716,
    "lng": 77.5946,
    "address": "Restaurant Address"
  },
  "dropoff": {
    "lat": 12.9558,
    "lng": 77.6077,
    "address": "Customer Address"
  },
  "paymentType": "cash_on_delivery",
  "status": "pending",
  "items": [
    {
      "name": "Pizza",
      "quantity": 1,
      "price": 299
    }
  ],
  "slaSeconds": 2700,
  "zoneId": "zone-1"
}
```

**PaymentType Enum**: `cash_on_delivery`, `prepaid`, `partial`

**Response**: Created/updated order object

---

### PUT /orders/:id/assign

Assign an order to a driver.

**Authentication**: Required (JWT Bearer)  
**Roles**: `admin`, `dispatcher`

**Path Parameters**:
- `id` (string, required): Order UUID

**Request Body**:
```json
{
  "driverId": "driver-uuid"
}
```

**Response**: Updated order object

---

### PUT /orders/:id/status

Update order status.

**Authentication**: Required (JWT Bearer)

**Path Parameters**:
- `id` (string, required): Order UUID

**Request Body**:
```json
{
  "status": "accepted"
}
```

**Status Values**: `pending`, `assigned`, `accepted`, `picked_up`, `in_transit`, `delivered`, `cancelled`

**Response**: Updated order object

---

## Route Optimization

### POST /routes/optimize

Optimize route for multiple delivery stops.

**Authentication**: None (Public)

**Request Body**:
```json
{
  "driverId": "driver-uuid",
  "stops": [
    {
      "lat": 12.9716,
      "lng": 77.5946,
      "orderId": "order-1"
    },
    {
      "lat": 12.9558,
      "lng": 77.6077,
      "orderId": "order-2"
    }
  ]
}
```

**Response**:
```json
{
  "optimizedRoute": {
    "stops": [
      {
        "orderId": "order-1",
        "lat": 12.9716,
        "lng": 77.5946,
        "sequence": 1
      },
      {
        "orderId": "order-2",
        "lat": 12.9558,
        "lng": 77.6077,
        "sequence": 2
      }
    ],
    "totalDistance": 5.2,
    "estimatedTime": 900
  }
}
```

---

### GET /routes/driver/:driverId/latest

Get the latest route plan for a driver.

**Authentication**: None (Public)

**Path Parameters**:
- `driverId` (string, required): Driver UUID

**Response**: Route plan object

---

## Tracking

### POST /track/:orderId

Record a tracking point for an order.

**Authentication**: None (Public)

**Path Parameters**:
- `orderId` (string, required): Order UUID

**Headers**:
- `idempotency-key` (string, optional): Prevent duplicate tracking points

**Request Body**:
```json
{
  "driverId": "driver-uuid",
  "lat": 12.9716,
  "lng": 77.5946,
  "speed": 30.5,
  "heading": 45.0,
  "ts": "2024-01-01T12:00:00.000Z"
}
```

**Response**:
```json
{
  "ok": true,
  "id": "tracking-point-uuid"
}
```

---

### GET /track/:orderId/sse

Server-Sent Events (SSE) stream for real-time order tracking.

**Authentication**: None (Public)

**Path Parameters**:
- `orderId` (string, required): Order UUID

**Headers**:
- `Accept: text/event-stream`

**Response**: SSE stream with events:
- `position`: Location update
- `heartbeat`: Connection keep-alive (every 15 seconds)

**Event Format**:
```
event: position
data: {"id":"uuid","orderId":"order-uuid","driverId":"driver-uuid","lat":12.9716,"lng":77.5946,"ts":"2024-01-01T12:00:00.000Z"}

event: heartbeat
data: {"ts":1704110400000}
```

---

## Geolocation

### GET /geo/ip

Get geolocation information from IP address.

**Authentication**: None (Public)

**Headers**:
- `x-forwarded-for` (string, optional): Client IP address

**Response**:
```json
{
  "city": "Bengaluru",
  "country_code": "IN",
  "tz": "Asia/Kolkata",
  "lang": "en-IN",
  "approx": true
}
```

---

### GET /geo/reverse

Reverse geocode coordinates to address.

**Authentication**: None (Public)

**Query Parameters**:
- `lat` (number, required): Latitude
- `lng` (number, required): Longitude

**Response**:
```json
{
  "address": "MG Road, Bengaluru, Karnataka, India"
}
```

---

## Shifts

### GET /shifts

Get all shifts for the authenticated driver or all shifts if admin.

**Authentication**: Required (JWT Bearer)

**Response**:
```json
[
  {
    "id": "uuid",
    "name": "Morning Shift",
    "startTime": "08:00:00",
    "endTime": "16:00:00",
    "status": "active",
    "createdAt": "2024-01-01T12:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
]
```

---

### GET /shifts/driver/:driverId

Get shifts for a specific driver.

**Authentication**: Required (JWT Bearer)

**Path Parameters**:
- `driverId` (string, required): Driver UUID

**Response**: Array of shift objects

---

### GET /shifts/:id

Get a specific shift by ID.

**Authentication**: Required (JWT Bearer)

**Path Parameters**:
- `id` (string, required): Shift UUID

**Response**: Shift object

---

### POST /shifts

Create a new shift.

**Authentication**: Required (JWT Bearer)

**Request Body**:
```json
{
  "name": "Evening Shift",
  "startTime": "16:00:00",
  "endTime": "00:00:00",
  "status": "active",
  "driverId": "driver-uuid"
}
```

**Response**: Created shift object

---

### PUT /shifts/:id

Update a shift.

**Authentication**: Required (JWT Bearer)

**Path Parameters**:
- `id` (string, required): Shift UUID

**Request Body**: Partial shift object

**Response**: Updated shift object

---

### DELETE /shifts/:id

Delete a shift.

**Authentication**: Required (JWT Bearer)

**Path Parameters**:
- `id` (string, required): Shift UUID

**Response**:
```json
{
  "message": "Shift deleted successfully"
}
```

---

## Assignments

### POST /assignments/assign

Assign an order to a driver. If `driverId` is not provided, uses the authenticated driver.

**Authentication**: Required (JWT Bearer)

**Request Body**:
```json
{
  "orderId": "order-uuid",
  "driverId": "driver-uuid"
}
```

**Response**: Assignment result

---

## Webhooks

### POST /webhooks/orders

Create an order from a third-party platform webhook (Zomato, Swiggy, UberEats, etc.).

**Authentication**: None (Public)  
**Note**: Signature verification should be implemented in production

**Headers**:
- `x-webhook-signature` (string, optional): Webhook signature for verification
- `x-platform-key` (string, optional): Platform authentication key

**Request Body**:
```json
{
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
}
```

**PaymentType**: `cash` or `online`

**Response**:
```json
{
  "success": true,
  "orderId": "order-uuid",
  "trackingUrl": "https://track.example.com/order-uuid",
  "status": "pending",
  "message": "Order received and queued for assignment"
}
```

---

### POST /webhooks/test

Test endpoint to simulate a webhook call.

**Authentication**: None (Public)

**Request Body**: None

**Response**: Same as `/webhooks/orders` with test data

---

## Notifications & Events

### POST /events/delivery-completed

Broadcast delivery completed event.

**Authentication**: None (Public)

**Request Body**:
```json
{
  "orderId": "order-uuid",
  "driverId": "driver-uuid",
  "pod": {
    "photoUrl": "https://example.com/photo.jpg",
    "signature": "https://example.com/signature.jpg"
  },
  "ts": "2024-01-01T12:00:00.000Z"
}
```

**Response**:
```json
{
  "ok": true
}
```

---

### GET /notifications/templates

Get notification templates.

**Authentication**: None (Public)

**Response**: Object with notification templates

---

### PUT /notifications/templates

Update notification templates.

**Authentication**: None (Public)

**Request Body**:
```json
{
  "delivery_completed": "Your order has been delivered",
  "order_assigned": "New order assigned to you"
}
```

**Response**: Updated templates object

---

## Delivery Man API (Legacy)

These endpoints maintain backward compatibility with legacy mobile app versions.

### GET /v1/delivery-man/all-orders

Get all orders for the authenticated driver with pagination.

**Authentication**: Required (JWT Bearer)

**Query Parameters**:
- `offset` (string, optional): Offset for pagination (default: "1")
- `limit` (string, optional): Limit per page (default: "10")
- `status` (string, optional): Filter by status (`all`, `delivered`, `canceled`, etc.)
- `token` (string, optional): Legacy token parameter (deprecated, use Authorization header)

**Response**:
```json
{
  "orders": [
    {
      "id": "uuid",
      "status": "delivered",
      "pickup": {...},
      "dropoff": {...},
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  ],
  "total_size": 50,
  "limit": "10",
  "offset": "1",
  "order_count": {
    "all": 50,
    "delivered": 45,
    "canceled": 5,
    "refund_requested": 0,
    "refunded": 0,
    "refund_request_canceled": 0
  }
}
```

---

### GET /v1/delivery-man/dm-shift

Get shift information for the authenticated driver.

**Authentication**: Required (JWT Bearer)

**Response**:
```json
[
  {
    "id": "uuid",
    "name": "Morning Shift",
    "shift_name": "Morning Shift",
    "start_time": "08:00:00",
    "shift_start_time": "08:00:00",
    "end_time": "16:00:00",
    "shift_end_time": "16:00:00",
    "status": "active",
    "created_at": "2024-01-01T12:00:00.000Z",
    "updated_at": "2024-01-01T12:00:00.000Z"
  }
]
```

---

### GET /v1/delivery-man/notifications

Get notifications for the authenticated driver.

**Authentication**: Required (JWT Bearer)

**Query Parameters**:
- `offset` (string, optional): Offset for pagination
- `limit` (string, optional): Limit per page

**Response**:
```json
{
  "notifications": [],
  "total_size": 0,
  "limit": "10",
  "offset": "1"
}
```

---

### GET /v1/delivery-man/wallet-payment-list

Get wallet payment list for the authenticated driver.

**Authentication**: Required (JWT Bearer)

**Response**:
```json
{
  "wallet_payments": [],
  "total_size": 0
}
```

---

### GET /v1/delivery-man/get-withdraw-method-list

Get withdrawal method list.

**Authentication**: Required (JWT Bearer)

**Response**:
```json
{
  "withdraw_methods": [],
  "total_size": 0
}
```

---

### GET /v1/delivery-man/message/list

Get message/conversation list.

**Authentication**: Required (JWT Bearer)

**Query Parameters**:
- `offset` (string, optional): Offset for pagination
- `limit` (string, optional): Limit per page
- `type` (string, optional): Message type (`customer`, etc.)

**Response**:
```json
{
  "conversations": [],
  "total_size": 0,
  "limit": "10",
  "offset": "1",
  "type": "customer"
}
```

---

## Metrics

### GET /metrics

Get system metrics (admin/support only).

**Authentication**: Required (JWT Bearer)  
**Roles**: `admin`, `support`

**Response**: System metrics object

---

## Error Responses

All endpoints may return error responses in the following format:

**400 Bad Request**:
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

**401 Unauthorized**:
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**403 Forbidden**:
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}
```

**404 Not Found**:
```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "error": "Not Found"
}
```

**500 Internal Server Error**:
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

---

## Rate Limiting

Currently, rate limiting is not implemented. Consider implementing rate limiting for production use.

---

## Pagination

Endpoints that support pagination accept the following query parameters:

- `page` (number): Page number (1-indexed, default: 1)
- `limit` (number): Items per page (default: 10)

Pagination response format:
```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 10
}
```

---

## Data Types

### Coordinate
```typescript
{
  lat: number;    // Latitude (-90 to 90)
  lng: number;    // Longitude (-180 to 180)
  address?: string; // Optional address string
}
```

### PaymentType
- `cash_on_delivery` - Cash payment on delivery
- `prepaid` - Prepaid online payment
- `partial` - Partial payment

### Order Status
- `pending` - Order created, not assigned
- `assigned` - Order assigned to driver
- `accepted` - Driver accepted the order
- `picked_up` - Driver picked up the order
- `in_transit` - Order in transit to customer
- `delivered` - Order delivered
- `cancelled` - Order cancelled

---

## Notes

1. **UUID Format**: All IDs are UUIDs (v4 format)
2. **Timestamps**: All timestamps are in ISO 8601 format (UTC)
3. **Coordinates**: Latitude and longitude are decimal degrees
4. **Redis**: Some features (OTP, real-time tracking) require Redis but degrade gracefully if unavailable
5. **Demo Account**: Special demo account handling exists for phone `9975008124` or `+919975008124`

---

## Swagger Documentation

Interactive API documentation is available at:
```
http://localhost:3000/api/docs
```

This provides a web-based interface to explore and test all endpoints.

## OpenAPI Specification

The complete OpenAPI 3.0 specification is available in [`openapi.yaml`](./openapi.yaml). This file can be used with:

- **Swagger UI**: Import the file to generate interactive documentation
- **Postman**: Import to create a complete API collection
- **Code Generation**: Generate client SDKs for various languages
- **API Testing Tools**: Use with tools like Insomnia, Bruno, or REST Client
- **API Gateway**: Deploy to AWS API Gateway, Azure API Management, etc.

### Using the OpenAPI Specification

1. **View in Swagger Editor**: 
   - Visit https://editor.swagger.io/
   - Import the `openapi.yaml` file
   - Explore and validate the API

2. **Generate Client Code**:
   ```bash
   # Using openapi-generator
   openapi-generator-cli generate -i openapi.yaml -g typescript-axios -o ./generated-client
   ```

3. **Import to Postman**:
   - Open Postman
   - Click Import → File → Select `openapi.yaml`
   - All endpoints will be imported with request examples

4. **Validate API**:
   ```bash
   # Using swagger-cli
   swagger-cli validate openapi.yaml
   ```

---

**Last Updated**: 2024-01-01  
**Maintainer**: Stack Delivery Team

