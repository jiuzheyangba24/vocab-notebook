<template>
  <PageContainer>
    <template #header>
      <div class="vocab-header">
        <div>
          <h1 class="page-title">词库</h1>
          <p class="page-subtitle">共 {{ store.wordCount }} 个单词</p>
        </div>
        <div class="header-actions">
          <button class="settings-btn" @click="showSettings = true" title="设置">⚙️</button>
          <button class="view-toggle" @click="toggleView">
            {{ viewMode === 'card' ? '📋 列表' : '🃏 卡片' }}
          </button>
          <button class="add-btn" @click="showAddModal = true">+ 添加</button>
        </div>
      </div>
    </template>
    
    <!-- 搜索栏 -->
    <div class="search-bar">
      <input 
        v-model="searchQuery"
        type="text" 
        placeholder="🔍 搜索单词..."
        class="search-input"
      >
    </div>
    
    <!-- 卡片视图 -->
    <div v-if="viewMode === 'card'" class="card-view">
      <div class="card-container">
        <div class="word-card" v-if="currentWord">
          <div class="card-inner" :class="{ flipped: showDetails }" @click="showDetails = !showDetails">
            <!-- 正面 -->
            <div class="card-front">
              <div class="word-text">{{ currentWord.headWord }}</div>
              <div class="phonetic-row">
                <span class="word-phonetic">{{ currentWord.pronunciation }}</span>
                <button class="speak-btn" @click.stop="speakWord(currentWord.headWord)" title="朗读">🔊</button>
              </div>
              <div class="hint">点击查看释义</div>
            </div>
            <!-- 背面 -->
            <div class="card-back">
              <div class="word-text">{{ currentWord.headWord }}</div>
              <div class="phonetic-row">
                <span class="word-phonetic">{{ currentWord.pronunciation }}</span>
                <button class="speak-btn" @click.stop="speakWord(currentWord.headWord)" title="朗读">🔊</button>
              </div>
              <div class="definition">{{ currentWord.definition }}</div>
              <div class="sentences" v-if="currentWord.sentences?.length">
                <div class="sentence-item" v-for="(s, i) in currentWord.sentences" :key="i">
                  {{ s }}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="empty-card" v-else>
          <span class="empty-icon">📝</span>
          <p>词库是空的</p>
          <button @click="showAddModal = true">添加第一个单词</button>
        </div>
      </div>
      
      <!-- 底部控制栏 -->
      <div class="card-controls" v-if="currentWord">
        <button class="nav-btn prev" @click="prevWord" :disabled="!hasPrev">‹</button>
        <button class="action-btn delete" @click="deleteCurrentWord">🗑️</button>
        <span class="card-index">{{ store.currentIndex + 1 }} / {{ store.wordCount }}</span>
        <button class="nav-btn next" @click="nextWord" :disabled="!hasNext">›</button>
      </div>
      
      <!-- 快捷键提示 -->
      <div class="keyboard-hints" v-if="currentWord">
        <span>⌨️ 空格翻转 | ← → 切换 | S 朗读</span>
      </div>
    </div>
    
    <!-- 列表视图 -->
    <div v-else class="list-view">
      <div v-if="filteredWords.length === 0" class="empty-list">
        <p>{{ searchQuery ? '未找到匹配的单词' : '词库是空的' }}</p>
      </div>
      <div 
        v-for="word in filteredWords" 
        :key="word.id" 
        class="list-item"
        @click="selectWord(word)"
      >
        <div class="item-main">
          <div class="word">{{ word.headWord }}</div>
          <div class="phonetic-row" v-if="word.pronunciation">
            <span class="phonetic">{{ word.pronunciation }}</span>
            <button class="speak-btn-mini" @click.stop="speakWord(word.headWord)" title="朗读">🔊</button>
          </div>
        </div>
        <div class="item-def">{{ word.definition }}</div>
        <div class="item-mastery" v-if="word.mastery_level !== undefined">
          <div class="mastery-bar">
            <div class="mastery-fill" :style="{ width: word.mastery_level + '%' }"></div>
          </div>
          <span class="mastery-text">{{ word.mastery_level }}%</span>
        </div>
        <button class="delete-btn" @click.stop="deleteWord(word)">×</button>
      </div>
    </div>
    
    <!-- 添加弹窗 -->
    <Teleport to="body">
      <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
        <div class="modal-card">
          <div class="modal-header">
            <h3>添加单词</h3>
            <button class="close-btn" @click="showAddModal = false">×</button>
          </div>
          <div class="modal-body">
            <input 
              v-model="newWord" 
              type="text" 
              placeholder="输入单词..."
              @keypress.enter="addWord"
              autofocus
              class="word-input"
            >
            <button class="submit-btn" @click="addWord" :disabled="isAdding">
              {{ isAdding ? '添加中...' : '添加单词' }}
            </button>
            <button class="batch-btn" @click="showBatchModal = true">批量添加</button>
          </div>
        </div>
      </div>
    </Teleport>
    
    <!-- 批量添加弹窗 -->
    <Teleport to="body">
      <div v-if="showBatchModal" class="modal-overlay" @click.self="showBatchModal = false">
        <div class="modal-card batch-modal">
          <div class="modal-header">
            <h3>批量添加</h3>
            <button class="close-btn" @click="showBatchModal = false">×</button>
          </div>
          <div class="modal-body">
            <textarea 
              v-model="batchWords"
              placeholder="每行一个单词..."
              rows="10"
            ></textarea>
            <button class="submit-btn" @click="addBatchWords" :disabled="isBatchAdding">
              {{ isBatchAdding ? '添加中...' : '批量添加' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
    
    <!-- 设置面板 -->
    <Teleport to="body">
      <div v-if="showSettings" class="modal-overlay" @click.self="showSettings = false">
        <div class="modal-card settings-modal">
          <div class="modal-header">
            <h3>⚙️ 设置</h3>
            <button class="close-btn" @click="showSettings = false">×</button>
          </div>
          <div class="modal-body">
            <div class="setting-item">
              <label>自动播放发音</label>
              <p class="setting-desc">切换单词时自动朗读</p>
              <div class="radio-group">
                <label>
                  <input type="radio" v-model="settings.autoPlay" :value="true"> 开启
                </label>
                <label>
                  <input type="radio" v-model="settings.autoPlay" :value="false"> 关闭
                </label>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="submit-btn" @click="saveSettings">保存设置</button>
          </div>
        </div>
      </div>
    </Teleport>
  </PageContainer>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useVocabularyStore } from '../stores/vocabulary'
import { fetchWordInfo } from '../composables/useApi'
import PageContainer from '../components/layout/PageContainer.vue'

const store = useVocabularyStore()

// 键盘快捷键处理
function handleKeydown(e) {
  // 如果正在输入框中，不处理快捷键
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
  
  switch (e.code) {
    case 'Space':
      e.preventDefault()
      showDetails.value = !showDetails.value
      break
    case 'ArrowLeft':
      e.preventDefault()
      if (hasPrev.value) prevWord()
      break
    case 'ArrowRight':
      e.preventDefault()
      if (hasNext.value) nextWord()
      break
    case 'KeyS':
      // S 键朗读当前单词
      if (currentWord.value) {
        speakWord(currentWord.value.headWord)
      }
      break
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

// State
const viewMode = ref('card')
const showDetails = ref(false)
const searchQuery = ref('')
const showAddModal = ref(false)
const showBatchModal = ref(false)
const showSettings = ref(false)
const newWord = ref('')
const batchWords = ref('')
const isAdding = ref(false)
const isBatchAdding = ref(false)

// Settings with localStorage persistence
const settings = ref({
  autoPlay: false
})

// Load settings from localStorage on init
function loadSettings() {
  const saved = localStorage.getItem('vocab_settings')
  if (saved) {
    try {
      Object.assign(settings.value, JSON.parse(saved))
    } catch (e) {
      console.warn('Failed to load settings')
    }
  }
}
loadSettings()

// Computed
const currentWord = computed(() => store.currentWord)
const hasPrev = computed(() => store.currentIndex > 0)
const hasNext = computed(() => store.currentIndex < store.wordCount - 1)

const filteredWords = computed(() => {
  if (!searchQuery.value.trim()) return store.vocabulary
  const query = searchQuery.value.toLowerCase()
  return store.vocabulary.filter(w => 
    w.headWord.toLowerCase().includes(query) ||
    w.definition.toLowerCase().includes(query)
  )
})

// Methods
function toggleView() {
  viewMode.value = viewMode.value === 'card' ? 'list' : 'card'
}

// Speak word using Web Speech API
function speakWord(word) {
  if (!word) return
  const utterance = new SpeechSynthesisUtterance(word)
  utterance.lang = 'en-US'
  utterance.rate = 0.9
  speechSynthesis.speak(utterance)
}

// Save settings to localStorage
function saveSettings() {
  localStorage.setItem('vocab_settings', JSON.stringify(settings.value))
  showSettings.value = false
}

function prevWord() {
  store.prevWord()
  showDetails.value = false
  if (settings.value.autoPlay && store.currentWord) {
    speakWord(store.currentWord.headWord)
  }
}

function nextWord() {
  store.nextWord()
  showDetails.value = false
  if (settings.value.autoPlay && store.currentWord) {
    speakWord(store.currentWord.headWord)
  }
}

function selectWord(word) {
  const index = store.vocabulary.findIndex(w => w.id === word.id)
  if (index !== -1) {
    store.currentIndex = index
    viewMode.value = 'card'
    showDetails.value = true
  }
}

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

async function addBatchWords() {
  const words = batchWords.value.split('\n').map(w => w.trim()).filter(w => w)
  if (words.length === 0) return
  
  isBatchAdding.value = true
  let added = 0
  for (const word of words) {
    try {
      const wordInfo = await fetchWordInfo(word)
      await store.addWord(wordInfo)
      added++
    } catch (e) {
      console.warn(`Failed to add: ${word}`)
    }
  }
  isBatchAdding.value = false
  showBatchModal.value = false
  batchWords.value = ''
  alert(`成功添加 ${added} 个单词`)
}

function deleteCurrentWord() {
  if (confirm('确定删除这个单词吗？')) {
    store.deleteWord()
    showDetails.value = false
  }
}

function deleteWord(word) {
  if (confirm(`确定删除 "${word.headWord}" 吗？`)) {
    const index = store.vocabulary.findIndex(w => w.id === word.id)
    if (index !== -1) {
      store.currentIndex = index
      store.deleteWord()
    }
  }
}
</script>

<style scoped>
.vocab-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--gray-900, #18181b);
  margin: 0;
}

.page-subtitle {
  font-size: 14px;
  color: var(--gray-500, #71717a);
  margin: 4px 0 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.view-toggle {
  padding: 10px 16px;
  background: white;
  border: 1px solid var(--primary-200, #fbd5df);
  border-radius: 10px;
  font-size: 13px;
  cursor: pointer;
}

.add-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, var(--primary-400, #f4729a), var(--primary-500, #ec4074));
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
}

/* Search */
.search-bar {
  margin-bottom: 24px;
}

.search-input {
  width: 100%;
  padding: 14px 20px;
  border: 2px solid var(--primary-100, #fdeef2);
  border-radius: 14px;
  font-size: 15px;
  outline: none;
  background: white;
}

.search-input:focus {
  border-color: var(--primary-300, #f8a8c0);
}

/* Card View */
.card-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
  gap: 48px;
}

.card-container {
  display: flex;
  justify-content: center;
}

.nav-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: white;
  font-size: 20px;
  color: var(--primary-400, #f4729a);
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.nav-btn:hover:not(:disabled) {
  background: var(--primary-50, #fef7f9);
  transform: scale(1.05);
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* 底部控制栏 */
.card-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 16px 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 15px rgba(248, 165, 194, 0.15);
}

.word-card {
  width: 360px;
  perspective: 1000px;
}

.card-inner {
  position: relative;
  width: 100%;
  min-height: 300px;
  transition: transform 0.6s;
  transform-style: preserve-3d;
  cursor: pointer;
}

.card-inner.flipped {
  transform: rotateY(180deg);
}

.card-front, .card-back {
  width: 100%;
  min-height: 300px;
  backface-visibility: hidden;
  background: white;
  border-radius: 24px;
  padding: 40px 32px;
  box-shadow: 0 10px 40px rgba(248, 165, 194, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.card-front {
  position: relative;
}

.card-back {
  position: absolute;
  top: 0;
  left: 0;
  transform: rotateY(180deg);
}


.word-text {
  font-size: 36px;
  font-weight: 700;
  color: var(--gray-900, #18181b);
  margin-bottom: 8px;
}

.word-phonetic {
  font-size: 18px;
  color: var(--primary-400, #f4729a);
  font-style: italic;
}

.hint {
  margin-top: 24px;
  font-size: 13px;
  color: var(--gray-400, #a1a1aa);
}

.definition {
  font-size: 18px;
  color: var(--gray-700, #3f3f46);
  text-align: center;
  margin: 16px 0;
  line-height: 1.6;
}

.sentences {
  margin-top: 16px;
  width: 100%;
}

.sentence-item {
  font-size: 14px;
  color: var(--gray-500, #71717a);
  padding: 10px;
  background: var(--primary-50, #fef7f9);
  border-radius: 8px;
  margin-bottom: 8px;
  line-height: 1.5;
}


.action-btn {
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 16px;
  cursor: pointer;
}

.action-btn.delete {
  background: #fee2e2;
  color: #dc2626;
  border: none;
  transition: all 0.2s;
}

.action-btn.delete:hover {
  background: #fecaca;
}

.card-index {
  font-size: 15px;
  font-weight: 500;
  color: var(--gray-600, #52525b);
  min-width: 60px;
  text-align: center;
}

.keyboard-hints {
  text-align: center;
  font-size: 12px;
  color: var(--gray-400, #a1a1aa);
  padding: 8px;
  margin-top: 8px;
}

.empty-card {
  width: 360px;
  min-height: 300px;
  background: white;
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 40px rgba(248, 165, 194, 0.2);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-card p {
  color: var(--gray-500, #71717a);
  margin-bottom: 16px;
}

.empty-card button {
  padding: 12px 24px;
  background: linear-gradient(135deg, var(--primary-400, #f4729a), var(--primary-500, #ec4074));
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
}

/* List View */
.list-view {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.list-item {
  display: grid;
  grid-template-columns: 1fr 2fr auto auto;
  gap: 16px;
  align-items: center;
  background: white;
  padding: 16px 20px;
  border-radius: 12px;
  border: 1px solid var(--primary-100, #fdeef2);
  cursor: pointer;
  transition: all 0.2s;
}

.list-item:hover {
  background: var(--primary-50, #fef7f9);
}

.item-main .word {
  font-weight: 600;
  color: var(--gray-900, #18181b);
}

.item-main .phonetic-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
}

.item-main .phonetic {
  font-size: 13px;
  color: var(--primary-400, #f4729a);
  font-style: italic;
}

.speak-btn-mini {
  width: 22px;
  height: 22px;
  border: none;
  background: transparent;
  font-size: 12px;
  cursor: pointer;
  padding: 0;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.speak-btn-mini:hover {
  opacity: 1;
}

.item-def {
  font-size: 14px;
  color: var(--gray-500, #71717a);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-mastery {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 80px;
}

.mastery-bar {
  width: 50px;
  height: 6px;
  background: var(--gray-100, #f4f4f5);
  border-radius: 3px;
  overflow: hidden;
}

.mastery-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-300, #f8a8c0), var(--primary-500, #ec4074));
  border-radius: 3px;
}

.mastery-text {
  font-size: 12px;
  color: var(--gray-500, #71717a);
}

.delete-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--gray-400, #a1a1aa);
  font-size: 18px;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s;
}

.list-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: #fee2e2;
  color: #dc2626;
}

.empty-list {
  text-align: center;
  padding: 60px 20px;
  color: var(--gray-500, #71717a);
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

.batch-modal {
  max-width: 500px;
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
}

.close-btn {
  font-size: 24px;
  color: var(--gray-500, #71717a);
  background: none;
  border: none;
  cursor: pointer;
}

.modal-body {
  padding: 24px;
}

.word-input, textarea {
  width: 100%;
  padding: 14px 18px;
  border: 2px solid var(--primary-200, #fbd5df);
  border-radius: 12px;
  font-size: 15px;
  outline: none;
  margin-bottom: 16px;
  box-sizing: border-box;
}

.word-input:focus, textarea:focus {
  border-color: var(--primary-400, #f4729a);
}

textarea {
  resize: vertical;
  font-family: inherit;
}

.submit-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, var(--primary-400, #f4729a), var(--primary-500, #ec4074));
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 12px;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.batch-btn {
  width: 100%;
  padding: 12px;
  background: white;
  border: 2px solid var(--primary-200, #fbd5df);
  border-radius: 12px;
  color: var(--gray-600, #52525b);
  cursor: pointer;
}

/* Settings Button */
.settings-btn {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  border: 1px solid var(--primary-200, #fbd5df);
  background: white;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Phonetic Row */
.phonetic-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 4px;
}

/* Speak Button */
.speak-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: var(--primary-100, #fdeef2);
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.speak-btn:hover {
  background: var(--primary-200, #fbd5df);
}

/* Settings Modal */
.settings-modal {
  max-width: 360px;
}

.setting-item {
  margin-bottom: 20px;
}

.setting-item label {
  font-weight: 600;
  color: var(--gray-800, #27272a);
  display: block;
}

.setting-desc {
  font-size: 13px;
  color: var(--gray-500, #71717a);
  margin: 4px 0 12px;
}

.radio-group {
  display: flex;
  gap: 20px;
}

.radio-group label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 400;
  cursor: pointer;
}

.modal-footer {
  padding: 16px 24px 24px;
}

@media (max-width: 768px) {
  .list-item {
    grid-template-columns: 1fr auto;
  }
  
  .item-def, .item-mastery {
    display: none;
  }
  
  .card-container {
    position: relative;
    flex-direction: column;
    gap: 16px;
  }
  
  .nav-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    opacity: 0.8;
    z-index: 10;
  }
  
  .nav-btn.prev {
    left: -8px;
  }
  
  .nav-btn.next {
    right: -8px;
  }
  
  .word-card {
    width: 100%;
    max-width: 360px;
  }
}
</style>

