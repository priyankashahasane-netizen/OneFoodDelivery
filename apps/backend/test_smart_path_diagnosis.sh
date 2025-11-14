#!/bin/bash

echo "======================================"
echo "Smart Path Generation Diagnosis"
echo "======================================"
echo ""

DRIVER_ID="${1:-213b90c8-3fe7-4104-b5f3-0c98008a4ee1}"
BASE_URL="http://localhost:3000/api"

echo "Driver ID: $DRIVER_ID"
echo "Base URL: $BASE_URL"
echo ""

echo "Step 1: Check if Smart Paths table exists (via API)"
echo "---------------------------------------------------"
GET_EXISTING=$(curl -s "$BASE_URL/smart-path/driver/$DRIVER_ID")
EXISTING_COUNT=$(echo "$GET_EXISTING" | jq 'length // 0')
echo "Existing Smart Paths: $EXISTING_COUNT"
echo ""

echo "Step 2: Check active orders for driver"
echo "---------------------------------------------------"
ACTIVE_ORDERS=$(curl -s "$BASE_URL/orders/driver/$DRIVER_ID/active")
TOTAL_ORDERS=$(echo "$ACTIVE_ORDERS" | jq 'length // 0')
echo "Total active orders: $TOTAL_ORDERS"
echo ""

if [ "$TOTAL_ORDERS" -gt 0 ]; then
  echo "Step 3: Analyze orders"
  echo "---------------------------------------------------"
  
  # Count subscription orders
  SUBSCRIPTION_COUNT=$(echo "$ACTIVE_ORDERS" | jq '[.[] | select(.orderType == "subscription")] | length')
  echo "Subscription orders: $SUBSCRIPTION_COUNT"
  
  # Count orders created today
  TODAY=$(date +%Y-%m-%d)
  TODAY_COUNT=$(echo "$ACTIVE_ORDERS" | jq --arg today "$TODAY" '[.[] | select(.createdAt | startswith($today))] | length')
  echo "Orders created today ($TODAY): $TODAY_COUNT"
  
  # Count subscription orders created today
  SUBSCRIPTION_TODAY=$(echo "$ACTIVE_ORDERS" | jq --arg today "$TODAY" '[.[] | select(.orderType == "subscription" and (.createdAt | startswith($today)))] | length')
  echo "Subscription orders created today: $SUBSCRIPTION_TODAY"
  
  # Check for valid pickup locations
  VALID_PICKUP=$(echo "$ACTIVE_ORDERS" | jq '[.[] | select(.pickup != null and .pickup.lat != null and .pickup.lng != null)] | length')
  echo "Orders with valid pickup locations: $VALID_PICKUP"
  
  echo ""
  echo "Sample subscription order (if any):"
  echo "$ACTIVE_ORDERS" | jq '[.[] | select(.orderType == "subscription")][0]' 2>/dev/null || echo "  None found"
  echo ""
  
  echo "Step 4: Generate Smart Path"
  echo "---------------------------------------------------"
  GENERATE_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{\"driverId\": \"$DRIVER_ID\"}" \
    "$BASE_URL/smart-path/generate")
  
  GENERATED_COUNT=$(echo "$GENERATE_RESPONSE" | jq 'if type == "array" then length else 0 end')
  
  if [ "$GENERATED_COUNT" -gt 0 ]; then
    echo "✅ Successfully generated $GENERATED_COUNT Smart Path(s)"
    echo ""
    echo "Generated Smart Paths:"
    echo "$GENERATE_RESPONSE" | jq '.'
  else
    echo "⚠️  No Smart Paths generated"
    echo ""
    echo "Response:"
    echo "$GENERATE_RESPONSE" | jq '.'
    echo ""
    echo "Possible reasons:"
    echo "  1. No subscription orders created today"
    echo "  2. Orders don't have valid pickup locations"
    echo "  3. Orders are not active (delivered/canceled)"
    echo "  4. Orders are not assigned to this driver"
  fi
else
  echo "⚠️  No active orders found for this driver"
  echo ""
  echo "Response:"
  echo "$ACTIVE_ORDERS" | jq '.'
fi

echo ""
echo "======================================"
echo "Diagnosis Complete"
echo "======================================"
