#!/bin/bash

# Comprehensive API Testing Script for Stack Delivery Backend
# Base URL: http://localhost:3000
# Note: Ensure backend server is running before executing this script

BASE_URL="http://localhost:3000/api"
echo "=== Testing Stack Delivery API Endpoints ==="
echo "Base URL: $BASE_URL"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    local token=$5
    
    echo -e "${YELLOW}Testing: $description${NC}"
    echo "Endpoint: $method $endpoint"
    
    if [ -n "$token" ]; then
        if [ "$method" = "GET" ]; then
            response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $token")
        elif [ "$method" = "POST" ]; then
            response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $token" \
                -d "$data")
        elif [ "$method" = "PUT" ]; then
            response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X PUT "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $token" \
                -d "$data")
        elif [ "$method" = "PATCH" ]; then
            response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X PATCH "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $token" \
                -d "$data")
        fi
    else
        if [ "$method" = "GET" ]; then
            response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "$BASE_URL$endpoint" \
                -H "Content-Type: application/json")
        elif [ "$method" = "POST" ]; then
            response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data")
        elif [ "$method" = "PUT" ]; then
            response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X PUT "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data")
        elif [ "$method" = "PATCH" ]; then
            response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X PATCH "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data")
        fi
    fi
    
    http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
    body=$(echo "$response" | sed '/HTTP_CODE:/d')
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo -e "${GREEN}✓ Status: $http_code${NC}"
    else
        echo -e "${RED}✗ Status: $http_code${NC}"
    fi
    
    echo "$body" | jq . 2>/dev/null || echo "$body"
    echo ""
    echo "---"
    echo ""
}

# 1. HEALTH CHECK
test_endpoint "GET" "/health" "" "Health Check"

# 2. CONFIG
test_endpoint "GET" "/v1/config" "" "Get App Config"

# 3. AUTH - OTP REQUEST
test_endpoint "POST" "/auth/driver/otp/request" '{"phone":"+1234567890"}' "OTP Request"

# 4. AUTH - OTP VERIFY (Note: Need to get actual OTP from Redis or logs)
test_endpoint "POST" "/auth/driver/otp/verify" '{"phone":"+1234567890","code":"123456"}' "OTP Verify"
TOKEN=$(curl -s -X POST "$BASE_URL/auth/driver/otp/verify" \
    -H "Content-Type: application/json" \
    -d '{"phone":"+1234567890","code":"123456"}' | jq -r '.access_token // empty')

if [ -z "$TOKEN" ]; then
    # Try legacy login
    TOKEN=$(curl -s -X POST "$BASE_URL/v1/auth/delivery-man/login" \
        -H "Content-Type: application/json" \
        -d '{"phone":"+1234567890","password":"123456"}' | jq -r '.token // .access_token // empty')
fi

echo "Obtained Token: ${TOKEN:0:20}..."
echo ""

# 5. AUTH - LEGACY LOGIN
test_endpoint "POST" "/v1/auth/delivery-man/login" '{"phone":"+1234567890","password":"123456"}' "Legacy Login (Password)"

# 6. AUTH - ADMIN LOGIN
test_endpoint "POST" "/auth/login" '{"username":"admin","password":"admin"}' "Admin Login"

# 7. DRIVERS - LIST
test_endpoint "GET" "/drivers" "" "List All Drivers"

# 8. DRIVERS - GET BY ID (assuming we have a driver)
test_endpoint "GET" "/drivers/1" "" "Get Driver By ID"

# 9. DRIVERS - GET ME (requires auth)
if [ -n "$TOKEN" ]; then
    test_endpoint "GET" "/drivers/me" "" "Get Current Driver Profile" "$TOKEN"
fi

