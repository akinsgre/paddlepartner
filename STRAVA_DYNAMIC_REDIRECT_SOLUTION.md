# Dynamic Strava OAuth Redirect URI Solution

This implementation provides a solution to avoid having to update the Strava API callback domain for development vs production environments by using dynamic redirect URIs.

## Problem Solved

Previously, you had to manually update the Strava API application's callback domain settings when switching between:
- Development: `localhost:5173`
- Staging: `staging.paddlepartner.com`
- Production: `paddlepartner.com`

## Solution Overview

**Single Application with Dynamic Redirects**: The system now:

1. **Automatically detects the current environment** based on hostname
2. **Dynamically generates appropriate redirect URIs** for OAuth flows
3. **Validates redirect URIs** on the backend for security
4. **Uses environment-specific configurations** for optimal settings

## How It Works

### 1. Environment Detection
```typescript
// Automatically detects environment
const environment = detectEnvironment() // 'development' | 'staging' | 'production'

// Based on window.location.hostname:
// localhost/127.0.0.1 → development
// *.staging.*, *.dev.*, *.test.* → staging  
// everything else → production
```

### 2. Dynamic Redirect URI Generation
```typescript
// Automatically generates correct redirect URI
const redirectUri = getStravaRedirectUri()

// Examples:
// Development: http://localhost:5173/activities
// Staging: https://staging.paddlepartner.com/activities
// Production: https://paddlepartner.com/activities
```

### 3. Backend Validation
```javascript
// Server validates redirect URIs for security
function isValidRedirectUri(redirectUri) {
  // Checks against environment-specific allowed origins
  // Validates protocol, hostname, and path
}
```

## Files Modified

### Frontend
- `src/services/stravaService.ts` - Enhanced with dynamic redirect URI generation
- `src/config/environment.ts` - New centralized environment configuration

### Backend  
- `server/routes/strava.js` - Enhanced token exchange with redirect URI validation

## Configuration

### Environment-Specific Settings

```typescript
// src/config/environment.ts
const environments = {
  development: {
    allowedOrigins: [
      'http://localhost:5173',
      'http://localhost:5174', 
      'http://localhost:3000'
    ],
    stravaRedirectPath: '/activities'
  },
  staging: {
    allowedOrigins: [
      'https://staging.paddlepartner.com',
      'https://dev.paddlepartner.com'
    ],
    stravaRedirectPath: '/activities'
  },
  production: {
    allowedOrigins: [
      'https://paddlepartner.com',
      'https://www.paddlepartner.com'
    ],
    stravaRedirectPath: '/activities'
  }
}
```

## Setup Instructions

### 1. Strava API Application Setup
In your Strava API application settings, add **ALL** possible redirect URIs:

**Development:**
- `http://localhost:5173/activities`
- `http://localhost:5174/activities`
- `http://localhost:3000/activities`

**Staging:**  
- `https://staging.paddlepartner.com/activities`
- `https://dev.paddlepartner.com/activities`

**Production:**
- `https://paddlepartner.com/activities`
- `https://www.paddlepartner.com/activities`

### 2. Environment Variables
No changes needed to existing environment variables:
```bash
VITE_STRAVA_CLIENT_ID=your-strava-client-id
STRAVA_CLIENT_SECRET=your-strava-client-secret
```

## Usage

### Automatic Operation
The system now works automatically:

1. **User clicks "Connect with Strava"**
2. **System detects environment** and generates appropriate auth URL
3. **Strava redirects** to the correct environment URL
4. **Backend validates** the redirect URI for security
5. **Token exchange** completes successfully

### Manual Testing
```typescript
import { getStravaRedirectUri, detectEnvironment } from './config/environment'

// Check current environment
console.log('Environment:', detectEnvironment())

// Get current redirect URI
console.log('Redirect URI:', getStravaRedirectUri())
```

## Security Features

### 1. Origin Validation
- Only allows pre-defined origins per environment
- Validates both protocol and hostname

### 2. Path Validation  
- Only allows specific paths (`/activities`, `/auth/callback`, `/`)
- Prevents redirect to arbitrary paths

### 3. Environment-Aware Logging
- Debug logs in development
- Error-only logs in production
- Comprehensive audit trail

## Benefits

✅ **No Manual Updates**: Automatically works across environments  
✅ **Security**: Server-side validation of all redirect URIs  
✅ **Maintainability**: Centralized environment configuration  
✅ **Flexibility**: Easy to add new environments or origins  
✅ **Debugging**: Environment-aware logging and error reporting  

## Migration Notes

### Before
- Manual Strava callback domain updates for each environment
- Hard-coded redirect URIs in code
- Separate Strava applications for dev/prod

### After  
- Single Strava application works across all environments
- Dynamic redirect URI generation
- Environment-aware configuration management

## Testing

### Development
```bash
# Start development servers
npm run dev                    # Frontend: http://localhost:5173
cd server && npm run dev       # Backend: http://localhost:3001

# Test Strava OAuth flow - should automatically use localhost redirect
```

### Staging
```bash
# Deploy to staging environment
# OAuth flow automatically uses staging.paddlepartner.com redirect
```

### Production
```bash
# Deploy to production
# OAuth flow automatically uses paddlepartner.com redirect
```

## Troubleshooting

### Common Issues

1. **Redirect URI mismatch**
   - Check Strava app has all required URIs configured
   - Verify environment detection is working correctly

2. **CORS errors**
   - Ensure allowed origins include your current hostname
   - Check protocol matches (http vs https)

3. **Validation failures**
   - Review server logs for redirect URI validation details
   - Verify path matches expected redirect path

### Debug Commands
```bash
# Check environment detection
curl http://localhost:3001/api/strava/status

# View server environment logs
# Look for "Redirect URI validation" messages
```

This solution provides a robust, secure, and maintainable approach to handling Strava OAuth across multiple environments without manual configuration changes.