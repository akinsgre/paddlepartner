import api from './api'

interface GoogleUser {
  googleId: string
  email: string
  name: string
  picture?: string
}

interface AuthResponse {
  success: boolean
  token: string
  user: {
    id: string
    googleId: string
    email: string
    name: string
    picture?: string
    preferences: any
    stats: any
    lastLoginAt: string
  }
}

export const authService = {
  /**
   * Authenticate user with Google
   */
  async authenticateWithGoogle(googleUser: GoogleUser): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/google', googleUser)
      
      if (response.data.success && response.data.token) {
        // Store token and user info
        localStorage.setItem('authToken', response.data.token)
        localStorage.setItem('userAuthenticated', 'true')
        localStorage.setItem('userInfo', JSON.stringify(response.data.user))
      }
      
      return response.data
    } catch (error: any) {
      console.error('Google authentication error:', error)
      throw new Error(error.response?.data?.error || 'Authentication failed')
    }
  },

  /**
   * Get current user
   */
  async getCurrentUser() {
    try {
      const response = await api.get('/auth/me')
      return response.data
    } catch (error: any) {
      console.error('Get current user error:', error)
      throw new Error(error.response?.data?.error || 'Failed to get user information')
    }
  },

  /**
   * Logout user
   */
  async logout() {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear local storage regardless of API response
      localStorage.removeItem('authToken')
      localStorage.removeItem('userAuthenticated')
      localStorage.removeItem('userInfo')
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('authToken')
    const isAuth = localStorage.getItem('userAuthenticated') === 'true'
    return !!(token && isAuth)
  },

  /**
   * Get stored user info
   */
  getStoredUser() {
    try {
      const userInfo = localStorage.getItem('userInfo')
      return userInfo ? JSON.parse(userInfo) : null
    } catch (error) {
      console.error('Error parsing stored user info:', error)
      return null
    }
  }
}