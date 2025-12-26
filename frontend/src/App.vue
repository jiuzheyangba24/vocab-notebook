<template>
  <!-- 登录/注册界面 -->
  <div v-if="showAuthForm" class="auth-wrapper">
    <SakuraBackground />
    <AuthForm 
      @login="handleLogin"
      @guest="handleGuest"
    />
  </div>

  <!-- 主应用界面 -->
  <div v-else class="app-layout">
    <AppHeader :user="currentUser" @showAuth="showAuthForm = true" />
    
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" @showAuth="showAuthForm = true" @logout="handleLogout" />
      </transition>
    </router-view>
    
    <AIAssistantWidget />
    <BottomNav />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useVocabularyStore } from './stores/vocabulary'

import AuthForm from './components/AuthForm.vue'
import AppHeader from './components/layout/AppHeader.vue'
import BottomNav from './components/layout/BottomNav.vue'
import SakuraBackground from './components/SakuraBackground.vue'
import AIAssistantWidget from './components/AIAssistantWidget.vue'

const store = useVocabularyStore()

// State
const showAuthForm = ref(true)
const currentUser = ref(null)

// Auth handlers
function handleLogin(user) {
  currentUser.value = user
  showAuthForm.value = false
  store.loadVocabulary()
}

function handleGuest() {
  currentUser.value = null
  showAuthForm.value = false
  store.loadVocabulary()
}

function handleLogout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  currentUser.value = null
  showAuthForm.value = true
}

// Initialize
onMounted(() => {
  const savedUser = localStorage.getItem('user')
  if (savedUser) {
    try {
      currentUser.value = JSON.parse(savedUser)
      showAuthForm.value = false
      store.loadVocabulary()
    } catch (e) {
      console.error('Failed to parse user', e)
    }
  }
})
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  background: var(--bg-gradient, linear-gradient(135deg, #fff5f8 0%, #ffeef5 50%, #fff0f5 100%));
}

.auth-wrapper {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: radial-gradient(circle at center, #fff0f5 0%, #ffeef5 100%);
  position: relative;
  overflow: hidden;
}

/* Page transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
