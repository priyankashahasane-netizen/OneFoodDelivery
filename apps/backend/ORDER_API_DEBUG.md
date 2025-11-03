# Order API Debugging Guide

## Issue: Orders Not Showing in Flutter App

### What Was Fixed:

1. **Backend Endpoint Created**: `/api/v1/delivery-man/all-orders`
   - Supports status filtering: `all`, `delivered`, `canceled`, `refund_requested`, `refunded`, `refund_request_canceled`
   - Returns paginated results with order counts

2. **Data Format Transformation**: 
   - Backend now transforms orders to match Flutter's `OrderModel` format
   - Includes all required fields: `id`, `order_status`, `order_amount`, `restaurant_name`, `delivery_address`, etc.

3. **Orders Assigned to Demo Account**:
   - All mock orders are assigned to demo driver (phone: `9975008124`)
   - 41 total mock orders with various statuses

### Things to Check:

1. **Backend Running**: Make sure backend is running on port 3000
   ```bash
   cd apps/backend
   npm run start:dev
   ```

2. **Authentication**: 
   - Make sure you're logged in with demo account (phone: `9975008124`, password: `Pri@0110`)
   - JWT token should be in Authorization header: `Bearer <token>`

3. **API Endpoint**:
   - URL: `GET /api/v1/delivery-man/all-orders?offset=1&limit=10&status=all`
   - Requires JWT authentication
   - Returns format: `{ orders: [], total_size: number, order_count: {...} }`

4. **Flutter App**:
   - Check if API client is sending Authorization header
   - Check console logs for API errors
   - Verify token is being sent correctly

### Test the Endpoint Manually:

```bash
# 1. Login first to get token
curl -X POST http://localhost:3000/api/v1/auth/delivery-man/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"9975008124","password":"Pri@0110"}'

# 2. Use the token from response to get orders
curl -X GET "http://localhost:3000/api/v1/delivery-man/all-orders?offset=1&limit=10&status=all" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

### Expected Response Format:

```json
{
  "orders": [
    {
      "id": 123456,
      "order_status": "delivered",
      "order_amount": 399.0,
      "restaurant_name": "Dominos Pizza",
      "restaurant_address": "Dominos Pizza, Koramangala, Bengaluru",
      "delivery_address": {
        "address": "HSR Layout Sector 2, Bengaluru",
        "latitude": "12.9141",
        "longitude": "77.6411"
      },
      ...
    }
  ],
  "total_size": 41,
  "limit": "10",
  "offset": "1",
  "order_count": {
    "all": 41,
    "delivered": 7,
    "canceled": 4,
    "refund_requested": 4,
    "refunded": 4,
    "refund_request_canceled": 4
  }
}
```

### Debugging Steps:

1. Check backend logs for incoming requests
2. Check Flutter console for API errors
3. Verify token is valid and contains driver ID
4. Check network tab in Flutter debugger
5. Test endpoint with curl/Postman first

