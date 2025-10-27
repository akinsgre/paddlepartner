# 🧪 Paddle Partner Test Suite

A comprehensive smoke test suite for the Paddle Partner application providing immediate feedback on system health and functionality.

## ✅ Test Coverage

### Backend Smoke Tests
- **Express Application**: Server startup and middleware loading
- **Health Endpoints**: API responsiveness validation  
- **Configuration**: Package.json scripts and dependencies verification
- **Environment**: Test environment setup validation

### Frontend Smoke Tests
- **Service Integration**: API service module imports and configuration
- **Router**: Navigation configuration and route imports
- **Authentication State**: localStorage auth token handling
- **Environment**: Module imports and environment access

### End-to-End Smoke Tests
- **API Health**: Live server health check endpoints
- **Critical Endpoints**: Core API endpoint accessibility
- **Security**: CORS configuration and auth protection
- **Configuration**: Environment variables and package configuration

## 🚀 Quick Start

### Run All Smoke Tests
```bash
# Backend only
cd server && npm test tests/simple-smoke.test.js

# Frontend only  
npm test

# Combined report (if servers are running)
./smoke-test.sh
```

### Run Individual Test Suites
```bash
# Backend health check
cd server && npm run test:smoke

# Frontend service tests
npm run test:smoke

# Watch mode for development
cd server && npm run test:watch
npm run test:watch
```

## 📊 Test Results Summary

The smoke tests validate:

✅ **Application Health** - Core services can start and respond  
✅ **Configuration** - Dependencies and scripts are properly configured  
✅ **Module Imports** - All service modules load without errors  
✅ **Environment Setup** - Test environments are properly configured  
✅ **Basic Functionality** - Health endpoints return expected responses  

## 🛠️ Test Infrastructure

### Backend (Jest + Supertest)
- In-memory MongoDB for isolated testing
- Express app testing with supertest
- CommonJS configuration for reliable ES module handling
- Test environment isolation with `.env.test`

### Frontend (Vitest + Vue Test Utils) 
- jsdom environment for browser simulation
- Axios and localStorage mocking
- Service module integration testing
- TypeScript support with proper mocking

### CI/CD Ready
- Tests designed to run in CI environments
- Graceful handling of missing server dependencies  
- Configurable timeouts and environment detection
- Clear pass/fail reporting for automated systems

## 🔧 Development Usage

Use these smoke tests during development to:
- Validate new feature integration
- Catch configuration issues early
- Verify deployment readiness
- Monitor application health

The test suite provides immediate feedback on the most critical aspects of the application without requiring complex setup or external dependencies.

## 📝 Notes

- Database tests use in-memory MongoDB for isolation
- Network tests gracefully handle offline environments  
- Frontend tests use comprehensive mocking for reliability
- All tests designed for fast execution (< 30 seconds total)

This suite serves as a reliable "first line of defense" for application health validation.