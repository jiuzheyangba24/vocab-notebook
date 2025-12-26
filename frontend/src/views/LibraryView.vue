
<template>
  <PageContainer title="词库中心" subtitle="选择词库开始学习">
    <!-- 我的词库 -->
    <section class="library-section" v-if="customLibraries.length > 0 || true">
      <div class="section-header">
        <h2><NotebookPen class="section-icon" /> 我的词库</h2>
        <button class="import-btn" @click="showImportModal = true">
          <Plus class="btn-icon" /> 导入词库
        </button>
      </div>
      
      <div class="library-grid" v-if="customLibraries.length > 0">
        <div 
          v-for="lib in customLibraries" 
          :key="lib.id"
          class="library-card custom-card"
          @click="enterCustomLibrary(lib.id)"
        >
          <div class="card-icon custom-icon">
            <BookHeart class="icon-svg" />
          </div>
          <div class="card-info">
            <h3>{{ lib.name }}</h3>
            <p class="word-count">{{ lib.words.length }} 词</p>
          </div>
          <button class="delete-lib-btn" @click.stop="deleteCustomLibrary(lib.id)" title="删除">
            <Trash2 class="icon-svg-sm" />
          </button>
          <div class="card-arrow">
            <ChevronRight />
          </div>
        </div>
      </div>
      
      <div v-else class="empty-custom">
        <p>还没有自定义词库</p>
        <button class="add-lib-btn" @click="showImportModal = true">
          导入你的第一个词库
        </button>
      </div>
    </section>
    
    <!-- 官方词库 -->
    <section class="library-section">
      <div class="section-header">
        <h2><LibraryBig class="section-icon" /> 官方词库</h2>
      </div>
      <div class="library-grid">
        <div 
          v-for="lib in libraries" 
          :key="lib.id"
          class="library-card"
          :style="{ '--card-color': lib.color }"
          @click="enterLibrary(lib.id)"
        >
          <div class="card-icon">
            <component :is="getLibraryIcon(lib.id)" class="icon-svg" />
          </div>
          <div class="card-info">
            <h3>{{ lib.name }}</h3>
            <p class="word-count">
              {{ isActualCount(lib.id) ? '' : '约 ' }}{{ getActualWordCount(lib.id).toLocaleString() }} 词
            </p>
          </div>
          <div class="card-progress" v-if="getProgress(lib.id) > 0">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: getProgress(lib.id) + '%' }"
              ></div>
            </div>
            <span class="progress-text">{{ getProgress(lib.id) }}%</span>
          </div>
          <div class="card-arrow">
            <ChevronRight />
          </div>
        </div>
      </div>
    </section>
    
    <!-- 快捷入口 -->
    <section class="quick-section">
      <h2><Zap class="section-icon" /> 快捷入口</h2>
      <div class="quick-grid">
        <div class="quick-card" @click="$router.push('/wrong')">
          <AlertCircle class="quick-icon red-icon" />
          <div class="quick-info">
            <h4>错题本</h4>
            <p>{{ wrongCount }} 个错题</p>
          </div>
        </div>
        <div class="quick-card" @click="$router.push('/quiz')">
          <BrainCircuit class="quick-icon blue-icon" />
          <div class="quick-info">
            <h4>开始测试</h4>
            <p>检验学习成果</p>
          </div>
        </div>
      </div>
    </section>
    
    <!-- 导入词库弹窗 -->
    <ImportLibraryModal 
      :show="showImportModal"
      @close="showImportModal = false"
      @import="handleImport"
    />
  </PageContainer>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useVocabularyStore } from '../stores/vocabulary'
import { libraries, fetchLibraryWordCount } from '../composables/useLibrary'
import PageContainer from '../components/layout/PageContainer.vue'
import ImportLibraryModal from '../components/ImportLibraryModal.vue'
import {
  BookHeart,
  Plus,
  BookOpen,
  Trash2,
  ChevronRight,
  LibraryBig,
  Zap,
  AlertCircle,
  BrainCircuit,
  School,
  GraduationCap,
  BookText,
  BookOpenCheck,
  Target,
  Globe,
  BarChart,
  NotebookPen
} from 'lucide-vue-next'

