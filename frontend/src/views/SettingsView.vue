<template>
  <PageContainer title="设置" subtitle="账户和应用设置">
    <!-- 用户信息 -->
    <section class="settings-section">
      <h3>账户信息</h3>
      <div v-if="currentUser" class="user-card">
        <div class="avatar">
          <User class="avatar-icon" />
        </div>
        <div class="user-info">
          <div class="name">{{ currentUser.nickname || currentUser.username }}</div>
          <div class="email">{{ currentUser.email }}</div>
        </div>
        <button class="logout-btn" @click="handleLogout">退出登录</button>
      </div>
      <div v-else class="guest-card">
        <p>当前以游客身份使用</p>
        <button class="login-btn" @click="$emit('showAuth')">登录 / 注册</button>
      </div>
    </section>
    
    <!-- 数据管理 -->
    <section class="settings-section">
      <h3>数据管理</h3>
      <div class="settings-list">
        <div class="setting-item" @click="exportData">
          <div class="setting-icon-wrapper blue">
            <FileDown class="setting-icon" />
          </div>
          <span class="setting-label">导出词库</span>
          <ChevronRight class="setting-arrow" />
        </div>
        <div class="setting-item" @click="triggerImport">
          <div class="setting-icon-wrapper purple">
            <FileUp class="setting-icon" />
          </div>
          <span class="setting-label">导入词库</span>
          <ChevronRight class="setting-arrow" />
        </div>
        <div class="setting-item danger" @click="clearAllData">
          <div class="setting-icon-wrapper red">
            <Trash2 class="setting-icon" />
          </div>
          <span class="setting-label">清空所有数据</span>
          <ChevronRight class="setting-arrow" />
        </div>
      </div>
    </section>
    
    <!-- 关于 -->
    <section class="settings-section">
      <h3>关于</h3>
      <div class="about-info">
        <div class="about-item">
          <span class="label">应用名称</span>
          <span class="value">Vocab Notebook</span>
        </div>
        <div class="about-item">
          <span class="label">版本</span>
          <span class="value">2.0.0</span>
        </div>
        <div class="about-item">
          <span class="label">词库数量</span>
          <span class="value">{{ store.wordCount }} 个单词</span>
        </div>
      </div>
    </section>
    
    <!-- 隐藏的文件输入 -->
    <input 
      ref="fileInput"
      type="file" 
      accept="application/json"
      style="display: none"
      @change="handleFileImport"
    >
  </PageContainer>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useVocabularyStore } from '../stores/vocabulary'
import PageContainer from '../components/layout/PageContainer.vue'
import { User, FileDown, FileUp, Trash2, ChevronRight, Info } from 'lucide-vue-next'

const emit = defineEmits(['showAuth', 'logout'])

const store = useVocabularyStore()
const router = useRouter()
const fileInput = ref(null)

const currentUser = computed(() => {
  const saved = localStorage.getItem('user')
  return saved ? JSON.parse(saved) : null
})

function handleLogout() {
  if (confirm('确定要退出登录吗？')) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    emit('logout')
    router.push('/')
  }
}

function exportData() {
  store.exportVocabulary()
}

function triggerImport() {
  fileInput.value?.click()
}

async function handleFileImport(event) {
  const file = event.target.files[0]
  if (!file) return
  
  try {
    const text = await file.text()
    const data = JSON.parse(text)
    const count = await store.importVocabulary(data)
    alert(`成功导入词库，现有 ${count} 个单词`)
  } catch (error) {
    alert('导入失败: ' + error.message)
  }
  
  event.target.value = ''
}

function clearAllData() {
  if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
    if (confirm('再次确认：您的所有单词和学习记录将被永久删除！')) {
      localStorage.removeItem('vocabulary')
      localStorage.removeItem('wrongQuestions')
      store.vocabulary = []
      store.wrongQuestions = []
      alert('数据已清空')
    }
  }
}
</script>

<style scoped>
.settings-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
  border: 1px solid var(--primary-100, #fdeef2);
}

.settings-section h3 {
  font-size: 14px;
  font-weight: 600;
  color: var(--gray-500, #71717a);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 16px;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar {
  width: 56px;
  height: 56px;
  background: var(--primary-50, #fef7f9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-400, #f4729a);
}

.avatar-icon {
  width: 28px;
  height: 28px;
}

.user-info {
  flex: 1;
}

.user-info .name {
  font-weight: 600;
  font-size: 18px;
  color: var(--gray-900, #18181b);
}

.user-info .email {
  font-size: 14px;
  color: var(--gray-500, #71717a);
}

.logout-btn {
  padding: 10px 20px;
  background: #fee2e2;
  color: #dc2626;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
}

.guest-card {
  text-align: center;
  padding: 20px;
}

.guest-card p {
  color: var(--gray-500, #71717a);
  margin: 0 0 16px;
}

.login-btn {
  padding: 12px 32px;
  background: linear-gradient(135deg, var(--primary-400, #f4729a), var(--primary-500, #ec4074));
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
}

.settings-list {
  display: flex;
  flex-direction: column;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 12px;
  border-bottom: 1px solid var(--primary-50, #fef7f9);
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 12px;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item:hover {
  background: var(--primary-50, #fef7f9);
}

.setting-item.danger .setting-label {
  color: #dc2626;
}

.setting-icon-wrapper {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.setting-icon-wrapper.blue { background: #e0f2fe; color: #0ea5e9; }
.setting-icon-wrapper.purple { background: #f3e8ff; color: #a855f7; }
.setting-icon-wrapper.red { background: #fee2e2; color: #dc2626; }

.setting-icon {
  width: 20px;
  height: 20px;
}

.setting-label {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  color: var(--gray-700, #3f3f46);
}

.setting-arrow {
  width: 18px;
  height: 18px;
  color: var(--gray-400, #a1a1aa);
}

.about-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.about-item {
  display: flex;
  justify-content: space-between;
}

.about-item .label {
  color: var(--gray-500, #71717a);
}

.about-item .value {
  font-weight: 500;
  color: var(--gray-700, #3f3f46);
}
</style>
