<script setup lang="ts">
// Modal state for Strava sync
const showStravaSyncModal = ref(false)
// Inline water type editing state (for activity card inline editing)
const editingWaterTypeId = ref<string | null>(null)
import type { Ref } from 'vue'
const inlineWaterType: Ref<string> = ref('')
const inlineLoadingId = ref<string | null>(null)

function startInlineEdit(activity: Activity) {
  editingWaterTypeId.value = activity._id ?? null
  inlineWaterType.value = activity.waterType ? activity.waterType : ''
}

async function updateWaterType(activity: Activity) {
  inlineLoadingId.value = activity._id ?? null
  try {
    // Always pass a string (never undefined)
    const response = await activityService.updateActivity(activity._id, { waterType: inlineWaterType.value as string })
    
    // Log success in development
    if (import.meta.env.DEV) {
      console.log('✅ Water type updated successfully:', {
        activityId: activity._id,
        oldWaterType: activity.waterType,
        newWaterType: inlineWaterType.value,
        response: response
      })
    }
    
    activity.waterType = inlineWaterType.value as string
    editingWaterTypeId.value = null
  } catch (e: any) {
    logError('Update Water Type', e)
    
    // Enhanced error display for development
    let errorMessage = e.message || 'Failed to update water type.'
    
    if (import.meta.env.DEV && e.response?.data?.debugInfo) {
      errorMessage += `\n\nDevelopment Debug Info:\n${JSON.stringify(e.response.data.debugInfo, null, 2)}`
    }
    
    error.value = formatErrorForDisplay(e)
    
    // Also show alert for immediate user feedback
    alert(errorMessage)
  } finally {
    inlineLoadingId.value = null
  }
}
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authService } from '../services/authService'
import { stravaService } from '../services/stravaService'
import { activityService, type Activity, type PaginationInfo } from '../services/activityService'
import { getWaterTypes, type WaterType } from '../services/waterTypeService'
import { formatErrorForDisplay, shouldShowDetails, logError } from '../utils/errorHandler'
// Water type state
const waterTypes = ref<WaterType[]>([])
const selectedWaterType = ref('') // always a string, never null

onMounted(async () => {
  checkAuthentication()
  setupStravaAuth()
  checkForStravaCode()
  // Initialize with first page load
  if (authService.isAuthenticated()) {
    fetchActivities(1)
  }
  // Fetch allowed water types
  try {
    waterTypes.value = await getWaterTypes()
  } catch (e) {
    // fallback: use static list if API fails
    waterTypes.value = [
      { _id: 'whitewater', name: 'whitewater', description: 'Whitewater paddling' },
      { _id: 'moving water', name: 'moving water', description: 'Moving water (not whitewater)' },
      { _id: 'flat water', name: 'flat water', description: 'Flat water (lakes, slow rivers)' },
      { _id: 'erg', name: 'erg', description: 'Ergometer (indoor trainer)' }
    ]
  }
})
// Example: Add/edit activity modal state (simplified for patch)
const showActivityModal = ref(false)
const editingActivity = ref<Activity | null>(null)
const activityForm = ref<Partial<Activity>>({})
const activityFormError = ref('')

// openActivityModal is unused, remove to fix TS6133

