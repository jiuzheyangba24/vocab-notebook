<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1>📘 生词本</h1>
      <p class="subtitle">英语四级/六级/考研词汇学习</p>
      
      <!-- 切换标签 -->
      <div class="auth-tabs">
        <button 
          :class="{ active: mode === 'login' }"
          @click="mode = 'login'"
        >
          登录
        </button>
        <button 
          :class="{ active: mode === 'register' }"
          @click="mode = 'register'"
        >
          注册
        </button>
      </div>
      
      <!-- 登录表单 -->
      <form v-if="mode === 'login'" @submit.prevent="handleLogin">
        <div class="form-group">
          <label>用户名 / 邮箱</label>
          <input 
            v-model="loginForm.username"
            type="text" 
            placeholder="请输入用户名或邮箱"
            required
          >
        </div>
        
        <div class="form-group">
          <label>密码</label>
          <input 
            v-model="loginForm.password"
            type="password" 
            placeholder="请输入密码"
            required
          >
        </div>
        
        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
        
        <p class="hint">
          还没有账号？ 
          <a href="#" @click.prevent="mode = 'register'">立即注册</a>
        </p>
      </form>
      
      <!-- 注册表单 -->
      <form v-else @submit.prevent="handleRegister">
        <div class="form-group">
          <label>用户名</label>
          <input 
            v-model="registerForm.username"
            type="text" 
            placeholder="3-50个字符，字母数字下划线"
            required
          >
        </div>
        
        <div class="form-group">
          <label>邮箱</label>
          <input 
            v-model="registerForm.email"
            type="email" 
            placeholder="请输入有效邮箱"
            required
          >
        </div>
        
        <div class="form-group">
          <label>密码</label>
          <input 
            v-model="registerForm.password"
            type="password" 
            placeholder="至少6个字符"
            required
            minlength="6"
          >
        </div>
        
        <div class="form-group">
          <label>确认密码</label>
          <input 
            v-model="registerForm.confirmPassword"
            type="password" 
            placeholder="再次输入密码"
            required
          >
        </div>
        
        <div class="form-group">
          <label>昵称 (可选)</label>
          <input 
            v-model="registerForm.nickname"
            type="text" 
            placeholder="显示名称"
          >
        </div>
        
        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? '注册中...' : '注册' }}
        </button>
        
        <p class="hint">
          已有账号？ 
          <a href="#" @click.prevent="mode = 'login'">立即登录</a>
        </p>
      </form>
      
      <!-- 游客模式 -->
      <div class="guest-option">
        <p>或者</p>
        <button class="btn-secondary" @click="$emit('guest')">
          以游客身份继续
        </button>
      </div>
      
      <!-- 错误提示 -->
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { authApi } from '../composables/useApi'

const emit = defineEmits(['login', 'guest'])

const mode = ref('login')
const loading = ref(false)
const error = ref('')

const loginForm = reactive({
  username: '',
  password: ''
})

const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  nickname: ''
})

async function handleLogin() {
  error.value = ''
  loading.value = true
  
  try {
    const response = await authApi.login(loginForm.username, loginForm.password)
    
    // 保存 token
    localStorage.setItem('token', response.token)
    localStorage.setItem('user', JSON.stringify(response.user))
    
    // 检查是否有游客模式的单词需要同步
    await syncGuestWordsToDatabase()
    
    emit('login', response.user)
  } catch (err) {
    error.value = err.response?.data?.message || '登录失败，请检查用户名和密码'
  } finally {
    loading.value = false
  }
}

// 同步游客模式的单词到数据库
async function syncGuestWordsToDatabase() {
  const guestVocabulary = localStorage.getItem('vocabulary')
  if (!guestVocabulary) return
  
  try {
    const words = JSON.parse(guestVocabulary)
    if (!Array.isArray(words) || words.length === 0) return
    
    // 批量导入到数据库
    const { wordsApi } = await import('../composables/useApi')
    let syncedCount = 0
    
    for (const word of words) {
      try {
        await wordsApi.add({
          headWord: word.headWord,
          definition: word.definition,
          pronunciation: word.pronunciation || '',
          sentences: word.sentences || []
        })
        syncedCount++
      } catch (e) {
        // 单词已存在，跳过
        console.log(`单词 ${word.headWord} 已存在，跳过`)
      }
    }
    
    if (syncedCount > 0) {
      // 清空游客模式的本地存储
      localStorage.removeItem('vocabulary')
      alert(`已将 ${syncedCount} 个单词同步到你的账户！`)
    }
  } catch (e) {
    console.error('同步单词失败:', e)
  }
}

