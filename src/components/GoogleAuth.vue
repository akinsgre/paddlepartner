<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { authService } from '../services/authService'

interface GoogleUser {
  name: string
  email: string
  picture: string
  googleId: string
}

const isAuthenticated = ref(false)
const user = ref<GoogleUser | null>(null)
const isLoading = ref(false)
const errorMessage = ref('')
const currentOrigin = ref('')
const isMenuOpen = ref(false)

// Google Client ID - Replace with your actual client ID from environment
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id.apps.googleusercontent.com'

onMounted(() => {
  currentOrigin.value = window.location.origin
  
  // Check for existing authentication
  if (authService.isAuthenticated()) {
    const storedUser = authService.getStoredUser()
    if (storedUser) {
      user.value = {
        name: storedUser.name,
        email: storedUser.email,
        picture: storedUser.picture,
        googleId: storedUser.googleId
      }
      isAuthenticated.value = true
    }
  }
  
  loadGoogleScript()
})

const loadGoogleScript = () => {
  if (typeof window !== 'undefined' && !document.getElementById('google-script')) {
    const script = document.createElement('script')
    script.id = 'google-script'
    script.src = 'https://accounts.google.com/gsi/client'
    script.onload = initializeGoogleAuth
    script.onerror = () => {
      errorMessage.value = 'Failed to load Google Sign-In script'
    }
    document.head.appendChild(script)
  } else if (window.google) {
    initializeGoogleAuth()
  }
}

const initializeGoogleAuth = () => {
  try {
    if (window.google && window.google.accounts) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
        ux_mode: 'popup',
        context: 'signin'
      })
      errorMessage.value = ''
    } else {
      throw new Error('Google Sign-In library not available')
    }
  } catch (error) {
    errorMessage.value = 'Failed to initialize Google Sign-In'
  }
}

const handleCredentialResponse = async (response: any) => {
  isLoading.value = true
  errorMessage.value = ''
  
  try {
    if (!response.credential) {
      throw new Error('No credential received from Google')
    }
    
    // Decode the JWT token to get user info
    const payload = JSON.parse(atob(response.credential.split('.')[1]))
    
    const googleUser = {
      googleId: payload.sub,
      name: payload.name,
      email: payload.email,
      picture: payload.picture
    }
    
    // Authenticate with server
    const authResponse = await authService.authenticateWithGoogle(googleUser)
    
    if (authResponse.success) {
      user.value = {
        name: authResponse.user.name,
        email: authResponse.user.email,
        picture: authResponse.user.picture || '',
        googleId: authResponse.user.googleId
      }
      isAuthenticated.value = true
    } else {
      throw new Error('Server authentication failed')
    }
    
  } catch (error: any) {
    console.error('Authentication error:', error)
    errorMessage.value = error.message || 'Authentication failed. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const signIn = () => {
  errorMessage.value = ''
  
  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.includes('your-google-client-id')) {
    errorMessage.value = 'Google Client ID not configured. Please check your .env.local file.'
    return
  }
  
  try {
    if (window.google && window.google.accounts) {
      // Use the One Tap prompt or render button directly
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // If prompt doesn't show, render the button inline
          renderInlineButton()
        }
      })
    } else {
      throw new Error('Google Sign-In not initialized')
    }
  } catch (error) {
    errorMessage.value = 'Failed to initiate sign-in. Please refresh and try again.'
  }
}

const renderInlineButton = () => {
  // Create a temporary container for the Google button
  const tempContainer = document.createElement('div')
  tempContainer.id = 'temp-google-button'
  
  if (window.google && window.google.accounts) {
    window.google.accounts.id.renderButton(tempContainer, {
      theme: 'outline',
      size: 'large',
      width: 280,
      text: 'signin_with',
      shape: 'rectangular'
    })
    
    // Trigger click on the rendered button
    setTimeout(() => {
      const googleBtn = tempContainer.querySelector('div[role="button"]') as HTMLElement
      if (googleBtn) {
        googleBtn.click()
      }
    }, 100)
  }
}

const signOut = async () => {
  try {
    if (window.google) {
      window.google.accounts.id.disableAutoSelect()
    }
    
    // Logout from server
    await authService.logout()
    
  } catch (error) {
    console.error('Logout error:', error)
  } finally {
    // Clear local state
    isAuthenticated.value = false
    user.value = null
    errorMessage.value = ''
  }
}

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const closeMenu = () => {
  isMenuOpen.value = false
}
</script>