async function saveActivity() {
  activityFormError.value = ''
  activityForm.value.waterType = selectedWaterType.value || undefined
  
  if (import.meta.env.DEV) {
    console.log('💾 Saving activity:', {
      isEditing: !!editingActivity.value?._id,
      activityId: editingActivity.value?._id,
      formData: activityForm.value,
      selectedWaterType: selectedWaterType.value,
      timestamp: new Date().toISOString()
    })
  }
  
  try {
    let response
    if (editingActivity.value && editingActivity.value._id) {
      response = await activityService.updateActivity(editingActivity.value._id, activityForm.value)
      if (import.meta.env.DEV) {
        console.log('✅ Activity updated successfully:', {
          success: response.success,
          activityId: response.activity?._id,
          activityName: response.activity?.name,
          debugInfo: (response as any).debugInfo,
          timestamp: new Date().toISOString()
        })
      }
      
      // Verify success before proceeding
      if (!response.success) {
        throw new Error('Server returned unsuccessful response despite 200 status')
      }
    } else {
      response = await activityService.createActivity(activityForm.value)
      if (import.meta.env.DEV) {
        console.log('✅ Activity created successfully:', {
          success: response.success,
          activityId: response.activity?._id,
          timestamp: new Date().toISOString()
        })
      }
    }
    
    showActivityModal.value = false
    await fetchActivities(1)
    
    if (import.meta.env.DEV) {
      console.log('✅ Modal closed and activities refreshed')
    }
  } catch (e: any) {
    logError('Save Activity', e)
    
    // Enhanced error display for development
    let errorMessage = e.message || 'Failed to save activity.'
    
    if (import.meta.env.DEV) {
      console.error('💥 Save Activity Error Details:', {
        error: e.message,
        errorOrigin: (e as any).errorOrigin,
        debugInfo: (e as any).debugInfo,
        formData: activityForm.value,
        response: e.response?.data,
        status: e.response?.status,
        statusText: e.response?.statusText,
        timestamp: new Date().toISOString()
      })
      
      if (e.response?.data?.debugInfo) {
        errorMessage += `\n\nDevelopment Debug Info:\n${JSON.stringify(e.response.data.debugInfo, null, 2)}`
      }
    }
    
    activityFormError.value = formatErrorForDisplay(e)
  }
}

const router = useRouter()
const route = useRoute()

// Initialize filters from query parameters
function getQueryString(val: unknown, fallback: string): string {
  if (typeof val === 'string') return val
  if (Array.isArray(val)) return val[0] || fallback
  return fallback
}

function goToBulkEdit() {
  router.push({
    name: 'BulkEdit',
    query: {
      search: searchQuery.value || undefined,
      sportType: selectedSportType.value !== 'all' ? selectedSportType.value : undefined,
      waterType: selectedWaterTypeFilter.value !== 'all' ? selectedWaterTypeFilter.value : undefined,
      sort: sortBy.value || undefined,
      startDate: startDateFilter.value || undefined,
      endDate: endDateFilter.value || undefined
    }
  })
}
const activities = ref<Activity[]>([])
const pagination = ref<PaginationInfo>({
  currentPage: 1,
  totalPages: 1,
  totalActivities: 0,
  hasNextPage: false,
  hasPrevPage: false,
  limit: 12
})
const isLoading = ref(false)
const error = ref('')
const isConnectedToStrava = ref(false)
const stravaAuthUrl = ref('')
const syncMessage = ref('')
const searchQuery = ref(getQueryString(route.query.search, ''))
const selectedSportType = ref(getQueryString(route.query.sportType, 'all'))
const sortBy = ref(getQueryString(route.query.sort, '-startDate'))
const selectedWaterTypeFilter = ref(getQueryString(route.query.waterType, 'all'))
const startDateFilter = ref(getQueryString(route.query.startDate, ''))
const endDateFilter = ref(getQueryString(route.query.endDate, ''))

// Watch for filter changes and auto-apply
watch([searchQuery, selectedSportType, sortBy, selectedWaterTypeFilter, startDateFilter, endDateFilter], () => {
  fetchActivities(1)
}, { deep: true })

onMounted(() => {
  checkAuthentication()
  setupStravaAuth()
  checkForStravaCode()
  // Initialize with first page load
  if (authService.isAuthenticated()) {
    fetchActivities(1)
  }
})

const checkAuthentication = () => {
  if (!authService.isAuthenticated()) {
    router.push('/')
    return
  }
}

const setupStravaAuth = () => {
  stravaAuthUrl.value = stravaService.generateAuthUrl()
}

const checkForStravaCode = async () => {
  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('code')
  
  if (code) {
    await exchangeCodeForToken(code)
  } else {
    // Check Strava connection status from server
    await checkStravaStatus()
  }
}

