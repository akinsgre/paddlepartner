<script setup lang="ts">
import AppHeader from './components/AppHeader.vue'
</script>

<template>
  <div id="app">
    <AppHeader />
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<style>
#app {
  margin: 0;
  padding: 0;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
}
</style>