const router = useRouter()
const store = useVocabularyStore()

// Icon Map for libraries
const iconMap = {
  chuzhong: School,
  gaozhong: GraduationCap,
  cet4: BookText,
  cet6: BookOpenCheck,
  kaoyan: Target,
  toefl: Globe,
  sat: BarChart
}

function getLibraryIcon(id) {
  return iconMap[id] || BookOpen
}


// Modal state
const showImportModal = ref(false)

// 自定义词库
const customLibraries = ref([])

// 加载自定义词库
function loadCustomLibraries() {
  const saved = localStorage.getItem('custom_libraries')
  if (saved) {
    try {
      customLibraries.value = JSON.parse(saved)
    } catch (e) {
      console.warn('Failed to load custom libraries')
    }
  }
}

// 保存自定义词库
function saveCustomLibraries() {
  localStorage.setItem('custom_libraries', JSON.stringify(customLibraries.value))
}

// 处理导入
function handleImport(data) {
  const newLib = {
    id: 'custom_' + Date.now(),
    name: data.name,
    words: data.words,
    createdAt: new Date().toISOString()
  }
  customLibraries.value.push(newLib)
  saveCustomLibraries()
}

// 进入自定义词库
function enterCustomLibrary(libId) {
  // 将自定义词库加载到 vocabulary store
  const lib = customLibraries.value.find(l => l.id === libId)
  if (lib) {
    // 跳转到自定义词库学习页面
    router.push(`/study/custom?id=${libId}`)
  }
}

// 删除自定义词库
function deleteCustomLibrary(libId) {
  if (confirm('确定要删除这个词库吗？')) {
    customLibraries.value = customLibraries.value.filter(l => l.id !== libId)
    saveCustomLibraries()
  }
}

// 实际词汇数量缓存
const actualWordCounts = ref({})
const isLoadingCounts = ref(false)

const wrongCount = computed(() => store.wrongQuestions?.length || 0)

function enterLibrary(libraryId) {
  router.push(`/study/${libraryId}`)
}

function getActualWordCount(libraryId) {
  // 优先从缓存获取实际数量
  if (actualWordCounts.value[libraryId]) {
    return actualWordCounts.value[libraryId]
  }
  // 否则返回估算值
  const lib = libraries.find(l => l.id === libraryId)
  return lib ? lib.wordCount : 0
}

function isActualCount(libraryId) {
  return !!actualWordCounts.value[libraryId]
}

function getProgress(libraryId) {
  const key = `mastered_${libraryId}`
  const saved = localStorage.getItem(key)
  if (!saved) return 0
  
  try {
    const mastered = JSON.parse(saved)
    const totalWords = getActualWordCount(libraryId)
    if (!totalWords) return 0
    return Math.round((mastered.length / totalWords) * 100)
  } catch {
    return 0
  }
}