const checkStravaStatus = async () => {
  try {
    const status = await stravaService.getConnectionStatus()
    if (status.success && status.isConnected && status.isTokenValid) {
      isConnectedToStrava.value = true
      await fetchActivities()
    }
  } catch (error: any) {
    console.error('Error checking Strava status:', error.message)
  }
}

const exchangeCodeForToken = async (code: string) => {
  try {
    isLoading.value = true
    error.value = ''
    
    const response = await stravaService.exchangeToken(code)
    
    if (response.success) {
      isConnectedToStrava.value = true
      
      // Clean up URL
      window.history.replaceState({}, document.title, '/activities')
      
      // Fetch activities after successful connection
      await fetchActivities()
      
      syncMessage.value = 'Successfully connected to Strava!'
      setTimeout(() => {
        syncMessage.value = ''
      }, 3000)
    }
    
  } catch (error: any) {
    error.value = error.message || 'Failed to connect to Strava. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const fetchActivities = async (page = 1) => {
  try {
    isLoading.value = true
    error.value = ''
    
    if (import.meta.env.DEV) {
      console.log('🔍 Activities View - Fetching activities:', {
        page: page,
        filters: {
          sort: sortBy.value,
          sportType: selectedSportType.value,
          search: searchQuery.value,
          waterType: selectedWaterTypeFilter.value,
          startDate: startDateFilter.value,
          endDate: endDateFilter.value
        },
        timestamp: new Date().toISOString()
      })
    }
    
    // Get activities from server database with pagination
    const response = await activityService.getActivities({
      page,
      limit: 12,
      sort: sortBy.value,
      sportType: selectedSportType.value !== 'all' ? selectedSportType.value : undefined,
      search: searchQuery.value.trim() || undefined,
      waterType: selectedWaterTypeFilter.value !== 'all' ? selectedWaterTypeFilter.value : undefined,
      startDate: startDateFilter.value || undefined,
      endDate: endDateFilter.value || undefined
    })
    
    if (response.success) {
      activities.value = response.activities || []
      pagination.value = response.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalActivities: 0,
        hasNextPage: false,
        hasPrevPage: false,
        limit: 12
      }
      
      if (import.meta.env.DEV) {
        console.log('✅ Activities View - Fetch successful:', {
          activitiesCount: activities.value.length,
          pagination: pagination.value,
          timestamp: new Date().toISOString()
        })
      }
    }
    
  } catch (error: any) {
    if (import.meta.env.DEV) {
      console.error('💥 Activities View - Fetch failed:', {
        page: page,
        error: error.message,
        errorOrigin: error.errorOrigin,
        statusCode: error.statusCode,
        retryAfter: error.retryAfter,
        timestamp: new Date().toISOString()
      })
    }
    
    logError('Fetch Activities', error)
    
    // Enhanced error messages for specific scenarios
    let errorMessage = error.message || 'Failed to fetch activities'
    
    // Special handling for rate limiting
    if (error.statusCode === 429) {
      errorMessage = `⚠️ ${error.message}`
      if (import.meta.env.DEV) {
        errorMessage += `\n\nDevelopment Info: Rate limit exceeded. Check server logs for details.`
      }
    }
    // Special handling for network errors
    else if (error.code === 'NETWORK_ERROR' || !error.response) {
      errorMessage = 'Unable to connect to server. Please check your internet connection and try again.'
    }
    // Enhanced development error info
    else if (import.meta.env.DEV && error.errorOrigin) {
      errorMessage += `\n\nDevelopment Info:\nOrigin: ${error.errorOrigin}\nStatus: ${error.statusCode || 'Unknown'}`
    }
    
    error.value = errorMessage
    
    // Reset pagination on error
    pagination.value = {
      currentPage: 1,
      totalPages: 1,
      totalActivities: 0,
      hasNextPage: false,
      hasPrevPage: false,
      limit: 12
    }
  } finally {
    isLoading.value = false
  }
}

const goToPage = async (page: number) => {
  if (pagination.value && page >= 1 && page <= pagination.value.totalPages) {
    await fetchActivities(page)
  }
}

