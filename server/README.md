# Paddle Partner Server

A Node.js/Express API server for the Paddle Partner application, providing data persistence, user management, and Strava integration.

## Features

- **User Authentication**: JWT-based authentication with Google OAuth integration
- **Activity Management**: CRUD operations for paddle sports activities
- **Strava Integration**: Sync activities from Strava API
- **Data Persistence**: MongoDB database with Mongoose ODM
- **RESTful API**: Well-structured API endpoints
- **Security**: Helmet, CORS, rate limiting, and input validation
- **Error Handling**: Comprehensive error handling and logging

## Quick Start

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Set Up Environment
Copy `.env` and update with your credentials:
```bash
cp .env .env.local
# Edit .env.local with your actual credentials
```

### 3. Start MongoDB
- **Local**: Install and start MongoDB locally
- **Cloud**: Create MongoDB Atlas account and update connection string

### 4. Run Server
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /api/auth/google` - Authenticate with Google
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/preferences` - Get user preferences
- `PUT /api/users/preferences` - Update user preferences
- `PUT /api/users/strava-tokens` - Update Strava tokens
- `GET /api/users/stats` - Get user statistics
- `DELETE /api/users/account` - Delete user account

### Activities
- `GET /api/activities` - Get user activities (with filtering)
- `GET /api/activities/:id` - Get single activity
- `POST /api/activities` - Create new activity
- `PUT /api/activities/:id` - Update activity
- `DELETE /api/activities/:id` - Delete activity
- `GET /api/activities/stats/summary` - Get activity statistics
- `GET /api/activities/public/feed` - Get public activities feed

### Strava Integration
- `POST /api/strava/exchange-token` - Exchange authorization code for tokens
- `POST /api/strava/refresh-token` - Refresh Strava access token
- `POST /api/strava/sync-activities` - Sync activities from Strava
- `GET /api/strava/status` - Get Strava connection status
- `DELETE /api/strava/disconnect` - Disconnect Strava account

### System
- `GET /health` - Health check endpoint

## Database Schema

### User Model
```javascript
{
  googleId: String,
  email: String,
  name: String,
  picture: String,
  stravaAccessToken: String,
  stravaRefreshToken: String,
  stravaTokenExpiry: Date,
  stravaAthleteId: String,
  preferences: {
    units: 'metric' | 'imperial',
    defaultPrivacy: 'public' | 'private',
    notifications: { email, newActivities, weeklyDigest },
    dashboard: { showStats, showMap, showWeather }
  },
  stats: {
    totalActivities, totalDistance, totalTime,
    longestActivity, favoriteSportType, favoriteLocation
  }
}
```

### Activity Model
```javascript
{
  stravaId: Number,
  userId: ObjectId,
  userGoogleId: String,
  name: String,
  type: String,
  sportType: String,
  startDate: Date,
  distance: Number,
  movingTime: Number,
  totalElevationGain: Number,
  averageSpeed: Number,
  maxSpeed: Number,
  location: {
    startLatLng: [Number, Number],
    endLatLng: [Number, Number],
    city: String,
    state: String,
    country: String
  },
  gear: {
    kayakType: String,
    paddleType: String,
    equipment: [String]
  },
  weather: {
    temperature: Number,
    windSpeed: Number,
    waterConditions: String
  },
  notes: String,
  photos: [String],
  isPublic: Boolean,
  stravaData: {
    polyline, summaryPolyline, mapId,
    timezone, startDateLocal, utcOffset
  }
}
```

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing configuration
- **Rate Limiting**: Prevent API abuse
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Mongoose schema validation
- **Error Handling**: Secure error responses

## Development

### Project Structure
```
server/
├── config/
│   └── database.js         # Database connection
├── middleware/
│   ├── auth.js             # Authentication middleware
│   └── errorHandler.js     # Error handling
├── models/
│   ├── User.js             # User model
│   └── Activity.js         # Activity model
├── routes/
│   ├── auth.js             # Authentication routes
│   ├── users.js            # User management routes
│   ├── activities.js       # Activity routes
│   └── strava.js           # Strava integration routes
├── .env                    # Environment variables
├── index.js                # Server entry point
└── package.json            # Dependencies and scripts
```

### Adding New Features

1. **New Model**: Create in `models/` directory
2. **New Routes**: Create in `routes/` directory
3. **Middleware**: Add to `middleware/` directory
4. **Register Routes**: Import and use in `index.js`

### Testing

Health check endpoint for monitoring:
```bash
curl http://localhost:3001/health
```

## Deployment

### Environment Variables
Ensure all environment variables are set in production:
- `NODE_ENV=production`
- `MONGODB_URI` (MongoDB Atlas connection string)
- `JWT_SECRET` (strong secret key)
- `STRAVA_CLIENT_ID` and `STRAVA_CLIENT_SECRET`
- `CLIENT_URL` (production frontend URL)

### Production Considerations
- Use environment-specific `.env` files
- Set up proper logging and monitoring
- Configure reverse proxy (nginx)
- Set up SSL certificates
- Configure database backups
- Implement proper error tracking

## Integration with Client

The client application should be updated to use these API endpoints instead of direct Strava API calls and localStorage for data persistence.

Example client integration:
```javascript
// Authenticate user
const response = await fetch('/api/auth/google', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ googleId, email, name, picture })
})

// Get activities
const activities = await fetch('/api/activities', {
  headers: { 'Authorization': `Bearer ${token}` }
})

// Sync Strava activities
await fetch('/api/strava/sync-activities', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
})
```