<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { authService } from '../services/authService'
import { activityService } from '../services/activityService'
import { useAuth } from '../composables/useAuth'

defineProps<{ msg: string }>()

// Use shared authentication state
const { isAuthenticated } = useAuth()

// Mock data for non-logged-in users
const mockYearlyData = [
  { year: 2020, days: 45 },
  { year: 2021, days: 62 },
  { year: 2022, days: 78 },
  { year: 2023, days: 89 },
  { year: 2024, days: 94 },
  { year: 2025, days: 67 }
]

const yearlyData = ref(mockYearlyData)
const isLoading = ref(false)
const error = ref('')

const totalDays = computed(() => yearlyData.value.reduce((sum, d) => sum + d.days, 0))

const fetchYearlyData = async () => {
  if (!isAuthenticated.value) {
    yearlyData.value = mockYearlyData
    return
  }

  try {
    isLoading.value = true
    error.value = ''
    
    if (import.meta.env.DEV) {
      console.log('📊 HelloWorld - Fetching user activity data...')
    }
    
    // Get all activities for the logged-in user
    const response = await activityService.getActivities({
      limit: 1000, // Get all activities
      sort: '-startDate'
    })
    
    if (response.success && response.activities) {
      // Process activities to get yearly totals
      const yearlyTotals = new Map<number, Set<string>>()
      
      response.activities.forEach(activity => {
        const activityDate = new Date(activity.startDate)
        const year = activityDate.getFullYear()
        const dayKey = activityDate.toISOString().split('T')[0] // YYYY-MM-DD format
        
        if (!yearlyTotals.has(year)) {
          yearlyTotals.set(year, new Set())
        }
        if (dayKey) {
          yearlyTotals.get(year)!.add(dayKey)
        }
      })
      
      // Convert to array format, ensuring we have data for recent years
      const currentYear = new Date().getFullYear()
      const years = []
      for (let year = Math.max(2020, currentYear - 5); year <= currentYear; year++) {
        years.push({
          year,
          days: yearlyTotals.get(year)?.size || 0
        })
      }
      
      yearlyData.value = years
      
      if (import.meta.env.DEV) {
        console.log('📊 HelloWorld - User data loaded:', years)
      }
    } else {
      // Fall back to mock data if no activities
      yearlyData.value = mockYearlyData
    }
  } catch (err: any) {
    console.error('Failed to fetch yearly data:', err)
    error.value = 'Failed to load paddling data'
    // Fall back to mock data on error
    yearlyData.value = mockYearlyData
  } finally {
    isLoading.value = false
  }
}

// Watch for authentication changes and refetch data
watch(isAuthenticated, (newValue, oldValue) => {
  if (import.meta.env.DEV) {
    console.log('📊 HelloWorld - Auth state changed:', {
      from: oldValue,
      to: newValue,
      timestamp: new Date().toISOString()
    })
  }
  
  if (newValue !== oldValue) {
    if (import.meta.env.DEV) {
      console.log('📊 HelloWorld - Triggering data refetch due to auth change')
    }
    fetchYearlyData()
  }
}, { immediate: false })

onMounted(async () => {
  // Fetch appropriate data based on current auth state
  await fetchYearlyData()
})
</script>

<template>
  <div class="content-card">
    <h1>{{ msg }}</h1>

    <div class="card">
      <div class="stats-header">
        <h3>🏄‍♂️ Paddling Days Per Year</h3>
        <p class="total-counter">Total Days: {{ totalDays }}</p>
        <div v-if="isAuthenticated" class="analysis-link-container">
          <router-link to="/analysis" class="analysis-link">
            📊 View Detailed Analysis
          </router-link>
        </div>
        <p v-if="!isAuthenticated" class="data-source">📊 Sample Data - Sign in to see your stats</p>
        <p v-else-if="!isLoading && !error" class="data-source">📈 Your Personal Data</p>
        <p v-if="error" class="error-message">⚠️ {{ error }}</p>
      </div>
      
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading your paddling data...</p>
      </div>
      
      <div v-else class="yearly-chart">
        <div v-for="data in yearlyData" :key="data.year" class="chart-bar-container">
          <div class="stacked-bar">
            <div class="remaining-portion"></div>
            <div 
              class="paddled-portion" 
                          :style="{ height: `${data.days === 0 ? 5 : (data.days / Math.max(...yearlyData.map(d => d.days), 1)) * 100}%` }"
              :title="`${data.year}: ${data.days} days paddled out of 365`"
            >
              <span class="bar-value">{{ data.days }}</span>
            </div>
          </div>
          <span class="bar-label">{{ data.year }}</span>
          <span class="percentage-label">{{ Math.round((data.days / 365) * 100) }}%</span>
        </div>
      </div>
      
      <p v-if="!isLoading">
        {{ isAuthenticated ? 'Your paddling activity as a percentage of total days per year' : 'Each bar shows paddling days as a percentage of the year (365 days)' }}
      </p>
    </div>

    <div class="info-grid">
      <div class="info-card">
        <h3>🌊 Paddle Challenges</h3>
        <ul>
          <li>Multi-sport tracking (kayak, canoe, SUP)</li>
          <li>Technical rapid navigation</li>
          <li>Distance and endurance goals</li>
          <li>Weather and water conditions</li>
        </ul>
      </div>
      
      <div class="info-card">
        <h3>🛶 Paddle Features</h3>
        <ul>
          <li>Strava activity sync</li>
          <li>Progress tracking</li>
          <li>Route planning tools</li>
          <li>Community sharing</li>
        </ul>
      </div>
    </div>

    <p class="read-the-docs">
      Built with modern web technologies for the best paddle sports tracking experience.
    </p>
  </div>
