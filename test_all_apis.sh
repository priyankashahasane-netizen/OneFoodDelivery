#!/bin/bash

# Stack Delivery API Test Script
# This script tests all available API endpoints
# Usage: ./test_all_apis.sh [BASE_URL]
# Example: ./test_all_apis.sh http://localhost:3000/api

BASE_URL="${1:-http://localhost:3000/api}"
DRIVER_PHONE="+919975008124"
DRIVER_PASSWORD="123456"
ADMIN_USER="admin"
ADMIN_PASS="admin"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Stack Delivery API Test Suite"
echo "=========================================="
echo "Base URL: $BASE_URL"
echo ""

# Function to print test result
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
    fi
}

# Function to extract token from response
extract_token() {
    echo "$1" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4
}

# Function to extract driver ID from response
extract_driver_id() {
    echo "$1" | grep -o '"driverId":"[^"]*' | cut -d'"' -f4
}

# Test counter
PASSED=0
FAILED=0

# ============================================
# 1. Health & Configuration
# ============================================
echo "=== Health & Configuration ==="

# Health Check
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/health")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')
if [ "$HTTP_CODE" -eq 200 ]; then
    print_result 0 "GET /health"
    ((PASSED++))
else
    print_result 1 "GET /health (HTTP $HTTP_CODE)"
    ((FAILED++))
fi

# Config
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/v1/config")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" -eq 200 ]; then
    print_result 0 "GET /v1/config"
    ((PASSED++))
else
    print_result 1 "GET /v1/config (HTTP $HTTP_CODE)"
    ((FAILED++))
fi

echo ""

# ============================================
# 2. Authentication
# ============================================
echo "=== Authentication ==="

# Admin Login
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$ADMIN_USER\",\"password\":\"$ADMIN_PASS\"}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')
if [ "$HTTP_CODE" -eq 200 ]; then
    ADMIN_TOKEN=$(extract_token "$BODY")
    print_result 0 "POST /auth/login (Admin)"
    ((PASSED++))
else
    print_result 1 "POST /auth/login (HTTP $HTTP_CODE)"
    ((FAILED++))
fi

# Driver OTP Request
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/driver/otp/request" \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$DRIVER_PHONE\"}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" -eq 200 ]; then
    print_result 0 "POST /auth/driver/otp/request"
    ((PASSED++))
    echo -e "${YELLOW}  Note: Check server logs for OTP code${NC}"
else
    print_result 1 "POST /auth/driver/otp/request (HTTP $HTTP_CODE)"
    ((FAILED++))
fi

# Driver OTP Verify (using a test OTP - may fail without Redis)
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/driver/otp/verify" \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$DRIVER_PHONE\",\"code\":\"123456\"}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')
if [ "$HTTP_CODE" -eq 200 ]; then
    DRIVER_TOKEN=$(extract_token "$BODY")
    DRIVER_ID=$(extract_driver_id "$BODY")
    print_result 0 "POST /auth/driver/otp/verify"
    ((PASSED++))
else
    print_result 1 "POST /auth/driver/otp/verify (HTTP $HTTP_CODE) - May need valid OTP from Redis"
    ((FAILED++))
fi

# Legacy Driver Login
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/v1/auth/delivery-man/login" \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$DRIVER_PHONE\",\"password\":\"$DRIVER_PASSWORD\"}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')
if [ "$HTTP_CODE" -eq 200 ]; then
    if [ -z "$DRIVER_TOKEN" ]; then
        DRIVER_TOKEN=$(extract_token "$BODY")
        DRIVER_ID=$(extract_driver_id "$BODY")
    fi
    print_result 0 "POST /v1/auth/delivery-man/login"
    ((PASSED++))
else
    print_result 1 "POST /v1/auth/delivery-man/login (HTTP $HTTP_CODE)"
    ((FAILED++))
fi

echo ""

# ============================================
# 3. Driver Management
# ============================================
echo "=== Driver Management ==="

# List Drivers
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/drivers?page=1&pageSize=10")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" -eq 200 ]; then
    print_result 0 "GET /drivers"
    ((PASSED++))
else
    print_result 1 "GET /drivers (HTTP $HTTP_CODE)"
    ((FAILED++))
fi

# Get Driver Profile (if token available)
if [ ! -z "$DRIVER_TOKEN" ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/drivers/me" \
      -H "Authorization: Bearer $DRIVER_TOKEN")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" -eq 200 ]; then
        print_result 0 "GET /drivers/me"
        ((PASSED++))
    else
        print_result 1 "GET /drivers/me (HTTP $HTTP_CODE)"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⊘ GET /drivers/me (Skipped - No driver token)${NC}"
fi

echo ""

# ============================================
# 4. Geolocation
# ============================================
echo "=== Geolocation ==="

# Geo IP
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/geo/ip" \
  -H "x-forwarded-for: 192.168.1.1")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" -eq 200 ]; then
    print_result 0 "GET /geo/ip"
    ((PASSED++))
else
    print_result 1 "GET /geo/ip (HTTP $HTTP_CODE)"
    ((FAILED++))
fi

# Geo Reverse
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/geo/reverse?lat=12.9716&lng=77.5946")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" -eq 200 ]; then
    print_result 0 "GET /geo/reverse"
    ((PASSED++))
else
    print_result 1 "GET /geo/reverse (HTTP $HTTP_CODE)"
    ((FAILED++))
fi

echo ""

# ============================================
# 5. Routes
# ============================================
echo "=== Route Optimization ==="

