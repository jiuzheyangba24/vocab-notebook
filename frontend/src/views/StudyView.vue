<template>
  <div class="study-container">
    <!-- 顶部导航栏 -->
    <header class="study-header">
      <button class="back-btn" @click="goBack" title="返回">
        <ChevronLeft class="icon-md" />
      </button>
      <h1 class="study-title">{{ libraryName }}</h1>
      <div class="header-stats">
        <span>{{ words.length }} 词</span>
        <span>已掌握 {{ masteredSet.size }}</span>
      </div>
    </header>
    
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-state">
      <Loader2 class="loading-spinner" />
      <p>正在加载词库...</p>
    </div>
    
    <!-- 主内容区 -->
    <div v-else class="word-list-container">
      <!-- 表头工具栏 -->
      <div class="table-toolbar">
        <button class="settings-btn" @click="showSettings = true" title="设置">
          <Settings class="icon-md" />
        </button>
        <div class="column-toggles">
          <button 
            class="toggle-btn" 
            :class="{ active: showWord }"
            @click="showWord = !showWord"
          >
            单词
          </button>
          <button 
            class="toggle-btn" 
            :class="{ active: showPhonetic }"
            @click="showPhonetic = !showPhonetic"
          >
            音标
          </button>
          <button 
            class="toggle-btn" 
            :class="{ active: showDefinition }"
            @click="showDefinition = !showDefinition"
          >
            释义
          </button>
          <span class="toggle-label">操作</span>
        </div>
      </div>
      
      <!-- 单词列表 -->
      <div class="word-list">
        <div 
          v-for="(word, index) in displayWords" 
          :key="word.headWord"
          class="word-row"
          :class="{ 
            mastered: masteredSet.has(word.headWord),
            highlighted: settings.highlightLearned && masteredSet.has(word.headWord)
          }"
        >
          <span class="col-num">{{ (currentPage - 1) * pageSize + index + 1 }}</span>
          
          <div class="col-word">
            <div class="word-main">
              <span class="word-text" v-if="showWord">{{ word.headWord }}</span>
              <span class="word-text hidden" v-else>••••••</span>
              <button 
                class="speak-btn" 
                @click="speakWord(word.headWord)"
                title="朗读"
              >
                <Volume2 class="icon-sm" />
            </button>
            </div>
            <div class="phonetic-text" v-if="showPhonetic && getPhonetic(word)">
              {{ getPhonetic(word) }}
            </div>
            <div class="phonetic-text loading" v-else-if="showPhonetic">
              <span class="loading-dots">加载中...</span>
            </div>
            <div class="phonetic-text hidden" v-else>/ ••• /</div>
          </div>
          
          <div class="col-definition">
            <span v-if="showDefinition">{{ word.definition }}</span>
            <span v-else class="hidden">点击释义显示</span>
          </div>
          
          <div class="col-action">
            <button 
              v-if="!masteredSet.has(word.headWord)"
              class="action-btn master"
              @click="markAsMastered(word)"
            >
              移除
            </button>
            <button 
              v-else
              class="action-btn unmaster"
              @click="unmarkMastered(word)"
            >
              恢复
            </button>
          </div>
        </div>
      </div>
      
      <!-- 分页 -->
      <div class="pagination" v-if="totalPages > 1">
        <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">
          上一页
        </button>
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++">
          下一页
        </button>
      </div>
    </div>
    
    <!-- 底部操作栏 -->
    <footer class="study-footer">
      <button class="add-all-btn" @click="addAllToVocab">
        <FolderDown class="btn-icon" /> 导入到我的词库
      </button>
    </footer>
    
    <!-- 设置面板 -->
    <Teleport to="body">
      <div v-if="showSettings" class="settings-overlay" @click.self="showSettings = false">
        <div class="settings-panel">
          <h2>设置</h2>
          
          <div class="setting-item">
            <label>每日单词量 <span class="hint">(用于学习计划)</span></label>
            <input type="number" v-model.number="settings.dailyWords" min="1" max="200">
          </div>
          
          <div class="setting-item">
            <label>发音</label>
            <div class="radio-group">
              <label>
                <input type="radio" v-model="settings.pronunciation" value="us"> 美式
              </label>
              <label>
                <input type="radio" v-model="settings.pronunciation" value="uk"> 英式
              </label>
            </div>
          </div>
          
          <div class="setting-item">
            <label>单词顺序</label>
            <div class="radio-group">
              <label>
                <input type="radio" v-model="settings.wordOrder" value="random"> 乱序
              </label>
              <label>
                <input type="radio" v-model="settings.wordOrder" value="sequential"> 正序
              </label>
            </div>
          </div>
          
          <div class="setting-item">
            <label>自动播放发音 <span class="hint">(切换单词时自动朗读)</span></label>
            <div class="radio-group">
              <label>
                <input type="radio" v-model="settings.autoPlay" value="on"> 开启
              </label>
              <label>
                <input type="radio" v-model="settings.autoPlay" value="off"> 关闭
              </label>
            </div>
          </div>
          
          <div class="setting-item">
            <label>已学高亮</label>
            <div class="radio-group">
              <label>
                <input type="radio" v-model="settings.highlightLearned" :value="true"> 开启
              </label>
              <label>
                <input type="radio" v-model="settings.highlightLearned" :value="false"> 关闭
              </label>
            </div>
          </div>
          
          <button class="close-settings" @click="showSettings = false">完成</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { libraries, fetchLibraryWords, fetchPhonetic } from '../composables/useLibrary'