// 加载缓存的词库数据以获取实际词汇数量
function loadCachedCounts() {
  libraries.forEach(lib => {
    // 优先检查单独缓存的词数
    const countCacheKey = `library_count_${lib.id}`
    const cachedCount = localStorage.getItem(countCacheKey)
    if (cachedCount) {
      actualWordCounts.value[lib.id] = parseInt(cachedCount, 10)
      return
    }
    
    // 否则检查完整缓存
    const cacheKey = `library_cache_${lib.id}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      try {
        const data = JSON.parse(cached)
        if (Array.isArray(data)) {
          actualWordCounts.value[lib.id] = data.length
        }
      } catch (e) {
        console.warn('Failed to parse cache for', lib.id)
      }
    }
  })
}

// 加载所有词库的词数
async function loadAllWordCounts() {
  isLoadingCounts.value = true
  
  // 逐个加载，避免并发过多
  for (const lib of libraries) {
    if (!actualWordCounts.value[lib.id]) {
      try {
        const count = await fetchLibraryWordCount(lib.id)
        actualWordCounts.value[lib.id] = count
      } catch (e) {
        console.warn('Failed to load count for', lib.id)
      }
    }
  }
  
  isLoadingCounts.value = false
}

onMounted(() => {
  loadCustomLibraries()
  loadCachedCounts()
  // 后台加载未缓存的词库词数
  loadAllWordCounts()
})
</script>

<style scoped>
.library-section {
  margin-bottom: 32px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h2 {
  font-size: 16px;
  font-weight: 600;
  color: var(--gray-800, #27272a);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-icon {
  width: 20px;
  height: 20px;
  color: var(--primary-500, #ec4074);
}

.import-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, var(--primary-400, #f4729a), var(--primary-500, #ec4074));
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-icon {
  width: 16px;
  height: 16px;
}

.import-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(236, 64, 116, 0.3);
}

.custom-card {
  border-color: var(--primary-200, #fbd5df);
}

.custom-icon {
  background: linear-gradient(135deg, #a855f7, #6366f1) !important;
}

.delete-lib-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  font-size: 16px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
  border-radius: 8px;
  display: flex; /* Centering fix */
  align-items: center;
  justify-content: center;
}

.icon-svg-sm {
  width: 18px;
  height: 18px;
  color: #ef4444; /* Red for trash */
}

.library-card:hover .delete-lib-btn {
  opacity: 1;
}

.delete-lib-btn:hover {
  background: #fee2e2;
}

.empty-custom {
  text-align: center;
  padding: 32px;
  background: white;
  border-radius: 16px;
  border: 2px dashed var(--primary-200, #fbd5df);
}

.empty-custom p {
  color: var(--gray-500, #71717a);
  margin: 0 0 16px;
}

.add-lib-btn {
  padding: 12px 24px;
  background: white;
  border: 2px solid var(--primary-400, #f4729a);
  color: var(--primary-500, #ec4074);
  border-radius: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.add-lib-btn:hover {
  background: var(--primary-50, #fef7f9);
}

.library-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.library-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: white;
  padding: 20px;
  border-radius: 16px;
  border: 1px solid var(--primary-100, #fdeef2);
  cursor: pointer;
  transition: all 0.3s;
}

.library-card:hover {
  transform: translateX(4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border-color: var(--card-color, #ec4074);
}

.card-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, var(--card-color, #ec4074), var(--card-color, #ec4074));
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white; /* Ensure SVG is white */
}

.icon-svg {
  width: 28px;
  height: 28px;
  color: white;
}

.card-info {
  flex: 1;
}

.card-info h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--gray-900, #18181b);
  margin: 0 0 4px;
}

.word-count {
  font-size: 14px;
  color: var(--gray-500, #71717a);
  margin: 0;
}

.card-progress {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  min-width: 80px;
}

.progress-bar {
  width: 80px;
  height: 6px;
  background: var(--gray-100, #f4f4f5);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--card-color, #22c55e);
  border-radius: 3px;
  transition: width 0.3s;
}

.progress-text {
  font-size: 12px;
  color: var(--gray-500, #71717a);
}

.card-arrow {
  color: var(--gray-300, #d4d4d8);
  display: flex;
  align-items: center;
}

/* Quick Section */
.quick-section {
  margin-top: 32px;
}

.quick-section h2 {
  font-size: 16px;
  font-weight: 600;
  color: var(--gray-700, #3f3f46);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.quick-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  padding: 16px;
  border-radius: 14px;
  border: 1px solid var(--primary-100, #fdeef2);
  cursor: pointer;
  transition: all 0.2s;
}

.quick-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.quick-icon {
  width: 24px;
  height: 24px;
}

.red-icon { color: #ef4444; }
.blue-icon { color: #3b82f6; }

.quick-info h4 {
  font-size: 15px;
  font-weight: 600;
  color: var(--gray-900, #18181b);
  margin: 0 0 2px;
}

.quick-info p {
  font-size: 13px;
  color: var(--gray-500, #71717a);
  margin: 0;
}

@media (max-width: 640px) {
  .quick-grid {
    grid-template-columns: 1fr;
  }
}
</style>