<template>
  <div class="auth-container">
    <div v-if="!isAuthenticated" class="login-section">
      <h3>🔐 Paddle Partner Access</h3>
      <p>Sign in to access your personal paddle sports dashboard and features</p>
      
      <!-- Error Message -->
      <div v-if="errorMessage" class="error-message">
        ⚠️ {{ errorMessage }}
      </div>
      
      <!-- Google Sign-In Button -->
      <button 
        @click="signIn" 
        :disabled="isLoading"
        class="google-signin-btn"
      >
        <svg class="google-icon" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {{ isLoading ? 'Signing in...' : 'Sign in with Google' }}
      </button>
    </div>

    <div v-else class="user-profile">
      <div class="profile-header">
        <img :src="user?.picture" :alt="user?.name" class="profile-image" />
        <div class="profile-info">
          <h3>Welcome, {{ user?.name }}! 🎉</h3>
          <p class="email">{{ user?.email }}</p>
        </div>
      </div>
      
      <div class="authenticated-content">
        <div class="horizontal-layout">
          <div class="access-badge-compact">
            <span class="badge">✨ Member</span>
          </div>
          
          <div class="menu-container">
            <button @click="toggleMenu" class="menu-trigger" :class="{ 'active': isMenuOpen }">
              <span>⚡ Actions</span>
              <svg class="menu-arrow" :class="{ 'rotated': isMenuOpen }" viewBox="0 0 24 24">
                <path fill="currentColor" d="M7,10L12,15L17,10H7Z"/>
              </svg>
            </button>
            
            <div v-if="isMenuOpen" class="dropdown-menu" @click="closeMenu">
              <router-link to="/activities" class="menu-item primary">
                <span class="menu-icon">🛶</span>
                <span>View Activities</span>
              </router-link>
              <button class="menu-item secondary" @click="closeMenu">
                <span class="menu-icon">📸</span>
                <span>Photo Gallery</span>
              </button>
              <button class="menu-item secondary" @click="closeMenu">
                <span class="menu-icon">🗺️</span>
                <span>Plan Adventure</span>
              </button>
              <button @click="signOut" class="menu-item logout">
                <span class="menu-icon">🚪</span>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-container {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 1rem 1.5rem;
  margin: 0;
  max-width: 100%;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 200;
}

.login-section {
  text-align: center;
}

.login-section h3 {
  color: #2c5282;
  margin-bottom: 0.5rem;
  font-size: clamp(1.2rem, 3vw, 1.5rem);
}

.login-section p {
  color: #666;
  margin-bottom: 1rem;
  font-size: clamp(0.9rem, 2vw, 1rem);
}

.error-message {
  background: #fed7d7;
  border: 1px solid #fc8181;
  color: #c53030;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: clamp(0.8rem, 2vw, 0.9rem);
  word-wrap: break-word;
}

.google-signin-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
  padding: 12px 24px;
  background: white;
  border: 2px solid #dadce0;
  border-radius: 8px;
  font-size: clamp(0.9rem, 2.5vw, 1rem);
  font-weight: 500;
  color: #3c4043;
  cursor: pointer;
  transition: all 0.3s ease;
}

.google-signin-btn:hover:not(:disabled) {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border-color: #dadce0;
}

.google-signin-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.google-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.user-profile {
  text-align: center;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.profile-image {
  width: clamp(50px, 12vw, 60px);
  height: clamp(50px, 12vw, 60px);
  border-radius: 50%;
  border: 3px solid #4299e1;
  flex-shrink: 0;
}

.profile-info {
  text-align: left;
  flex: 1;
  min-width: 0;
}

.profile-info h3 {
  margin: 0;
  color: #2c5282;
  font-size: clamp(1rem, 3vw, 1.3rem);
  word-wrap: break-word;
}

.email {
  margin: 0.25rem 0 0 0;
  color: #666;
  font-size: clamp(0.8rem, 2vw, 0.9rem);
  word-break: break-word;
}

.horizontal-layout {
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: space-between;
}

.access-badge-compact {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 20px;
  flex-shrink: 0;
}

.badge {
  font-weight: bold;
  font-size: 0.85rem;
  white-space: nowrap;
}

.menu-container {
  position: relative;
  flex: 1;
  max-width: 150px;
  z-index: 1;
}

.menu-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 12px;
  background: linear-gradient(135deg, #4299e1, #3182ce);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.85rem;
  white-space: nowrap;
}

.menu-trigger:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(66, 153, 225, 0.3);
}

.menu-trigger.active {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.menu-arrow {
  width: 20px;
  height: 20px;
  transition: transform 0.3s ease;
}

.menu-arrow.rotated {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 2px solid #4299e1;
  border-top: none;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.25);
  z-index: 201;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: white;
  color: #4a5568;
  font-size: clamp(0.85rem, 2vw, 0.95rem);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  border-bottom: 1px solid #e2e8f0;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:hover {
  background: #f7fafc;
  color: #2d3748;
}

.menu-item.primary:hover {
  background: #ebf8ff;
  color: #2b6cb0;
}

.menu-item.secondary:hover {
  background: #f0fff4;
  color: #276749;
}

.menu-item.logout:hover {
  background: #fed7d7;
  color: #c53030;
}

.menu-icon {
  font-size: 1.1em;
  flex-shrink: 0;
}

/* Mobile-specific styles */
@media (max-width: 767px) {
  .auth-container {
    margin: 0;
    padding: 0.75rem 1rem;
    border-radius: 8px;
  }
  
  .profile-header {
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }
  
  .profile-info {
    text-align: center;
  }
  
  .horizontal-layout {
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;
  }
  
  .menu-container {
    max-width: 100%;
  }
  
  .google-signin-btn {
    padding: 10px 16px;
    gap: 8px;
  }
  
  .google-icon {
    width: 18px;
    height: 18px;
  }
  
  .menu-trigger {
    padding: 8px 12px;
    font-size: 0.8rem;
  }
  
  .menu-item {
    padding: 10px 14px;
  }
  
  .menu-icon {
    font-size: 1em;
  }
}

/* Tablet styles */
@media (min-width: 768px) and (max-width: 1024px) {
  .auth-container {
    max-width: 600px;
  }
}

/* Large screen styles */
@media (min-width: 1024px) {
  .menu-container {
    max-width: 300px;
    margin: 0 auto;
  }
}
</style>