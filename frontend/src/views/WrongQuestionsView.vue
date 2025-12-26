<template>
  <div class="wrong-container">
    <!-- 顶部工具栏 -->
    <header class="wrong-header">
      <button class="back-btn" @click="$router.push('/library')" title="返回">
        <ChevronLeft class="icon-md" />
      </button>
      <h1 class="page-title">错题本</h1>
      <div class="header-tools">
        <button 
          class="tool-btn" 
          :class="{ active: !hideWord }"
          @click="hideWord = !hideWord"
        >
          <component :is="hideWord ? EyeOff : Eye" class="btn-icon" /> 单词
        </button>
        <button 
          class="tool-btn" 
          :class="{ active: !hideDefinition }"
          @click="hideDefinition = !hideDefinition"
        >
          <component :is="hideDefinition ? EyeOff : Eye" class="btn-icon" /> 释义
        </button>
        <button 
          class="tool-btn clear-btn" 
          @click="clearAll"
          v-if="wrongQuestions.length > 0"
        >
          <Trash2 class="btn-icon" /> 清空
        </button>
      </div>
    </header>
    
    <!-- 空状态 -->
    <div v-if="wrongQuestions.length === 0" class="empty-state">
      <PartyPopper class="empty-icon-svg" />
      <h3>太棒了!</h3>
      <p>暂无错题，继续保持</p>
      <button class="action-btn" @click="$router.push('/library')">
        <BookOpen class="btn-icon" /> 去学习
      </button>
    </div>
    
    <!-- 错题列表 -->
    <div v-else class="wrong-list">
      <div class="list-header">
        <span class="col-num">#</span>
        <span class="col-word">单词</span>
        <span class="col-definition">释义</span>
        <span class="col-action">操作</span>
      </div>
      
      <div 
        v-for="(item, index) in wrongQuestions" 
        :key="index"
        class="wrong-row"
      >
        <span class="col-num">{{ index + 1 }}</span>
        
        <div 
          class="col-word"
          :class="{ hidden: hideWord }"
          @click="toggleReveal(index, 'word')"
        >
          {{ hideWord && !revealed[index]?.word ? '••••••' : item.word }}
        </div>
        
        <div 
          class="col-definition"
          :class="{ hidden: hideDefinition }"
          @click="toggleReveal(index, 'definition')"
        >
          {{ hideDefinition && !revealed[index]?.definition ? '点击查看' : item.definition }}
        </div>
        
        <div class="col-action">
          <button 
            class="remove-btn"
            @click="removeWrongQuestion(index)"
            title="移除"
          >
            <Check class="btn-icon-sm" /> 已掌握
          </button>
        </div>
      </div>
    </div>
    
    <!-- 底部操作栏 -->
    <footer class="wrong-footer" v-if="wrongQuestions.length > 0">
      <div class="stats">
        <span>共 {{ wrongQuestions.length }} 个错题</span>
      </div>
      <div class="footer-actions">
        <button class="review-btn" @click="startReview">
          <BookOpenCheck class="btn-icon" /> 复习测试
        </button>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useVocabularyStore } from '../stores/vocabulary'
import { 
  ChevronLeft, 
  Eye, 
  EyeOff, 
  Trash2, 
  PartyPopper, 
  BookOpen, 
  Check, 
  BookOpenCheck 
} from 'lucide-vue-next'

const router = useRouter()
const store = useVocabularyStore()

// 状态
const hideWord = ref(false)
const hideDefinition = ref(true)
const revealed = reactive({})

const wrongQuestions = computed(() => store.wrongQuestions || [])

function toggleReveal(index, field) {
  if (!revealed[index]) {
    revealed[index] = {}
  }
  revealed[index][field] = !revealed[index][field]
}

function removeWrongQuestion(index) {
  store.wrongQuestions.splice(index, 1)
  saveWrongQuestions()
}

function clearAll() {
  if (confirm('确定要清空所有错题吗？')) {
    store.clearWrongQuestions()
  }
}

function saveWrongQuestions() {
  localStorage.setItem('wrongQuestions', JSON.stringify(store.wrongQuestions))
}

function startReview() {
  router.push('/quiz?wrongOnly=true')
}
</script>

<style scoped>
.wrong-container {
  min-height: 100vh;
  padding-top: 64px; /* 为顶部固定导航栏留出空间 */
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #e0e0e0;
  display: flex;
  flex-direction: column;
}

/* Header */
.wrong-header {
  position: sticky;
  top: 64px; /* 在全局导航栏下方 */
  background: rgba(26, 26, 46, 0.95);
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

.btn-icon {
  width: 16px;
  height: 16px;
}

.btn-icon-sm {
  width: 14px;
  height: 14px;
}

.empty-icon-svg {
  width: 72px;
  height: 72px;
  color: var(--primary-400, #f4729a);
  margin-bottom: 16px;
}

.back-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: transparent;
  border: none;
  color: var(--gray-600, #52525b);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.back-btn:hover {
  background: var(--gray-100, #f4f4f5);
  color: var(--gray-900, #18181b);
}

.page-title {
  flex: 1;
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.header-tools {
  display: flex;
  gap: 8px;
}

.tool-btn {
  padding: 8px 16px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #888;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.tool-btn.active {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.5);
  color: #ef4444;
}

.tool-btn.clear-btn {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.5);
  color: #ef4444;
}

/* Empty State */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 40px;
}

.empty-state h3 {
  font-size: 24px;
  margin: 0;
}

.empty-state p {
  color: #888;
  margin: 0;
}

.action-btn {
  margin-top: 16px;
  padding: 14px 32px;
  background: linear-gradient(135deg, #ec4074, #f472b6);
  border: none;
  border-radius: 12px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Wrong List */
.wrong-list {
  flex: 1;
  padding: 0 24px 100px;
}

.list-header {
  display: grid;
  grid-template-columns: 50px 180px 1fr 100px;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 14px;
  color: #888;
}

.wrong-row {
  display: grid;
  grid-template-columns: 50px 180px 1fr 100px;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  align-items: center;
}

.col-num {
  color: #666;
}

.col-word {
  font-size: 18px;
  font-weight: 600;
  color: #ef4444;
  cursor: pointer;
}

.col-word.hidden {
  color: #666;
}

.col-definition {
  font-size: 14px;
  color: #bbb;
  cursor: pointer;
}

.col-definition.hidden {
  color: #555;
  font-style: italic;
}

.remove-btn {
  padding: 6px 12px;
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Footer */
.wrong-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(26, 26, 46, 0.98);
  backdrop-filter: blur(10px);
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 100;
}

.stats {
  color: #888;
}

.footer-actions {
  display: flex;
  gap: 12px;
}

.clear-btn {
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 10px;
  color: #888;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.review-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #ef4444, #f87171);
  border: none;
  border-radius: 10px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 768px) {
  .list-header,
  .wrong-row {
    grid-template-columns: 40px 1fr 80px;
  }
  
  .col-definition {
    display: none;
  }
}
</style>
