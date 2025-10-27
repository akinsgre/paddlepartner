#!/bin/bash

# Paddle Partner Application Smoke Tests
# This script runs comprehensive smoke tests for both frontend and backend

echo "🧪 Starting Paddle Partner Smoke Tests..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        return 1
    fi
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Change to project root
cd "$(dirname "$0")"

print_info "Running Backend Smoke Tests..."

# Backend Tests
cd server
npm test -- --testNamePattern="health|smoke" --silent
BACKEND_STATUS=$?
cd ..

print_status $BACKEND_STATUS "Backend API Health Check"

# Frontend Tests
print_info "Running Frontend Smoke Tests..."
npm test
FRONTEND_STATUS=$?

print_status $FRONTEND_STATUS "Frontend Service Integration"

# API Health Check (if servers are running)
print_info "Checking API Health Endpoint..."
curl -f -s http://localhost:3001/health > /dev/null 2>&1
API_HEALTH=$?

if [ $API_HEALTH -eq 0 ]; then
    print_status 0 "API Health Endpoint Responsive"
else
    print_info "API Server not running (expected in CI/test environment)"
fi

# Frontend Dev Server Check (if running)
print_info "Checking Frontend Dev Server..."
curl -f -s http://localhost:5174/ > /dev/null 2>&1
FRONTEND_HEALTH=$?

if [ $FRONTEND_HEALTH -eq 0 ]; then
    print_status 0 "Frontend Dev Server Responsive"
else
    print_info "Frontend Dev Server not running (expected in CI/test environment)"
fi

# Overall Status
echo ""
print_info "Smoke Test Summary:"

if [ $BACKEND_STATUS -eq 0 ] && [ $FRONTEND_STATUS -eq 0 ]; then
    echo -e "${GREEN}🎉 All smoke tests passed! Application is healthy.${NC}"
    exit 0
else
    echo -e "${RED}💥 Some smoke tests failed. Check the output above.${NC}"
    exit 1
fi