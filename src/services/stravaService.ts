import api from './api'

// Removed unused interfaces to fix TypeScript build errors
// These can be added back when needed for future features

interface SyncResponse {
  success: boolean
  message: string
  totalFound: number
  newActivities: number
  pagesProcessed: number
  hasMore: boolean
}

export const stravaService = {
  /**
   * Exchange Strava authorization code for tokens
   */
  async exchangeToken(code: string): Promise<{ success: boolean; message: string; athlete?: any }> {
    try {
      const response = await api.post('/strava/exchange-token', { code })
      return response.data
    } catch (error: any) {
      console.error('Strava token exchange error:', error)
      throw new Error(error.response?.data?.error || 'Failed to connect to Strava')
    }
  },

  /**
   * Refresh Strava access token
   */
  async refreshToken(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post('/strava/refresh-token')
      return response.data
    } catch (error: any) {
      console.error('Strava token refresh error:', error)
      throw new Error(error.response?.data?.error || 'Failed to refresh Strava token')
    }
  },

  /**
   * Sync activities from Strava
   */
  async syncActivities(options: {
    page?: number
    per_page?: number
    sync_all?: boolean
  } = {}): Promise<SyncResponse> {
    try {
      const response = await api.post('/strava/sync-activities', options)
      return response.data
    } catch (error: any) {
      console.error('Strava sync error:', error)
      throw new Error(error.response?.data?.error || 'Failed to sync activities from Strava')
    }
  },

  /**
   * Get Strava connection status
   */
  async getConnectionStatus(): Promise<{
    success: boolean
    isConnected: boolean
    isTokenValid: boolean
    athleteId?: string
    tokenExpiry?: string
  }> {
    try {
      const response = await api.get('/strava/status')
      return response.data
    } catch (error: any) {
      console.error('Strava status error:', error)
      throw new Error(error.response?.data?.error || 'Failed to get Strava status')
    }
  },

  /**
   * Disconnect Strava account
   */
  async disconnect(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.delete('/strava/disconnect')
      return response.data
    } catch (error: any) {
      console.error('Strava disconnect error:', error)
      throw new Error(error.response?.data?.error || 'Failed to disconnect Strava')
    }
  },

  /**
   * Generate Strava authorization URL
   */
  generateAuthUrl(): string {
    const STRAVA_CLIENT_ID = import.meta.env.VITE_STRAVA_CLIENT_ID
    const REDIRECT_URI = `${window.location.origin}/activities`
    
    return `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&approval_prompt=force&scope=read,activity:read_all`
  }
}