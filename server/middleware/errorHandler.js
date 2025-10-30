export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err)

  // Default error
  let error = {
    statusCode: err.statusCode || 500,
    message: err.message || 'Internal Server Error',
    origin: 'Unknown'
  }

  // Detect error origins and enhance messages for development
  const isDevelopment = process.env.NODE_ENV === 'development'

  // First check for rate limiting errors regardless of source
  if (err.statusCode === 429 || err.status === 429 || err.response?.status === 429 ||
      err.message?.toLowerCase().includes('rate limit') || 
      err.message?.toLowerCase().includes('too many requests') ||
      err.code === 'TooManyRequests' || err.name === 'TooManyRequestsError') {
    
    const retryAfter = err.retryAfter || err.headers?.['retry-after'] || err.response?.headers?.['retry-after'] || 60
    const source = err.response?.config?.url?.includes('strava') ? 'Strava API' : 
                   (err.message?.includes('Atlas') || err.message?.includes('MongoDB')) ? 'MongoDB Atlas' : 
                   'Unknown Service'
    
    error = {
      statusCode: 429,
      message: isDevelopment ? `[${source}] Rate limit exceeded - too many requests. Please wait ${retryAfter} seconds before trying again.` : 'Too many requests. Please try again in a moment.',
      origin: source
    }
    // Set retry-after header
    res.set('Retry-After', retryAfter.toString())
    
    if (isDevelopment) {
      console.error('🚫 Rate Limit Error Detected:', {
        source: source,
        originalError: err.message,
        statusCode: err.statusCode || err.status || err.response?.status,
        retryAfter: retryAfter,
        url: err.response?.config?.url || req.originalUrl,
        timestamp: new Date().toISOString()
      })
    }
  }

  // MongoDB Atlas errors (excluding rate limiting which is handled above)
  else if (err.name === 'MongoNetworkError' || err.name === 'MongoServerError' || 
      err.message?.includes('Atlas') || err.message?.includes('MongoDB') ||
      err.code === 11000 || err.name === 'ValidationError' || err.name === 'CastError') {
    error.origin = 'MongoDB Atlas'
    
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0]
      error = {
        statusCode: 400,
        message: isDevelopment ? `[MongoDB Atlas] Duplicate key error: ${field} already exists` : `${field} already exists`,
        origin: 'MongoDB Atlas'
      }
    } else if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message)
      error = {
        statusCode: 400,
        message: isDevelopment ? `[MongoDB Atlas] Validation error: ${messages.join(', ')}` : messages.join(', '),
        origin: 'MongoDB Atlas'
      }
    } else if (err.name === 'CastError') {
      error = {
        statusCode: 400,
        message: isDevelopment ? '[MongoDB Atlas] Invalid ID format' : 'Invalid ID format',
        origin: 'MongoDB Atlas'
      }
    } else if (err.name === 'MongoNetworkError') {
      error = {
        statusCode: 503,
        message: isDevelopment ? '[MongoDB Atlas] Database connection failed - check network connectivity' : 'Database temporarily unavailable',
        origin: 'MongoDB Atlas'
      }
    } else if (err.name === 'MongoServerError') {
      error = {
        statusCode: 500,
        message: isDevelopment ? `[MongoDB Atlas] Server error: ${err.message}` : 'Database server error',
        origin: 'MongoDB Atlas'
      }
    }
  }

  // Strava API errors
  else if (err.message?.includes('Strava') || err.message?.includes('strava') || 
           req.originalUrl?.includes('/strava') || err.response?.config?.url?.includes('strava')) {
    error.origin = 'Strava API'
    
    if (err.response?.status === 401) {
      error = {
        statusCode: 401,
        message: isDevelopment ? '[Strava API] Authentication failed - check Strava credentials or token expiry' : 'Strava authentication failed',
        origin: 'Strava API'
      }
    } else if (err.response?.status === 403) {
      error = {
        statusCode: 403,
        message: isDevelopment ? '[Strava API] Access forbidden - check API permissions or rate limits' : 'Strava access denied',
        origin: 'Strava API'
      }
    } else if (err.response?.status === 429) {
      error = {
        statusCode: 429,
        message: isDevelopment ? '[Strava API] Rate limit exceeded - too many requests' : 'Strava service temporarily unavailable',
        origin: 'Strava API'
      }
    } else if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
      error = {
        statusCode: 503,
        message: isDevelopment ? '[Strava API] Network connection failed - check internet connectivity' : 'External service unavailable',
        origin: 'Strava API'
      }
    } else {
      error.message = isDevelopment ? `[Strava API] ${err.message}` : 'Strava service error'
    }
  }

  // Google OAuth errors
  else if (err.message?.includes('Google') || err.message?.includes('OAuth') || 
           req.originalUrl?.includes('/auth') || err.message?.includes('invalid_grant') ||
           err.message?.includes('google') || err.response?.config?.url?.includes('google')) {
    error.origin = 'Google OAuth'
    
    if (err.message?.includes('invalid_grant') || err.message?.includes('invalid_client')) {
      error = {
        statusCode: 401,
        message: isDevelopment ? '[Google OAuth] Invalid credentials or expired token - check Google client configuration' : 'Authentication failed',
        origin: 'Google OAuth'
      }
    } else if (err.message?.includes('access_denied')) {
      error = {
        statusCode: 403,
        message: isDevelopment ? '[Google OAuth] Access denied by user or insufficient permissions' : 'Access denied',
        origin: 'Google OAuth'
      }
    } else if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
      error = {
        statusCode: 503,
        message: isDevelopment ? '[Google OAuth] Network connection failed - check internet connectivity' : 'Authentication service unavailable',
        origin: 'Google OAuth'
      }
    } else {
      error.message = isDevelopment ? `[Google OAuth] ${err.message}` : 'Authentication error'
    }
  }

  // JWT errors
  else if (err.name === 'JsonWebTokenError') {
    error = {
      statusCode: 401,
      message: isDevelopment ? '[JWT] Invalid token format or signature' : 'Invalid token',
      origin: 'JWT'
    }
  } else if (err.name === 'TokenExpiredError') {
    error = {
      statusCode: 401,
      message: isDevelopment ? '[JWT] Token has expired - please login again' : 'Token expired',
      origin: 'JWT'
    }
  }

  // Network/Connection errors
  else if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
    error = {
      statusCode: 503,
      message: isDevelopment ? `[Network] Connection error: ${err.message}` : 'Service temporarily unavailable',
      origin: 'Network'
    }
  }

  // Rate limiting errors (429)
  else if (err.statusCode === 429 || err.status === 429) {
    const retryAfter = err.retryAfter || 60 // Default to 60 seconds
    error = {
      statusCode: 429,
      message: isDevelopment ? `[Rate Limiting] Too many requests. Please wait ${retryAfter} seconds before trying again.` : 'Too many requests. Please try again later.',
      origin: 'Rate Limiting'
    }
    
    // Set retry-after header
    res.set('Retry-After', retryAfter.toString())
  }

  // If no specific origin detected, try to infer from context
  else if (isDevelopment && !error.origin) {
    if (req.originalUrl?.includes('/strava')) {
      error.origin = 'Strava API'
      error.message = `[Strava API] ${error.message}`
    } else if (req.originalUrl?.includes('/auth')) {
      error.origin = 'Google OAuth'
      error.message = `[Google OAuth] ${error.message}`
    } else if (err.name?.includes('Mongo') || err.message?.includes('database')) {
      error.origin = 'MongoDB Atlas'
      error.message = `[MongoDB Atlas] ${error.message}`
    }
  }

  const response = {
    success: false,
    error: error.message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  }

  // Add development-specific debugging info
  if (isDevelopment) {
    response.errorOrigin = error.origin
    response.originalError = err.message
    response.stack = err.stack
    
    // Add additional context for debugging
    if (err.response) {
      response.httpStatus = err.response.status
      response.httpStatusText = err.response.statusText
      response.responseData = err.response.data
    }
    
    if (err.code) {
      response.errorCode = err.code
    }
    
    // Add rate limiting specific debug info
    if (error.statusCode === 429) {
      response.debugInfo = {
        rateLimitSource: error.origin,
        retryAfter: res.get('Retry-After'),
        originalStatusCode: err.statusCode || err.status || err.response?.status,
        detectedVia: err.statusCode === 429 ? 'statusCode' : 
                     err.status === 429 ? 'status' : 
                     err.response?.status === 429 ? 'response.status' :
                     err.message?.toLowerCase().includes('rate limit') ? 'message content' : 'unknown',
        timestamp: new Date().toISOString()
      }
    }
  }

  res.status(error.statusCode).json(response)
}

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}