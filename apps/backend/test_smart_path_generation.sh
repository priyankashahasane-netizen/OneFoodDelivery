#!/bin/bash

echo "======================================"
echo "Testing Smart Path Generation"
echo "======================================"
echo ""

DRIVER_ID="213b90c8-3fe7-4104-b5f3-0c98008a4ee1" # Replace with your driver ID
BASE_URL="http://localhost:3000/api"

echo "1. Checking if Smart Paths table exists..."
echo "   (This requires database access - check backend logs)"
echo ""

echo "2. Testing Smart Path Generation"
echo "   Driver ID: $DRIVER_ID"
echo ""

GENERATE_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{\"driverId\": \"$DRIVER_ID\"}" \
  "$BASE_URL/smart-path/generate")

echo "Response:"
echo "$GENERATE_RESPONSE" | jq .
echo ""

SMART_PATH_COUNT=$(echo "$GENERATE_RESPONSE" | jq 'length // 0')

if [ "$SMART_PATH_COUNT" -eq 0 ]; then
  echo "⚠️  No Smart Paths generated. Possible reasons:"
  echo "   1. No subscription orders for today"
  echo "   2. No orders assigned to this driver"
  echo "   3. Orders don't have valid pickup locations"
  echo "   4. Orders are not active (delivered/canceled)"
  echo ""
  echo "3. Checking active orders for this driver..."
  echo ""
  
  ACTIVE_ORDERS=$(curl -s "$BASE_URL/orders/driver/$DRIVER_ID/active")
  ORDER_COUNT=$(echo "$ACTIVE_ORDERS" | jq 'length // 0')
  echo "   Found $ORDER_COUNT active orders"
  echo ""
  
  if [ "$ORDER_COUNT" -gt 0 ]; then
    echo "   Checking for subscription orders..."
    SUBSCRIPTION_COUNT=$(echo "$ACTIVE_ORDERS" | jq '[.[] | select(.orderType == "subscription")] | length')
    echo "   Found $SUBSCRIPTION_COUNT subscription orders"
    echo ""
    
    if [ "$SUBSCRIPTION_COUNT" -gt 0 ]; then
      echo "   Sample subscription order:"
      echo "$ACTIVE_ORDERS" | jq '[.[] | select(.orderType == "subscription")][0] | {id, orderType, status, createdAt, pickup}'
    fi
  fi
else
  echo "✅ Generated $SMART_PATH_COUNT Smart Path(s)"
  echo ""
  echo "3. Verifying Smart Paths in database..."
  echo ""
  
  GET_RESPONSE=$(curl -s "$BASE_URL/smart-path/driver/$DRIVER_ID")
  echo "Retrieved Smart Paths:"
  echo "$GET_RESPONSE" | jq .
fi

echo ""
echo "======================================"
echo "Test Complete"
echo "======================================"
