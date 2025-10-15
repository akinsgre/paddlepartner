<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface GoogleUser {
  name: string
  email: string
  picture: string
}

const isAuthenticated = ref(false)
const user = ref<GoogleUser | null>(null)
const isLoading = ref(false)
const errorMessage = ref('')
const debugInfo = ref('')
const currentOrigin = ref('')

// Google Client ID - Replace with your actual client ID from environment
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id.apps.googleusercontent.com'

onMounted(() => {
  currentOrigin.value = window.location.origin
  debugInfo.value = `Client ID: ${GOOGLE_CLIENT_ID.substring(0, 20)}...`
  console.log('Google Client ID:', GOOGLE_CLIENT_ID)
  console.log('Current origin:', window.location.origin)
  
  // Check for existing authentication
  const storedAuth = localStorage.getItem('userAuthenticated')
  const storedUserInfo = localStorage.getItem('userInfo')
  
  if (storedAuth === 'true' && storedUserInfo) {
    try {
      user.value = JSON.parse(storedUserInfo)
      isAuthenticated.value = true
    } catch (error) {
      console.error('Error parsing stored user info:', error)
      localStorage.removeItem('userAuthenticated')
      localStorage.removeItem('userInfo')
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
      console.error('Failed to load Google Sign-In script')
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
      console.log('Google Auth initialized successfully')
      errorMessage.value = ''
    } else {
      throw new Error('Google Sign-In library not available')
    }
  } catch (error) {
    console.error('Error initializing Google Auth:', error)
    errorMessage.value = 'Failed to initialize Google Sign-In'
  }
}

const handleCredentialResponse = (response: any) => {
  isLoading.value = true
  errorMessage.value = ''
  
  try {
    console.log('Received credential response:', response)
    
    if (!response.credential) {
      throw new Error('No credential received from Google')
    }
    
    // Decode the JWT token to get user info
    const payload = JSON.parse(atob(response.credential.split('.')[1]))
    console.log('Decoded payload:', payload)
    
    user.value = {
      name: payload.name,
      email: payload.email,
      picture: payload.picture
    }
    
    isAuthenticated.value = true
    
    // Store authentication state
    localStorage.setItem('userAuthenticated', 'true')
    localStorage.setItem('userInfo', JSON.stringify(user.value))
    
    console.log('User authenticated:', user.value)
  } catch (error) {
    console.error('Authentication error:', error)
    errorMessage.value = 'Authentication failed. Please try again.'
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
      console.log('Prompting for Google Sign-In...')
      window.google.accounts.id.prompt((notification: any) => {
        console.log('Prompt notification:', notification)
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.log('Prompt was not displayed or skipped')
          // Fallback to renderButton if prompt fails
          renderSignInButton()
        }
      })
    } else {
      throw new Error('Google Sign-In not initialized')
    }
  } catch (error) {
    console.error('Sign-in error:', error)
    errorMessage.value = 'Failed to initiate sign-in. Please refresh and try again.'
  }
}

const renderSignInButton = () => {
  const buttonContainer = document.getElementById('google-signin-button')
  if (buttonContainer && window.google) {
    window.google.accounts.id.renderButton(buttonContainer, {
      theme: 'outline',
      size: 'large',
      width: 300
    })
  }
}

const signOut = () => {
  if (window.google) {
    window.google.accounts.id.disableAutoSelect()
  }
  isAuthenticated.value = false
  user.value = null
  errorMessage.value = ''
  
  // Clear stored authentication
  localStorage.removeItem('userAuthenticated')
  localStorage.removeItem('userInfo')
  
  console.log('User signed out')
}
</script>

<template>
  <div class="auth-container">
    <div v-if="!isAuthenticated" class="login-section">
      <h3>🔐 Adventure Access</h3>
      <p>Sign in to access exclusive tour content and features</p>
      
      <!-- Error Message -->
      <div v-if="errorMessage" class="error-message">
        ⚠️ {{ errorMessage }}
      </div>
      
      <!-- Debug Info (only in development) -->
      <div v-if="debugInfo" class="debug-info">
        <small>{{ debugInfo }}</small>
        <br>
        <small>Origin: {{ currentOrigin }}</small>
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
      
      <!-- Fallback button container -->
      <div id="google-signin-button" style="margin-top: 1rem;"></div>
      
      <!-- Configuration Help -->
      <div class="config-help">
        <details>
          <summary>Need help setting up Google Auth?</summary>
          <ol>
            <li>Go to <a href="https://console.cloud.google.com/" target="_blank">Google Cloud Console</a></li>
            <li>Create/select a project</li>
            <li>Enable Google Identity API</li>
            <li>Create OAuth 2.0 credentials</li>
            <li>Add <code>{{ currentOrigin }}</code> to authorized origins</li>
            <li>Update your .env.local file with the client ID</li>
          </ol>
        </details>
      </div>
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
          <span class="badge">✨ Premium Explorer</span>
          <p>You now have access to exclusive tour content!</p>
        </div>
        
        <div class="quick-actions">
          <router-link to="/activities" class="action-btn primary">🛶 View Kayak Activities</router-link>
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
  padding: 2rem;
  margin: 2rem auto;
  max-width: 500px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
}

.login-section {
  text-align: center;
}

.login-section h3 {
  color: #2c5282;
  margin-bottom: 0.5rem;
  font-size: 1.5rem;
}

.login-section p {
  color: #666;
  margin-bottom: 1rem;
}

.error-message {
  background: #fed7d7;
  border: 1px solid #fc8181;
  color: #c53030;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.debug-info {
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  padding: 0.5rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  font-family: monospace;
  color: #4a5568;
}

.config-help {
  margin-top: 1.5rem;
  text-align: left;
}

.config-help summary {
  cursor: pointer;
  color: #4299e1;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.config-help ol {
  font-size: 0.85rem;
  color: #666;
  margin: 0.5rem 0;
  padding-left: 1.2rem;
}

.config-help li {
  margin-bottom: 0.25rem;
}

.config-help code {
  background: #f7fafc;
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  font-size: 0.8rem;
}

.config-help a {
  color: #4299e1;
  text-decoration: none;
}

.config-help a:hover {
  text-decoration: underline;
}

.google-signin-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  padding: 12px 24px;
  background: white;
  border: 2px solid #dadce0;
  border-radius: 8px;
  font-size: 16px;
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
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 3px solid #4299e1;
}

.profile-info {
  text-align: left;
  flex: 1;
}

.profile-info h3 {
  margin: 0;
  color: #2c5282;
  font-size: 1.3rem;
}

.email {
  margin: 0.25rem 0 0 0;
  color: #666;
  font-size: 0.9rem;
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
  font-size: 1.1rem;
}

.access-badge p {
  margin: 0.5rem 0 0 0;
  opacity: 0.9;
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
  font-size: 0.95rem;
  text-decoration: none;
  display: inline-block;
  text-align: center;
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

@media (max-width: 480px) {
  .auth-container {
    margin: 1rem;
    padding: 1.5rem;
  }
  
  .profile-header {
    flex-direction: column;
    text-align: center;
  }
  
  .profile-info {
    text-align: center;
  }
}
</style>