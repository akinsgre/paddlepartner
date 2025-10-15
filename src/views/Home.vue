<script setup lang="ts">
import HelloWorld from '../components/HelloWorld.vue'
import GoogleAuth from '../components/GoogleAuth.vue'
</script>

<template>
  <div class="home-container">
    <header class="header">
      <div class="logos">
        <a href="https://vite.dev" target="_blank">
          <img src="/vite.svg" class="logo" alt="Vite logo" />
        </a>
        <a href="https://vuejs.org/" target="_blank">
          <img src="./assets/vue.svg" class="logo vue" alt="Vue logo" />
        </a>
      </div>
      <h1 class="main-title">Whitewater Kayak Adventures</h1>
    </header>
    
    <main class="main-content">
      <GoogleAuth />
      
      <div class="river-showcase">
        <img 
          src="/tour-photo.jpg" 
          alt="Adventure tour photo from the collection" 
          class="river-image"
        />
        <div class="river-overlay">
          <h2>Adventure Awaits</h2>
          <p>Captured moments from incredible outdoor expeditions</p>
        </div>
      </div>
      
      <HelloWorld msg="Vue + Vite Kayak Explorer" />
    </main>
  </div>
</template>

<style scoped>
.home-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.header {
  padding: 2rem;
  text-align: center;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.logos {
  margin-bottom: 1rem;
}

.logo {
  height: 4em;
  padding: 1em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}

.main-title {
  color: white;
  font-size: 2.5rem;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.main-content {
  padding: 2rem;
}

.river-showcase {
  position: relative;
  margin: 2rem auto;
  max-width: 1000px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.river-image {
  width: 100%;
  height: 400px;
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
  padding: 2rem;
  text-align: center;
}

.river-overlay h2 {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.river-overlay p {
  margin: 0;
  font-size: 1.2rem;
  opacity: 0.9;
}

@media (max-width: 768px) {
  .main-title {
    font-size: 2rem;
  }
  
  .river-image {
    height: 300px;
  }
  
  .river-overlay h2 {
    font-size: 1.5rem;
  }
  
  .river-overlay p {
    font-size: 1rem;
  }
}
</style>