async function handleRegister() {
  error.value = ''
  
  // 验证密码确认
  if (registerForm.password !== registerForm.confirmPassword) {
    error.value = '两次输入的密码不一致'
    return
  }
  
  loading.value = true
  
  try {
    const response = await authApi.register({
      username: registerForm.username,
      email: registerForm.email,
      password: registerForm.password,
      nickname: registerForm.nickname || undefined
    })
    
    // 🧹 清理旧用户的本地数据（新账号应该是干净的）
    localStorage.removeItem('vocabulary')
    localStorage.removeItem('wrongQuestions')
    localStorage.removeItem('checkin_records')
    localStorage.removeItem('today_stats')
    localStorage.removeItem('today_stats_date')
    
    // 保存 token
    localStorage.setItem('token', response.token)
    localStorage.setItem('user', JSON.stringify(response.user))
    
    emit('login', response.user)
  } catch (err) {
    const details = err.response?.data?.details
    if (details && details.length > 0) {
      error.value = details.map(d => d.msg).join(', ')
    } else {
      error.value = err.response?.data?.message || '注册失败，请稍后重试'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* 🌸 樱花主题 - 登录表单 */
.auth-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.auth-card {
  background: rgba(255, 255, 255, 0.7);
  padding: 48px 40px;
  border-radius: 28px;
  box-shadow: 
    0 20px 60px rgba(248, 165, 194, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.4);
  width: 100%;
  max-width: 420px;
  text-align: center;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  position: relative;
  overflow: hidden;
  z-index: 10;
}

/* 樱花装饰 */
.auth-card::before {
  content: '🌸';
  position: absolute;
  top: -10px;
  right: 20px;
  font-size: 60px;
  opacity: 0.15;
  transform: rotate(15deg);
  z-index: 0;
  pointer-events: none;
}

.auth-card::after {
  content: '🌸';
  position: absolute;
  bottom: -10px;
  left: 20px;
  font-size: 40px;
  opacity: 0.1;
  transform: rotate(-25deg);
  z-index: 0;
  pointer-events: none;
}

.auth-card h1 {
  margin-bottom: 8px;
  font-size: 2.2rem;
  color: var(--primary-dark);
  font-weight: 600;
}

.subtitle {
  color: var(--text-secondary);
  margin-bottom: 32px;
  font-size: 0.95rem;
}

.auth-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 32px;
}

.auth-tabs button {
  flex: 1;
  padding: 14px;
  border: 2px solid #fdd5e0;
  background: white;
  border-radius: 14px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
  color: #a89ba7;
}

.auth-tabs button:hover {
  border-color: #f8a5c2;
  color: #cf8ba9;
}

.auth-tabs button.active {
  border-color: transparent;
  background: linear-gradient(135deg, #f8a5c2, #f48fb1) !important;
  color: white !important;
  box-shadow: 0 4px 15px rgba(248, 165, 194, 0.4);
  position: relative;
  z-index: 1;
}

.form-group {
  margin-bottom: 20px;
  text-align: left;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.form-group input {
  width: 100%;
  padding: 14px 18px;
  border: 2px solid var(--border-color);
  border-radius: 14px;
  font-size: 1rem;
  transition: all 0.3s;
  background: #fff;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #f8a5c2;
  box-shadow: 0 0 0 4px rgba(248, 165, 194, 0.15);
}

.form-group input::placeholder {
  color: #d4c8d2;
}

form button[type="submit"] {
  width: 100%;
  padding: 16px;
  font-size: 1.1rem;
  margin-top: 16px;
  background: linear-gradient(135deg, #f8a5c2, #f48fb1) !important;
  color: white !important;
  border: none;
  border-radius: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(248, 165, 194, 0.3);
}

form button[type="submit"]:hover {
  background: linear-gradient(135deg, #f48fb1, #ec407a) !important;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(248, 165, 194, 0.4);
}

form button[type="submit"]:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.hint {
  margin-top: 24px;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.hint a {
  color: var(--primary-dark);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.hint a:hover {
  color: var(--accent-color);
}

.guest-option {
  margin-top: 28px;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}

.guest-option p {
  color: var(--text-light);
  margin-bottom: 16px;
  font-size: 0.9rem;
}

.guest-option button {
  width: 100%;
  padding: 14px;
  border: 2px solid var(--border-color);
  background: white;
  border-radius: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  transition: all 0.3s;
}

.guest-option button:hover {
  border-color: var(--sakura-300);
  background: var(--sakura-50);
  color: var(--primary-dark);
}

.error-message {
  margin-top: 20px;
  padding: 14px 18px;
  background: linear-gradient(135deg, #fff5f5, #ffe4e4);
  color: #c0392b;
  border-radius: 12px;
  font-size: 0.9rem;
  border: 1px solid rgba(192, 57, 43, 0.1);
}
</style>
