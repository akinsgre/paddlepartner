<template>
  <header class="app-header">
    <div class="header-container">
      <!-- Logo/Brand Section -->
      <div class="brand-section">
        <router-link to="/" class="brand-link">
          <h1 class="brand-title">🛶 Paddle Partner</h1>
        </router-link>
      </div>

      <!-- Navigation Links -->
      <nav class="nav-section">
        <router-link 
          to="/" 
          class="nav-link"
          :class="{ active: $route.path === '/' }"
        >
          🏠 Home
        </router-link>
        <router-link 
          to="/activities" 
          class="nav-link"
          :class="{ active: $route.path === '/activities' }"
        >
          🚣 Activities
        </router-link>
        <router-link 
          to="/analysis" 
          class="nav-link"
          :class="{ active: $route.path === '/analysis' }"
        >
          📊 Analysis
        </router-link>
      </nav>

      <!-- User Actions Section -->
      <div class="user-section">
        <div v-if="isAuthenticated" class="user-info">
          <span class="user-greeting">Welcome back!</span>
          <button @click="handleLogout" class="logout-btn">
            Logout
          </button>
        </div>
        <div v-else class="auth-prompt">
          <span class="auth-message">Sign in to track your activities</span>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../services/authService'
import { useAuth } from '../composables/useAuth'

const router = useRouter()

// Use shared authentication state
const { isAuthenticated, logout } = useAuth()

const handleLogout = async () => {
  try {
    await authService.logout()
    
    // Update shared authentication state
    logout()
    
    router.push('/')
  } catch (error) {
    console.error('Logout error:', error)
    // Continue with logout even if server call fails
    logout()
    router.push('/')
  }
}

// Watch for auth state changes
onMounted(() => {
  // This will reactively update when auth state changes
})
</script>

<style scoped>
.app-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
  padding: 0;
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  gap: 2rem;
}

.brand-section {
  flex-shrink: 0;
}

.brand-link {
  text-decoration: none;
  color: inherit;
}

.brand-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0;
  background: linear-gradient(45deg, #3182ce, #2c5282);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  transition: all 0.3s ease;
}

.brand-link:hover .brand-title {
  transform: scale(1.05);
}

.nav-section {
  display: flex;
  align-items: center;
  gap: 2rem;
  flex: 1;
  justify-content: center;
}

.nav-link {
  text-decoration: none;
  color: #4a5568;
  font-weight: 500;
  font-size: 1rem;
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-link:hover {
  color: #3182ce;
  background: rgba(49, 130, 206, 0.1);
  transform: translateY(-2px);
}

.nav-link.active {
  color: white;
  background: linear-gradient(45deg, #3182ce, #2c5282);
  box-shadow: 0 4px 15px rgba(49, 130, 206, 0.3);
}

.nav-link.active:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(49, 130, 206, 0.4);
}

.user-section {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-greeting {
  color: #4a5568;
  font-weight: 500;
  font-size: 0.9rem;
}

.logout-btn {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
  border: 2px solid rgba(239, 68, 68, 0.2);
  border-radius: 20px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
  transform: translateY(-1px);
}

.auth-prompt {
  display: flex;
  align-items: center;
}

.auth-message {
  color: #6b7280;
  font-size: 0.9rem;
  font-style: italic;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .header-container {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .brand-title {
    font-size: 1.25rem;
  }

  .nav-section {
    justify-content: center;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .nav-link {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }

  .user-section {
    width: 100%;
    justify-content: center;
  }

  .user-info {
    flex-direction: column;
    gap: 0.5rem;
  }
}

@media (max-width: 480px) {
  .header-container {
    padding: 0.75rem;
  }

  .nav-section {
    gap: 0.5rem;
  }

  .nav-link {
    padding: 0.5rem 0.75rem;
    font-size: 0.85rem;
  }

  .brand-title {
    font-size: 1.1rem;
  }
}
</style>