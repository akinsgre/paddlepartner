<script setup lang="ts">
import HelloWorld from '../components/HelloWorld.vue'
import GoogleAuth from '../components/GoogleAuth.vue'
</script>

<template>
  <div class="home-container">
    <header class="header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="main-title">Paddle Partner</h1>
          <p class="tagline">Your Ultimate Paddle Sports Companion</p>
        </div>
        <div class="auth-container">
          <GoogleAuth />
        </div>
      </div>
    </header>
    
    <main class="main-content">
      <div class="river-showcase">
        <img 
          src="/tour-photo.jpg" 
          alt="Adventure tour photo from the collection" 
          class="river-image"
        />
        <div class="river-overlay">
          <h2>Your Paddle Adventure Awaits</h2>
          <p>Track, analyze, and share your paddle sports journey</p>
        </div>
      </div>
      
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
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  max-width: 1200px;
  margin: 0 auto;
  gap: 2rem;
}

.title-section {
  text-align: left;
  flex: 1;
}

.auth-container {
  flex-shrink: 0;
  max-width: 300px;
}

.main-title {
  color: white;
  font-size: clamp(2rem, 6vw, 3.5rem);
  margin: 0 0 0.5rem 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  line-height: 1.1;
  font-weight: 700;
}

.tagline {
  color: rgba(255, 255, 255, 0.9);
  font-size: clamp(1rem, 2.5vw, 1.3rem);
  margin: 0;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  font-weight: 300;
  letter-spacing: 0.5px;
}

.main-content {
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

.river-showcase {
  position: relative;
  margin: 1rem auto 2rem;
  max-width: 100%;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.river-image {
  width: 100%;
  height: clamp(250px, 50vw, 400px);
  object-fit: cover;
  display: block;
}

.river-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  color: white;
  padding: 1.5rem;
  text-align: center;
}

.river-overlay h2 {
  margin: 0 0 0.5rem 0;
  font-size: clamp(1.2rem, 3vw, 2rem);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.river-overlay p {
  margin: 0;
  font-size: clamp(0.9rem, 2vw, 1.2rem);
  opacity: 0.9;
}

/* Tablet styles */
@media (min-width: 768px) {
  .header {
    padding: 2.5rem 2rem;
  }
  
  .main-content {
    padding: 2rem;
  }
  
  .river-showcase {
    border-radius: 20px;
  }
  
  .river-overlay {
    padding: 2rem;
  }
}

/* Mobile styles */
@media (max-width: 767px) {
  .header {
    padding: 1.5rem 1rem;
  }
  
  .header-content {
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
  
  .title-section {
    text-align: center;
  }
  
  .auth-container {
    max-width: 100%;
    width: 100%;
  }
  
  .main-content {
    padding: 0.5rem;
  }
  
  .river-showcase {
    margin: 0.5rem auto 1rem;
    border-radius: 10px;
  }
  
  .river-overlay {
    padding: 1rem;
  }
}

/* Large desktop styles */
@media (min-width: 1200px) {
  .main-content {
    padding: 3rem;
  }
  
  .river-showcase {
    max-width: 1000px;
  }
}
</style>