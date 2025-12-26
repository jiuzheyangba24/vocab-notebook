
<template>
  <header class="app-header">
    <div class="header-content">
      <div class="logo" @click="$router.push('/')">
        <component :is="BookHeart" class="logo-icon" />
        <span class="logo-text">Vocab</span>
      </div>
      
      <!-- Desktop Navigation -->
      <nav class="desktop-nav">
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
      
      <div class="header-actions">
        <div class="user-info" v-if="user" @click="$router.push('/settings')">
          <User class="avatar" />
          <span class="username">{{ user.nickname || user.username }}</span>
        </div>
        <button v-else class="login-btn" @click="$emit('showAuth')">登录</button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { 
  House, 
  Library, 
  BookOpen, 
  BrainCircuit, 
  ChartBar, 
  BookHeart,
  User 
} from 'lucide-vue-next'

const props = defineProps({
  user: {
    type: Object,
    default: null
  }
})

defineEmits(['showAuth'])

const navItems = [
  { path: '/', label: '首页', icon: House },
  { path: '/library', label: '词库', icon: Library },
  { path: '/vocabulary', label: '单词', icon: BookOpen },
  { path: '/quiz', label: '测试', icon: BrainCircuit },
  { path: '/statistics', label: '统计', icon: ChartBar }
]
</script>


<style scoped>
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--primary-200, #fbd5df);
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}

.logo:hover {
  transform: scale(1.05);
}

.logo-icon {
  width: 28px;
  height: 28px;
  color: var(--primary-500, #ec4074);
}

.logo-text {
  font-family: 'Georgia', serif;
  font-size: 24px;
  font-weight: bold;
  color: var(--primary-500, #ec4074);
  letter-spacing: 1px;
}

/* Desktop Navigation */
.desktop-nav {
  display: flex;
  gap: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 12px;
  text-decoration: none;
  color: var(--gray-500, #71717a);
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.nav-item:hover {
  background: var(--primary-50, #fef7f9);
  color: var(--primary-500, #ec4074);
}

.nav-item.router-link-active {
  background: linear-gradient(135deg, var(--primary-100, #fdeef2), var(--primary-50, #fef7f9));
  color: var(--primary-500, #ec4074);
}

.nav-icon {
  width: 18px;
  height: 18px;
}

.header-actions {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 24px;
  background: var(--primary-50, #fef7f9);
  cursor: pointer;
  transition: all 0.2s;
}

.user-info:hover {
  background: var(--primary-100, #fdeef2);
}

.avatar {
  width: 20px;
  height: 20px;
  color: var(--gray-500, #71717a);
}

.username {
  font-size: 14px;
  font-weight: 500;
  color: var(--gray-700, #3f3f46);
}

.login-btn {
  padding: 10px 24px;
  background: linear-gradient(135deg, var(--primary-300, #f8a8c0), var(--primary-400, #f4729a));
  color: white;
  border: none;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.login-btn:hover {
  background: linear-gradient(135deg, var(--primary-400, #f4729a), var(--primary-500, #ec4074));
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(236, 64, 116, 0.3);
}

/* Hide on mobile */
@media (max-width: 768px) {
  .desktop-nav {
    display: none;
  }
  
  .header-content {
    padding: 0 16px;
  }
}
</style>
