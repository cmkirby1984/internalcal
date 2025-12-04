#!/bin/bash

# Deployment Verification Script
# Usage: ./scripts/verify-deployment.sh <backend-url> <frontend-url>
#
# Example:
#   ./scripts/verify-deployment.sh https://your-backend.up.railway.app https://your-app.vercel.app

set -e

BACKEND_URL="${1:-http://localhost:3001}"
FRONTEND_URL="${2:-http://localhost:3000}"

echo "========================================"
echo "Deployment Verification Script"
echo "========================================"
echo ""
echo "Backend URL: $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

pass() {
    echo -e "${GREEN}✓ PASS${NC}: $1"
}

fail() {
    echo -e "${RED}✗ FAIL${NC}: $1"
    FAILED=1
}

warn() {
    echo -e "${YELLOW}⚠ WARN${NC}: $1"
}

FAILED=0

echo "----------------------------------------"
echo "Backend Health Checks"
echo "----------------------------------------"

# 1. Liveness check
echo -n "Checking liveness endpoint... "
LIVENESS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/health/live" 2>/dev/null || echo "000")
if [ "$LIVENESS" = "200" ]; then
    pass "Liveness endpoint returned 200"
else
    fail "Liveness endpoint returned $LIVENESS (expected 200)"
fi

# 2. Readiness check
echo -n "Checking readiness endpoint... "
READINESS_RESPONSE=$(curl -s "$BACKEND_URL/health/ready" 2>/dev/null || echo '{"ready":false}')
READY=$(echo "$READINESS_RESPONSE" | grep -o '"ready":true' || echo "")
if [ -n "$READY" ]; then
    pass "Database connection is ready"
else
    fail "Database not ready: $READINESS_RESPONSE"
fi

# 3. Full health check
echo -n "Checking full health endpoint... "
HEALTH_RESPONSE=$(curl -s "$BACKEND_URL/health" 2>/dev/null || echo '{"status":"unhealthy"}')
HEALTH_STATUS=$(echo "$HEALTH_RESPONSE" | grep -o '"status":"healthy"' || echo "")
if [ -n "$HEALTH_STATUS" ]; then
    pass "Full health check passed"
else
    warn "Health check returned: $HEALTH_RESPONSE"
fi

# 4. Metrics endpoint
echo -n "Checking metrics endpoint... "
METRICS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/metrics" 2>/dev/null || echo "000")
if [ "$METRICS" = "200" ]; then
    pass "Metrics endpoint accessible"
else
    warn "Metrics endpoint returned $METRICS"
fi

# 5. Swagger docs
echo -n "Checking Swagger docs... "
SWAGGER=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/docs" 2>/dev/null || echo "000")
if [ "$SWAGGER" = "200" ] || [ "$SWAGGER" = "301" ] || [ "$SWAGGER" = "302" ]; then
    pass "Swagger docs accessible"
else
    warn "Swagger docs returned $SWAGGER"
fi

echo ""
echo "----------------------------------------"
echo "API Endpoint Checks"
echo "----------------------------------------"

# 6. Auth login endpoint exists
echo -n "Checking auth endpoint... "
AUTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BACKEND_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}' 2>/dev/null || echo "000")
if [ "$AUTH_RESPONSE" = "401" ] || [ "$AUTH_RESPONSE" = "400" ]; then
    pass "Auth endpoint responds (returned $AUTH_RESPONSE for invalid creds)"
elif [ "$AUTH_RESPONSE" = "200" ]; then
    warn "Auth endpoint accepted test credentials (check if intended)"
else
    fail "Auth endpoint returned unexpected $AUTH_RESPONSE"
fi

# 7. Tasks endpoint (should require auth)
echo -n "Checking tasks endpoint auth... "
TASKS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/tasks" 2>/dev/null || echo "000")
if [ "$TASKS_RESPONSE" = "401" ]; then
    pass "Tasks endpoint requires authentication"
elif [ "$TASKS_RESPONSE" = "200" ]; then
    warn "Tasks endpoint is public (check if intended)"
else
    fail "Tasks endpoint returned $TASKS_RESPONSE"
fi

echo ""
echo "----------------------------------------"
echo "Frontend Checks"
echo "----------------------------------------"

# 8. Frontend loads
echo -n "Checking frontend loads... "
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" 2>/dev/null || echo "000")
if [ "$FRONTEND_RESPONSE" = "200" ] || [ "$FRONTEND_RESPONSE" = "307" ] || [ "$FRONTEND_RESPONSE" = "308" ]; then
    pass "Frontend loads (HTTP $FRONTEND_RESPONSE)"
else
    fail "Frontend returned $FRONTEND_RESPONSE"
fi

# 9. Login page accessible
echo -n "Checking login page... "
LOGIN_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL/login" 2>/dev/null || echo "000")
if [ "$LOGIN_RESPONSE" = "200" ]; then
    pass "Login page accessible"
else
    fail "Login page returned $LOGIN_RESPONSE"
fi

echo ""
echo "========================================"
if [ "$FAILED" = "1" ]; then
    echo -e "${RED}DEPLOYMENT VERIFICATION FAILED${NC}"
    echo "Please check the failed items above."
    exit 1
else
    echo -e "${GREEN}DEPLOYMENT VERIFICATION PASSED${NC}"
    echo "All critical checks passed!"
    exit 0
fi

