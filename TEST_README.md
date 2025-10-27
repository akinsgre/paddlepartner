# Paddle Partner Test Suite

This directory contains comprehensive integration and smoke tests for the Paddle Partner application.

## Test Structure

### Backend Tests (`server/tests/`)
- **Integration Tests**: Full API endpoint testing with in-memory MongoDB
- **Authentication Flow**: Google OAuth integration testing
- **Data Isolation**: User data security validation
- **Strava Integration**: External API integration testing

### Frontend Tests (`tests/`)
- **Service Integration**: API service module testing
- **Router Configuration**: Navigation and auth guard testing
- **Environment Configuration**: Build and deployment validation

## Running Tests

### Backend Tests
```bash
cd server
npm test                    # Run all backend tests
npm run test:watch         # Watch mode for development
npm run test:coverage      # Generate coverage report
npm run test:smoke         # Run only smoke/health tests
```

### Frontend Tests
```bash
npm test                    # Run all frontend tests
npm run test:watch         # Watch mode for development
npm run test:ui            # Visual test runner
npm run test:smoke         # Run smoke tests
```

### Comprehensive Smoke Tests
```bash
./smoke-test.sh            # Run full application health check
```

## Test Environment

### Backend Test Configuration
- Uses in-memory MongoDB (`mongodb-memory-server`)
- Test environment variables in `.env.test`
- Isolated test database for each test run
- JWT and auth token mocking

### Frontend Test Configuration
- Uses Vitest with jsdom environment
- Vue component testing with Vue Test Utils
- Axios and localStorage mocking
- Service module integration testing

## Smoke Test Coverage

The smoke tests validate:

1. **API Health**: Backend server responsiveness
2. **Database Connection**: MongoDB connectivity and operations
3. **Authentication**: Google OAuth flow and JWT handling
4. **Data Security**: User data isolation patterns
5. **Service Integration**: Frontend-backend communication
6. **Environment Configuration**: Proper setup validation

## CI/CD Integration

These tests are designed to run in CI/CD pipelines and provide:
- Quick feedback on application health
- Regression detection for critical user flows
- Deployment readiness validation

## Test Data

Tests use mock data and temporary databases to ensure:
- No interference with production data
- Consistent test environments
- Fast execution times
- Reliable results

## Debugging Tests

For test debugging:
```bash
# Backend debugging
cd server && npm run test:watch

# Frontend debugging  
npm run test:ui

# Verbose output
npm run test:smoke
```