import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'


// Import components
import Home from '../views/Home.vue'
import Activities from '../views/Activities.vue'
const BulkEdit = () => import('../views/BulkEdit.vue')
const Analysis = () => import('../views/Analysis.vue')

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/activities',
    name: 'Activities',
    component: Activities,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/analysis',
    name: 'Analysis',
    component: Analysis,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/bulk-edit',
    name: 'BulkEdit',
    component: BulkEdit,
    meta: {
      requiresAuth: true
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard to protect routes
router.beforeEach((to, _from, next) => {
  const isAuthenticated = localStorage.getItem('userAuthenticated') === 'true'
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    // Redirect to home if not authenticated
    next('/')
  } else {
    next()
  }
})

export default router