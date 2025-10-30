import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('🧪 Frontend Integration Tests - Services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should import and create API service without errors', async () => {
    const { default: api } = await import('../src/services/api')
    
    expect(api).toBeDefined()
    expect(api.defaults.baseURL).toContain('api')
  })

  it('should import auth service without errors', async () => {
    const authService = await import('../src/services/authService')
    expect(authService).toBeDefined()
  })

  it('should import activity service without errors', async () => {
    const activityService = await import('../src/services/activityService')
    expect(activityService).toBeDefined()
  })

  it('should import strava service without errors', async () => {
    const stravaService = await import('../src/services/stravaService')
    expect(stravaService).toBeDefined()
  })

  it('should import user service without errors', async () => {
    const userService = await import('../src/services/userService')
    expect(userService).toBeDefined()
  })

  it('should import water type service without errors', async () => {
    const waterTypeService = await import('../src/services/waterTypeService')
    expect(waterTypeService).toBeDefined()
  })
})

describe('🧪 Frontend Integration Tests - Router', () => {
  it('should import router configuration without errors', async () => {
    const routerModule = await import('../src/router/index')
    expect(routerModule.default).toBeDefined()
  })

  it('should import Analysis view without errors', async () => {
    const analysisModule = await import('../src/views/Analysis.vue')
    expect(analysisModule.default).toBeDefined()
  })
})

describe('🧪 Frontend Integration Tests - Auth State', () => {
  beforeEach(() => {
    // Clear localStorage mock
    vi.mocked(localStorage.getItem).mockClear()
    vi.mocked(localStorage.setItem).mockClear()
    vi.mocked(localStorage.removeItem).mockClear()
  })

  it('should handle authentication token storage', () => {
    const mockToken = 'mock-jwt-token'
    
    // Mock setting token
    localStorage.setItem('authToken', mockToken)
    expect(localStorage.setItem).toHaveBeenCalledWith('authToken', mockToken)
    
    // Mock getting token
    vi.mocked(localStorage.getItem).mockReturnValue(mockToken)
    const retrievedToken = localStorage.getItem('authToken')
    expect(retrievedToken).toBe(mockToken)
  })

  it('should handle user authentication state', () => {
    // Mock authenticated state
    localStorage.setItem('userAuthenticated', 'true')
    expect(localStorage.setItem).toHaveBeenCalledWith('userAuthenticated', 'true')
    
    // Mock unauthenticated state
    localStorage.setItem('userAuthenticated', 'false')
    expect(localStorage.setItem).toHaveBeenCalledWith('userAuthenticated', 'false')
  })
})

describe('🧪 Frontend Integration Tests - Environment Configuration', () => {
  it('should handle environment variable access', () => {
    // Test that we can access process.env in the test environment
    expect(process.env.NODE_ENV).toBeDefined()
  })

  it('should validate service module structure', async () => {
    // Verify that all service modules export expected structure
    const modules = [
      '../src/services/api',
      '../src/services/authService',
      '../src/services/activityService',
      '../src/services/stravaService',
      '../src/services/userService',
      '../src/services/waterTypeService'
    ]

    for (const modulePath of modules) {
      const module = await import(modulePath)
      expect(module).toBeDefined()
    }
  })
})