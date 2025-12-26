<template>
  <Modal v-model="showModal" title="错题本">
    <template v-if="wrongQuestions.length === 0">
      <p class="empty-tip">暂无错题记录</p>
    </template>
    
    <template v-else>
      <div class="wrong-questions-list">
        <div 
          v-for="(question, index) in wrongQuestions" 
          :key="index"
          class="wrong-question"
        >
          <p><strong>单词:</strong> {{ question.word }}</p>
          <p><strong>释义:</strong> {{ question.definition }}</p>
          <p><strong>你的答案:</strong> <span class="wrong-answer">{{ question.selectedAnswer }}</span></p>
          <p><strong>正确答案:</strong> <span class="correct-answer">{{ question.correctAnswer }}</span></p>
          <p><strong>测试模式:</strong> {{ formatTestMode(question.testMode) }}</p>
          <p><strong>时间:</strong> {{ formatTime(question.timestamp) }}</p>
        </div>
      </div>
      
      <button class="btn-danger clear-btn" @click="clearAll">
        清空错题本
      </button>
    </template>
  </Modal>
</template>

<script setup>
import { computed } from 'vue'
import Modal from './common/Modal.vue'
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

const wrongQuestions = computed(() => store.wrongQuestions)

function formatTestMode(mode) {
  const modeMap = {
    'en-to-cn': '英译中',
    'cn-to-en': '中译英',
    'fill-blank': '填空测试',
    'spelling': '单词拼写'
  }
  return modeMap[mode] || mode
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleString('zh-CN')
}

function clearAll() {
  if (confirm('确定要清空所有错题记录吗？')) {
    store.clearWrongQuestions()
  }
}
</script>

<style scoped>
.empty-tip {
  text-align: center;
  color: #666;
  padding: 30px 0;
}

.wrong-questions-list {
  max-height: 400px;
  overflow-y: auto;
}

.wrong-question {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
}

.wrong-question p {
  margin: 8px 0;
  font-size: 0.95rem;
}

.wrong-answer {
  color: #dc3545;
}

.correct-answer {
  color: #28a745;
}

.clear-btn {
  width: 100%;
  margin-top: 15px;
}
</style>
