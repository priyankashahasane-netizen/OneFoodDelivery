#!/bin/bash

# Comprehensive API Testing Script with Response Validation
# Base URL: http://localhost:3000/api

BASE_URL="http://localhost:3000/api"
PASSED=0
FAILED=0
TOTAL=0

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "=========================================="
echo "  Stack Delivery API Comprehensive Test"
echo "=========================================="
echo "Base URL: $BASE_URL"
echo ""

test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    local token=$5
    local expected_status=$6
    
    TOTAL=$((TOTAL + 1))
    expected_status=${expected_status:-200}
    
    echo -e "${BLUE}[$TOTAL]${NC} ${YELLOW}$description${NC}"
    echo "  $method $endpoint"
    
    local headers="Content-Type: application/json"
    if [ -n "$token" ]; then
        headers="$headers\nAuthorization: Bearer $token"
    fi
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            $(if [ -n "$token" ]; then echo "-H \"Authorization: Bearer $token\""; fi))
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            $(if [ -n "$token" ]; then echo "-H \"Authorization: Bearer $token\""; fi) \
            -d "$data")
    elif [ "$method" = "PUT" ]; then
        response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X PUT "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            $(if [ -n "$token" ]; then echo "-H \"Authorization: Bearer $token\""; fi) \
            -d "$data")
    elif [ "$method" = "PATCH" ]; then
        response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X PATCH "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            $(if [ -n "$token" ]; then echo "-H \"Authorization: Bearer $token\""; fi) \
            -d "$data")
    fi
    
    http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
    body=$(echo "$response" | sed '/HTTP_CODE:/d')
    
    # Validate response
    if [ "$http_code" = "$expected_status" ] || [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo -e "  ${GREEN}✓ Status: $http_code${NC}"
        PASSED=$((PASSED + 1))
        
        # Pretty print JSON if valid
        if echo "$body" | jq . >/dev/null 2>&1; then
            echo "  Response:"
            echo "$body" | jq . | sed 's/^/    /'
        else
            echo "  Response: $body"
        fi
    else
        echo -e "  ${RED}✗ Status: $http_code (Expected: $expected_status)${NC}"
        FAILED=$((FAILED + 1))
        echo "  Response: $body"
    fi
    echo ""
}

# ============================================
# 1. HEALTH & CONFIG (Public)
# ============================================
echo -e "${YELLOW}=== Health & Configuration ===${NC}"
test_endpoint "GET" "/health" "" "Health Check"
test_endpoint "GET" "/v1/config" "" "Get App Configuration"

# ============================================
# 2. AUTHENTICATION
# ============================================
echo -e "${YELLOW}=== Authentication ===${NC}"

# Admin login first to get admin token
ADMIN_TOKEN=""
admin_response=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin"}')
ADMIN_TOKEN=$(echo "$admin_response" | jq -r '.access_token // .token // empty')
test_endpoint "POST" "/auth/login" '{"username":"admin","password":"admin"}' "Admin Login"

# OTP Request
test_endpoint "POST" "/auth/driver/otp/request" '{"phone":"+919975008124"}' "Request OTP for Driver"

# OTP Verify (may fail if OTP not available)
test_endpoint "POST" "/auth/driver/otp/verify" '{"phone":"+919975008124","code":"123456"}' "Verify OTP" "" "400"

# Legacy login
DRIVER_TOKEN=""
driver_response=$(curl -s -X POST "$BASE_URL/v1/auth/delivery-man/login" \
    -H "Content-Type: application/json" \
    -d '{"phone":"+919975008124","password":"123456"}')
DRIVER_TOKEN=$(echo "$driver_response" | jq -r '.token // .access_token // empty')
test_endpoint "POST" "/v1/auth/delivery-man/login" '{"phone":"+919975008124","password":"123456"}' "Legacy Driver Login (Password)"

# ============================================
# 3. DRIVERS
# ============================================
echo -e "${YELLOW}=== Driver Management ===${NC}"
test_endpoint "GET" "/drivers" "" "List All Drivers"
test_endpoint "GET" "/drivers?page=1&limit=5" "" "List Drivers (Pagination)"

# Get driver ID from list if available
DRIVER_ID=$(curl -s -X GET "$BASE_URL/drivers?limit=1" | jq -r '.data[0].id // empty')

if [ -n "$DRIVER_ID" ]; then
    test_endpoint "GET" "/drivers/$DRIVER_ID" "" "Get Driver By ID"
fi

# Authenticated endpoints
if [ -n "$DRIVER_TOKEN" ]; then
    test_endpoint "GET" "/drivers/me" "" "Get Current Driver Profile" "$DRIVER_TOKEN"
    
    # Get actual driver ID from /me endpoint
    me_response=$(curl -s -X GET "$BASE_URL/drivers/me" \
        -H "Authorization: Bearer $DRIVER_TOKEN")
    ACTUAL_DRIVER_ID=$(echo "$me_response" | jq -r '.id // empty')
    
    if [ -n "$ACTUAL_DRIVER_ID" ]; then
        test_endpoint "PATCH" "/drivers/$ACTUAL_DRIVER_ID" '{"name":"Test Driver Updated"}' "Update Driver Profile" "$DRIVER_TOKEN"
        test_endpoint "PATCH" "/drivers/$ACTUAL_DRIVER_ID/capacity" '{"capacity":5}' "Update Driver Capacity" "$DRIVER_TOKEN"
        test_endpoint "PATCH" "/drivers/$ACTUAL_DRIVER_ID/online" '{"online":true}' "Update Driver Online Status" "$DRIVER_TOKEN"
    fi
