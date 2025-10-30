import axios from 'axios'

// API base URL - change this to your production server URL when deploying
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Enhanced error handling for development
    const isDevelopment = import.meta.env.DEV
    
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken')
      localStorage.removeItem('userAuthenticated')
      localStorage.removeItem('userInfo')
      window.location.href = '/'
    }

    // Enhanced error object for better debugging in development
    if (isDevelopment && error.response?.data) {
      const errorData = error.response.data
      
      // Create a detailed error message for development
      let enhancedMessage = error.message
      
      if (errorData.errorOrigin) {
        enhancedMessage = `${errorData.error || error.message}`
        
        // Add additional context in development
        if (errorData.originalError && errorData.originalError !== errorData.error) {
          enhancedMessage += `\n\nOriginal Error: ${errorData.originalError}`
        }
        
        if (errorData.errorCode) {
          enhancedMessage += `\nError Code: ${errorData.errorCode}`
        }
        
        if (errorData.httpStatus) {
          enhancedMessage += `\nHTTP Status: ${errorData.httpStatus} ${errorData.httpStatusText || ''}`
        }
        
        enhancedMessage += `\nEndpoint: ${errorData.method} ${errorData.path}`
        enhancedMessage += `\nTimestamp: ${errorData.timestamp}`
      }
      
      // Override the error message with our enhanced version
      error.message = enhancedMessage
      
      // Add the error origin to the error object for potential use by components
      error.errorOrigin = errorData.errorOrigin
      error.originalError = errorData.originalError
    }
    
    return Promise.reject(error)
  }
)

export default api