import { useVocabularyStore } from '../stores/vocabulary'
import { 
  ChevronLeft, 
  Settings, 
  Volume2, 
  FolderDown,
  Loader2
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const store = useVocabularyStore()

// 词库信息
const libraryId = computed(() => route.params.id)
const libraryInfo = computed(() => libraries.find(lib => lib.id === libraryId.value))
const libraryName = computed(() => libraryInfo.value?.name || '词库')

// 状态
const words = ref([])
const isLoading = ref(true)
const currentPage = ref(1)
const showSettings = ref(false)

// 列显示控制
const showWord = ref(true)
const showPhonetic = ref(true)
const showDefinition = ref(false)

// 已掌握单词 (从词库中移除的)
const masteredSet = ref(new Set())

// 选中的单词 (要加入词库的)
const selectedWords = ref(new Set())

// 设置
const settings = reactive({
  dailyWords: 30,  // 每页显示单词数量
  pronunciation: 'us',
  wordOrder: 'sequential',
  autoPlay: 'off',
  highlightLearned: true
})

// 每页大小（来自设置）
const pageSize = computed(() => settings.dailyWords || 30)

// 计算属性
const totalPages = computed(() => Math.ceil(words.value.length / pageSize.value))
const displayWords = computed(() => {
  let list = [...words.value]
  // 只根据顺序设置来处理
  if (settings.wordOrder === 'random') {
    // 使用固定随机种子避免每次渲染都重新打乱
    list = shuffleWithSeed(list, libraryId.value)
  }
  const start = (currentPage.value - 1) * pageSize.value
  return list.slice(start, start + pageSize.value)
})

// 方法
function goBack() {
  router.push('/library')
}

// 使用固定种子的 shuffle 避免重渲染时重排
function shuffleWithSeed(array, seed) {
  const arr = [...array]
  let seedNum = seed.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
  
  for (let i = arr.length - 1; i > 0; i--) {
    seedNum = (seedNum * 9301 + 49297) % 233280
    const j = Math.floor((seedNum / 233280) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// 音标缓存
const phoneticsMap = ref({})

// 获取单词的音标（优先使用缓存）
function getPhonetic(word) {
  if (word.pronunciation) return word.pronunciation
  return phoneticsMap.value[word.headWord] || ''
}

// 自动获取当前页单词的音标
let isLoadingPhonetics = false
async function loadPhoneticsForPage() {
  if (isLoadingPhonetics) return
  isLoadingPhonetics = true
  
  try {
    const wordsNeedingPhonetics = displayWords.value.filter(w => !w.pronunciation && !phoneticsMap.value[w.headWord])
    
    // 逐个获取，每个之间稍作延迟避免API限流
    for (const word of wordsNeedingPhonetics) {
      const phonetic = await fetchPhonetic(word.headWord)
      if (phonetic) {
        phoneticsMap.value[word.headWord] = phonetic
      }
      // 小延迟避免请求过快
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  } finally {
    isLoadingPhonetics = false
  }
}

// 监听页面变化自动获取音标
watch([displayWords, () => showPhonetic.value], ([newWords, show]) => {
  if (show && newWords.length > 0) {
    loadPhoneticsForPage()
  }
}, { immediate: true })

// 发音功能 - 使用 Web Speech API
function speakWord(word) {
  if (!window.speechSynthesis) {
    alert('您的浏览器不支持语音朗读功能')
    return
  }
  
  // 停止当前朗读
  window.speechSynthesis.cancel()
  
  const utterance = new SpeechSynthesisUtterance(word)
  utterance.lang = settings.pronunciation === 'uk' ? 'en-GB' : 'en-US'
  utterance.rate = 0.9
  utterance.pitch = 1
  
  window.speechSynthesis.speak(utterance)
}

function markAsMastered(word) {
  masteredSet.value.add(word.headWord)
  saveMasteredList()
}

function unmarkMastered(word) {
  masteredSet.value.delete(word.headWord)
  saveMasteredList()
}

function saveMasteredList() {
  const key = `mastered_${libraryId.value}`
  localStorage.setItem(key, JSON.stringify([...masteredSet.value]))
}

function loadMasteredList() {
  const key = `mastered_${libraryId.value}`
  const saved = localStorage.getItem(key)
  if (saved) {
    try {
      masteredSet.value = new Set(JSON.parse(saved))
    } catch (e) {
      console.error('Failed to load mastered list', e)
    }
  }
}

function loadSettings() {
  const saved = localStorage.getItem('studySettings')
  if (saved) {
    try {
      Object.assign(settings, JSON.parse(saved))
    } catch (e) {
      console.error('Failed to load settings', e)
    }
  }
}

function saveSettings() {
  localStorage.setItem('studySettings', JSON.stringify(settings))
}

// 监听设置变化自动保存
watch(settings, () => {
  saveSettings()
}, { deep: true })

// 切换单词选择状态
function toggleWordSelection(word) {
  if (selectedWords.value.has(word.headWord)) {
    selectedWords.value.delete(word.headWord)
  } else {
    selectedWords.value.add(word.headWord)
  }
  // 强制更新
  selectedWords.value = new Set(selectedWords.value)
}

// 加入选中的单词到词库
async function addSelectedToVocab() {
  if (selectedWords.value.size === 0) return
  
  const wordsToAdd = words.value.filter(w => selectedWords.value.has(w.headWord))
  let added = 0
  
  for (const word of wordsToAdd) {
    try {
      await store.addWord({
        headWord: word.headWord,
        definition: word.definition,
        pronunciation: word.pronunciation || getPhonetic(word),
        sentences: word.sentences || []
      })
      added++
    } catch (e) {
      console.warn('Word already exists:', word.headWord)
    }
  }
  
  alert(`成功加入 ${added} 个单词到你的词库！`)
  selectedWords.value.clear()
  selectedWords.value = new Set()
}

// 全部加入词库
async function addAllToVocab() {
  if (words.value.length === 0) {
    alert('没有可导入的单词')
    return
  }
  
  if (!confirm(`确定要将全部 ${words.value.length} 个单词导入到你的词库吗？`)) return
  
  // 统计当前词库中已存在的单词
  const existingWords = new Set(
    store.vocabulary.map(w => (w.headWord || '').toLowerCase())
  )
  
  // 过滤出新单词
  const newWords = words.value.filter(
    w => !existingWords.has((w.headWord || '').toLowerCase())
  )
  
  if (newWords.length === 0) {
    alert('这些单词都已经在你的词库中了！')
    return
  }
  
  // 使用 importVocabulary 批量导入
  try {
    await store.importVocabulary(newWords)
    alert(`成功导入 ${newWords.length} 个新单词到你的词库！`)
  } catch (e) {
    console.error('Import error:', e)
    alert('导入失败：' + e.message)
  }
}

async function loadLibrary() {
  if (!libraryId.value) {
    router.push('/library')
    return
  }
  
  isLoading.value = true
  
  try {
    const cacheKey = `library_cache_${libraryId.value}`
    const cached = localStorage.getItem(cacheKey)
    
    if (cached) {
      words.value = JSON.parse(cached)
    } else {
      const fetchedWords = await fetchLibraryWords(libraryId.value)
      words.value = fetchedWords
      
      try {
        localStorage.setItem(cacheKey, JSON.stringify(fetchedWords))
      } catch (e) {
        console.warn('Cache storage failed')
      }
    }
    
    loadMasteredList()
  } catch (error) {
    alert('加载词库失败: ' + error.message)
    router.push('/library')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadSettings()
  loadLibrary()
})
</script>

<style scoped>
.study-container {
  min-height: 100vh;
  padding-top: 64px; /* 为顶部固定导航栏留出空间 */
  background: linear-gradient(135deg, #1e1e2e 0%, #2d2d3a 100%);
  color: #e0e0e0;
  display: flex;
  flex-direction: column;
}

/* Header */
.study-header {
  position: sticky;
  top: 64px; /* 在全局导航栏下方 */
  background: rgba(30, 30, 46, 0.95);
  backdrop-filter: blur(10px);
  padding: 16px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 10;
}

.icon-md {
  width: 24px;
  height: 24px;
}

.icon-sm {
  width: 16px;
  height: 16px;
}

.btn-icon {
  width: 18px;
  height: 18px;
}

.back-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: transparent;
  border: none;
  color: var(--gray-600, #52525b);
  cursor: pointer;
  display: flex; /* Flex center */
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.back-btn:hover {
  background: var(--gray-100, #f4f4f5);
  color: var(--gray-900, #18181b);
}

.study-title {
  flex: 1;
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.header-stats {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #888;
}

/* Table Toolbar */
.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: rgba(45, 45, 58, 0.9);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.settings-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.settings-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.column-toggles {
  display: flex;
  gap: 24px;
  align-items: center;
}

.toggle-btn {
  background: transparent;
  border: none;
  color: #888;
  font-size: 14px;
  cursor: pointer;
  padding: 8px 0;
  position: relative;
}

.toggle-btn.active {
  color: #4fc3f7;
}

.toggle-btn::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #4fc3f7;
  opacity: 0;
  transition: opacity 0.2s;
}

.toggle-btn.active::after {
  opacity: 1;
}

.toggle-label {
  color: #888;
  font-size: 14px;
}

/* Loading */
.loading-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  color: #4fc3f7;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Word List */
.word-list-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.word-list {
  flex: 1;
  padding: 16px 24px 160px;
}

.word-row {
  display: grid;
  grid-template-columns: 40px minmax(150px, 1fr) minmax(200px, 2fr) 80px;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  align-items: center;
}

.word-row.mastered {
  opacity: 0.5;
}

.word-row.highlighted {
  background: rgba(79, 195, 247, 0.05);
}

.col-num {
  color: #666;
  font-size: 14px;
}

.col-word {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.word-main {
  display: flex;
  align-items: center;
  gap: 8px;
}

.word-text {
  font-size: 17px;
  font-weight: 600;
  color: #4fc3f7;
}

.word-text.hidden {
  color: #555;
}

.speak-btn {
  background: transparent;
  border: none;
  font-size: 14px;
  cursor: pointer;
  padding: 4px;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.speak-btn:hover {
  opacity: 1;
}

.phonetic-text {
  font-size: 13px;
  color: #888;
}

.phonetic-text.hidden {
  color: #555;
}

.phonetic-text.loading {
  color: #666;
  font-style: italic;
}

.loading-dots {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

.col-definition {
  font-size: 14px;
  color: #bbb;
}

.col-definition .hidden {
  color: #555;
  font-style: italic;
}

.col-action {
  text-align: right;
}

.action-btn {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  border: none;
}

.action-btn.master {
  background: rgba(79, 195, 247, 0.15);
  color: #4fc3f7;
}

.action-btn.unmaster {
  background: rgba(255, 255, 255, 0.1);
  color: #888;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding: 24px 0;
  margin-bottom: 80px;
  background: rgba(30, 30, 46, 0.9);
  border-radius: 12px;
  margin: 16px 0 80px;
}

.page-btn {
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #e0e0e0;
  cursor: pointer;
}

.page-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* Footer */
.study-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(30, 30, 46, 0.95);
  backdrop-filter: blur(10px);
  padding: 16px 24px;
  display: flex;
  justify-content: center;
  gap: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.add-selected-btn {
  padding: 14px 32px;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  border: none;
  border-radius: 12px;
  color: white;
  font-weight: 600;
  cursor: pointer;
}

.add-selected-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.add-all-btn {
  padding: 14px 32px;
  background: linear-gradient(135deg, #ec4074, #f472b6);
  border: none;
  border-radius: 12px;
  color: white;
  font-weight: 600;
  cursor: pointer;
}

/* Checkbox */
.word-checkbox {
  width: 18px;
  height: 18px;
  accent-color: #4fc3f7;
  cursor: pointer;
}

.word-row.selected {
  background: rgba(79, 195, 247, 0.1);
}

/* Settings Panel */
.settings-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.settings-panel {
  background: #2d2d3a;
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 400px;
  max-height: 80vh;
  overflow-y: auto;
}

.settings-panel h2 {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 24px;
  color: #e0e0e0;
}

.setting-item {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
}

.setting-item:last-of-type {
  border-bottom: none;
}

.setting-item > label {
  display: block;
  font-size: 14px;
  color: #e0e0e0;
  margin-bottom: 12px;
}

.setting-item .hint {
  font-size: 12px;
  color: #666;
}

.setting-item input[type="number"] {
  width: 100%;
  padding: 12px;
  background: #1e1e2e;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #e0e0e0;
  font-size: 16px;
}

.radio-group {
  display: flex;
  gap: 24px;
}

.radio-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #888;
  cursor: pointer;
}

.radio-group input[type="radio"] {
  width: 16px;
  height: 16px;
  accent-color: #ef4444;
}

.close-settings {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #4fc3f7, #29b6f6);
  border: none;
  border-radius: 10px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
}

/* Mobile */
@media (max-width: 768px) {
  .word-row {
    grid-template-columns: 40px 1fr 60px;
  }
  
  .col-definition {
    display: none;
  }
  
  .column-toggles {
    gap: 16px;
  }
  
  .header-stats {
    display: none;
  }
}
</style>