# Optimize Route
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/routes/optimize" \
  -H "Content-Type: application/json" \
  -d '{
    "driverId": "test-driver-id",
    "stops": [
      {"lat": 12.9716, "lng": 77.5946, "orderId": "order-1"},
      {"lat": 12.9558, "lng": 77.6077, "orderId": "order-2"}
    ]
  }')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" -eq 200 ]; then
    print_result 0 "POST /routes/optimize"
    ((PASSED++))
else
    print_result 1 "POST /routes/optimize (HTTP $HTTP_CODE)"
    ((FAILED++))
fi

echo ""

# ============================================
# 6. Webhooks
# ============================================
echo "=== Webhooks ==="

# Test Webhook
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/webhooks/test" \
  -H "Content-Type: application/json")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
    print_result 0 "POST /webhooks/test"
    ((PASSED++))
    
    # Extract order ID for later use
    ORDER_ID=$(echo "$RESPONSE" | sed '$d' | grep -o '"orderId":"[^"]*' | cut -d'"' -f4)
else
    print_result 1 "POST /webhooks/test (HTTP $HTTP_CODE)"
    ((FAILED++))
fi

echo ""

# ============================================
# 7. Orders (if admin token available)
# ============================================
echo "=== Order Management ==="

if [ ! -z "$ADMIN_TOKEN" ]; then
    # List Orders
    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/orders?page=1&pageSize=10" \
      -H "Authorization: Bearer $ADMIN_TOKEN")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" -eq 200 ]; then
        print_result 0 "GET /orders"
        ((PASSED++))
    else
        print_result 1 "GET /orders (HTTP $HTTP_CODE)"
        ((FAILED++))
    fi
    
    # Get Available Orders
    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/orders/available" \
      -H "Authorization: Bearer $ADMIN_TOKEN")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" -eq 200 ]; then
        print_result 0 "GET /orders/available"
        ((PASSED++))
    else
        print_result 1 "GET /orders/available (HTTP $HTTP_CODE)"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⊘ Order endpoints (Skipped - No admin token)${NC}"
fi

# Get Active Orders (if driver token available)
if [ ! -z "$DRIVER_TOKEN" ] && [ ! -z "$DRIVER_ID" ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/orders/driver/$DRIVER_ID/active" \
      -H "Authorization: Bearer $DRIVER_TOKEN")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" -eq 200 ]; then
        print_result 0 "GET /orders/driver/:driverId/active"
        ((PASSED++))
    else
        print_result 1 "GET /orders/driver/:driverId/active (HTTP $HTTP_CODE)"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⊘ GET /orders/driver/:driverId/active (Skipped - No driver token/ID)${NC}"
fi

echo ""

# ============================================
# 8. Tracking
# ============================================
echo "=== Tracking ==="

if [ ! -z "$ORDER_ID" ] && [ ! -z "$DRIVER_ID" ]; then
    # Post Tracking Point
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/track/$ORDER_ID" \
      -H "Content-Type: application/json" \
      -H "idempotency-key: test-$(date +%s)" \
      -d "{
        \"driverId\": \"$DRIVER_ID\",
        \"lat\": 12.9716,
        \"lng\": 77.5946,
        \"speed\": 30.5,
        \"heading\": 45.0
      }")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
        print_result 0 "POST /track/:orderId"
        ((PASSED++))
    else
        print_result 1 "POST /track/:orderId (HTTP $HTTP_CODE)"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⊘ POST /track/:orderId (Skipped - No order ID)${NC}"
fi

echo ""

# ============================================
# 9. Notifications
# ============================================
echo "=== Notifications ==="

# Get Templates
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/notifications/templates")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" -eq 200 ]; then
    print_result 0 "GET /notifications/templates"
    ((PASSED++))
else
    print_result 1 "GET /notifications/templates (HTTP $HTTP_CODE)"
    ((FAILED++))
fi

echo ""

# ============================================
# 10. Delivery Man API (Legacy)
# ============================================
echo "=== Delivery Man API (Legacy) ==="

if [ ! -z "$DRIVER_TOKEN" ]; then
    # All Orders
    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/v1/delivery-man/all-orders?offset=1&limit=10" \
      -H "Authorization: Bearer $DRIVER_TOKEN")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" -eq 200 ]; then
        print_result 0 "GET /v1/delivery-man/all-orders"
        ((PASSED++))
    else
        print_result 1 "GET /v1/delivery-man/all-orders (HTTP $HTTP_CODE)"
        ((FAILED++))
    fi
    
    # Shift
    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/v1/delivery-man/dm-shift" \
      -H "Authorization: Bearer $DRIVER_TOKEN")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" -eq 200 ]; then
        print_result 0 "GET /v1/delivery-man/dm-shift"
        ((PASSED++))
    else
        print_result 1 "GET /v1/delivery-man/dm-shift (HTTP $HTTP_CODE)"
        ((FAILED++))
    fi
    
    # Notifications
    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/v1/delivery-man/notifications?offset=1&limit=10" \
      -H "Authorization: Bearer $DRIVER_TOKEN")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" -eq 200 ]; then
        print_result 0 "GET /v1/delivery-man/notifications"
        ((PASSED++))
    else
        print_result 1 "GET /v1/delivery-man/notifications (HTTP $HTTP_CODE)"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⊘ Delivery Man endpoints (Skipped - No driver token)${NC}"
fi

echo ""

# ============================================
# Summary
# ============================================
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
TOTAL=$((PASSED + FAILED))
if [ $TOTAL -gt 0 ]; then
    PERCENTAGE=$((PASSED * 100 / TOTAL))
    echo "Success Rate: $PERCENTAGE%"
fi
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${YELLOW}Some tests failed. Check the output above for details.${NC}"
    exit 1
fi

