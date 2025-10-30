/**
 * Enhanced error handling utilities for development mode
 */

export interface EnhancedError extends Error {
  errorOrigin?: string
  originalError?: string
  httpStatus?: number
  httpStatusText?: string
  errorCode?: string
  path?: string
  method?: string
  timestamp?: string
}

/**
 * Format error for display in development mode
 */
export function formatErrorForDisplay(error: any): string {
  const isDevelopment = import.meta.env.DEV
  
  if (!isDevelopment) {
    return error.message || 'An error occurred'
  }
  
  let formattedError = error.message || 'Unknown error'
  
  // If it's an enhanced error from our API, show the detailed information
  if (error.errorOrigin) {
    // The enhanced error message is already formatted from the API interceptor
    return formattedError
  }
  
  // For other errors, provide basic development context
  if (error.response) {
    formattedError += `\n\nHTTP ${error.response.status}: ${error.response.statusText || ''}`
    if (error.response.data?.error) {
      formattedError += `\nServer Error: ${error.response.data.error}`
    }
  }
  
  if (error.code) {
    formattedError += `\nError Code: ${error.code}`
  }
  
  return formattedError
}

/**
 * Get error origin for styling/categorization
 */
export function getErrorOrigin(error: any): string {
  if (error.errorOrigin) {
    return error.errorOrigin
  }
  
  // Try to infer from error properties
  if (error.message?.includes('Google') || error.message?.includes('OAuth')) {
    return 'Google OAuth'
  }
  
  if (error.message?.includes('Strava') || error.message?.includes('strava')) {
    return 'Strava API'
  }
  
  if (error.message?.includes('MongoDB') || error.message?.includes('database') || 
      error.name?.includes('Mongo')) {
    return 'MongoDB Atlas'
  }
  
  if (error.name?.includes('Network') || error.code === 'ENOTFOUND' || 
      error.code === 'ECONNREFUSED') {
    return 'Network'
  }
  
  return 'Application'
}

/**
 * Check if error should show development details
 */
export function shouldShowDetails(error: any): boolean {
  return import.meta.env.DEV && (
    error.errorOrigin || 
    error.response ||
    error.code ||
    error.message?.includes('\n')
  )
}

/**
 * Log error with enhanced context in development
 */
export function logError(context: string, error: any): void {
  const isDevelopment = import.meta.env.DEV
  
  if (isDevelopment) {
    console.group(`🚨 ${context}`)
    console.error('Error:', error.message)
    
    if (error.errorOrigin) {
      console.warn('Origin:', error.errorOrigin)
    }
    
    if (error.originalError && error.originalError !== error.message) {
      console.warn('Original Error:', error.originalError)
    }
    
    if (error.response) {
      console.warn('HTTP Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      })
    }
    
    if (error.code) {
      console.warn('Error Code:', error.code)
    }
    
    console.trace('Stack Trace')
    console.groupEnd()
  } else {
    console.error(`${context}:`, error.message)
  }
}