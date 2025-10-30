<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Ref } from 'vue'
import { useRoute } from 'vue-router'
import { activityService, type Activity } from '../services/activityService'
import { getWaterTypes, type WaterType } from '../services/waterTypeService'

const route = useRoute()

const activities = ref<Activity[]>([])
const isLoading = ref(false)
const error = ref('')
const waterTypes = ref<WaterType[]>([])
const selectedWaterType: Ref<string> = ref('') // always a string, never null
const bulkLoading = ref(false)

// Filters from query params (normalize to string)
function getQueryString(val: unknown, fallback: string): string {
  if (typeof val === 'string') return val
  if (Array.isArray(val)) return val[0] || fallback
  return fallback
}
const searchQuery = ref(getQueryString(route.query.search, ''))
const selectedSportType = ref(getQueryString(route.query.sportType, 'all'))
const selectedWaterTypeFilter = ref(getQueryString(route.query.waterType, 'all'))
const sortBy = ref(getQueryString(route.query.sort, '-startDate'))
const startDateFilter = ref(getQueryString(route.query.startDate, ''))
const endDateFilter = ref(getQueryString(route.query.endDate, ''))

onMounted(async () => {
  await fetchWaterTypes()
  await fetchActivities()
})

async function fetchWaterTypes() {
  try {
    waterTypes.value = await getWaterTypes()
  } catch (e) {
    waterTypes.value = [
      { _id: 'whitewater', name: 'whitewater', description: 'Whitewater paddling' },
      { _id: 'moving water', name: 'moving water', description: 'Moving water (not whitewater)' },
      { _id: 'flat water', name: 'flat water', description: 'Flat water (lakes, slow rivers)' },
      { _id: 'erg', name: 'erg', description: 'Ergometer (indoor trainer)' }
    ]
  }
}

async function fetchActivities() {
  isLoading.value = true
  error.value = ''
  try {
    const response = await activityService.getActivities({
      page: 1,
      limit: 100,
      sort: sortBy.value,
      sportType: selectedSportType.value !== 'all' ? selectedSportType.value : undefined,
      waterType: selectedWaterTypeFilter.value !== 'all' ? selectedWaterTypeFilter.value : undefined,
      search: searchQuery.value ? String(searchQuery.value) : undefined,
      startDate: startDateFilter.value || undefined,
      endDate: endDateFilter.value || undefined
    })
    if (response.success) {
      activities.value = response.activities || []
    }
  } catch (e: any) {
    error.value = e.message || 'Failed to fetch activities.'
  } finally {
    isLoading.value = false
  }
}

async function applyBulkWaterType() {
  if (selectedWaterType.value === '') return
  bulkLoading.value = true
  try {
    await Promise.all(activities.value.map(async (activity) => {
      if (activity.waterType !== selectedWaterType.value) {
  await activityService.updateActivity(activity._id, { waterType: selectedWaterType.value as string })
  activity.waterType = selectedWaterType.value as string
      }
    }))
  } catch (e: any) {
    alert(e.message || 'Failed to update all water types.')
  } finally {
    bulkLoading.value = false
  }
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<template>
  <div class="bulk-edit-container">
    <div class="bulk-edit-main">
      <h1>Bulk Edit Activities</h1>
      <div v-if="error" class="error-message">⚠️ {{ error }}</div>
      <div v-if="isLoading" class="loading">Loading activities...</div>
    <div v-else>
      <div class="bulk-edit-bar">
        <label for="bulk-water-type"><strong>Bulk set water type for all results:</strong></label>
        <select id="bulk-water-type" v-model="selectedWaterType">
          <option value="" disabled>Select water type</option>
          <option v-for="type in waterTypes" :key="type._id" :value="type.name">
            {{ type.description || (type.name.charAt(0).toUpperCase() + type.name.slice(1)) }}
          </option>
        </select>
        <button @click="applyBulkWaterType" :disabled="!selectedWaterType || bulkLoading" class="apply-btn">Apply to All</button>
        <span v-if="bulkLoading" class="inline-loading">⏳</span>
      </div>

      <table class="activities-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Date</th>
            <th>Sport Type</th>
            <th>Distance</th>
            <th>Water Type</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="activity in activities" :key="activity._id">
            <td>{{ activity.name }}</td>
            <td>{{ formatDate(activity.startDate) }}</td>
            <td>{{ activity.sportType || activity.type }}</td>
            <td>{{ (activity.distance / 1000).toFixed(2) }} km</td>
            <td>{{ activity.waterType ? activity.waterType.charAt(0).toUpperCase() + activity.waterType.slice(1) : '' }}</td>
          </tr>
        </tbody>
      </table>
      <div v-if="activities.length === 0" class="no-activities">No activities found for current filters.</div>
    </div>
    </div>
  </div>
</template>

<style scoped>
.bulk-edit-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding-top: 2rem;
}

.bulk-edit-main {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.bulk-edit-main h1 {
  color: white;
  margin: 0 0 2rem 0;
  font-size: 2rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.bulk-edit-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  background: rgba(255, 255, 255, 0.95);
  padding: 1.5rem;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  flex-wrap: wrap;
}

.bulk-edit-bar label {
  font-size: 0.95rem;
  font-weight: 600;
  color: #2c5282;
}

.bulk-edit-bar select {
  padding: 0.5rem;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: border-color 0.3s ease;
  min-width: 200px;
}

.bulk-edit-bar select:focus {
  outline: none;
  border-color: #4299e1;
}

.apply-btn {
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.apply-btn:hover:not(:disabled) {
  background: #3182ce;
}

.apply-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.activities-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.activities-table th,
.activities-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
  color: #2c5282;
}

.activities-table th {
  background: #f7fafc;
  color: #2c5282;
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.activities-table tbody tr {
  transition: background 0.2s ease;
}

.activities-table tbody tr:hover {
  background: #f7fafc;
}

.activities-table tbody tr:last-child td {
  border-bottom: none;
}

.inline-loading {
  margin-left: 0.5rem;
  color: #4299e1;
}

.no-activities {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 3rem;
  text-align: center;
  color: #2c5282;
  font-size: 1.1rem;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
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
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 3rem;
  text-align: center;
  color: #2c5282;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

/* Apply button styles */
.apply-btn {
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s;
}

.apply-btn:hover {
  background: #3182ce;
}

@media (max-width: 768px) {
  .bulk-edit-container {
    padding: 1rem;
  }

  .bulk-edit-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .bulk-edit-header h1 {
    font-size: 1.5rem;
  }

  .bulk-edit-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .bulk-edit-bar select {
    width: 100%;
  }

  .activities-table {
    font-size: 0.85rem;
  }

  .activities-table th,
  .activities-table td {
    padding: 0.5rem;
  }
}
</style>
