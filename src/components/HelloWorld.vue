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
        <h3>🌊 Kayaking Challenges</h3>
        <ul>
          <li>Class III-V rapids navigation</li>
          <li>Technical boulder gardens</li>
          <li>Steep water drops</li>
          <li>Fast-flowing currents</li>
        </ul>
      </div>
      
      <div class="info-card">
        <h3>🛶 Kayak Adventures</h3>
        <ul>
          <li>Solo kayaking expeditions</li>
          <li>Guided rapid tours</li>
          <li>Skills training courses</li>
          <li>Action photography sessions</li>
        </ul>
      </div>
    </div>

    <p class="read-the-docs">
      Built with 
      <a href="https://vuejs.org/guide/quick-start.html#local" target="_blank">Vue 3</a> 
      and 
      <a href="https://vitejs.dev/" target="_blank">Vite</a>
    </p>
  </div>
</template>

<style scoped>
.content-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 2rem;
  margin: 2rem auto;
  max-width: 800px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
}

.content-card h1 {
  color: #2c5282;
  margin-bottom: 1.5rem;
}

.card {
  background: linear-gradient(135deg, #4299e1, #3182ce);
  color: white;
  padding: 1.5rem;
  border-radius: 10px;
  margin: 1.5rem 0;
  text-align: center;
}

.river-button {
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 12px 24px;
  border-radius: 25px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.river-button:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
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
}

.info-card ul {
  color: #2d3748;
  margin: 0;
  padding-left: 1.2rem;
}

.info-card li {
  margin-bottom: 0.5rem;
}

.read-the-docs {
  color: #666;
  text-align: center;
  margin-top: 2rem;
}

.read-the-docs a {
  color: #3182ce;
  text-decoration: none;
  font-weight: 500;
}

.read-the-docs a:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .content-card {
    margin: 1rem;
    padding: 1.5rem;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
