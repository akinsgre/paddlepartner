export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err)

  // Default error
  let error = {
    statusCode: err.statusCode || 500,
    message: err.message || 'Internal Server Error'
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    error = {
      statusCode: 400,
      message: `${field} already exists`
    }
  }

  // MongoDB validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message)
    error = {
      statusCode: 400,
      message: messages.join(', ')
    }
  }

  // MongoDB cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    error = {
      statusCode: 400,
      message: 'Invalid ID format'
    }
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    error = {
      statusCode: 401,
      message: 'Invalid token'
    }
  }

  // JWT expired error
  if (err.name === 'TokenExpiredError') {
    error = {
      statusCode: 401,
      message: 'Token expired'
    }
  }

  res.status(error.statusCode).json({
    success: false,
    error: error.message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
}

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}