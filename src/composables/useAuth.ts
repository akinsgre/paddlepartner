import { ref, computed } from 'vue'
import { authService } from '../services/authService'

// Global authentication state
const isAuthenticated = ref(false)
const user = ref<any>(null)

// Check initial authentication state
const initializeAuth = () => {
  isAuthenticated.value = authService.isAuthenticated()
  if (isAuthenticated.value) {
    const storedUser = authService.getStoredUser()
    user.value = storedUser
  }
}

// Initialize on first load
initializeAuth()

export const useAuth = () => {
  const login = (userData: any) => {
    if (import.meta.env.DEV) {
      console.log('🔐 useAuth - Login function called with:', userData)
      console.log('🔐 useAuth - Current isAuthenticated before update:', isAuthenticated.value)
      console.log('🔐 useAuth - Picture URL:', userData.picture)
    }
    
    isAuthenticated.value = true
    user.value = userData
    
    if (import.meta.env.DEV) {
      console.log('🔐 useAuth - User logged in:', userData.name)
      console.log('🔐 useAuth - isAuthenticated after update:', isAuthenticated.value)
      console.log('🔐 useAuth - Stored user object:', user.value)
    }
  }

  const logout = () => {
    isAuthenticated.value = false
    user.value = null
    
    if (import.meta.env.DEV) {
      console.log('🚪 useAuth - User logged out')
    }
  }

  const checkAuth = () => {
    const wasAuthenticated = isAuthenticated.value
    initializeAuth()
    
    if (wasAuthenticated !== isAuthenticated.value) {
      if (import.meta.env.DEV) {
        console.log('🔄 useAuth - Authentication state changed:', {
          from: wasAuthenticated,
          to: isAuthenticated.value
        })
      }
    }
    
    return isAuthenticated.value
  }

  return {
    isAuthenticated: computed(() => isAuthenticated.value),
    user: computed(() => user.value),
    login,
    logout,
    checkAuth
  }
}