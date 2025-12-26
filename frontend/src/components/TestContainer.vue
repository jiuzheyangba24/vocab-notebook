<template>
  <div class="test-container">
    <!-- 进度显示 -->
    <div class="test-progress">
      第 {{ currentQuestionNumber }}/{{ totalQuestions }} 题
    </div>
    
    <!-- 测试结束显示 -->
    <template v-if="testFinished">
      <div class="test-finished">
        <h2>测试结束！</h2>
        <div class="score-summary">
          <div class="score-item correct">
            <div class="score-value">{{ score }}</div>
            <div class="score-label">答对</div>
          </div>
          <div class="score-item wrong">
            <div class="score-value">{{ totalQuestions - score }}</div>
            <div class="score-label">答错</div>
          </div>
          <div class="score-item accuracy">
            <div class="score-value">{{ accuracy }}%</div>
            <div class="score-label">正确率</div>
          </div>
        </div>
        <p class="total-info">总题数: {{ totalQuestions }}</p>
        <button class="btn-primary" @click="$emit('exit')">返回</button>
      </div>
    </template>
    
    <!-- 题目显示 -->
    <template v-else>
      <!-- 英译中模式 -->
      <div v-if="testMode === 'en-to-cn'" class="test-word">
        {{ currentQuestion?.headWord }}
      </div>
      
      <!-- 中译英模式 -->
      <div v-else-if="testMode === 'cn-to-en'" class="test-word">
        {{ currentQuestion?.definition }}
      </div>
      
      <!-- 填空模式 -->
      <div v-else-if="testMode === 'fill-blank'" class="test-word">
        {{ blankSentence }}
      </div>
      
      <!-- 拼写模式 -->
      <div v-else-if="testMode === 'spelling'" class="test-word">
        释义: {{ currentQuestion?.definition }}
        <br>
        <small>（请输入正确的英文单词）</small>
      </div>
      
      <!-- 选项区域 -->
      <div v-if="testMode !== 'spelling'" class="options-container">
        <button 
          v-for="(option, index) in currentOptions" 
          :key="index"
          class="option-btn"
          :class="{
            correct: showResult && option === correctAnswer,
            wrong: showResult && selectedAnswer === option && !isCorrect
          }"
          :disabled="showResult"
          @click="selectOption(option)"
        >
          {{ option }}
        </button>
      </div>
      
      <!-- 拼写输入 -->
      <div v-else class="spelling-input-container">
        <input 
          ref="spellingInput"
          v-model="spellingAnswer"
          type="text" 
          placeholder="输入英文单词"
          :disabled="showResult"
          @keypress.enter="checkSpelling"
        >
        <button 
          class="btn-primary" 
          :disabled="showResult"
          @click="checkSpelling"
        >
          检查
        </button>
      </div>
      
      <!-- 结果显示 -->
      <div v-if="showResult && !testFinished" class="test-result" :class="{ correct: isCorrect, wrong: !isCorrect }">
        <template v-if="isCorrect">
          <span>✓ 第{{ currentQuestionNumber }}题回答正确！</span>
        </template>
        <template v-else>
          <span>✗ 错误！正确答案是：{{ correctAnswer }}</span>
        </template>
      </div>
      
      <!-- 下一题按钮 -->
      <button 
        v-if="showResult && !testFinished" 
        class="btn-success next-btn"
        @click="$emit('next')"
      >
        下一题
      </button>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps({
  testMode: {
    type: String,
    required: true
  },
  currentQuestion: {
    type: Object,
    default: null
  },
  currentOptions: {
    type: Array,
    default: () => []
  },
  currentQuestionNumber: {
    type: Number,
    default: 0
  },
  totalQuestions: {
    type: Number,
    default: 0
  },
  showResult: {
    type: Boolean,
    default: false
  },
  isCorrect: {
    type: Boolean,
    default: false
  },
  correctAnswer: {
    type: String,
    default: ''
  },
  score: {
    type: Number,
    default: 0
  },
  testFinished: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['answer', 'next', 'exit'])

const selectedAnswer = ref('')
const spellingAnswer = ref('')
const spellingInput = ref(null)

const accuracy = computed(() => {
  if (props.totalQuestions === 0) return 0
  return ((props.score / props.totalQuestions) * 100).toFixed(1)
})

const blankSentence = computed(() => {
  if (!props.currentQuestion) return ''
  const sentences = props.currentQuestion.sentences
  if (sentences && sentences.length > 0) {
    return sentences[0].replace(new RegExp(props.currentQuestion.headWord, 'gi'), '________')
  }
  return props.currentQuestion.headWord
})

function selectOption(option) {
  selectedAnswer.value = option
  emit('answer', option)
}

function checkSpelling() {
  if (!spellingAnswer.value.trim()) return
  emit('answer', spellingAnswer.value.trim())
}

// 重置状态
watch(() => props.currentQuestion, () => {
  selectedAnswer.value = ''
  spellingAnswer.value = ''
  
  // 拼写模式自动聚焦
  if (props.testMode === 'spelling') {
    nextTick(() => {
      spellingInput.value?.focus()
    })
  }
})
</script>

<style scoped>
.test-finished {
  text-align: center;
}

.score-summary {
  display: flex;
  justify-content: space-around;
  margin: 30px 0;
}

.score-item {
  text-align: center;
}

.score-value {
  font-size: 2.5rem;
  font-weight: bold;
}

.score-label {
  font-size: 1rem;
  color: #666;
}

.score-item.correct .score-value {
  color: #28a745;
}

.score-item.wrong .score-value {
  color: #dc3545;
}

.score-item.accuracy .score-value {
  color: var(--sakura-400);
}

.total-info {
  color: #666;
  margin-bottom: 20px;
}

.spelling-input-container {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin: 20px 0;
}

.spelling-input-container input {
  padding: 12px 20px;
  font-size: 1.1rem;
  width: 200px;
}

.next-btn {
  margin-top: 20px;
  padding: 12px 30px;
}
</style>
