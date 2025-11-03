#!/bin/bash

# Auth System Test Script
# Tests the authentication system with demo user credentials

set -e

echo "🧪 Testing Authentication System"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend is running
echo "1. Checking backend availability..."
BACKEND_URL="http://localhost:3000"
if curl -s "$BACKEND_URL/api/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running${NC}"
    BACKEND_AVAILABLE=true
else
    echo -e "${YELLOW}⚠️  Backend is not running at $BACKEND_URL${NC}"
    echo "   Please start the backend first:"
    echo "   cd apps/backend && npm run start:dev"
    BACKEND_AVAILABLE=false
fi
echo ""

# Demo credentials
DEMO_PHONE="+919975008124"
DEMO_PHONE_ALT="9975008124"
DEMO_PASSWORD="Pri@0110"
DEFAULT_PASSWORD="123456"

if [ "$BACKEND_AVAILABLE" = true ]; then
    echo "2. Testing login endpoint..."
    
    # Test with full phone number
    echo "   Testing login with: $DEMO_PHONE"
    LOGIN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/v1/auth/delivery-man/login" \
        -H "Content-Type: application/json" \
        -d "{\"phone\":\"$DEMO_PHONE\",\"password\":\"$DEMO_PASSWORD\"}")
    
    if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
        echo -e "${GREEN}   ✅ Login successful with +919975008124${NC}"
        TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
        echo "   Token: ${TOKEN:0:50}..."
    else
        echo -e "${RED}   ❌ Login failed with +919975008124${NC}"
        echo "   Response: $LOGIN_RESPONSE"
    fi
    echo ""
    
    # Test with phone without country code
    echo "   Testing login with: $DEMO_PHONE_ALT"
    LOGIN_RESPONSE_ALT=$(curl -s -X POST "$BACKEND_URL/api/v1/auth/delivery-man/login" \
        -H "Content-Type: application/json" \
        -d "{\"phone\":\"$DEMO_PHONE_ALT\",\"password\":\"$DEMO_PASSWORD\"}")
    
    if echo "$LOGIN_RESPONSE_ALT" | grep -q "access_token"; then
        echo -e "${GREEN}   ✅ Login successful with 9975008124${NC}"
    else
        echo -e "${RED}   ❌ Login failed with 9975008124${NC}"
        echo "   Response: $LOGIN_RESPONSE_ALT"
    fi
    echo ""
    
    # Test with wrong password
    echo "   Testing with wrong password..."
    WRONG_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/v1/auth/delivery-man/login" \
        -H "Content-Type: application/json" \
        -d "{\"phone\":\"$DEMO_PHONE\",\"password\":\"WrongPassword\"}")
    
    if echo "$WRONG_RESPONSE" | grep -q "Invalid"; then
        echo -e "${GREEN}   ✅ Correctly rejected wrong password${NC}"
    else
        echo -e "${YELLOW}   ⚠️  Unexpected response for wrong password${NC}"
        echo "   Response: $WRONG_RESPONSE"
    fi
    echo ""
fi

echo "3. Checking Flutter app routes..."
if [ -f "lib/helper/route_helper.dart" ]; then
    if grep -q "getSignInRoute" lib/helper/route_helper.dart; then
        echo -e "${GREEN}✅ Sign-in route is defined${NC}"
    else
        echo -e "${RED}❌ Sign-in route not found${NC}"
    fi
    
    if grep -q "SignInViewScreen" lib/helper/route_helper.dart; then
        echo -e "${GREEN}✅ Sign-in screen is registered${NC}"
    else
        echo -e "${RED}❌ Sign-in screen not registered${NC}"
    fi
else
    echo -e "${RED}❌ route_helper.dart not found${NC}"
fi
echo ""

echo "4. Checking auth controller..."
if [ -f "lib/feature/auth/controllers/auth_controller.dart" ]; then
    if grep -q "login" lib/feature/auth/controllers/auth_controller.dart; then
        echo -e "${GREEN}✅ Login method exists in AuthController${NC}"
    else
        echo -e "${RED}❌ Login method not found${NC}"
    fi
    
    if grep -q "getUserToken" lib/feature/auth/controllers/auth_controller.dart; then
        echo -e "${GREEN}✅ Token management exists${NC}"
    else
        echo -e "${RED}❌ Token management not found${NC}"
    fi
else
    echo -e "${RED}❌ AuthController not found${NC}"
fi
echo ""

echo "5. Demo User Credentials Summary:"
echo "   Phone: $DEMO_PHONE (or $DEMO_PHONE_ALT)"
echo "   Password: $DEMO_PASSWORD"
echo ""

echo "================================"
echo "📝 Next Steps:"
echo ""
if [ "$BACKEND_AVAILABLE" = false ]; then
    echo "1. Start the backend:"
    echo "   cd apps/backend"
    echo "   npm run start:dev"
    echo ""
    echo "2. Ensure demo user exists (run seed script):"
    echo "   cd apps/backend"
    echo "   npm run seed"
    echo ""
fi
echo "3. Run Flutter app:"
echo "   flutter run"
echo ""
echo "4. The app should show login page if user is not logged in"
echo ""
echo "5. Use demo credentials to login:"
echo "   Phone: $DEMO_PHONE_ALT"
echo "   Password: $DEMO_PASSWORD"
echo ""