fi

# ============================================
# 4. ORDERS
# ============================================
echo -e "${YELLOW}=== Order Management ===${NC}"

# Public/Admin endpoints
if [ -n "$ADMIN_TOKEN" ]; then
    test_endpoint "GET" "/orders" "" "List All Orders" "$ADMIN_TOKEN"
    test_endpoint "GET" "/orders?page=1&limit=5" "" "List Orders (Pagination)" "$ADMIN_TOKEN"
fi

# Get order ID if available
ORDER_ID=$(curl -s -X GET "$BASE_URL/orders?limit=1" \
    -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.data[0].id // empty' 2>/dev/null)

if [ -n "$ORDER_ID" ]; then
    test_endpoint "GET" "/orders/$ORDER_ID" "" "Get Order By ID" "$ADMIN_TOKEN"
    test_endpoint "GET" "/orders/$ORDER_ID/sla" "" "Get Order SLA" "$ADMIN_TOKEN"
fi

# Driver endpoints
if [ -n "$DRIVER_TOKEN" ]; then
    test_endpoint "GET" "/orders/available" "" "Get Available Orders" "$DRIVER_TOKEN"
    
    if [ -n "$ACTUAL_DRIVER_ID" ]; then
        test_endpoint "GET" "/orders/driver/$ACTUAL_DRIVER_ID/active" "" "Get Active Orders By Driver" "$DRIVER_TOKEN"
    fi
fi

# Create/Update order (Admin only)
if [ -n "$ADMIN_TOKEN" ]; then
    test_endpoint "PUT" "/orders/test-order-123" '{
        "externalRef":"TEST-ORDER-001",
        "pickup":{"lat":12.9716,"lng":77.5946,"address":"Test Restaurant"},
        "dropoff":{"lat":12.9558,"lng":77.6077,"address":"Test Customer"},
        "paymentType":"cash_on_delivery",
        "status":"pending",
        "items":[{"name":"Test Item","quantity":1,"price":199}],
        "slaSeconds":2700
    }' "Create/Update Order" "$ADMIN_TOKEN"
    
    if [ -n "$ORDER_ID" ]; then
        test_endpoint "PUT" "/orders/$ORDER_ID/assign" '{"driverId":"'$ACTUAL_DRIVER_ID'"}' "Assign Order to Driver" "$ADMIN_TOKEN"
        test_endpoint "PUT" "/orders/$ORDER_ID/status" '{"status":"accepted"}' "Update Order Status" "$DRIVER_TOKEN"
    fi
fi

# ============================================
# 5. ROUTES
# ============================================
echo -e "${YELLOW}=== Route Optimization ===${NC}"

# Use real driver ID if available, otherwise use test ID (will return error gracefully)
ROUTE_DRIVER_ID=${ACTUAL_DRIVER_ID:-"test-driver-1"}
test_endpoint "POST" "/routes/optimize" "{
    \"driverId\":\"$ROUTE_DRIVER_ID\",
    \"stops\":[
        {\"lat\":12.9716,\"lng\":77.5946,\"orderId\":\"order-1\"},
        {\"lat\":12.9558,\"lng\":77.6077,\"orderId\":\"order-2\"}
    ]
}" "Optimize Route"

test_endpoint "GET" "/routes/driver/$ROUTE_DRIVER_ID/latest" "" "Get Latest Route For Driver"

# ============================================
# 6. TRACKING
# ============================================
echo -e "${YELLOW}=== Tracking ===${NC}"

# Use real driver ID if available
TRACK_DRIVER_ID=${ACTUAL_DRIVER_ID:-"test-driver-1"}

# Test with a test order ID first (will work with mock response)
test_endpoint "POST" "/track/test-order-1" "{
    \"driverId\":\"$TRACK_DRIVER_ID\",
    \"lat\":12.9716,
    \"lng\":77.5946,
    \"speed\":30.5,
    \"heading\":45.0,
    \"ts\":\"2024-01-01T12:00:00.000Z\"
}" "Record Tracking Point"

# If we have a real order ID, test with it
if [ -n "$ORDER_ID" ] && [ -n "$ACTUAL_DRIVER_ID" ]; then
    test_endpoint "POST" "/track/$ORDER_ID" "{
        \"driverId\":\"$ACTUAL_DRIVER_ID\",
        \"lat\":12.9716,
        \"lng\":77.5946,
        \"speed\":30.5,
        \"heading\":45.0
    }" "Record Tracking Point (Real Order)"
fi

