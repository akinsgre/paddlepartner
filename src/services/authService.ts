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
      
      // In development, provide more detailed error information
      if (import.meta.env.DEV && error.errorOrigin === 'Google OAuth') {
        throw error // Let the enhanced error message pass through
      }
      
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
      
      // In development, provide more detailed error information  
      if (import.meta.env.DEV && (error.errorOrigin === 'Google OAuth' || error.errorOrigin === 'MongoDB Atlas')) {
        throw error // Let the enhanced error message pass through
      }
      
      throw new Error(error.response?.data?.error || 'Failed to get user information')
    }
  },

  /**
   * Logout user
   */
  async logout() {
    try {
      if (import.meta.env.DEV) {
        console.log('🚪 AuthService - Initiating logout...')
      }
      
      // Call server logout endpoint
      await api.post('/auth/logout')
      
      if (import.meta.env.DEV) {
        console.log('✅ AuthService - Server logout successful')
      }
    } catch (error) {
      console.error('🔴 AuthService - Logout server call failed:', error)
      // Continue with local cleanup even if server call fails
    } finally {
      // Clear local storage regardless of API response
      const itemsToRemove = ['authToken', 'userAuthenticated', 'userInfo']
      
      itemsToRemove.forEach(item => {
        if (localStorage.getItem(item)) {
          localStorage.removeItem(item)
          if (import.meta.env.DEV) {
            console.log(`🗑️ Removed ${item} from localStorage`)
          }
        }
      })
      
      if (import.meta.env.DEV) {
        console.log('✅ AuthService - Local storage cleared')
        console.log('🔍 Remaining auth state:', {
          hasToken: !!localStorage.getItem('authToken'),
          isAuthenticated: localStorage.getItem('userAuthenticated'),
          hasUserInfo: !!localStorage.getItem('userInfo')
        })
      }
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