const applyFilters = async () => {
  await fetchActivities(1) // Reset to first page when applying filters
}

const clearFilters = async () => {
  searchQuery.value = ''
  selectedSportType.value = 'all'
  sortBy.value = '-startDate'
  selectedWaterTypeFilter.value = 'all'
  startDateFilter.value = ''
  endDateFilter.value = ''
  await fetchActivities(1)
}

const sportTypes = computed(() => {
  const types = ['all', 'Kayaking', 'Canoeing', 'SUP', 'Stand Up Paddleboarding', 'Paddle']
  return types
})

const shouldShowDetailsForError = computed(() => {
  return error.value ? shouldShowDetails({ message: error.value }) : false
})

const connectToStrava = () => {
  window.location.href = stravaAuthUrl.value
}

const syncFromStrava = async (syncAll = false) => {
  try {
    isLoading.value = true
    error.value = ''
    syncMessage.value = ''
    
    const options = syncAll ? {
      sync_all: true,
      per_page: 200
    } : {
      page: 1,
      per_page: 30
    }
    
    const response = await stravaService.syncActivities(options)
    
    if (response.success) {
      syncMessage.value = `${response.message} (${response.pagesProcessed} pages processed)`
      
      // Refresh activities list
      await fetchActivities()
      
      // Clear message after 5 seconds
      setTimeout(() => {
        syncMessage.value = ''
      }, 5000)
    }
    
  } catch (error: any) {
    logError('Strava Sync', error)
    error.value = formatErrorForDisplay(error)
  } finally {
    isLoading.value = false
  }
}

const syncAllFromStrava = async () => {
  if (confirm('This will sync ALL your paddle activities from Strava. This may take a while. Continue?')) {
    await syncFromStrava(true)
  }
}

const disconnectStrava = async () => {
  try {
    await stravaService.disconnect()
    isConnectedToStrava.value = false
    activities.value = []
    syncMessage.value = 'Disconnected from Strava successfully'
    
    setTimeout(() => {
      syncMessage.value = ''
    }, 3000)
    
  } catch (error: any) {
    logError('Strava Disconnect', error)
    error.value = formatErrorForDisplay(error)
  }
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
  if (!metersPerSecond) return '0.0 km/h'
  const kmh = (metersPerSecond * 3.6)
  return `${kmh.toFixed(1)} km/h`
}
</script>

