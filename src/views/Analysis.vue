<template>
  <div class="analysis-container">
    <div class="content-wrapper">
      <h1 class="page-title">📊 Analysis Dashboard</h1>
      <p class="page-subtitle">Comprehensive insights into your paddling activities</p>
      
      <!-- Loading State -->
      <div v-if="isLoading" class="loading">
        <div class="loading-spinner"></div>
        <p>Loading your analysis...</p>
      </div>

      <!-- Error State -->
      <div v-if="error" class="error-message">
        <p>⚠️ {{ error }}</p>
        <button @click="fetchAnalysisData" class="retry-btn">Try Again</button>
      </div>

      <!-- Analysis Content -->
      <div v-if="!isLoading && !error" class="analysis-content">

      <!-- Yearly Progress - Moved to top -->
      <div class="chart-container">
        <div class="yearly-progress-header">
          <div class="header-left">
            <h3>📅 Yearly Progress</h3>
            <span v-if="isYearlyProgressCollapsed" class="selected-year-indicator">
              {{ selectedYear ? `(${selectedYear})` : '(All Years)' }}
            </span>
            <button @click="toggleYearlyProgress" class="collapse-btn" :class="{ collapsed: isYearlyProgressCollapsed }">
              <span class="collapse-icon">{{ isYearlyProgressCollapsed ? '▶' : '▼' }}</span>
            </button>
          </div>
          <div class="year-filter-options" v-show="!isYearlyProgressCollapsed">
            <button 
              @click="filterByYear(null)" 
              :class="{ active: selectedYear === null }"
              class="year-filter-btn all-years-btn"
            >
              All Years
            </button>
          </div>
        </div>
        <div class="yearly-progress" v-show="!isYearlyProgressCollapsed">
          <div 
            v-for="year in yearlyProgress" 
            :key="year.year" 
            class="year-item"
            :class="{ active: selectedYear === year.year, clickable: true }"
            @click="filterByYear(year.year)"
          >
            <div class="year-header">
              <h4>{{ year.year }}</h4>
              <span class="year-total">{{ year.activities }} activities</span>
            </div>
            <div class="progress-bar">
              <div 
                class="progress-fill"
                :style="{ width: `${year.percentage}%` }"
              ></div>
            </div>
            <div class="year-stats">
              <span>{{ formatDistance(year.distance) }}</span>
              <span>{{ formatDuration(year.time) }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Overview Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <h3>Total Activities</h3>
          <div class="stat-value">{{ stats.totalActivities }}</div>
          <div class="stat-label">Paddle Sessions</div>
        </div>
        
        <div class="stat-card">
          <h3>Total Distance</h3>
          <div class="stat-value">{{ formatDistance(stats.totalDistance) }}</div>
          <div class="stat-label">Paddled</div>
        </div>
        
        <div class="stat-card">
          <h3>Total Time</h3>
          <div class="stat-value">{{ formatDuration(stats.totalTime) }}</div>
          <div class="stat-label">On Water</div>
        </div>
        
        <div class="stat-card">
          <h3>Longest Session</h3>
          <div class="stat-value">{{ formatDistance(stats.longestActivity) }}</div>
          <div class="stat-label">Personal Best</div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="charts-section">
        
        <!-- Monthly Activity Chart -->
        <div class="chart-container">
          <h3>📈 Monthly Activity Trends</h3>
          <div class="monthly-chart">
            <div v-for="month in monthlyData" :key="month.month" class="month-bar">
              <div class="bar-container">
                <div 
                  class="activity-bar"
                  :style="{ height: `${(month.count / maxMonthlyActivities) * 100}%` }"
                  :title="`${month.month}: ${month.count} activities, ${formatDistance(month.distance)}`"
                >
                  <span class="bar-value">{{ month.count }}</span>
                </div>
              </div>
              <span class="month-label">{{ formatMonth(month.month) }}</span>
            </div>
          </div>
        </div>

        <!-- Sport Type Breakdown -->
        <div class="chart-container">
          <h3>🛶 Activity Types</h3>
          <div class="sport-breakdown">
            <div v-for="(count, sport) in stats.sportTypeBreakdown" :key="sport" class="sport-item">
              <div class="sport-bar-container">
                <div class="sport-label">{{ sport }}</div>
                <div class="sport-bar-wrapper">
                  <div 
                    class="sport-bar"
                    :style="{ width: `${(count / stats.totalActivities) * 100}%` }"
                  ></div>
                  <span class="sport-count">{{ count }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Insights Section -->
      <div class="insights-section">
        <h3>💡 Insights</h3>
        <div class="insights-grid">
          <div class="insight-card">
            <h4>🏆 Best Month</h4>
            <p>{{ bestMonth.month }} with {{ bestMonth.count }} activities</p>
          </div>
          
          <div class="insight-card">
            <h4>📊 Average Distance</h4>
            <p>{{ formatDistance(stats.averageDistance) }} per session</p>
          </div>
          
          <div class="insight-card">
            <h4>🎯 Favorite Activity</h4>
            <p>{{ stats.favoriteSportType || 'Keep tracking to find out!' }}</p>
          </div>
          
          <div class="insight-card">
            <h4>⏰ Time per Week</h4>
            <p>{{ formatDuration(averageWeeklyTime) }} average</p>
          </div>
        </div>
      </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { authService } from '../services/authService'
import { activityService } from '../services/activityService'

interface ActivityStats {
  totalActivities: number
  totalDistance: number
  totalTime: number
  averageDistance: number
  longestActivity: number
  sportTypeBreakdown: Record<string, number>
  monthlyStats: Array<{
    month: string
    count: number
    distance: number
  }>
  favoriteSportType?: string
}

const isLoading = ref(true)
const error = ref('')
const selectedYear = ref<number | null>(null)
const isYearlyProgressCollapsed = ref(false)
const allActivities = ref<any[]>([])
const stats = ref<ActivityStats>({
  totalActivities: 0,
  totalDistance: 0,
  totalTime: 0,
  averageDistance: 0,
  longestActivity: 0,
  sportTypeBreakdown: {},
  monthlyStats: []
})

const monthlyData = computed(() => {
  // Get last 12 months of data
  const data = stats.value.monthlyStats.slice(-12)
  return data.length > 0 ? data : []
})

const maxMonthlyActivities = computed(() => {
  return Math.max(...monthlyData.value.map(m => m.count), 1)
})

const yearlyProgress = computed(() => {
  const yearlyData = new Map<number, { activities: number, distance: number, time: number }>()
  
  // Process all activities to get yearly data
  allActivities.value.forEach(activity => {
    const year = new Date(activity.startDate).getFullYear()
    if (!yearlyData.has(year)) {
      yearlyData.set(year, { activities: 0, distance: 0, time: 0 })
    }
    const yearData = yearlyData.get(year)!
    yearData.activities++
    yearData.distance += activity.distance || 0
    yearData.time += activity.movingTime || 0
  })
  
  // Convert to array and sort by year
  const years = Array.from(yearlyData.entries())
    .map(([year, data]) => ({ year, ...data }))
    .sort((a, b) => b.year - a.year) // Most recent first
  
  // Calculate percentages
  const maxActivities = Math.max(...years.map(y => y.activities), 1)
  
  return years.map(year => ({
    ...year,
    percentage: (year.activities / maxActivities) * 100
  }))
})

const bestMonth = computed(() => {
  if (monthlyData.value.length === 0) {
    return { month: 'N/A', count: 0 }
  }
  
  const best = monthlyData.value.reduce((max, current) => 
    current.count > max.count ? current : max
  )
  
  return {
    month: formatMonth(best.month),
    count: best.count
  }
})

const averageWeeklyTime = computed(() => {
  if (stats.value.totalActivities === 0) return 0
  
  // Rough estimate: total time divided by estimated weeks
  const estimatedWeeks = Math.max(stats.value.totalActivities / 2, 1)
  return stats.value.totalTime / estimatedWeeks
})

const filterByYear = (year: number | null) => {
  selectedYear.value = year
  calculateStats()
}

const toggleYearlyProgress = () => {
  isYearlyProgressCollapsed.value = !isYearlyProgressCollapsed.value
}

const calculateStats = () => {
  let filteredActivities = allActivities.value
  
  // Filter by selected year if applicable
  if (selectedYear.value !== null) {
    filteredActivities = allActivities.value.filter(activity => {
      const activityYear = new Date(activity.startDate).getFullYear()
      return activityYear === selectedYear.value
    })
  }
  
  // Calculate statistics from filtered activities
  const newStats: ActivityStats = {
    totalActivities: filteredActivities.length,
    totalDistance: filteredActivities.reduce((sum, act) => sum + (act.distance || 0), 0),
    totalTime: filteredActivities.reduce((sum, act) => sum + (act.movingTime || 0), 0),
    averageDistance: 0,
    longestActivity: Math.max(...filteredActivities.map(act => act.distance || 0), 0),
    sportTypeBreakdown: {},
    monthlyStats: []
  }
  
  newStats.averageDistance = newStats.totalActivities > 0 ? newStats.totalDistance / newStats.totalActivities : 0
  
  // Sport type breakdown
  filteredActivities.forEach(activity => {
    const sportType = activity.sportType || 'Unknown'
    newStats.sportTypeBreakdown[sportType] = (newStats.sportTypeBreakdown[sportType] || 0) + 1
  })
  
  // Monthly stats
  const monthlyData: Record<string, { count: number, distance: number }> = {}
  filteredActivities.forEach(activity => {
    const month = new Date(activity.startDate).toISOString().slice(0, 7) // YYYY-MM
    if (!monthlyData[month]) {
      monthlyData[month] = { count: 0, distance: 0 }
    }
    monthlyData[month].count++
    monthlyData[month].distance += activity.distance || 0
  })
  
  newStats.monthlyStats = Object.entries(monthlyData)
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => a.month.localeCompare(b.month))
  
  stats.value = newStats
}

const fetchAnalysisData = async () => {
  if (!authService.isAuthenticated()) {
    error.value = 'Please log in to view your analysis'
    isLoading.value = false
    return
  }

  try {
    isLoading.value = true
    error.value = ''
    
    // Fetch all activities to enable year filtering
    const response = await activityService.getActivities({
      limit: 1000, // Get all activities
      sort: '-startDate'
    })
    
    if (response.success && response.activities) {
      allActivities.value = response.activities
      // Calculate initial stats (all years)
      selectedYear.value = null
      calculateStats()
    } else {
      error.value = 'Failed to load analysis data'
    }
  } catch (err: any) {
    console.error('Failed to fetch analysis data:', err)
    error.value = err.message || 'Failed to load analysis data'
  } finally {
    isLoading.value = false
  }
}

const formatDistance = (meters: number): string => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`
  }
  return `${Math.round(meters)} m`
}

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

const formatMonth = (monthStr: string): string => {
  const [year, month] = monthStr.split('-')
  const date = new Date(parseInt(year || '0'), parseInt(month || '1') - 1)
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

onMounted(() => {
  fetchAnalysisData()
})
</script>

<style scoped>
.analysis-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding-top: 2rem;
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.page-title {
  color: white;
  margin: 0 0 0.5rem 0;
  font-size: 2.5rem;
  text-align: center;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.page-subtitle {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.1rem;
  text-align: center;
  margin: 0 0 2rem 0;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.loading {
  text-align: center;
  padding: 4rem 2rem;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  color: #2c5282;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-left: 4px solid #3182ce;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  text-align: center;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  color: #e53e3e;
}

.retry-btn {
  background: #3182ce;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 1rem;
  transition: background 0.3s ease;
}

.retry-btn:hover {
  background: #2c5282;
}

.analysis-content {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.stat-card h3 {
  color: #4a5568;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  text-transform: uppercase;
  font-weight: 600;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #2c5282;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
}

.charts-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.chart-container {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.chart-container h3 {
  color: #2c5282;
  margin-bottom: 1.5rem;
}

.monthly-chart {
  display: flex;
  gap: 0.5rem;
  align-items: end;
  height: 200px;
  padding: 1rem 0;
}

.month-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.bar-container {
  height: 150px;
  display: flex;
  align-items: end;
  width: 100%;
  justify-content: center;
}

.activity-bar {
  background: linear-gradient(180deg, #3182ce 0%, #2c5282 100%);
  width: 80%;
  min-height: 4px;
  border-radius: 4px 4px 0 0;
  display: flex;
  align-items: end;
  justify-content: center;
  color: white;
  font-size: 0.8rem;
  font-weight: bold;
  position: relative;
}

.bar-value {
  position: absolute;
  bottom: 4px;
}

.month-label {
  font-size: 0.8rem;
  color: #666;
  margin-top: 0.5rem;
}

.sport-breakdown {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.sport-item {
  display: flex;
  align-items: center;
}

.sport-bar-container {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.sport-label {
  min-width: 120px;
  font-weight: 500;
  color: #4a5568;
}

.sport-bar-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sport-bar {
  background: linear-gradient(90deg, #3182ce 0%, #2c5282 100%);
  height: 24px;
  border-radius: 12px;
  min-width: 20px;
}

.sport-count {
  font-weight: bold;
  color: #2c5282;
  min-width: 30px;
}

.yearly-progress {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.yearly-progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.selected-year-indicator {
  color: #3182ce;
  font-weight: 600;
  font-size: 1rem;
  background: rgba(49, 130, 206, 0.1);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  border: 1px solid rgba(49, 130, 206, 0.3);
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.collapse-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3182ce;
}

.collapse-btn:hover {
  background: rgba(49, 130, 206, 0.1);
}

.collapse-icon {
  font-size: 1rem;
  font-weight: bold;
  transition: transform 0.3s ease;
}

.collapse-btn.collapsed .collapse-icon {
  transform: rotate(0deg);
}

.collapse-btn:not(.collapsed) .collapse-icon {
  transform: rotate(0deg);
}

.year-filter-options {
  display: flex;
  gap: 0.5rem;
}

.year-filter-btn {
  background: rgba(49, 130, 206, 0.1);
  color: #3182ce;
  border: 2px solid #3182ce;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.year-filter-btn:hover {
  background: rgba(49, 130, 206, 0.2);
}

.year-filter-btn.active {
  background: #3182ce;
  color: white;
}

.all-years-btn {
  font-weight: 600;
}

.year-item {
  border: 2px solid rgba(226, 232, 240, 0.6);
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.3s ease;
}

.year-item.clickable {
  cursor: pointer;
}

.year-item.clickable:hover {
  border-color: #3182ce;
  background: rgba(49, 130, 206, 0.05);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.year-item.active {
  border-color: #3182ce;
  background: rgba(49, 130, 206, 0.1);
  box-shadow: 0 4px 12px rgba(49, 130, 206, 0.2);
}

.year-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.year-header h4 {
  color: #2c5282;
  margin: 0;
}

.year-total {
  color: #666;
  font-size: 0.9rem;
}

.progress-bar {
  background: #e2e8f0;
  height: 8px;
  border-radius: 4px;
  margin: 0.5rem 0;
  overflow: hidden;
}

.progress-fill {
  background: linear-gradient(90deg, #3182ce 0%, #2c5282 100%);
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.year-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: #666;
}

.insights-section {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.insights-section h3 {
  color: #2c5282;
  margin-bottom: 1.5rem;
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.insight-card {
  background: rgba(247, 250, 252, 0.8);
  border-radius: 10px;
  padding: 1.5rem;
  border: 1px solid rgba(226, 232, 240, 0.6);
  backdrop-filter: blur(5px);
}

.insight-card h4 {
  color: #2c5282;
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

.insight-card p {
  color: #4a5568;
  margin: 0;
  font-weight: 500;
}

@media (max-width: 768px) {
  .content-wrapper {
    padding: 1rem;
  }
  
  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .header-content h1 {
    font-size: 2rem;
  }

  .yearly-progress-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .header-left {
    justify-content: center;
  }

  .year-filter-options {
    justify-content: center;
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
  
  .chart-container {
    padding: 1rem;
  }
  
  .monthly-chart {
    height: 150px;
  }
  
  .bar-container {
    height: 100px;
  }
}
</style>