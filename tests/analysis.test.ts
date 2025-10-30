import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import Analysis from '../src/views/Analysis.vue'

// Mock the services
vi.mock('../src/services/authService', () => ({
  authService: {
    isAuthenticated: vi.fn(() => true)
  }
}))

vi.mock('../src/services/activityService', () => ({
  activityService: {
    getActivities: vi.fn(),
    getActivityStats: vi.fn()
  }
}))

// Mock router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/activities', component: { template: '<div>Activities</div>' } },
    { path: '/analysis', component: Analysis }
  ]
})

// Mock data
const mockActivities = [
  {
    _id: '1',
    name: 'Morning Paddle',
    type: 'Kayaking',
    startDate: '2024-01-15T08:00:00Z',
    sportType: 'Kayaking',
    distance: 5000,
    movingTime: 3600,
    waterType: 'flat water'
  },
  {
    _id: '2',
    name: 'Afternoon Kayak',
    type: 'Kayaking',
    startDate: '2024-02-20T14:00:00Z',
    sportType: 'Kayaking',
    distance: 7500,
    movingTime: 4500,
    waterType: 'whitewater'
  },
  {
    _id: '3',
    name: 'Evening SUP',
    type: 'Stand Up Paddleboarding',
    startDate: '2023-06-10T18:00:00Z',
    sportType: 'Stand Up Paddleboarding',
    distance: 3000,
    movingTime: 2400,
    waterType: 'flat water'
  }
]

