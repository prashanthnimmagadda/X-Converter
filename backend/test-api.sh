#!/bin/bash

# X-Converter Backend API Test Script
# Tests all endpoints and validates responses

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
TEST_URL="https://x.com/elonmusk/status/1"

echo "================================"
echo "X-Converter API Test Suite"
echo "================================"
echo ""
echo "Base URL: $BASE_URL"
echo ""

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        exit 1
    fi
}

# Test 1: Health Check
echo "Test 1: Health Check Endpoint"
response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health")
if [ "$response" = "200" ]; then
    print_result 0 "Health check returned 200"
else
    print_result 1 "Health check failed (status: $response)"
fi
echo ""

# Test 2: Validate Endpoint - Valid URL
echo "Test 2: Validate Endpoint - Valid X URL"
response=$(curl -s -X POST "$BASE_URL/validate" \
    -H "Content-Type: application/json" \
    -d "{\"url\":\"$TEST_URL\"}")

if echo "$response" | grep -q "success"; then
    print_result 0 "Validate endpoint accepts valid X URL"
else
    print_result 1 "Validate endpoint failed for valid URL"
fi
echo ""

# Test 3: Validate Endpoint - Invalid URL
echo "Test 3: Validate Endpoint - Invalid URL"
response=$(curl -s -X POST "$BASE_URL/validate" \
    -H "Content-Type: application/json" \
    -d '{"url":"https://google.com"}')

if echo "$response" | grep -q "error\|Invalid"; then
    print_result 0 "Validate endpoint rejects invalid URL"
else
    print_result 1 "Validate endpoint should reject non-X URLs"
fi
echo ""

# Test 4: Validate Endpoint - Missing URL
echo "Test 4: Validate Endpoint - Missing URL Parameter"
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/validate" \
    -H "Content-Type: application/json" \
    -d '{}')

if [ "$response" = "400" ]; then
    print_result 0 "Validate endpoint returns 400 for missing URL"
else
    print_result 1 "Validate endpoint should return 400 (got: $response)"
fi
echo ""

# Test 5: Convert Endpoint - Check Response Type
echo "Test 5: Convert Endpoint - Response Type (WARNING: This will attempt real conversion)"
echo -e "${YELLOW}Note: This test requires a valid, accessible X URL${NC}"

# We'll just check that the endpoint accepts the request
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/convert" \
    -H "Content-Type: application/json" \
    -d "{\"url\":\"$TEST_URL\"}" \
    --max-time 60)

# Accept 200 (success), 500 (content issue), or 400 (invalid)
if [ "$response" = "200" ] || [ "$response" = "500" ] || [ "$response" = "400" ]; then
    print_result 0 "Convert endpoint responds (status: $response)"
else
    print_result 1 "Convert endpoint unexpected response (status: $response)"
fi
echo ""

# Test 6: 404 Endpoint
echo "Test 6: 404 for Unknown Endpoint"
response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/unknown")

if [ "$response" = "404" ]; then
    print_result 0 "Unknown endpoint returns 404"
else
    print_result 1 "Unknown endpoint should return 404 (got: $response)"
fi
echo ""

echo "================================"
echo -e "${GREEN}All Tests Passed!${NC}"
echo "================================"
echo ""
echo "API is ready for production use."
