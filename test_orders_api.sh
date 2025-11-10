#!/bin/bash

echo "======================================"
echo "Testing Orders API"
echo "======================================"
echo ""

DRIVER_ID="213b90c8-3fe7-4104-b5f3-0c98008a4ee1"

echo "1. Fetching active orders from API..."
echo "   GET /api/orders/driver/$DRIVER_ID/active"
echo ""

RESPONSE=$(curl -s "http://localhost:3000/api/orders/driver/$DRIVER_ID/active")

echo "2. Counting orders by status..."
echo ""
echo "$RESPONSE" | jq '[.[] | .order_status] | group_by(.) | map({status: .[0], count: length}) | sort_by(.status)'

echo ""
echo "3. Orders that SHOULD appear in 'Currently Active' page:"
echo "   (statuses: accepted, confirmed, processing, handover, picked_up, in_transit)"
echo ""

VALID_COUNT=$(echo "$RESPONSE" | jq '[.[] | select(.order_status == "accepted" or .order_status == "confirmed" or .order_status == "processing" or .order_status == "handover" or .order_status == "picked_up" or .order_status == "in_transit")] | length')

echo "   Total orders: $VALID_COUNT"
echo ""

echo "4. Sample orders that should be visible:"
echo ""
echo "$RESPONSE" | jq '[.[] | select(.order_status == "accepted" or .order_status == "confirmed" or .order_status == "processing" or .order_status == "handover" or .order_status == "picked_up" or .order_status == "in_transit")] | .[0:5] | .[] | {id, status: .order_status, restaurant: .restaurant_name}'

echo ""
echo "======================================"
echo "Expected behavior in app:"
echo "======================================"
echo "- 'All' tab should show: $VALID_COUNT orders"
echo "- Each status tab should filter to show only that status"
echo "- Orders with status 'assigned' should NOT appear (they're in Order Request page)"
echo ""
