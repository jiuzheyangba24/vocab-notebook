<template>
  <nav class="bottom-nav">
    <router-link 
      v-for="item in navItems" 
      :key="item.path"
      :to="item.path"
      class="nav-item"
    >
      <component :is="item.icon" class="nav-icon" />
      <span class="nav-label">{{ item.label }}</span>
    </router-link>
  </nav>
</template>

<script setup>
import { 
  House, 
  Library, 
  BookOpen, 
  BrainCircuit, 
  Settings
} from 'lucide-vue-next'

const navItems = [
  { path: '/', label: '首页', icon: House },
  { path: '/library', label: '词库', icon: Library },
  { path: '/vocabulary', label: '单词', icon: BookOpen },
  { path: '/quiz', label: '测试', icon: BrainCircuit },
  { path: '/settings', label: '设置', icon: Settings }
]
</script>

<style scoped>
.bottom-nav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-top: 1px solid var(--primary-200, #fbd5df);
  padding: 0 8px;
  padding-bottom: env(safe-area-inset-bottom, 0);
  z-index: 100;
}

@media (max-width: 768px) {
  .bottom-nav {
    display: flex;
    justify-content: space-around;
    align-items: center;
  }
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 12px;
  text-decoration: none;
  color: var(--gray-500, #71717a);
  transition: all 0.2s;
  min-width: 56px;
}

.nav-item:hover,
.nav-item.router-link-active {
  color: var(--primary-500, #ec4074);
}

.nav-item.router-link-active {
  background: var(--primary-50, #fef7f9);
}

.nav-icon {
  width: 24px;
  height: 24px;
}

.nav-label {
  font-size: 11px;
  font-weight: 500;
}
</style>
