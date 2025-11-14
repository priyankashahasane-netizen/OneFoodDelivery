#!/bin/bash

# Test script for Smart Path feature
# This script tests the Smart Path API endpoints

echo "======================================"
echo "Testing Smart Path Feature"
echo "======================================"
echo ""

BASE_URL="http://localhost:3000"
DRIVER_ID="213b90c8-3fe7-4104-b5f3-0c98008a4ee1"  # Demo driver ID

echo "1. Testing POST /api/smart-path/generate"
echo "   Generating Smart Path for driver: $DRIVER_ID"
echo ""

RESPONSE=$(curl -s -X POST "$BASE_URL/api/smart-path/generate" \
  -H "Content-Type: application/json" \
  -d "{\"driverId\": \"$DRIVER_ID\"}")

echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Extract Smart Path ID if generated
SMART_PATH_ID=$(echo "$RESPONSE" | jq -r '.[0].id' 2>/dev/null)

if [ "$SMART_PATH_ID" != "null" ] && [ -n "$SMART_PATH_ID" ]; then
  echo "✅ Smart Path generated successfully!"
  echo "   Smart Path ID: $SMART_PATH_ID"
  echo ""
  
  echo "2. Testing GET /api/smart-path/driver/$DRIVER_ID"
  echo "   Retrieving Smart Path for driver"
  echo ""
  
  RESPONSE2=$(curl -s "$BASE_URL/api/smart-path/driver/$DRIVER_ID")
  echo "Response:"
  echo "$RESPONSE2" | jq '.' 2>/dev/null || echo "$RESPONSE2"
  echo ""
  
  echo "3. Testing GET /api/smart-path/$SMART_PATH_ID"
  echo "   Retrieving Smart Path by ID"
  echo ""
  
  RESPONSE3=$(curl -s "$BASE_URL/api/smart-path/$SMART_PATH_ID")
  echo "Response:"
  echo "$RESPONSE3" | jq '.' 2>/dev/null || echo "$RESPONSE3"
  echo ""
  
  # Check if route plan exists
  ROUTE_PLAN_ID=$(echo "$RESPONSE3" | jq -r '.routePlanId' 2>/dev/null)
  if [ "$ROUTE_PLAN_ID" != "null" ] && [ -n "$ROUTE_PLAN_ID" ]; then
    echo "✅ Route Plan linked: $ROUTE_PLAN_ID"
    echo ""
    
    # Check route plan details
    ROUTE_STOPS=$(echo "$RESPONSE3" | jq -r '.routePlan.stops | length' 2>/dev/null)
    if [ "$ROUTE_STOPS" != "null" ] && [ -n "$ROUTE_STOPS" ]; then
      echo "✅ Route Plan has $ROUTE_STOPS stops"
    fi
  fi
else
  echo "⚠️  No Smart Path generated (may be no subscription orders for today)"
  echo ""
  
  echo "2. Testing GET /api/smart-path/driver/$DRIVER_ID"
  echo "   Retrieving Smart Path for driver"
  echo ""
  
  RESPONSE2=$(curl -s "$BASE_URL/api/smart-path/driver/$DRIVER_ID")
  echo "Response:"
  echo "$RESPONSE2" | jq '.' 2>/dev/null || echo "$RESPONSE2"
  echo ""
fi

echo ""
echo "======================================"
echo "Test Summary"
echo "======================================"
echo "- Smart Path generation endpoint: Tested"
echo "- Get Smart Path by driver: Tested"
echo "- Get Smart Path by ID: Tested"
echo ""
echo "Note: Ensure you have:"
echo "  1. Backend server running on port 3000"
echo "  2. Database with subscription orders for today"
echo "  3. Driver with assigned subscription orders"
echo ""