# 10. DRIVERS - UPDATE (requires auth)
if [ -n "$TOKEN" ]; then
    DRIVER_ID=$(curl -s -X GET "$BASE_URL/drivers/me" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" | jq -r '.id // empty')
    
    if [ -n "$DRIVER_ID" ]; then
        test_endpoint "PATCH" "/drivers/$DRIVER_ID" '{"name":"Updated Driver Name"}' "Update Driver" "$TOKEN"
    fi
fi

# 11. DRIVERS - UPDATE CAPACITY (requires auth)
if [ -n "$TOKEN" ] && [ -n "$DRIVER_ID" ]; then
    test_endpoint "PATCH" "/drivers/$DRIVER_ID/capacity" '{"capacity":5}' "Update Driver Capacity" "$TOKEN"
fi

# 12. DRIVERS - UPDATE ONLINE STATUS (requires auth)
if [ -n "$TOKEN" ] && [ -n "$DRIVER_ID" ]; then
    test_endpoint "PATCH" "/drivers/$DRIVER_ID/online" '{"online":true}' "Update Driver Online Status" "$TOKEN"
fi

# 13. ORDERS - LIST (requires admin role)
test_endpoint "GET" "/orders" "" "List All Orders"

# 14. ORDERS - GET AVAILABLE (requires auth)
if [ -n "$TOKEN" ]; then
    test_endpoint "GET" "/orders/available?driverId=$DRIVER_ID" "" "Get Available Orders" "$TOKEN"
fi

# 15. ORDERS - GET ACTIVE BY DRIVER (requires auth)
if [ -n "$TOKEN" ] && [ -n "$DRIVER_ID" ]; then
    test_endpoint "GET" "/orders/driver/$DRIVER_ID/active" "" "Get Active Orders By Driver" "$TOKEN"
fi

# 16. ORDERS - GET BY ID
test_endpoint "GET" "/orders/1" "" "Get Order By ID"

# 17. ORDERS - GET SLA
test_endpoint "GET" "/orders/1/sla" "" "Get Order SLA"

# 18. ROUTES - OPTIMIZE
test_endpoint "POST" "/routes/optimize" '{
    "driverId":"driver-1",
    "stops":[
        {"lat":12.9716,"lng":77.5946,"orderId":"order-1"},
        {"lat":12.9558,"lng":77.6077,"orderId":"order-2"}
    ]
}' "Optimize Route"

# 19. ROUTES - GET LATEST FOR DRIVER
test_endpoint "GET" "/routes/driver/driver-1/latest" "" "Get Latest Route For Driver"

# 20. TRACKING - POST LOCATION (requires order ID)
test_endpoint "POST" "/track/order-1" '{
    "lat":12.9716,
    "lng":77.5946,
    "accuracy":10,
    "heading":45,
    "speed":30,
    "timestamp":"2024-01-01T12:00:00Z"
}' "Record Tracking Location"

# 21. GEO - IP LOOKUP
test_endpoint "GET" "/geo/ip" "" "IP Geolocation Lookup"

# 22. GEO - REVERSE GEOCODE
test_endpoint "GET" "/geo/reverse?lat=12.9716&lng=77.5946" "" "Reverse Geocode"

# 23. WEBHOOKS - TEST WEBHOOK
test_endpoint "POST" "/webhooks/test" "" "Test Webhook"

# 24. WEBHOOKS - CREATE ORDER
test_endpoint "POST" "/webhooks/orders" '{
    "platform":"test",
    "externalRef":"TEST-001",
    "pickup":{"lat":12.9716,"lng":77.5946,"address":"Test Restaurant"},
    "dropoff":{"lat":12.9558,"lng":77.6077,"address":"Test Customer"},
    "items":[{"name":"Test Item","quantity":1,"price":199}],
    "paymentType":"online",
    "customerPhone":"+919999999999",
    "customerName":"Test Customer",
    "slaMinutes":30
}' "Create Order Via Webhook"

# 25. ASSIGNMENTS - ASSIGN ORDER (requires auth)
if [ -n "$TOKEN" ]; then
    ORDER_ID=$(curl -s -X GET "$BASE_URL/orders/available?driverId=$DRIVER_ID" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" | jq -r '.[0].id // empty')
    
    if [ -n "$ORDER_ID" ]; then
        test_endpoint "POST" "/assignments/assign" "{\"orderId\":\"$ORDER_ID\",\"driverId\":\"$DRIVER_ID\"}" "Assign Order" "$TOKEN"
    else
        test_endpoint "POST" "/assignments/assign" '{"orderId":"order-1","driverId":"driver-1"}' "Assign Order" "$TOKEN"
    fi
fi

# 26. ORDERS - UPDATE STATUS (requires auth)
if [ -n "$TOKEN" ] && [ -n "$ORDER_ID" ]; then
    test_endpoint "PUT" "/orders/$ORDER_ID/status" '{"status":"accepted"}' "Update Order Status" "$TOKEN"
fi

echo "=== API Testing Complete ==="


