<template>
  <PageContainer title="首页" subtitle="今日学习概览">
    <!-- 打卡卡片 -->
    <CheckInCard 
      ref="checkInCardRef"
      :daily-goal="10"
      @checkin="handleCheckIn"
    />
    
    <!-- 复习提醒 -->
    <ReviewReminder />
    
    <!-- 今日统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon-wrapper blue">
          <Book class="stat-icon" />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ store.wordCount }}</div>
          <div class="stat-label">词库总数</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon-wrapper red">
          <AlertCircle class="stat-icon" />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ store.wrongCount }}</div>
          <div class="stat-label">待复习错题</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon-wrapper green">
          <Target class="stat-icon" />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ masteredCount }}</div>
          <div class="stat-label">已掌握</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon-wrapper purple">
          <TrendingUp class="stat-icon" />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ avgMastery }}%</div>
          <div class="stat-label">掌握度</div>
        </div>
      </div>
    </div>
    
    <!-- 快捷操作 -->
    <section class="quick-actions">
      <h2><Rocket class="section-icon" /> 快捷操作</h2>
      <div class="actions-grid">
        <div class="action-card" @click="$router.push('/library')">
          <Library class="action-icon" />
          <span class="action-text">词库中心</span>
        </div>
        <div class="action-card" @click="$router.push('/quiz')">
          <BrainCircuit class="action-icon" />
          <span class="action-text">开始测试</span>
        </div>
        <div class="action-card" @click="$router.push('/wrong')">
          <RotateCw class="action-icon" />
          <span class="action-text">复习错题</span>
        </div>
        <div class="action-card ai-card" @click="$router.push('/ai')">
          <Bot class="action-icon" />
          <span class="action-text">AI 助手</span>
        </div>
      </div>
    </section>
    
    <!-- 最近添加 -->
    <section class="recent-words" v-if="recentWords.length > 0">
      <h2><History class="section-icon" /> 最近学习</h2>
      <div class="words-list">
        <div 
          v-for="word in recentWords" 
          :key="word.id" 
          class="word-item"
          @click="$router.push('/vocabulary')"
        >
          <div class="word-main">{{ word.headWord }}</div>
          <div class="word-def">{{ word.definition }}</div>
        </div>
      </div>
    </section>
    
    <!-- 添加单词弹窗 -->
    <Teleport to="body">
      <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
        <div class="modal-card">
          <div class="modal-header">
            <h3>添加单词</h3>
            <button class="close-btn" @click="showAddModal = false">×</button>
          </div>
          <div class="modal-body">
            <div class="input-group">
              <input 
                v-model="newWord" 
                type="text" 
                placeholder="输入要添加的单词..."
                @keypress.enter="addWord"
                autofocus
              >
              <button class="add-btn" @click="addWord" :disabled="isAdding">
                {{ isAdding ? '添加中...' : '添加' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </PageContainer>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useVocabularyStore } from '../stores/vocabulary'
import { fetchWordInfo } from '../composables/useApi'
import PageContainer from '../components/layout/PageContainer.vue'
import CheckInCard from '../components/CheckInCard.vue'
import ReviewReminder from '../components/ReviewReminder.vue'
import { 
  Book, 
  AlertCircle, 
  Target, 
  TrendingUp, 
  Rocket, 
  Library, 
  BrainCircuit, 
  RotateCw, 
  Bot, 
  History 
} from 'lucide-vue-next'

const store = useVocabularyStore()

// Refs
const checkInCardRef = ref(null)
const showAddModal = ref(false)
const newWord = ref('')
const isAdding = ref(false)

// 计算属性
const masteredCount = computed(() => {
  return store.vocabulary.filter(w => w.mastery_level >= 80).length
})

const avgMastery = computed(() => {
  if (store.vocabulary.length === 0) return 0
  const sum = store.vocabulary.reduce((acc, w) => acc + (w.mastery_level || 0), 0)
  return Math.round(sum / store.vocabulary.length)
})

const recentWords = computed(() => {
  return [...store.vocabulary]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
})

// 方法
async function addWord() {
  const word = newWord.value.trim()
  if (!word) return
  
  isAdding.value = true
  try {
    const wordInfo = await fetchWordInfo(word)
    await store.addWord(wordInfo)
    newWord.value = ''
    showAddModal.value = false
  } catch (error) {
    alert(error.message)
  } finally {
    isAdding.value = false
  }
}

// 打卡成功处理
function handleCheckIn(streakDays) {
  alert(`恭喜！你已连续打卡 ${streakDays} 天 🎉`)
}
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 12px rgba(248, 165, 194, 0.1);
  border: 1px solid var(--primary-100, #fdeef2);
  transition: all 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(248, 165, 194, 0.15);
}

.stat-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon-wrapper.blue { background: #e0f2fe; color: #0ea5e9; }
.stat-icon-wrapper.red { background: #fee2e2; color: #ef4444; }
.stat-icon-wrapper.green { background: #dcfce7; color: #22c55e; }
.stat-icon-wrapper.purple { background: #f3e8ff; color: #a855f7; }

.stat-icon {
  width: 24px;
  height: 24px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--gray-900, #18181b);
}

.stat-label {
  font-size: 13px;
  color: var(--gray-500, #71717a);
}

/* Quick Actions */
.quick-actions, .recent-words {
  margin-bottom: 32px;
}

h2 {
  font-size: 18px;
  font-weight: 600;
  color: var(--gray-700, #3f3f46);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-icon {
  width: 20px;
  height: 20px;
  color: var(--primary-500, #ec4074);
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.action-card {
  background: white;
  border-radius: 16px;
  padding: 24px 16px;
  text-align: center;
  cursor: pointer;
  border: 1px solid var(--primary-100, #fdeef2);
  transition: all 0.2s;
}

.action-card:hover {
  background: var(--primary-50, #fef7f9);
  border-color: var(--primary-300, #f8a8c0);
  transform: translateY(-2px);
}

.action-card.ai-card {
  background: linear-gradient(135deg, #ede9fe, #e0e7ff);
  border-color: #c7d2fe;
}

.action-card.ai-card:hover {
  border-color: #a5b4fc;
  background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
}

.action-icon {
  width: 28px;
  height: 28px;
  display: block;
  margin: 0 auto 8px;
  color: var(--primary-500, #ec4074);
}

.ai-card .action-icon {
  color: #6366f1;
}

.action-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--gray-700, #3f3f46);
}

/* Recent Words */
.words-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.word-item {
  background: white;
  border-radius: 12px;
  padding: 14px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid var(--primary-100, #fdeef2);
  cursor: pointer;
  transition: all 0.2s;
}

.word-item:hover {
  background: var(--primary-50, #fef7f9);
}

.word-main {
  font-weight: 600;
  color: var(--gray-900, #18181b);
}

.word-def {
  font-size: 13px;
  color: var(--gray-500, #71717a);
  max-width: 60%;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.modal-card {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 400px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--primary-100, #fdeef2);
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  font-size: 24px;
  color: var(--gray-500, #71717a);
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
}

.modal-body {
  padding: 24px;
}

.input-group {
  display: flex;
  gap: 12px;
}

.input-group input {
  flex: 1;
  padding: 14px 18px;
  border: 2px solid var(--primary-200, #fbd5df);
  border-radius: 12px;
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s;
}

.input-group input:focus {
  border-color: var(--primary-400, #f4729a);
}

.add-btn {
  padding: 14px 24px;
  background: linear-gradient(135deg, var(--primary-400, #f4729a), var(--primary-500, #ec4074));
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.add-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(236, 64, 116, 0.3);
}

.add-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
