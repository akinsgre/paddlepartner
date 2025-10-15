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
        <div class="access-badge">
          <span class="badge">✨ Paddle Partner Member</span>
          <p>You now have access to your personal paddle sports dashboard!</p>
        </div>
        
        <div class="quick-actions">
          <router-link to="/activities" class="action-btn primary">🛶 View Paddle Activities</router-link>
          <button class="action-btn secondary">📸 View Photo Gallery</button>
          <button class="action-btn secondary">🗺️ Plan New Adventure</button>
          <button @click="signOut" class="action-btn logout">🚪 Sign Out</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-container {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: clamp(1rem, 3vw, 2rem);
  margin: 1rem auto 2rem;
  max-width: min(500px, 90vw);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
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
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e2e8f0;
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

.access-badge {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 1rem;
  border-radius: 10px;
  margin-bottom: 1.5rem;
}

.badge {
  font-weight: bold;
  font-size: clamp(1rem, 2.5vw, 1.1rem);
}

.access-badge p {
  margin: 0.5rem 0 0 0;
  opacity: 0.9;
  font-size: clamp(0.85rem, 2vw, 0.95rem);
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.action-btn {
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: clamp(0.85rem, 2vw, 0.95rem);
  text-decoration: none;
  display: inline-block;
  text-align: center;
  line-height: 1.2;
}

.action-btn.primary {
  background: linear-gradient(135deg, #4299e1, #3182ce);
  color: white;
}

.action-btn.secondary {
  background: linear-gradient(135deg, #48bb78, #38a169);
  color: white;
}

.action-btn.logout {
  background: #f7fafc;
  border: 2px solid #e2e8f0;
  color: #4a5568;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Mobile-specific styles */
@media (max-width: 480px) {
  .auth-container {
    margin: 0.5rem;
    padding: 1.5rem 1rem;
    border-radius: 10px;
  }
  
  .profile-header {
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
  }
  
  .profile-info {
    text-align: center;
  }
  
  .google-signin-btn {
    padding: 10px 16px;
    gap: 8px;
  }
  
  .google-icon {
    width: 18px;
    height: 18px;
  }
  
  .quick-actions {
    gap: 0.5rem;
  }
  
  .action-btn {
    padding: 10px 16px;
  }
}

/* Tablet styles */
@media (min-width: 768px) and (max-width: 1024px) {
  .auth-container {
    max-width: 600px;
  }
  
  .quick-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  
  .action-btn.logout {
    grid-column: 1 / -1;
  }
}

/* Large screen styles */
@media (min-width: 1024px) {
  .quick-actions {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
  
  .action-btn.logout {
    grid-column: 1 / -1;
    max-width: 200px;
    margin: 0 auto;
  }
}
</style>