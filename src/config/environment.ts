/**
 * Environment Configuration for Dynamic Strava OAuth
 * 
 * This configuration supports multiple environments without needing to update
 * Strava API callback domains for each environment change.
 */

export interface EnvironmentConfig {
  name: 'development' | 'staging' | 'production'
  allowedOrigins: string[]
  stravaRedirectPath: string
  apiTimeout: number
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  features: {
    enableDebugLogs: boolean
    enablePerformanceTracking: boolean
    enableErrorReporting: boolean
  }
}

/**
 * Environment-specific configurations
 */
const environments: Record<string, EnvironmentConfig> = {
  development: {
    name: 'development',
    allowedOrigins: [
      'http://localhost:5173',
      'http://localhost:5174', 
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:3000'
    ],
    stravaRedirectPath: '/activities',
    apiTimeout: 10000,
    logLevel: 'debug',
    features: {
      enableDebugLogs: true,
      enablePerformanceTracking: true,
      enableErrorReporting: false
    }
  },
  
  staging: {
    name: 'staging',
    allowedOrigins: [
      'https://staging.paddlepartner.com',
      'https://dev.paddlepartner.com',
      'https://test.paddlepartner.com'
    ],
    stravaRedirectPath: '/activities',
    apiTimeout: 15000,
    logLevel: 'info',
    features: {
      enableDebugLogs: true,
      enablePerformanceTracking: true,
      enableErrorReporting: true
    }
  },
  
  production: {
    name: 'production',
    allowedOrigins: [
      'https://paddlepartner.com',
      'https://www.paddlepartner.com'
    ],
    stravaRedirectPath: '/activities',
    apiTimeout: 20000,
    logLevel: 'error',
    features: {
      enableDebugLogs: false,
      enablePerformanceTracking: false,
      enableErrorReporting: true
    }
  }
}

/**
 * Detect current environment based on hostname and other factors
 */
export function detectEnvironment(): EnvironmentConfig['name'] {
  if (typeof window === 'undefined') {
    // Server-side detection - simplified for client-side only usage
    return 'development'
  }
  
  const hostname = window.location.hostname
  
  // Development environment detection
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local')) {
    return 'development'
  }
  
  // Staging environment detection
  if (hostname.includes('staging') || hostname.includes('dev') || hostname.includes('test')) {
    return 'staging'
  }
  
  // Production environment (everything else)
  return 'production'
}

/**
 * Get configuration for current environment
 */
export function getCurrentEnvironmentConfig(): EnvironmentConfig {
  const environmentName = detectEnvironment()
  const config = environments[environmentName]
  
  if (!config) {
    console.warn(`⚠️ Unknown environment: ${environmentName}, falling back to development`)
    return environments.development!
  }
  
  return config
}

/**
 * Get the appropriate Strava redirect URI for current environment
 */
export function getStravaRedirectUri(): string {
  const config = getCurrentEnvironmentConfig()
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : ''
  
  return `${currentOrigin}${config.stravaRedirectPath}`
}

/**
 * Validate if a redirect URI is allowed for current environment
 */
export function isValidRedirectUri(redirectUri: string): boolean {
  try {
    const url = new URL(redirectUri)
    const config = getCurrentEnvironmentConfig()
    
    // Check if the origin is in the allowed list
    const origin = `${url.protocol}//${url.host}`
    const isAllowedOrigin = config.allowedOrigins.includes(origin)
    
    // Check if the path matches expected redirect path
    const isValidPath = url.pathname === config.stravaRedirectPath
    
    console.log('🔍 Redirect URI validation:', {
      uri: redirectUri,
      origin,
      pathname: url.pathname,
      environment: config.name,
      isAllowedOrigin,
      isValidPath,
      isValid: isAllowedOrigin && isValidPath
    })
    
    return isAllowedOrigin && isValidPath
    
  } catch (error) {
    console.error('❌ Error validating redirect URI:', error)
    return false
  }
}

/**
 * Log a message based on current environment log level
 */
export function environmentLog(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any) {
  const config = getCurrentEnvironmentConfig()
  const logLevels = { debug: 0, info: 1, warn: 2, error: 3 }
  
  if (logLevels[level] >= logLevels[config.logLevel]) {
    const logMethod = console[level] || console.log
    if (data) {
      logMethod(`[${config.name.toUpperCase()}] ${message}`, data)
    } else {
      logMethod(`[${config.name.toUpperCase()}] ${message}`)
    }
  }
}

export default {
  detectEnvironment,
  getCurrentEnvironmentConfig,
  getStravaRedirectUri,
  isValidRedirectUri,
  environmentLog
}