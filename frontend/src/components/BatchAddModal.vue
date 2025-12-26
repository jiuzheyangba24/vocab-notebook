<template>
  <Modal v-model="showModal" title="批量添加单词">
    <p class="batch-tip">每行输入一个单词，系统将自动获取释义和例句</p>
    
    <textarea 
      v-model="inputText"
      placeholder="请输入单词，每行一个，例如：
hello
world
vocabulary"
      rows="10"
      :disabled="isAdding"
    ></textarea>
    
    <div class="batch-controls">
      <button 
        class="btn-primary" 
        :disabled="isAdding || !inputText.trim()"
        @click="startBatchAdd"
      >
        {{ isAdding ? '添加中...' : '开始添加' }}
      </button>
      <button 
        class="btn-secondary" 
        @click="cancel"
      >
        {{ isAdding ? '取消' : '关闭' }}
      </button>
    </div>
    
    <!-- 进度显示 -->
    <div v-if="isAdding || results.length > 0" class="batch-progress">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
      </div>
      <p class="progress-text">
        <template v-if="isAdding">
          正在添加: {{ currentIndex + 1 }}/{{ totalWords }} - {{ currentWord }}
        </template>
        <template v-else>
          <strong>批量添加完成！</strong><br>
          成功: {{ successCount }} | 跳过: {{ skipCount }} | 失败: {{ errorCount }}
        </template>
      </p>
      
      <div class="batch-results">
        <div 
          v-for="(result, index) in results" 
          :key="index"
          class="result-item"
          :class="result.type"
        >
          {{ result.text }}
        </div>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Modal from './common/Modal.vue'
import { fetchWordInfo } from '../composables/useApi'
import { useVocabularyStore } from '../stores/vocabulary'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const store = useVocabularyStore()

const showModal = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const inputText = ref('')
const isAdding = ref(false)
const isCancelled = ref(false)
const currentIndex = ref(0)
const currentWord = ref('')
const totalWords = ref(0)
const results = ref([])

const successCount = ref(0)
const skipCount = ref(0)
const errorCount = ref(0)

const progressPercent = computed(() => {
  if (totalWords.value === 0) return 0
  return Math.round(((currentIndex.value + 1) / totalWords.value) * 100)
})

async function startBatchAdd() {
  const text = inputText.value.trim()
  if (!text) return
  
  // 解析单词
  const words = text.split('\n')
    .map(w => w.trim())
    .filter(w => w.length > 0 && /^[a-zA-Z\s-]+$/.test(w))
  
  if (words.length === 0) {
    alert('没有找到有效的英文单词')
    return
  }
  
  // 去重
  const uniqueWords = [...new Set(words.map(w => w.toLowerCase()))]
  
  if (!confirm(`准备添加 ${uniqueWords.length} 个单词，确定继续吗？`)) {
    return
  }
  
  // 开始添加
  isAdding.value = true
  isCancelled.value = false
  totalWords.value = uniqueWords.length
  currentIndex.value = 0
  results.value = []
  successCount.value = 0
  skipCount.value = 0
  errorCount.value = 0
  
  for (let i = 0; i < uniqueWords.length; i++) {
    if (isCancelled.value) {
      addResult('批量添加已取消', 'result-error')
      break
    }
    
    const word = uniqueWords[i]
    currentIndex.value = i
    currentWord.value = word
    
    try {
      // 检查是否已存在
      const exists = store.vocabulary.some(
        w => (w.headWord || '').toLowerCase() === word.toLowerCase()
      )
      
      if (exists) {
        addResult(`${word} - 已存在，跳过`, 'result-skip')
        skipCount.value++
        await sleep(100)
        continue
      }
      
      // 获取单词信息
      const wordInfo = await fetchWordInfo(word)
      
      // 添加到词库
      await store.addWord(wordInfo)
      addResult(`${word} - 添加成功`, 'result-success')
      successCount.value++
      
    } catch (error) {
      addResult(`${word} - ${error.message || '添加失败'}`, 'result-error')
      errorCount.value++
    }
    
    await sleep(500)
  }
  
  isAdding.value = false
}

function addResult(text, type) {
  results.value.push({ text, type })
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function cancel() {
  if (isAdding.value) {
    if (confirm('批量添加正在进行中，确定要取消吗？')) {
      isCancelled.value = true
    }
  } else {
    showModal.value = false
  }
}

// 重置状态
watch(showModal, (val) => {
  if (val) {
    inputText.value = ''
    results.value = []
    isAdding.value = false
    isCancelled.value = false
  }
})
</script>

<style scoped>
.batch-tip {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 15px;
}

textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  font-family: 'Courier New', monospace;
  resize: vertical;
  margin-bottom: 15px;
}

textarea:focus {
  outline: none;
  border-color: var(--sakura-300);
}

.batch-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.batch-controls button {
  flex: 1;
}

.progress-text {
  text-align: center;
  color: #666;
  margin: 10px 0 15px;
}
</style>