describe('🧪 Analysis Component Tests', () => {
  let wrapper: any
  let mockGetActivities: any

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Setup mocks
    const { activityService } = await import('../src/services/activityService')
    mockGetActivities = vi.mocked(activityService.getActivities)
    
    mockGetActivities.mockResolvedValue({
      success: true,
      activities: mockActivities,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalActivities: mockActivities.length,
        hasNextPage: false,
        hasPrevPage: false,
        limit: 1000
      }
    })

    // Mount component
    wrapper = mount(Analysis, {
      global: {
        plugins: [router]
      }
    })

    await router.push('/analysis')
    await router.isReady()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('Component Mounting and Basic Functionality', () => {
    it('should mount without errors', () => {
      expect(wrapper.exists()).toBe(true)
    })

    it('should have the correct page title', () => {
      expect(wrapper.find('h1').text()).toBe('📊 Analysis Dashboard')
    })

    it('should have a back button to activities', () => {
      const backBtn = wrapper.find('.back-btn')
      expect(backBtn.exists()).toBe(true)
      expect(backBtn.attributes('to')).toBe('/activities')
    })

    it('should show loading state initially', () => {
      const loadingSpinner = wrapper.find('.loading-spinner')
      expect(loadingSpinner.exists()).toBe(true)
    })
  })

  describe('Data Fetching and Statistics Calculation', () => {
    it('should fetch activities on mount', async () => {
      await wrapper.vm.$nextTick()
      expect(mockGetActivities).toHaveBeenCalledWith({
        limit: 1000,
        sort: '-startDate'
      })
    })

    it('should calculate statistics from activities', async () => {
      // Wait for data to load
      await new Promise(resolve => setTimeout(resolve, 100))
      await wrapper.vm.$nextTick()

      const stats = wrapper.vm.stats
      expect(stats.totalActivities).toBe(3)
      expect(stats.totalDistance).toBe(15500) // 5000 + 7500 + 3000
      expect(stats.totalTime).toBe(10500) // 3600 + 4500 + 2400
    })

    it('should calculate sport type breakdown correctly', async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
      await wrapper.vm.$nextTick()

      const breakdown = wrapper.vm.stats.sportTypeBreakdown
      expect(breakdown['Kayaking']).toBe(2)
      expect(breakdown['Stand Up Paddleboarding']).toBe(1)
    })

    it('should generate yearly progress data', async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
      await wrapper.vm.$nextTick()

      const yearlyProgress = wrapper.vm.yearlyProgress
      expect(yearlyProgress).toBeInstanceOf(Array)
      expect(yearlyProgress.length).toBeGreaterThan(0)
      
      // Should have data for 2023 and 2024
      const years = yearlyProgress.map((y: any) => y.year)
      expect(years).toContain(2023)
      expect(years).toContain(2024)
    })
  })

  describe('Year Filtering Functionality', () => {
    beforeEach(async () => {
      // Wait for initial data load
      await new Promise(resolve => setTimeout(resolve, 100))
      await wrapper.vm.$nextTick()
    })

    it('should filter data by selected year', async () => {
      // Filter by 2024
      await wrapper.vm.filterByYear(2024)
      await wrapper.vm.$nextTick()

      const stats = wrapper.vm.stats
      expect(stats.totalActivities).toBe(2) // Only 2024 activities
      expect(wrapper.vm.selectedYear).toBe(2024)
    })

    it('should show all data when filtering by null', async () => {
      // First filter by a year
      await wrapper.vm.filterByYear(2024)
      await wrapper.vm.$nextTick()

      // Then filter by null (all years)
      await wrapper.vm.filterByYear(null)
      await wrapper.vm.$nextTick()

      const stats = wrapper.vm.stats
      expect(stats.totalActivities).toBe(3) // All activities
      expect(wrapper.vm.selectedYear).toBe(null)
    })

    it('should update UI when year is selected', async () => {
      await wrapper.vm.filterByYear(2024)
      await wrapper.vm.$nextTick()

      // Check if "All Years" button is not active
      const allYearsBtn = wrapper.find('.all-years-btn')
      expect(allYearsBtn.classes()).not.toContain('active')
    })

    it('should highlight selected year in yearly progress', async () => {
      await wrapper.vm.filterByYear(2024)
      await wrapper.vm.$nextTick()

      // Check if year items have correct active class
      const yearItems = wrapper.findAll('.year-item')
      const year2024Item = yearItems.find((item: any) => 
        item.find('h4').text() === '2024'
      )
      
      if (year2024Item) {
        expect(year2024Item.classes()).toContain('active')
      }
    })
  })

  describe('Collapsible Yearly Progress', () => {
    beforeEach(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
      await wrapper.vm.$nextTick()
    })

    it('should start with yearly progress expanded', () => {
      expect(wrapper.vm.isYearlyProgressCollapsed).toBe(false)
      
      const yearlyProgress = wrapper.find('.yearly-progress')
      expect(yearlyProgress.isVisible()).toBe(true)
    })

    it('should toggle collapse state when button is clicked', async () => {
      const collapseBtn = wrapper.find('.collapse-btn')
      expect(collapseBtn.exists()).toBe(true)

      // Click to collapse
      await collapseBtn.trigger('click')
      expect(wrapper.vm.isYearlyProgressCollapsed).toBe(true)

      // Click to expand
      await collapseBtn.trigger('click')
      expect(wrapper.vm.isYearlyProgressCollapsed).toBe(false)
    })

    it('should show correct arrow icon based on collapsed state', async () => {
      const collapseIcon = wrapper.find('.collapse-icon')
      
      // Initially expanded - should show down arrow
      expect(collapseIcon.text()).toBe('▼')

      // Collapse and check up arrow
      await wrapper.vm.toggleYearlyProgress()
      await wrapper.vm.$nextTick()
      expect(collapseIcon.text()).toBe('▶')
    })

    it('should show selected year indicator when collapsed', async () => {
      // Filter by a specific year
      await wrapper.vm.filterByYear(2024)
      await wrapper.vm.$nextTick()

      // Collapse the section
      await wrapper.vm.toggleYearlyProgress()
      await wrapper.vm.$nextTick()

      const indicator = wrapper.find('.selected-year-indicator')
      expect(indicator.exists()).toBe(true)
      expect(indicator.text()).toBe('(2024)')
    })

    it('should show "All Years" indicator when collapsed and no year selected', async () => {
      // Ensure no year is selected
      await wrapper.vm.filterByYear(null)
      await wrapper.vm.$nextTick()

      // Collapse the section
      await wrapper.vm.toggleYearlyProgress()
      await wrapper.vm.$nextTick()

      const indicator = wrapper.find('.selected-year-indicator')
      expect(indicator.exists()).toBe(true)
      expect(indicator.text()).toBe('(All Years)')
    })

    it('should hide year indicator when expanded', async () => {
      // Collapse first
      await wrapper.vm.toggleYearlyProgress()
      await wrapper.vm.$nextTick()
      
      // Then expand
      await wrapper.vm.toggleYearlyProgress()
      await wrapper.vm.$nextTick()

      const indicator = wrapper.find('.selected-year-indicator')
      expect(indicator.exists()).toBe(false)
    })
  })

  describe('User Interactions', () => {
    beforeEach(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
      await wrapper.vm.$nextTick()
    })

    it('should handle year item clicks', async () => {
      const yearItems = wrapper.findAll('.year-item')
      expect(yearItems.length).toBeGreaterThan(0)

      if (yearItems.length > 0) {
        const firstYearItem = yearItems[0]
        await firstYearItem.trigger('click')
        
        // Should have called filterByYear
        expect(wrapper.vm.selectedYear).toBeDefined()
      }
    })

    it('should handle "All Years" button click', async () => {
      const allYearsBtn = wrapper.find('.all-years-btn')
      expect(allYearsBtn.exists()).toBe(true)

      await allYearsBtn.trigger('click')
      expect(wrapper.vm.selectedYear).toBe(null)
    })
  })

  describe('Statistics Display', () => {
    beforeEach(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
      await wrapper.vm.$nextTick()
    })

    it('should display stat cards with correct values', async () => {
      const statCards = wrapper.findAll('.stat-card')
      expect(statCards.length).toBe(4) // Total Activities, Distance, Time, Longest Session

      // Check if stat values are displayed
      const statValues = wrapper.findAll('.stat-value')
      expect(statValues.length).toBe(4)
      
      statValues.forEach((statValue: any) => {
        expect(statValue.text()).toBeTruthy()
      })
    })

    it('should display charts section', () => {
      const chartsSection = wrapper.find('.charts-section')
      expect(chartsSection.exists()).toBe(true)

      const chartContainers = wrapper.findAll('.chart-container')
      expect(chartContainers.length).toBeGreaterThan(0)
    })

    it('should display insights section', () => {
      const insightsSection = wrapper.find('.insights-section')
      expect(insightsSection.exists()).toBe(true)

      const insightCards = wrapper.findAll('.insight-card')
      expect(insightCards.length).toBe(4)
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      // Mock API error
      mockGetActivities.mockRejectedValue(new Error('API Error'))

      const errorWrapper = mount(Analysis, {
        global: {
          plugins: [router]
        }
      })

      await new Promise(resolve => setTimeout(resolve, 100))
      await errorWrapper.vm.$nextTick()

      expect(errorWrapper.vm.error).toBeTruthy()
      
      errorWrapper.unmount()
    })

    it('should show retry button on error', async () => {
      mockGetActivities.mockRejectedValue(new Error('API Error'))

      const errorWrapper = mount(Analysis, {
        global: {
          plugins: [router]
        }
      })

      await new Promise(resolve => setTimeout(resolve, 100))
      await errorWrapper.vm.$nextTick()

      const retryBtn = errorWrapper.find('.retry-btn')
      expect(retryBtn.exists()).toBe(true)
      
      errorWrapper.unmount()
    })
  })

  describe('Authentication Handling', () => {
    it('should handle unauthenticated users', async () => {
      // Mock unauthenticated state
      const { authService } = await import('../src/services/authService')
      vi.mocked(authService.isAuthenticated).mockReturnValue(false)

      const unauthWrapper = mount(Analysis, {
        global: {
          plugins: [router]
        }
      })

      await new Promise(resolve => setTimeout(resolve, 100))
      await unauthWrapper.vm.$nextTick()

      expect(unauthWrapper.vm.error).toContain('Please log in')
      
      unauthWrapper.unmount()
    })
  })
})

