#!/bin/bash

echo "======================================"
echo "Smart Path Generation Test"
echo "======================================"
echo ""

DRIVER_ID="${1:-213b90c8-3fe7-4104-b5f3-0c98008a4ee1}"
BASE_URL="http://localhost:3000/api"

echo "Driver ID: $DRIVER_ID"
echo "Base URL: $BASE_URL"
echo ""
echo "This will:"
echo "1. Check existing Smart Paths"
echo "2. Generate new Smart Paths"
echo "3. Verify they were created"
echo ""

echo "Step 1: Check existing Smart Paths"
echo "---------------------------------------------------"
EXISTING=$(curl -s "$BASE_URL/smart-path/driver/$DRIVER_ID")
EXISTING_COUNT=$(echo "$EXISTING" | jq 'length // 0')
echo "Found $EXISTING_COUNT existing Smart Path(s)"
echo ""

echo "Step 2: Generate Smart Paths"
echo "---------------------------------------------------"
echo "Calling POST /api/smart-path/generate..."
echo ""

GENERATE_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{\"driverId\": \"$DRIVER_ID\"}" \
  "$BASE_URL/smart-path/generate")

echo "Response:"
echo "$GENERATE_RESPONSE" | jq .

GENERATED_COUNT=$(echo "$GENERATE_RESPONSE" | jq 'if type == "array" then length else 0 end')

echo ""
echo "Step 3: Verify Smart Paths were created"
echo "---------------------------------------------------"
if [ "$GENERATED_COUNT" -gt 0 ]; then
  echo "✅ Successfully generated $GENERATED_COUNT Smart Path(s)"
  echo ""
  
  # Get the generated Smart Paths
  VERIFY=$(curl -s "$BASE_URL/smart-path/driver/$DRIVER_ID")
  VERIFY_COUNT=$(echo "$VERIFY" | jq 'length // 0')
  echo "Verified: Found $VERIFY_COUNT Smart Path(s) in database"
  echo ""
  
  if [ "$VERIFY_COUNT" -gt 0 ]; then
    echo "Smart Path Details:"
    echo "$VERIFY" | jq '.[0] | {id, driverId, orderIds, pickupLocation, routePlanId, status, targetDate}'
  fi
else
  echo "⚠️  No Smart Paths generated"
  echo ""
  echo "Check backend logs for details. Common reasons:"
  echo "  - No subscription orders for today"
  echo "  - Orders not assigned to driver"
  echo "  - Orders don't have valid pickup/dropoff locations"
  echo "  - Driver has no location set"
fi

echo ""
echo "======================================"
echo "Test Complete"
echo "======================================"
echo ""
echo "💡 Tip: Check backend console logs for detailed [SmartPath] messages"
