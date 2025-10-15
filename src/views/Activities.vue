<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

interface StravaActivity {
  id: number
  name: string
  type: string
  sport_type: string
  start_date: string
  distance: number
  moving_time: number
  total_elevation_gain: number
  average_speed: number
  max_speed: number
}

const router = useRouter()
const activities = ref<StravaActivity[]>([])
const isLoading = ref(false)
const error = ref('')
const isConnectedToStrava = ref(false)
const stravaAuthUrl = ref('')

// Strava API configuration
const STRAVA_CLIENT_ID = import.meta.env.VITE_STRAVA_CLIENT_ID || 'your-strava-client-id'
const REDIRECT_URI = `${window.location.origin}/activities`

onMounted(() => {
  checkAuthentication()
  setupStravaAuth()
  checkForStravaCode()
})

const checkAuthentication = () => {
  const isAuthenticated = localStorage.getItem('userAuthenticated') === 'true'
  if (!isAuthenticated) {
    router.push('/')
    return
  }
}

const setupStravaAuth = () => {
  stravaAuthUrl.value = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&approval_prompt=force&scope=read,activity:read_all`
}

const checkForStravaCode = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('code')
  
  if (code) {
    exchangeCodeForToken(code)
  } else {
    // Check if we have a stored access token
    const storedToken = localStorage.getItem('stravaAccessToken')
    if (storedToken) {
      isConnectedToStrava.value = true
      fetchActivities()
    }
  }
}

const exchangeCodeForToken = async (code: string) => {
  try {
    isLoading.value = true
    
    // Note: In a real app, this should be done on your backend for security
    const response = await axios.post('https://www.strava.com/oauth/token', {
      client_id: STRAVA_CLIENT_ID,
      client_secret: import.meta.env.VITE_STRAVA_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code'
    })
    
    const { access_token } = response.data
    localStorage.setItem('stravaAccessToken', access_token)
    isConnectedToStrava.value = true
    
    // Clean up URL
    window.history.replaceState({}, document.title, '/activities')
    
    await fetchActivities()
  } catch (err) {
    console.error('Error exchanging code for token:', err)
    error.value = 'Failed to connect to Strava. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const fetchActivities = async () => {
  try {
    isLoading.value = true
    error.value = ''
    
    const accessToken = localStorage.getItem('stravaAccessToken')
    if (!accessToken) {
      throw new Error('No Strava access token found')
    }
    
    const response = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      params: {
        per_page: 30,
        page: 1
      }
    })
    
    // Filter for kayaking/paddling activities
    activities.value = response.data.filter((activity: StravaActivity) => 
      activity.sport_type?.toLowerCase().includes('kayak') || 
      activity.sport_type?.toLowerCase().includes('canoe') ||
      activity.sport_type?.toLowerCase().includes('paddle') ||
      activity.type?.toLowerCase().includes('kayak') ||
      activity.name?.toLowerCase().includes('kayak')
    )
    
  } catch (err: any) {
    console.error('Error fetching activities:', err)
    if (err.response?.status === 401) {
      // Token expired, need to re-authenticate
      localStorage.removeItem('stravaAccessToken')
      isConnectedToStrava.value = false
      error.value = 'Strava session expired. Please reconnect.'
    } else {
      error.value = 'Failed to fetch activities from Strava.'
    }
  } finally {
    isLoading.value = false
  }
}

const connectToStrava = () => {
  window.location.href = stravaAuthUrl.value
}

const disconnectStrava = () => {
  localStorage.removeItem('stravaAccessToken')
  isConnectedToStrava.value = false
  activities.value = []
}

const formatDistance = (meters: number): string => {
  const km = meters / 1000
  return `${km.toFixed(2)} km`
}

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatSpeed = (metersPerSecond: number): string => {
  const kmh = (metersPerSecond * 3.6)
  return `${kmh.toFixed(1)} km/h`
}
</script>

<template>
  <div class="activities-container">
    <header class="page-header">
      <div class="header-content">
        <h1>🛶 Kayak Activities</h1>
        <router-link to="/" class="back-link">← Back to Home</router-link>
      </div>
    </header>

    <main class="activities-main">
      <!-- Strava Connection Section -->
      <div class="strava-section">
        <div v-if="!isConnectedToStrava" class="connect-strava">
          <div class="strava-info">
            <h2>Connect to Strava</h2>
            <p>Link your Strava account to view your kayaking activities and track your progress.</p>
          </div>
          <button @click="connectToStrava" class="strava-connect-btn">
            <svg class="strava-icon" viewBox="0 0 24 24">
              <path fill="#FC4C02" d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.172"/>
            </svg>
            Connect with Strava
          </button>
        </div>

        <div v-else class="strava-connected">
          <div class="connection-status">
            <span class="status-indicator">✓</span>
            <span>Connected to Strava</span>
            <button @click="disconnectStrava" class="disconnect-btn">Disconnect</button>
          </div>
          <button @click="fetchActivities" :disabled="isLoading" class="refresh-btn">
            🔄 Refresh Activities
          </button>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="error-message">
        ⚠️ {{ error }}
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading">
        <div class="loading-spinner"></div>
        <p>Loading kayak activities...</p>
      </div>

      <!-- Activities List -->
      <div v-else-if="activities.length > 0" class="activities-grid">
        <div v-for="activity in activities" :key="activity.id" class="activity-card">
          <div class="activity-header">
            <h3>{{ activity.name }}</h3>
            <span class="activity-type">{{ activity.sport_type || activity.type }}</span>
          </div>
          
          <div class="activity-date">
            📅 {{ formatDate(activity.start_date) }}
          </div>
          
          <div class="activity-stats">
            <div class="stat">
              <span class="stat-label">Distance</span>
              <span class="stat-value">{{ formatDistance(activity.distance) }}</span>
            </div>
            
            <div class="stat">
              <span class="stat-label">Duration</span>
              <span class="stat-value">{{ formatDuration(activity.moving_time) }}</span>
            </div>
            
            <div class="stat" v-if="activity.average_speed">
              <span class="stat-label">Avg Speed</span>
              <span class="stat-value">{{ formatSpeed(activity.average_speed) }}</span>
            </div>
            
            <div class="stat" v-if="activity.total_elevation_gain">
              <span class="stat-label">Elevation</span>
              <span class="stat-value">{{ Math.round(activity.total_elevation_gain) }}m</span>
            </div>
          </div>
        </div>
      </div>

      <!-- No Activities Message -->
      <div v-else-if="isConnectedToStrava && !isLoading" class="no-activities">
        <div class="no-activities-content">
          <h3>No Kayak Activities Found</h3>
          <p>No kayaking activities were found in your Strava account. Make sure to:</p>
          <ul>
            <li>Log your kayaking sessions in Strava</li>
            <li>Use activity types like "Kayaking", "Canoeing", or "Paddling"</li>
            <li>Include "kayak" in your activity names</li>
          </ul>
        </div>
      </div>

      <!-- Getting Started -->
      <div v-if="!isConnectedToStrava" class="getting-started">
        <h3>Getting Started</h3>
        <div class="setup-steps">
          <div class="step">
            <span class="step-number">1</span>
            <div class="step-content">
              <h4>Connect Strava</h4>
              <p>Link your Strava account to access your activity data</p>
            </div>
          </div>
          
          <div class="step">
            <span class="step-number">2</span>
            <div class="step-content">
              <h4>Log Kayaking Activities</h4>
              <p>Record your kayaking sessions in Strava with proper activity types</p>
            </div>
          </div>
          
          <div class="step">
            <span class="step-number">3</span>
            <div class="step-content">
              <h4>Track Progress</h4>
              <p>View your kayaking statistics and monitor your improvement</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.activities-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.page-header {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.header-content h1 {
  color: white;
  margin: 0;
  font-size: 2.5rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.back-link {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.back-link:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
}

.activities-main {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.strava-section {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.connect-strava {
  text-align: center;
}

.strava-info h2 {
  color: #2c5282;
  margin-bottom: 0.5rem;
}

.strava-info p {
  color: #666;
  margin-bottom: 2rem;
}

.strava-connect-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #FC4C02;
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.strava-connect-btn:hover {
  background: #e43e00;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(252, 76, 2, 0.3);
}

.strava-icon {
  width: 24px;
  height: 24px;
}

.strava-connected {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #38a169;
  font-weight: 500;
}

.status-indicator {
  background: #38a169;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.disconnect-btn, .refresh-btn {
  padding: 0.5rem 1rem;
  border: 2px solid #e2e8f0;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.disconnect-btn:hover {
  border-color: #fc8181;
  color: #c53030;
}

.refresh-btn:hover:not(:disabled) {
  border-color: #4299e1;
  color: #3182ce;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  background: #fed7d7;
  border: 1px solid #fc8181;
  color: #c53030;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.loading {
  text-align: center;
  padding: 3rem;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #4299e1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.activities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
}

.activity-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.activity-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.2);
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.activity-header h3 {
  margin: 0;
  color: #2c5282;
  font-size: 1.2rem;
  flex: 1;
}

.activity-type {
  background: #4299e1;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.activity-date {
  color: #666;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.activity-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.stat {
  text-align: center;
  padding: 0.75rem;
  background: #f7fafc;
  border-radius: 8px;
}

.stat-label {
  display: block;
  color: #666;
  font-size: 0.8rem;
  margin-bottom: 0.25rem;
}

.stat-value {
  display: block;
  color: #2c5282;
  font-weight: bold;
  font-size: 1.1rem;
}

.no-activities, .getting-started {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.no-activities-content h3 {
  color: #2c5282;
  margin-bottom: 1rem;
}

.no-activities-content ul {
  text-align: left;
  max-width: 400px;
  margin: 1rem auto;
  color: #666;
}

.setup-steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.step {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  text-align: left;
}

.step-number {
  background: #4299e1;
  color: white;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
}

.step-content h4 {
  margin: 0 0 0.5rem 0;
  color: #2c5282;
}

.step-content p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .header-content h1 {
    font-size: 2rem;
  }
  
  .activities-grid {
    grid-template-columns: 1fr;
  }
  
  .activity-stats {
    grid-template-columns: 1fr;
  }
  
  .strava-connected {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
}
</style>