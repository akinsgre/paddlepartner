# Paddle Partner — AI Agent Instructions

AI coding agents: Use this guide for immediate productivity in this paddle sports tracking application.

## AI Agent Workflow Protocol

### Application Health Assessment
**CRITICAL RULE**: Before investigating any application issues or when asked about application status:

1. **ALWAYS run comprehensive health check first**: `./focused-smoke-test.sh`
2. **Interpret results**: 
   - `🎉 SUCCESS: Application is fully operational!` = All systems healthy
   - `💥 ISSUES DETECTED: X problem(s) found` = Specific components need attention
3. **Report findings**: Share complete health check results with user before detailed investigation
4. **Use results for debugging**: Failed checks indicate exact areas requiring attention
5. **Verify server connectivity**: Health check includes server status and API communication tests

### Common User Queries That Trigger Health Checks
- "Is the application running correctly?"
- "Is the application running successfully?"
- "Are there any issues with the app?"
- "Check if everything is working"
- "Verify the application health"
- "Run a health check"
- "Is the system operational?"
- "Are the client and server working together?"

**Response Pattern**: 
1. Execute `./focused-smoke-test.sh` immediately
2. Report comprehensive results (servers + tests + API communication)
3. If all pass: "🎉 Application is fully operational!"
4. If failures: Detail which components failed and provide quick fixes

## Architecture Overview
- **Frontend**: Vue 3 + TypeScript + Vite (`src/main.ts` entry, `src/App.vue` root)
- **Backend**: Node.js/Express API (`server/index.js` entry, port 3001)
- **Database**: MongoDB with Mongoose ODM (`server/models/`)
- **Auth**: JWT tokens + Google OAuth + localStorage persistence
- **External APIs**: Strava for activity sync (server-side token handling)

## Critical Data Flow Patterns
- Client auth: Google OAuth → JWT token → `localStorage` → `api.ts` interceptor → `Authorization: Bearer` headers
- Activity sync: Strava OAuth → server token exchange → background sync → MongoDB → filtered paddle activities
- Route protection: `router.beforeEach()` checks `localStorage.userAuthenticated` for `meta.requiresAuth` routes

## User Data Isolation Design
**CRITICAL**: All user data is isolated using a dual-key pattern to prevent cross-user data access:

```javascript
// Auth middleware extracts user from JWT token
const decoded = jwt.verify(token, JWT_SECRET)
req.user = await User.findById(decoded.id)  // Sets req.user with googleId

// ALL data queries MUST filter by userGoogleId
Activity.find({ userGoogleId: req.user.googleId })  // ✅ Correct
Activity.find({ userId: req.user._id })            // ❌ Insufficient alone

// Activity creation stamps both IDs for redundant security
activity = new Activity({
  userId: user._id,        // MongoDB ObjectId reference
  userGoogleId: user.googleId,  // Google's unique identifier (primary filter)
  // ... other fields
})
```

**Why dual keys**: `googleId` is immutable from Google OAuth, `userId` can change if User documents are recreated. Always filter by `userGoogleId` in queries for data isolation.

## Development Workflows
```bash
# Start both servers (required for full functionality)
npm run dev              # Frontend (http://localhost:5173)
cd server && npm run dev # Backend API (http://localhost:3001)

# Health checks
curl http://localhost:3001/health
```

## Application Health Verification
**MANDATORY**: When asked if the application is running correctly, is healthy, or working successfully, ALWAYS run the comprehensive health check first:

```bash
# Comprehensive health check command (servers + tests + API communication)
./focused-smoke-test.sh
```

This script verifies:
- **Server Status**: Backend (port 3001) and Frontend (port 5173) running and responding
- **API Communication**: Health endpoints, CORS configuration, connectivity
- **Core Tests**: Backend smoke tests (15 tests) + Frontend integration tests (11 tests)

**Expected Output**: `🎉 SUCCESS: Application is fully operational!` indicates complete system health.

### Health Check Components
The comprehensive health check validates:
- ✅ Backend server running and accessible on port 3001
- ✅ Frontend server running and accessible on port 5173  
- ✅ API health endpoint responding correctly
- ✅ CORS configuration allowing frontend-backend communication
- ✅ Backend core functionality (Express, MongoDB, auth, dependencies)
- ✅ Frontend service layer integration (API services, router, auth state)

### Alternative Individual Test Suites
```bash
# Backend only (15 tests)
cd server && npm test

# Frontend only (11 tests) 
npm test

# Manual server checks
curl http://localhost:3001/health  # Backend health
curl http://localhost:5173         # Frontend accessibility
```