describe('🧪 Analysis Helper Functions Tests', () => {
  let wrapper: any

  beforeEach(async () => {
    const { activityService } = await import('../src/services/activityService')
    vi.mocked(activityService.getActivities).mockResolvedValue({
      success: true,
      activities: mockActivities,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalActivities: mockActivities.length,
        hasNextPage: false,
        hasPrevPage: false,
        limit: 1000
      }
    })

    wrapper = mount(Analysis, {
      global: {
        plugins: [router]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('Format Functions', () => {
    it('should format distance correctly', () => {
      expect(wrapper.vm.formatDistance(1000)).toBe('1.0 km')
      expect(wrapper.vm.formatDistance(500)).toBe('500 m')
      expect(wrapper.vm.formatDistance(2500)).toBe('2.5 km')
    })

    it('should format duration correctly', () => {
      expect(wrapper.vm.formatDuration(3600)).toBe('1h 0m')
      expect(wrapper.vm.formatDuration(1800)).toBe('30m')
      expect(wrapper.vm.formatDuration(5400)).toBe('1h 30m')
      expect(wrapper.vm.formatDuration(7200)).toBe('2h 0m')
    })

    it('should format month correctly', () => {
      expect(wrapper.vm.formatMonth('2024-01')).toMatch(/Jan.*24/)
      expect(wrapper.vm.formatMonth('2024-12')).toMatch(/Dec.*24/)
    })
  })

  describe('Computed Properties', () => {
    it('should calculate monthly data correctly', () => {
      const monthlyData = wrapper.vm.monthlyData
      expect(Array.isArray(monthlyData)).toBe(true)
    })

    it('should calculate max monthly activities', () => {
      const maxMonthlyActivities = wrapper.vm.maxMonthlyActivities
      expect(typeof maxMonthlyActivities).toBe('number')
      expect(maxMonthlyActivities).toBeGreaterThan(0)
    })

    it('should calculate best month', () => {
      const bestMonth = wrapper.vm.bestMonth
      expect(bestMonth).toHaveProperty('month')
      expect(bestMonth).toHaveProperty('count')
    })

    it('should calculate average weekly time', () => {
      const avgWeeklyTime = wrapper.vm.averageWeeklyTime
      expect(typeof avgWeeklyTime).toBe('number')
      expect(avgWeeklyTime).toBeGreaterThanOrEqual(0)
    })
  })
})