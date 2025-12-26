<template>
  <div class="page-container">
    <div class="page-content">
      <header class="page-header" v-if="title || $slots.header">
        <slot name="header">
          <h1 class="page-title">{{ title }}</h1>
          <p class="page-subtitle" v-if="subtitle">{{ subtitle }}</p>
        </slot>
      </header>
      
      <main class="page-main">
        <slot></slot>
      </main>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  padding-top: 64px; /* Header height */
  padding-bottom: 80px; /* Bottom nav + safe area */
  background: var(--bg-gradient, linear-gradient(135deg, #fff5f8 0%, #ffeef5 50%, #fff0f5 100%));
  overflow-y: auto;
}

@media (min-width: 769px) {
  .page-container {
    padding-bottom: 24px;
  }
}

.page-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

@media (max-width: 768px) {
  .page-content {
    padding: 16px;
  }
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--gray-900, #18181b);
  margin: 0 0 8px 0;
}

.page-subtitle {
  font-size: 15px;
  color: var(--gray-500, #71717a);
  margin: 0;
}

.page-main {
  position: relative;
}
</style>