<template>
  <!-- Activity Modal (simplified for patch) -->
  <div v-if="showActivityModal" class="modal-overlay">
    <div class="modal-content">
      <h2>{{ editingActivity ? 'Edit Activity' : 'Add Activity' }}</h2>
      <form @submit.prevent="saveActivity">
        <!-- ...other fields... -->
        <div class="form-group">
          <label for="waterType">Water Type</label>
          <select id="waterType" v-model="selectedWaterType" required>
            <option value="" disabled>Select water type</option>
            <option v-for="type in waterTypes" :key="type.name" :value="type.name">
              {{ type.description || type.name }}
            </option>
          </select>
        </div>
        <div v-if="activityFormError" class="error-message">{{ activityFormError }}</div>
        <button type="submit">Save</button>
        <button type="button" @click="showActivityModal = false">Cancel</button>
      </form>
    </div>
  </div>
  <div class="activities-container">
    <main class="activities-main">
      <!-- Sync from Strava Button (styled like filters-section) -->
      <div class="filters-section" style="margin-bottom: 1.5rem; display: flex; align-items: center; gap: 1rem;">
  <button @click="showStravaSyncModal = true" class="sync-strava-btn" style="border: 2px solid #FC4C02;">
          <svg class="strava-icon" viewBox="0 0 24 24" style="width: 1.5em; height: 1.5em; vertical-align: middle; margin-right: 0.5em;">
            <path fill="#FC4C02" d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.172"/>
          </svg>
          Sync from Strava
        </button>
        <span style="color: #222; font-size: 0.95em; font-weight: 500;">Import new activities from your Strava account</span>
      </div>

      <!-- Strava Sync Modal -->
      <div v-if="showStravaSyncModal" class="modal-overlay">
        <div class="modal-content">
          <h2>Sync Activities from Strava</h2>
          <div v-if="!isConnectedToStrava">
            <p>To import activities, connect your Strava account.</p>
            <button @click="connectToStrava" class="strava-connect-btn">
              <svg class="strava-icon" viewBox="0 0 24 24" style="width: 1.2em; height: 1.2em; vertical-align: middle; margin-right: 0.5em;">
                <path fill="#FC4C02" d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.172"/>
              </svg>
              Connect with Strava
            </button>
          </div>
          <div v-else>
            <p>Strava is connected. Choose an option:</p>
            <button @click="syncFromStrava(false)" :disabled="isLoading" class="sync-btn">
              <span v-if="isLoading">Syncing...</span>
              <span v-else>🔄 Sync Recent</span>
            </button>
            <button @click="syncAllFromStrava" :disabled="isLoading" class="sync-all-btn">
              <span v-if="isLoading">Syncing...</span>
              <span v-else>📥 Sync All History</span>
            </button>
            <button @click="disconnectStrava" class="disconnect-btn">Disconnect</button>
          </div>
          <button @click="showStravaSyncModal = false" class="close-btn" style="margin-top: 1em;">Close</button>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="error-message">
        <div class="error-title">⚠️ Error Occurred</div>
        <div class="error-content">{{ error.split('\\n')[0] }}</div>
        <div v-if="shouldShowDetailsForError" class="error-details">
          <details>
            <summary>Development Details</summary>
            <pre>{{ error }}</pre>
          </details>
        </div>
      </div>

      <!-- Success Message -->
      <div v-if="syncMessage" class="success-message">
        ✅ {{ syncMessage }}
      </div>


      <!-- Filters Section (always visible) -->
      <div class="filters-section">
        <div class="filters-row">
          <div class="filter-group">
            <label for="search">Search:</label>
            <input 
              id="search"
              v-model="searchQuery" 
              type="text" 
              placeholder="Search activities..."
              class="search-input"
              @keyup.enter="applyFilters"
            />
          </div>
          
          <div class="filter-group">
            <label for="sport-type">Sport Type:</label>
            <select id="sport-type" v-model="selectedSportType" class="sport-select">
              <option v-for="type in sportTypes" :key="type" :value="type">
                {{ type === 'all' ? 'All Sports' : type }}
              </option>
            </select>
          </div>
          
          <div class="filter-group">
            <label for="water-type-filter">Water Type:</label>
            <select id="water-type-filter" v-model="selectedWaterTypeFilter" class="water-type-select">
              <option value="all">All Types</option>
              <option value="undefined">Not Set</option>
              <option v-for="type in waterTypes" :key="type._id" :value="type.name">
                {{ type.name.charAt(0).toUpperCase() + type.name.slice(1) }}
              </option>
            </select>
          </div>
          
          <div class="filter-group">
            <label for="start-date">Start Date:</label>
            <input 
              id="start-date"
              v-model="startDateFilter" 
              type="date" 
              class="date-input"
            />
          </div>
          
          <div class="filter-group">
            <label for="end-date">End Date:</label>
            <input 
              id="end-date"
              v-model="endDateFilter" 
              type="date" 
              class="date-input"
            />
          </div>
          
          <div class="filter-group">
            <label for="sort">Sort By:</label>
            <select id="sort" v-model="sortBy" class="sort-select">
              <option value="-startDate">Newest First</option>
              <option value="startDate">Oldest First</option>
              <option value="-distance">Longest Distance</option>
              <option value="-movingTime">Longest Duration</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>
          
          <div class="filter-actions">
            <button @click="applyFilters" class="apply-btn">Apply</button>
            <button @click="clearFilters" class="clear-btn">Clear</button>
            <button type="button" @click="goToBulkEdit" class="bulk-edit-btn">Bulk Edit</button>
          </div>
        </div>
      </div>




      <!-- Loading State -->
      <div v-if="isLoading" class="loading">
        <div class="loading-spinner"></div>
        <p>Loading paddle activities...</p>
      </div>


      <!-- Activities List -->
      <div v-if="activities.length > 0">
        <div class="activities-grid">
          <div v-for="activity in activities" :key="activity._id" class="activity-card">
            <div class="activity-header">
              <h3 class="activity-name">{{ activity.name }}</h3>
              <span class="activity-type">{{ activity.sportType || activity.type }}</span>
            </div>

            <div class="activity-meta">
              📅 {{ formatDate(activity.startDate) }}
            </div>

            <div class="activity-stats">
              <div class="stat">
                <span class="stat-label">Distance</span>
                <span class="stat-value">{{ formatDistance(activity.distance) }}</span>
              </div>

              <div class="stat">
                <span class="stat-label">⏱️ Time</span>
                <span class="stat-value">{{ formatDuration(activity.movingTime) }}</span>
              </div>

              <div class="stat" v-if="activity.averageSpeed">
                <span class="stat-label">🚤 Avg Speed</span>
                <span class="stat-value">{{ formatSpeed(activity.averageSpeed) }}</span>
              </div>

              <div class="stat" v-if="activity.totalElevationGain">
                <span class="stat-label">⛰️ Elevation</span>
                <span class="stat-value">{{ Math.round(activity.totalElevationGain) }}m</span>
              </div>
            </div>
            <!-- Editable fields at bottom of card -->
            <div class="activity-edit-fields">
              <span class="activity-water-type">
                💧
                <template v-if="editingWaterTypeId === activity._id">
                  <select v-model="inlineWaterType" @change="updateWaterType(activity)" :disabled="inlineLoadingId === activity._id">
                    <option value="" disabled>Select water type</option>
                    <option v-for="type in waterTypes" :key="type._id" :value="type.name">
                      {{ type.name.charAt(0).toUpperCase() + type.name.slice(1) }}
                    </option>
                  </select>
                  <span v-if="inlineLoadingId === activity._id" class="inline-loading">⏳</span>
                  <button @click="editingWaterTypeId = null" :disabled="inlineLoadingId === activity._id">✕</button>
                </template>
                <template v-else>
                  <span v-if="activity.waterType">
                    {{ activity.waterType.charAt(0).toUpperCase() + activity.waterType.slice(1) }}
                    <button class="edit-btn" @click="startInlineEdit(activity)">✎</button>
                  </span>
                  <span v-else>
                    <button class="add-btn" @click="startInlineEdit(activity)">Add water type</button>
                  </span>
                </template>
              </span>
            </div>
          </div>

          <!-- Pagination Controls -->
          <div v-if="pagination && pagination.totalPages > 1" class="pagination">
            <button 
              @click="goToPage(1)" 
              :disabled="!pagination.hasPrevPage"
              class="pagination-btn"
            >
              « First
            </button>

            <button 
              @click="goToPage(pagination.currentPage - 1)" 
              :disabled="!pagination.hasPrevPage"
              class="pagination-btn"
            >
              ‹ Prev
            </button>

            <div class="pagination-info">
              Page {{ pagination.currentPage }} of {{ pagination.totalPages }}
            </div>

            <button 
              @click="goToPage(pagination.currentPage + 1)" 
              :disabled="!pagination.hasNextPage"
              class="pagination-btn"
            >
              Next ›
            </button>

            <button 
              @click="goToPage(pagination.totalPages)" 
              :disabled="!pagination.hasNextPage"
              class="pagination-btn"
            >
              Last »
            </button>
          </div>
        </div>
      </div>

      <!-- No Activities Message -->
      <div v-else-if="isConnectedToStrava && !isLoading" class="no-activities">
        <div class="no-activities-content">
          <h3>No Paddle Activities Found</h3>
          <p>No paddle sports activities were found in your Strava account. Make sure to:</p>
          <ul>
            <li>Log your paddle sessions in Strava</li>
            <li>Use activity types like "Kayaking", "Canoeing", "Stand Up Paddleboarding", or "Paddling"</li>
            <li>Include paddle sport keywords in your activity names</li>
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
  padding-top: 2rem;
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
  flex-wrap: wrap;
  gap: 1rem;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
}