</template>

<style scoped>
.content-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: clamp(1rem, 3vw, 2rem);
  margin: 1rem auto 2rem;
  max-width: min(800px, 95vw);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
}

.content-card h1 {
  color: #2c5282;
  margin-bottom: 1.5rem;
  font-size: clamp(1.3rem, 4vw, 2rem);
  text-align: center;
}

.card {
  background: linear-gradient(135deg, #4299e1, #3182ce);
  color: white;
  padding: 1.5rem;
  border-radius: 10px;
  margin: 1.5rem 0;
  text-align: center;
}

.stats-header {
  margin-bottom: 1.5rem;
}

.stats-header h3 {
  margin: 0 0 0.5rem 0;
  font-size: clamp(1.1rem, 3vw, 1.4rem);
  font-weight: 600;
}

.total-counter {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  display: inline-block;
  font-weight: 600;
  font-size: clamp(0.9rem, 2.5vw, 1rem);
  margin: 0 0 0.5rem 0;
}

.analysis-link-container {
  margin: 0.75rem 0 0.5rem 0;
}

.analysis-link {
  background: linear-gradient(45deg, #3182ce, #2c5282);
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  display: inline-block;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.analysis-link:hover {
  background: linear-gradient(45deg, #2c5282, #2a4365);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.data-source {
  background: rgba(255, 255, 255, 0.15);
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  display: inline-block;
  font-size: clamp(0.75rem, 2vw, 0.85rem);
  margin: 0.25rem 0 0 0;
  opacity: 0.9;
}

.error-message {
  background: rgba(255, 107, 107, 0.3);
  padding: 0.5rem 1rem;
  border-radius: 15px;
  display: inline-block;
  font-size: clamp(0.8rem, 2vw, 0.9rem);
  margin: 0.25rem 0 0 0;
  border: 1px solid rgba(255, 107, 107, 0.5);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 150px;
  gap: 1rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.yearly-chart {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 150px;
  margin: 1.5rem 0;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  gap: 0.5rem;
}

.chart-bar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  max-width: 60px;
}

.stacked-bar {
  width: 100%;
  height: 120px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.3);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.paddled-portion {
  width: 100%;
  background: linear-gradient(to top, rgba(72, 187, 120, 0.9), rgba(72, 187, 120, 1));
  position: relative;
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 0.25rem;
  min-height: 2px;
  order: 2;
}

.paddled-portion:hover {
  background: linear-gradient(to top, rgba(72, 187, 120, 1), rgba(104, 211, 145, 1));
  transform: scaleX(1.05);
}

.remaining-portion {
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  order: 1;
}

.bar-value {
  color: white;
  font-weight: 600;
  font-size: clamp(0.6rem, 1.8vw, 0.75rem);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.bar-label {
  color: white;
  font-size: clamp(0.7rem, 2vw, 0.8rem);
  font-weight: 500;
  margin-top: 0.5rem;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.percentage-label {
  color: rgba(255, 255, 255, 0.8);
  font-size: clamp(0.6rem, 1.8vw, 0.7rem);
  font-weight: 500;
  margin-top: 0.25rem;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(250px, 100%), 1fr));
  gap: clamp(1rem, 3vw, 1.5rem);
  margin: 2rem 0;
}

.info-card {
  background: linear-gradient(135deg, #e6fffa, #b2f5ea);
  padding: 1.5rem;
  border-radius: 10px;
  border-left: 4px solid #38b2ac;
}

.info-card h3 {
  color: #2c7a7b;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: clamp(1rem, 2.5vw, 1.2rem);
  flex-wrap: wrap;
}

.info-card ul {
  color: #2d3748;
  margin: 0;
  padding-left: 1.2rem;
  font-size: clamp(0.8rem, 2vw, 0.9rem);
}

.info-card li {
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.read-the-docs {
  color: #666;
  text-align: center;
  margin-top: 2rem;
  font-size: clamp(0.8rem, 2vw, 0.9rem);
  line-height: 1.5;
}

.read-the-docs a {
  color: #3182ce;
  text-decoration: none;
  font-weight: 500;
}

.read-the-docs a:hover {
  text-decoration: underline;
}

/* Mobile-specific adjustments */
@media (max-width: 480px) {
  .content-card {
    margin: 0.5rem;
    padding: 1rem;
    border-radius: 10px;
  }
  
  .card {
    padding: 1rem;
    margin: 1rem 0;
  }
  
  .yearly-chart {
    height: 120px;
    padding: 0.75rem;
    gap: 0.25rem;
  }
  
  .stacked-bar {
    height: 100px;
  }
  
  .chart-bar-container {
    max-width: 45px;
  }
  
  .stats-header h3 {
    font-size: 1rem;
  }
  
  .info-grid {
    gap: 1rem;
    margin: 1.5rem 0;
  }
  
  .info-card {
    padding: 1rem;
  }
  
  .info-card h3 {
    justify-content: center;
    text-align: center;
  }
}

/* Tablet adjustments */
@media (min-width: 768px) and (max-width: 1024px) {
  .info-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Large screen adjustments */
@media (min-width: 1024px) {
  .content-card {
    padding: 2.5rem;
  }
  
  .yearly-chart {
    height: 180px;
    padding: 1.5rem;
  }
  
  .stacked-bar {
    height: 150px;
  }
  
  .chart-bar-container {
    max-width: 80px;
  }
}
</style>