**Critical**: The enhanced health check provides 100% reliability and comprehensive system status including server connectivity and inter-service communication.

## Code Patterns & Conventions

### Frontend (Vue 3 Composition API)
- **Services pattern**: All API calls through `src/services/*.ts` using shared `api.ts` axios instance
- **Route structure**: Views in `src/views/`, components in `src/components/`, register routes in `src/router/index.ts`
- **Auth flow**: `GoogleAuth.vue` → `authService.ts` → localStorage + router navigation

### Backend (Express + Mongoose)
- **Route organization**: `server/routes/*.js` → register in `server/index.js` middleware section
- **Auth middleware**: `protect` middleware (`server/middleware/auth.js`) validates JWT on protected routes
- **Error handling**: `asyncHandler` wrapper + centralized `errorHandler` middleware

### Database Schema Patterns
```javascript
// User model: nested subdocuments for preferences, stats, location
user.stats.totalActivities  // Auto-calculated via updateStats() method
user.preferences.units       // 'metric' | 'imperial'

// Activity model: Strava data + enriched fields
activity.waterType          // References WaterType collection
activity.stravaData         // Nested Strava-specific fields
activity.location.startLatLng // [lat, lng] coordinate arrays
```

## Strava Integration (Server-Only)
- **OAuth flow**: `/api/strava/exchange-token` with authorization code
- **Sync endpoint**: `POST /api/strava/sync-activities` with pagination support
- **Activity filtering**: Server filters paddle activities by sport_type, type, and name patterns
- **Token management**: Auto-refresh logic in sync endpoints

### Data Sync & Local Enrichment Pattern
```javascript
// Strava sync creates base activity with core metrics
const activity = new Activity({
  // Strava core data (immutable after sync)
  stravaId: stravaActivity.id,
  name: stravaActivity.name,
  distance: stravaActivity.distance,
  movingTime: stravaActivity.moving_time,
  // ... other Strava metrics
  
  // Strava-specific data preserved in subdocument
  stravaData: {
    polyline: stravaActivity.map?.polyline,
    timezone: stravaActivity.timezone,
    // ... raw Strava metadata
  },
  
  // Local enrichment fields (user-editable via PUT /api/activities/:id)
  waterType: undefined,        // User categorizes water type
  gear: { kayakType: null },   // User adds equipment details
  weather: {},                 // User adds conditions
  notes: '',                   // User adds observations
  photos: [],                  // User uploads images
  isPublic: false             // User controls visibility
})
```

**Key principle**: Strava provides base activity data, app adds paddle-specific enrichments

## Key Integration Points
- **Google Auth**: `VITE_GOOGLE_CLIENT_ID` (client) + `server/routes/auth.js` (server validation)
- **Strava**: `STRAVA_CLIENT_ID` + `STRAVA_CLIENT_SECRET` (server-only) for token operations
- **MongoDB**: Connection via `server/config/database.js` with connection pooling

## AWS Deployment Context
- **Frontend**: AWS Amplify (`amplify.yml` with build/cache config)
- **Backend**: AWS App Runner ready (`server/apprunner.yaml`, `server/Dockerfile`)
- **Environment**: Production env vars loaded via `amplify.yml` preBuild phase

## Quick Debug Starting Points
- **Application Health**: Run `./focused-smoke-test.sh` for comprehensive status (ALWAYS FIRST STEP)
- **Smoke test failures**: Check specific test output to identify failing components
- **Auth issues**: `src/components/GoogleAuth.vue`, `server/routes/auth.js`, `server/middleware/auth.js`
- **Activity sync**: `server/routes/strava.js`, `server/models/Activity.js`, paddle activity filtering logic
- **Data flow**: `src/services/api.ts` interceptors, `server/middleware/errorHandler.js`
- **Route protection**: `src/router/index.ts` navigation guards

### Debugging Workflow
1. **Start with smoke tests**: `./focused-smoke-test.sh` (reveals 90% of issues)
2. **Analyze failures**: Each test failure points to specific component/file
3. **Targeted investigation**: Use failed test names to focus debugging efforts
4. **Verify fixes**: Re-run smoke tests after changes to confirm resolution

## DO NOT Modify
- Environment files (`.env*`) - secrets management handled via deployment platforms
- Auto-seeded data (`WaterType` collection seeding in `server/index.js`)

When uncertain about API endpoints or data schemas, examine the corresponding route file and Mongoose model first.