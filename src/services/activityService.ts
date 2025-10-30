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
  waterType?: string
  search?: string
  startDate?: string
  endDate?: string
}

export const activityService = {
  /**
   * Get activities with pagination and filters
   */
  async getActivities(params: GetActivitiesParams = {}): Promise<GetActivitiesResponse> {
    try {
      if (import.meta.env.DEV) {
        console.log('🔍 Activity Service - Fetch Request:', {
          params: params,
          timestamp: new Date().toISOString()
        })
      }
      
      const queryParams = new URLSearchParams()
      
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.limit) queryParams.append('limit', params.limit.toString())
      if (params.sort) queryParams.append('sort', params.sort)
      if (params.sportType) queryParams.append('sportType', params.sportType)
      if (params.waterType) queryParams.append('waterType', params.waterType)
      if (params.search) queryParams.append('search', params.search)
      if (params.startDate) queryParams.append('startDate', params.startDate)
      if (params.endDate) queryParams.append('endDate', params.endDate)
      
      const response = await api.get(`/activities?${queryParams.toString()}`)
      
      if (import.meta.env.DEV) {
        console.log('✅ Activity Service - Fetch Response:', {
          success: response.data.success,
          activitiesCount: response.data.activities?.length || 0,
          pagination: response.data.pagination,
          timestamp: new Date().toISOString()
        })
      }
      
      return response.data
    } catch (error: any) {
      console.error('💥 Activity Service - Fetch Error:', {
        params: params,
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        timestamp: new Date().toISOString()
      })
      
      // Enhanced error handling for specific status codes
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'] || 'unknown'
        const errorMsg = `Too many requests. Please wait ${retryAfter} seconds before trying again.`
        
        if (import.meta.env.DEV) {
          console.warn('⚠️ Rate limit exceeded:', {
            retryAfter: retryAfter,
            headers: error.response.headers,
            timestamp: new Date().toISOString()
          })
        }
        
        const enhancedError = new Error(errorMsg) as any
        enhancedError.errorOrigin = 'Rate Limiting'
        enhancedError.statusCode = 429
        enhancedError.retryAfter = retryAfter
        throw enhancedError
      }
      
      // In development, provide more detailed error information
      if (import.meta.env.DEV && error.errorOrigin) {
        throw error // Let the enhanced error message pass through
      }
      
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
      
      // In development, provide more detailed error information
      if (import.meta.env.DEV && error.errorOrigin === 'MongoDB Atlas') {
        throw error // Let the enhanced error message pass through
      }
      
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
      
      // In development, provide more detailed error information
      if (import.meta.env.DEV && error.errorOrigin === 'MongoDB Atlas') {
        throw error // Let the enhanced error message pass through
      }
      
      throw new Error(error.response?.data?.error || 'Failed to create activity')
    }
  },

  /**
   * Update activity
   */
  async updateActivity(id: string | undefined, updates: Partial<Activity>): Promise<{ success: boolean; activity: Activity }> {
    try {
      if (import.meta.env.DEV) {
        console.log('🔄 Activity Service - Update Request:', {
          activityId: id,
          updates: updates,
          timestamp: new Date().toISOString()
        })
      }
      
      const response = await api.put(`/activities/${id}`, updates)
      
      if (import.meta.env.DEV) {
        console.log('✅ Activity Service - Update Response:', {
          success: response.data.success,
          activityId: response.data.activity?._id,
          debugInfo: response.data.debugInfo,
          timestamp: new Date().toISOString()
        })
      }
      
      return response.data
    } catch (error: any) {
      console.error('💥 Activity Service - Update Error:', {
        activityId: id,
        updates: updates,
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        timestamp: new Date().toISOString()
      })
      
      // Enhanced error handling for specific status codes and development mode
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'] || 'unknown'
        const errorMsg = error.response?.data?.error || `Too many requests. Please wait ${retryAfter} seconds before trying again.`
        
        if (import.meta.env.DEV) {
          console.warn('⚠️ Rate limit exceeded on update:', {
            retryAfter: retryAfter,
            errorOrigin: error.response?.data?.errorOrigin,
            debugInfo: error.response?.data?.debugInfo,
            timestamp: new Date().toISOString()
          })
        }
        
        const enhancedError = new Error(errorMsg) as any
        enhancedError.errorOrigin = error.response?.data?.errorOrigin || 'Rate Limiting'
        enhancedError.statusCode = 429
        enhancedError.retryAfter = retryAfter
        enhancedError.debugInfo = error.response?.data?.debugInfo
        enhancedError.response = error.response
        throw enhancedError
      }
      
      // In development, provide more detailed error information
      if (import.meta.env.DEV && error.response?.data?.errorOrigin) {
        const enhancedError = new Error(error.response?.data?.error || error.message) as any
        enhancedError.errorOrigin = error.response.data.errorOrigin
        enhancedError.debugInfo = error.response.data.debugInfo
        enhancedError.originalError = error.response.data.originalError
        enhancedError.response = error.response
        throw enhancedError
      }
      
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