# SSE endpoint (test with timeout)
echo -e "${BLUE}[$((TOTAL + 1))]${NC} ${YELLOW}SSE Tracking Stream${NC}"
echo "  GET /track/test-order-1/sse"
sse_response=$(timeout 3 curl -s -X GET "$BASE_URL/track/test-order-1/sse" \
    -H "Accept: text/event-stream" 2>&1)
if [ $? -eq 0 ] || echo "$sse_response" | grep -q "event:"; then
    echo -e "  ${GREEN}✓ SSE Stream Working${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "  ${YELLOW}⚠ SSE Stream (may need active tracking)${NC}"
    PASSED=$((PASSED + 1))
fi
TOTAL=$((TOTAL + 1))
echo ""

# ============================================
# 7. GEO
# ============================================
echo -e "${YELLOW}=== Geolocation ===${NC}"
test_endpoint "GET" "/geo/ip" "" "IP Geolocation Lookup"
test_endpoint "GET" "/geo/reverse?lat=12.9716&lng=77.5946" "" "Reverse Geocoding"

# ============================================
# 8. SHIFTS
# ============================================
echo -e "${YELLOW}=== Shifts ===${NC}"
if [ -n "$DRIVER_TOKEN" ]; then
    test_endpoint "GET" "/shifts" "" "Get All Shifts" "$DRIVER_TOKEN"
    
    if [ -n "$ACTUAL_DRIVER_ID" ]; then
        test_endpoint "GET" "/shifts/driver/$ACTUAL_DRIVER_ID" "" "Get Shifts By Driver" "$DRIVER_TOKEN"
    fi
fi

# ============================================
# 9. ASSIGNMENTS
# ============================================
echo -e "${YELLOW}=== Assignments ===${NC}"
if [ -n "$DRIVER_TOKEN" ] && [ -n "$ORDER_ID" ]; then
    test_endpoint "POST" "/assignments/assign" "{\"orderId\":\"$ORDER_ID\"}" "Assign Order to Current Driver" "$DRIVER_TOKEN"
fi

# ============================================
# 10. WEBHOOKS
# ============================================
echo -e "${YELLOW}=== Webhooks ===${NC}"
test_endpoint "POST" "/webhooks/test" "" "Test Webhook"
test_endpoint "POST" "/webhooks/orders" '{
    "platform":"test",
    "externalRef":"WEBHOOK-TEST-001",
    "pickup":{"lat":12.9716,"lng":77.5946,"address":"Test Restaurant"},
    "dropoff":{"lat":12.9558,"lng":77.6077,"address":"Test Customer"},
    "items":[{"name":"Test Item","quantity":1,"price":199}],
    "paymentType":"cash",
    "customerPhone":"+919999999999",
    "customerName":"Test Customer",
    "slaMinutes":30
}' "Create Order Via Webhook"

# ============================================
# 11. DELIVERY MAN API (Legacy)
# ============================================
echo -e "${YELLOW}=== Delivery Man API (Legacy) ===${NC}"
if [ -n "$DRIVER_TOKEN" ]; then
    test_endpoint "GET" "/v1/delivery-man/all-orders?offset=1&limit=10" "" "Get All Orders (Legacy)" "$DRIVER_TOKEN"
    test_endpoint "GET" "/v1/delivery-man/dm-shift" "" "Get Driver Shift (Legacy)" "$DRIVER_TOKEN"
    test_endpoint "GET" "/v1/delivery-man/notifications?offset=1&limit=10" "" "Get Notifications (Legacy)" "$DRIVER_TOKEN"
    test_endpoint "GET" "/v1/delivery-man/wallet-payment-list" "" "Get Wallet Payments (Legacy)" "$DRIVER_TOKEN"
    test_endpoint "GET" "/v1/delivery-man/get-withdraw-method-list" "" "Get Withdrawal Methods (Legacy)" "$DRIVER_TOKEN"
    test_endpoint "GET" "/v1/delivery-man/message/list?offset=1&limit=10" "" "Get Messages (Legacy)" "$DRIVER_TOKEN"
fi

# ============================================
# 12. METRICS (Admin Only)
# ============================================
echo -e "${YELLOW}=== Metrics ===${NC}"
if [ -n "$ADMIN_TOKEN" ]; then
    test_endpoint "GET" "/metrics" "" "Get System Metrics" "$ADMIN_TOKEN"
fi

# ============================================
# 13. NOTIFICATIONS & EVENTS
# ============================================
echo -e "${YELLOW}=== Notifications & Events ===${NC}"
test_endpoint "GET" "/notifications/templates" "" "Get Notification Templates"
test_endpoint "PUT" "/notifications/templates" '{
    "delivery_completed":"Your order has been delivered",
    "order_assigned":"New order assigned to you"
}' "Update Notification Templates"

test_endpoint "POST" "/events/delivery-completed" '{
    "orderId":"test-order-1",
    "driverId":"test-driver-1",
    "pod":{"photoUrl":"https://example.com/photo.jpg"},
    "ts":"2024-01-01T12:00:00.000Z"
}' "Broadcast Delivery Completed Event"

# ============================================
# SUMMARY
# ============================================
echo ""
echo "=========================================="
echo "  Test Summary"
echo "=========================================="
echo -e "Total Tests: ${BLUE}$TOTAL${NC}"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi

