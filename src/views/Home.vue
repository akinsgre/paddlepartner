<script setup lang="ts">
import HelloWorld from '../components/HelloWorld.vue'
import GoogleAuth from '../components/GoogleAuth.vue'
</script>

<template>
  <div class="home-container">
    <header class="header">
      <img 
        src="/tour-photo.jpg" 
        alt="Adventure tour photo from the collection" 
        class="header-background-image"
      />
      <div class="header-overlay"></div>
      <div class="header-content">
        <div class="title-section">
          <h1 class="main-title">Paddle Partner</h1>
          <p class="tagline">Your Ultimate Paddle Sports Companion</p>
          <div class="hero-subtitle">
            <h3>Your Paddle Adventure Awaits</h3>
            <p>Track, analyze, and share your paddle sports journey</p>
          </div>
        </div>
        <div class="auth-container">
          <GoogleAuth />
        </div>
      </div>
    </header>
    
    <main class="main-content">
      <HelloWorld msg="Track Your Paddle Adventures" />
    </main>
  </div>
</template>

<style scoped>
.home-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.header {
  position: relative;
  padding: 1rem;
  overflow: visible;
  z-index: 50;
}

.header-background-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
}

.header-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.7) 0%, rgba(118, 75, 162, 0.7) 100%);
  z-index: 1;
}

.header-content {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  gap: 2rem;
  min-height: 80px;
  z-index: 51;
}

.title-section {
  text-align: left;
  flex: 1;
}

.auth-container {
  flex-shrink: 0;
  max-width: 400px;
  min-width: 300px;
}

.main-title {
  color: white;
  font-size: clamp(2rem, 6vw, 3.5rem);
  margin: 0 0 0.5rem 0;
  text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.6);
  line-height: 1.1;
  font-weight: 700;
}

.tagline {
  color: rgba(255, 255, 255, 0.95);
  font-size: clamp(1rem, 2.5vw, 1.3rem);
  margin: 0 0 1rem 0;
  text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.6);
  font-weight: 300;
  letter-spacing: 0.5px;
}

.hero-subtitle {
  margin-top: 1rem;
}

.hero-subtitle h3 {
  color: white;
  font-size: clamp(1.2rem, 3vw, 1.8rem);
  margin: 0 0 0.25rem 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.6);
  font-weight: 600;
}

.hero-subtitle p {
  color: rgba(255, 255, 255, 0.9);
  font-size: clamp(0.9rem, 2vw, 1.1rem);
  margin: 0;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.6);
  opacity: 0.95;
}

.main-content {
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

/* Tablet styles */
@media (min-width: 768px) {
  .header {
    padding: 2.5rem 2rem;
  }
  
  .main-content {
    padding: 2rem;
  }
}

/* Mobile styles */
@media (max-width: 767px) {
  .header {
    padding: 1rem;
  }
  
  .header-content {
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    min-height: auto;
  }
  
  .title-section {
    text-align: center;
  }
  
  .auth-container {
    max-width: 100%;
    width: 100%;
    min-width: auto;
  }
  
  .main-content {
    padding: 0.5rem;
  }
  
  .hero-subtitle {
    margin-top: 0.75rem;
  }
}

/* Large desktop styles */
@media (min-width: 1200px) {
  .main-content {
    padding: 3rem;
  }
}
</style>