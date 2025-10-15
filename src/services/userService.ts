import api from './api'

interface UserProfile {
  id: string
  googleId: string
  email: string
  name: string
  picture?: string
  preferences: UserPreferences
  stats: UserStats
  lastLoginAt: string
  createdAt: string
  updatedAt: string
}

interface UserPreferences {
  units: 'metric' | 'imperial'
  defaultPrivacy: 'public' | 'private'
  notifications: {
    email: boolean
    newActivities: boolean
    weeklyDigest: boolean
  }
  dashboard: {
    showStats: boolean
    showMap: boolean
    showWeather: boolean
  }
}

interface UserStats {
  totalActivities: number
  totalDistance: number
  totalTime: number
  longestActivity: number
  favoriteSportType?: string
  favoriteLocation?: string
  lastSyncDate?: string
}

export const userService = {
  /**
   * Get user profile
   */
  async getProfile(): Promise<{ success: boolean; user: UserProfile }> {
    try {
      const response = await api.get('/users/profile')
      return response.data
    } catch (error: any) {
      console.error('Get profile error:', error)
      throw new Error(error.response?.data?.error || 'Failed to fetch user profile')
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(updates: { name?: string; picture?: string }): Promise<{ success: boolean; user: UserProfile }> {
    try {
      const response = await api.put('/users/profile', updates)
      return response.data
    } catch (error: any) {
      console.error('Update profile error:', error)
      throw new Error(error.response?.data?.error || 'Failed to update profile')
    }
  },

  /**
   * Get user preferences
   */
  async getPreferences(): Promise<{ success: boolean; preferences: UserPreferences }> {
    try {
      const response = await api.get('/users/preferences')
      return response.data
    } catch (error: any) {
      console.error('Get preferences error:', error)
      throw new Error(error.response?.data?.error || 'Failed to fetch preferences')
    }
  },

  /**
   * Update user preferences
   */
  async updatePreferences(preferences: Partial<UserPreferences>): Promise<{ success: boolean; preferences: UserPreferences }> {
    try {
      const response = await api.put('/users/preferences', preferences)
      return response.data
    } catch (error: any) {
      console.error('Update preferences error:', error)
      throw new Error(error.response?.data?.error || 'Failed to update preferences')
    }
  },

  /**
   * Update Strava tokens
   */
  async updateStravaTokens(tokens: {
    accessToken: string
    refreshToken?: string
    expiresAt?: string
    athleteId?: string
  }): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.put('/users/strava-tokens', tokens)
      return response.data
    } catch (error: any) {
      console.error('Update Strava tokens error:', error)
      throw new Error(error.response?.data?.error || 'Failed to update Strava tokens')
    }
  },

  /**
   * Get user statistics
   */
  async getStats(): Promise<{ 
    success: boolean
    stats: UserStats
    formattedStats: {
      totalDistance: string
      totalTime: string
    }
  }> {
    try {
      const response = await api.get('/users/stats')
      return response.data
    } catch (error: any) {
      console.error('Get stats error:', error)
      throw new Error(error.response?.data?.error || 'Failed to fetch user statistics')
    }
  },

  /**
   * Delete user account
   */
  async deleteAccount(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.delete('/users/account')
      return response.data
    } catch (error: any) {
      console.error('Delete account error:', error)
      throw new Error(error.response?.data?.error || 'Failed to delete account')
    }
  }
}

export type { UserProfile, UserPreferences, UserStats }