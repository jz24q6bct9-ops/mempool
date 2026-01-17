#!/bin/bash
# Test script for Mempool Health Check API
# Usage: ./test-health-api.sh [base_url]
# Default base_url: http://localhost:8999

BASE_URL="${1:-http://localhost:8999}"

echo "======================================"
echo "Mempool Health Check API Test"
echo "======================================"
echo "Base URL: $BASE_URL"
echo ""

# Test connections endpoint
echo "1. Testing /api/v1/health/connections..."
echo "--------------------------------------"
curl -s "${BASE_URL}/api/v1/health/connections" | python3 -m json.tool 2>/dev/null || curl -s "${BASE_URL}/api/v1/health/connections"
echo ""
echo ""

# Test security endpoint
echo "2. Testing /api/v1/health/security..."
echo "--------------------------------------"
curl -s "${BASE_URL}/api/v1/health/security" | python3 -m json.tool 2>/dev/null || curl -s "${BASE_URL}/api/v1/health/security"
echo ""
echo ""

# Test full report endpoint
echo "3. Testing /api/v1/health/full..."
echo "--------------------------------------"
curl -s "${BASE_URL}/api/v1/health/full" | python3 -m json.tool 2>/dev/null || curl -s "${BASE_URL}/api/v1/health/full"
echo ""
echo ""

echo "======================================"
echo "Health Check API Test Complete"
echo "======================================"