@media (max-width: 768px) {
  .action-buttons {
    flex-direction: column;
    width: 100%;
    gap: 0.5rem;
  }
  
  .action-buttons button {
    width: 100%;
    text-align: center;
  }
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

.disconnect-btn, .refresh-btn, .sync-btn, .sync-all-btn {
  padding: 0.5rem 1rem;
  border: 2px solid #e2e8f0;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  white-space: nowrap;
}

.disconnect-btn:hover {
  border-color: #fc8181;
  color: #c53030;
}

.refresh-btn:hover:not(:disabled) {
  border-color: #4299e1;
  color: #3182ce;
}

.sync-btn:hover:not(:disabled) {
  border-color: #38a169;
  color: #2f855a;
  background: #f0fff4;
}

.sync-all-btn {
  background: #1a365d;
  color: white;
  border-color: #1a365d;
}

.sync-all-btn:hover:not(:disabled) {
  background: #2a4365;
  border-color: #2a4365;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(26, 54, 93, 0.3);
}

.refresh-btn:disabled, .sync-btn:disabled, .sync-all-btn:disabled {
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

.error-title {
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.error-content {
  margin-bottom: 0.5rem;
}

.error-details {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #fc8181;
}

.error-details summary {
  cursor: pointer;
  font-weight: bold;
  color: #c53030;
  margin-bottom: 0.5rem;
}

.error-details pre {
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 1rem;
  font-size: 0.875rem;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: #2d3748;
  margin-top: 0.5rem;
}

.success-message {
  background: #f0fff4;
  color: #2f855a;
  padding: 1rem;
  border: 1px solid #9ae6b4;
  border-radius: 8px;
  margin-bottom: 2rem;
}

/* Filters Section */
.filters-section {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.filters-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 120px;
}

.filter-group label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #4a5568;
}

.search-input, .sport-select, .sort-select, .water-type-select, .date-input {
  padding: 0.5rem;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: border-color 0.3s ease;
}

.search-input:focus, .sport-select:focus, .sort-select:focus, .water-type-select:focus, .date-input:focus {
  outline: none;
  border-color: #4299e1;
}

.filter-actions {
  display: flex;
  gap: 0.5rem;
  align-items: end;
}

.apply-btn, .clear-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.apply-btn {
  background: #4299e1;
  color: white;
}

.apply-btn:hover {
  background: #3182ce;
}

.clear-btn {
  background: #e2e8f0;
  color: #4a5568;
}

.clear-btn:hover {
  background: #cbd5e0;
}

/* Activities Section */
.activities-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.activities-count {
  color: #666;
  font-size: 0.9rem;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: 2rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 10px;
}

.pagination-btn {
  padding: 0.5rem 1rem;
  border: 2px solid #e2e8f0;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.pagination-btn:hover:not(:disabled) {
  border-color: #4299e1;
  color: #3182ce;
  background: #f7fafc;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  padding: 0.5rem 1rem;
  font-weight: 500;
  color: #4a5568;
  background: #f7fafc;
  border-radius: 6px;
  min-width: 120px;
  text-align: center;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .filters-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-group {
    min-width: unset;
  }
  
  .filter-actions {
    align-self: stretch;
    margin-top: 0.5rem;
  }
  
  .filter-actions button {
    flex: 1;
  }
  
  .activities-header {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }
  
  .pagination {
    flex-wrap: wrap;
    gap: 0.25rem;
  }
  
  .pagination-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }
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
  color: #2c5282;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.activity-meta {
  color: #2d3748;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 1rem;
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
    padding: 0 1rem;
  }
  
  .header-content h1 {
    font-size: clamp(1.5rem, 5vw, 2rem);
  }
  
  .header-actions {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .paddle-partner-access {
    font-size: 0.8rem;
    padding: 0.4rem 0.8rem;
  }
  
  .activities-main {
    padding: 1rem;
  }
  
  .strava-section {
    padding: 1rem;
    margin-bottom: 1rem;
  }
  
  .activities-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .activity-card {
    padding: 1rem;
  }
  
  .activity-stats {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .strava-connected {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .connection-status {
    justify-content: center;
  }
  
  .strava-connect-btn {
    font-size: clamp(0.9rem, 3vw, 1.1rem);
    padding: 1rem 1.5rem;
  }
}

/* Mobile portrait */
@media (max-width: 480px) {
  .activities-main {
    padding: 0.5rem;
  }
  
  .strava-section {
    padding: 0.75rem;
    border-radius: 10px;
  }
  
  .activity-card {
    padding: 0.75rem;
    border-radius: 8px;
  }
  
  .activity-header h3 {
    font-size: 1rem;
    line-height: 1.3;
  }
  
  .activity-type {
    padding: 0.2rem 0.5rem;
    font-size: 0.7rem;
  }
  
  .stat {
    padding: 0.5rem;
  }
  
  .stat-value {
    font-size: 1rem;
  }
  
  .no-activities, .getting-started {
    padding: 1rem;
    margin: 0.5rem;
  }
  
  .setup-steps {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

/* Tablet styles */
@media (min-width: 769px) and (max-width: 1024px) {
  .activities-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .strava-connected {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
  }
  
  .setup-steps {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Activities Section */
.activities-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.activities-count {
  color: #666;
  font-size: 0.9rem;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: 2rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 10px;
}

.pagination-btn {
  padding: 0.5rem 1rem;
  border: 2px solid #e2e8f0;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.pagination-btn:hover:not(:disabled) {
  border-color: #4299e1;
  color: #3182ce;
  background: #f7fafc;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  padding: 0.5rem 1rem;
  font-weight: 500;
  color: #4a5568;
  background: #f7fafc;
  border-radius: 6px;
  min-width: 120px;
  text-align: center;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .filters-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-group {
    min-width: unset;
  }
  
  .filter-actions {
    align-self: stretch;
    margin-top: 0.5rem;
  }
  
  .filter-actions button {
    flex: 1;
  }
  
  .activities-header {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }
  
  .pagination {
    flex-wrap: wrap;
    gap: 0.25rem;
  }
  
  .pagination-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }
}

/* Bulk Edit Button Styles */
.bulk-edit-btn {
  background: #764ba2;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
  margin-left: 0.5rem;
  transition: background 0.2s;
}
.bulk-edit-btn:hover {
  background: #667eea;
}

/* Activity Water Type Inline Editing Styles */
.activity-edit-fields {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.activity-water-type {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #2c5282;
}

.activity-water-type span {
  color: #2c5282;
}

.activity-water-type select {
  padding: 0.5rem;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: border-color 0.3s ease;
  background: white;
  cursor: pointer;
  color: #2c5282;
}

.activity-water-type select:focus {
  outline: none;
  border-color: #4299e1;
}

.activity-water-type select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.activity-water-type button {
  padding: 0.25rem 0.5rem;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  color: #2c5282;
}

.activity-water-type button:hover:not(:disabled) {
  background: #f7fafc;
  border-color: #cbd5e0;
}

.activity-water-type button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.activity-water-type .edit-btn {
  background: #4299e1;
  color: white;
  border-color: #4299e1;
  margin-left: 0.5rem;
}

.activity-water-type .edit-btn:hover {
  background: #3182ce;
  border-color: #3182ce;
}

.activity-water-type .add-btn {
  background: #48bb78;
  color: white;
  border-color: #48bb78;
  padding: 0.5rem 1rem;
}

.activity-water-type .add-btn:hover {
  background: #38a169;
  border-color: #38a169;
}

.activity-water-type .inline-loading {
  color: #4299e1;
  font-size: 1rem;
}

@media (min-width: 1200px) {
  .activities-main {
    padding: 3rem 2rem;
  }
  
  .activities-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
  }
  
  .strava-section {
    padding: 2.5rem;
  }
}
</style>