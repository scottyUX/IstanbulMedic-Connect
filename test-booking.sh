#!/bin/bash

# Test booking endpoint
echo "🧪 Testing Cal.com Booking Endpoint..."
echo ""

# Get tomorrow's date in YYYY-MM-DD format
TOMORROW=$(date -v+1d +%Y-%m-%d 2>/dev/null || date -d "+1 day" +%Y-%m-%d)

# Test data
TEST_DATA=$(cat <<JSON
{
  "date": "$TOMORROW",
  "time": "10:00 AM",
  "name": "Test User",
  "email": "test@example.com",
  "phone": "+1234567890"
}
JSON
)

echo "📅 Test Date: $TOMORROW at 10:00 AM"
echo "📧 Test Email: test@example.com"
echo ""
echo "📤 Sending request to /api/cal-com/booking..."
echo ""

curl -X POST http://localhost:3000/api/cal-com/booking \
  -H "Content-Type: application/json" \
  -d "$TEST_DATA" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || curl -X POST http://localhost:3000/api/cal-com/booking \
  -H "Content-Type: application/json" \
  -d "$TEST_DATA" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s

echo ""
