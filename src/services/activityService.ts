import api from './api'

export interface Activity {
  _id?: string
  stravaId?: number
  name: string
  type: string
  sportType: string
  startDate: string
  distance: number
  movingTime: number
  waterType?: string | null
  totalElevationGain?: number
  averageSpeed?: number
  maxSpeed?: number
  location?: {
    startLatLng?: [number, number]
    endLatLng?: [number, number]
    city?: string
    state?: string
    country?: string
  }
  gear?: {
    kayakType?: string
    paddleType?: string
    equipment?: string[]
  }
  weather?: {
    temperature?: number
    windSpeed?: number
    waterConditions?: string
  }
  notes?: string
  photos?: string[]
  isPublic?: boolean
}

interface ActivityFilters {
  page?: number
  limit?: number
  sportType?: string
  startDate?: string
  endDate?: string
  search?: string
  isPublic?: boolean
}

interface ActivitiesResponse {
  success: boolean
  count: number
  total: number
  page: number
  pages: number
  activities: Activity[]
}

interface ActivityStats {
  success: boolean
  stats: {
    totalActivities: number
    totalDistance: number
    totalTime: number
    averageDistance: number
    longestActivity: number
    sportTypeBreakdown: Record<string, number>
    monthlyStats: Array<{ month: string; count: number; distance: number }>
  }
}

export interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalActivities: number
  hasNextPage: boolean
  hasPrevPage: boolean
  limit: number
}

export interface GetActivitiesResponse {
  success: boolean
  activities: Activity[]
  pagination: PaginationInfo
}

export interface GetActivitiesParams {
  page?: number
  limit?: number
  sort?: string
  sportType?: string
  search?: string
}

export const activityService = {
  /**
   * Get activities with pagination and filters
   */
  async getActivities(params: GetActivitiesParams = {}): Promise<GetActivitiesResponse> {
    try {
      const queryParams = new URLSearchParams()
      
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.limit) queryParams.append('limit', params.limit.toString())
      if (params.sort) queryParams.append('sort', params.sort)
      if (params.sportType) queryParams.append('sportType', params.sportType)
      if (params.search) queryParams.append('search', params.search)
      
      const response = await api.get(`/activities?${queryParams.toString()}`)
      return response.data
    } catch (error: any) {
      console.error('Get activities error:', error)
      throw new Error(error.response?.data?.error || 'Failed to fetch activities')
    }
  },

  /**
   * Get single activity by ID
   */
  async getActivity(id: string): Promise<{ success: boolean; activity: Activity }> {
    try {
      const response = await api.get(`/activities/${id}`)
      return response.data
    } catch (error: any) {
      console.error('Get activity error:', error)
      throw new Error(error.response?.data?.error || 'Failed to fetch activity')
    }
  },

  /**
   * Create new activity
   */
  async createActivity(activity: Partial<Activity>): Promise<{ success: boolean; activity: Activity }> {
    try {
      const response = await api.post('/activities', activity)
      return response.data
    } catch (error: any) {
      console.error('Create activity error:', error)
      throw new Error(error.response?.data?.error || 'Failed to create activity')
    }
  },

  /**
   * Update activity
   */
  async updateActivity(id: string | undefined, updates: Partial<Activity>): Promise<{ success: boolean; activity: Activity }> {
    try {
      const response = await api.put(`/activities/${id}`, updates)
      return response.data
    } catch (error: any) {
      console.error('Update activity error:', error)
      throw new Error(error.response?.data?.error || 'Failed to update activity')
    }
  },

  /**
   * Delete activity
   */
  async deleteActivity(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.delete(`/activities/${id}`)
      return response.data
    } catch (error: any) {
      console.error('Delete activity error:', error)
      throw new Error(error.response?.data?.error || 'Failed to delete activity')
    }
  },

  /**
   * Get activity statistics
   */
  async getActivityStats(timeRange?: number): Promise<ActivityStats> {
    try {
      const params = timeRange ? `?timeRange=${timeRange}` : ''
      const response = await api.get(`/activities/stats/summary${params}`)
      return response.data
    } catch (error: any) {
      console.error('Get activity stats error:', error)
      throw new Error(error.response?.data?.error || 'Failed to fetch activity statistics')
    }
  },

  /**
   * Get public activities feed
   */
  async getPublicActivities(filters: ActivityFilters = {}): Promise<ActivitiesResponse> {
    try {
      const params = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString())
        }
      })

      const response = await api.get(`/activities/public/feed?${params.toString()}`)
      return response.data
    } catch (error: any) {
      console.error('Get public activities error:', error)
      throw new Error(error.response?.data?.error || 'Failed to fetch public activities')
    }
  }
}