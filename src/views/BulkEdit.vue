<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { activityService, type Activity } from '../services/activityService'
import { getWaterTypes, type WaterType } from '../services/waterTypeService'

const router = useRouter()
const route = useRoute()

const activities = ref<Activity[]>([])
const isLoading = ref(false)
const error = ref('')
const waterTypes = ref<WaterType[]>([])
const selectedWaterType = ref('')
const bulkLoading = ref(false)

// Filters from query params
const searchQuery = ref(route.query.search || '')
const selectedSportType = ref(route.query.sportType || 'all')
const sortBy = ref(route.query.sort || '-startDate')

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
      search: searchQuery.value ? String(searchQuery.value) : undefined
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
  if (!selectedWaterType.value) return
  bulkLoading.value = true
  try {
    await Promise.all(activities.value.map(async (activity) => {
      if (activity.waterType !== selectedWaterType.value) {
        await activityService.updateActivity(activity._id, { waterType: selectedWaterType.value })
        activity.waterType = selectedWaterType.value
      }
    }))
  } catch (e: any) {
    alert(e.message || 'Failed to update all water types.')
  } finally {
    bulkLoading.value = false
  }
}

function goBack() {
  router.push({ name: 'Activities' })
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
    <header class="bulk-edit-header">
      <h1>Bulk Edit Activities</h1>
      <button @click="goBack" class="back-btn">← Back to Activities</button>
    </header>
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
/* Add style for apply-btn to match Activities page */
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
</template>

<style scoped>
.bulk-edit-container {
  max-width: 900px;
  margin: 2rem auto;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(0,0,0,0.10);
  padding: 2rem;
}
.bulk-edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}
.back-btn {
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 1rem;
}
.bulk-edit-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.activities-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}
.activities-table th, .activities-table td {
  border: 1px solid #e2e8f0;
  padding: 0.75rem 1rem;
  text-align: left;
}
.activities-table th {
  background: #f7fafc;
}
.inline-loading {
  margin-left: 0.5rem;
}
.no-activities {
  color: #666;
  text-align: center;
  margin-top: 2rem;
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
  padding: 2rem;
}
</style>
