<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ msg: string }>()

const count = ref(0)
</script>

<template>
  <div class="content-card">
    <h1>{{ msg }}</h1>

    <div class="card">
      <button type="button" @click="count++" class="river-button">
        � Rapids Conquered: {{ count }}
      </button>
      <p>
        Edit <code>components/HelloWorld.vue</code> to test HMR
      </p>
    </div>

    <div class="info-grid">
      <div class="info-card">
        <h3>🌊 Paddle Challenges</h3>
        <ul>
          <li>Multi-sport tracking (kayak, canoe, SUP)</li>
          <li>Technical rapid navigation</li>
          <li>Distance and endurance goals</li>
          <li>Weather and water conditions</li>
        </ul>
      </div>
      
      <div class="info-card">
        <h3>🛶 Paddle Features</h3>
        <ul>
          <li>Strava activity sync</li>
          <li>Progress tracking</li>
          <li>Route planning tools</li>
          <li>Community sharing</li>
        </ul>
      </div>
    </div>

    <p class="read-the-docs">
      Built with modern web technologies for the best paddle sports tracking experience.
    </p>
  </div>
</template>

<style scoped>
.content-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: clamp(1rem, 3vw, 2rem);
  margin: 1rem auto 2rem;
  max-width: min(800px, 95vw);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
}

.content-card h1 {
  color: #2c5282;
  margin-bottom: 1.5rem;
  font-size: clamp(1.3rem, 4vw, 2rem);
  text-align: center;
}

.card {
  background: linear-gradient(135deg, #4299e1, #3182ce);
  color: white;
  padding: 1.5rem;
  border-radius: 10px;
  margin: 1.5rem 0;
  text-align: center;
}

.card p {
  font-size: clamp(0.8rem, 2vw, 0.9rem);
  margin: 1rem 0 0.5rem 0;
}

.river-button {
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: clamp(10px, 2vw, 12px) clamp(16px, 4vw, 24px);
  border-radius: 25px;
  font-size: clamp(0.9rem, 2.5vw, 1.1rem);
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  width: 100%;
  max-width: 280px;
  margin: 0 auto;
}

.river-button:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(250px, 100%), 1fr));
  gap: clamp(1rem, 3vw, 1.5rem);
  margin: 2rem 0;
}

.info-card {
  background: linear-gradient(135deg, #e6fffa, #b2f5ea);
  padding: 1.5rem;
  border-radius: 10px;
  border-left: 4px solid #38b2ac;
}

.info-card h3 {
  color: #2c7a7b;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: clamp(1rem, 2.5vw, 1.2rem);
  flex-wrap: wrap;
}

.info-card ul {
  color: #2d3748;
  margin: 0;
  padding-left: 1.2rem;
  font-size: clamp(0.8rem, 2vw, 0.9rem);
}

.info-card li {
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.read-the-docs {
  color: #666;
  text-align: center;
  margin-top: 2rem;
  font-size: clamp(0.8rem, 2vw, 0.9rem);
  line-height: 1.5;
}

.read-the-docs a {
  color: #3182ce;
  text-decoration: none;
  font-weight: 500;
}

.read-the-docs a:hover {
  text-decoration: underline;
}

/* Mobile-specific adjustments */
@media (max-width: 480px) {
  .content-card {
    margin: 0.5rem;
    padding: 1rem;
    border-radius: 10px;
  }
  
  .card {
    padding: 1rem;
    margin: 1rem 0;
  }
  
  .info-grid {
    gap: 1rem;
    margin: 1.5rem 0;
  }
  
  .info-card {
    padding: 1rem;
  }
  
  .info-card h3 {
    justify-content: center;
    text-align: center;
  }
}

/* Tablet adjustments */
@media (min-width: 768px) and (max-width: 1024px) {
  .info-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Large screen adjustments */
@media (min-width: 1024px) {
  .content-card {
    padding: 2.5rem;
  }
  
  .river-button {
    max-width: 320px;
  }
}
</style>
