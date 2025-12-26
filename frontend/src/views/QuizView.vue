<template>
  <PageContainer title="测试" subtitle="检验你的词汇掌握程度">
    <!-- 测试选择界面 -->
    <div v-if="!isTestActive" class="test-selector">
      <!-- 测试模式选择 -->
      <div class="mode-cards">
        <div 
          v-for="mode in testModes" 
          :key="mode.id"
          class="mode-card"
          :class="{ active: selectedMode === mode.id }"
          @click="selectedMode = mode.id"
        >
          <div class="mode-icon-wrapper">
            <component :is="mode.icon" class="mode-icon-svg" />
          </div>
          <span class="mode-name">{{ mode.name }}</span>
          <span class="mode-desc">{{ mode.desc }}</span>
        </div>
      </div>
      
      <!-- 测试设置 -->
      <div class="test-options">
        <div class="option-group">
          <label>题目数量</label>
          <div class="option-pills">
            <button 
              v-for="opt in questionOptions" 
              :key="opt.value"
              :class="{ active: questionCount === opt.value && !useCustomCount }"
              @click="selectPresetCount(opt.value)"
            >
              {{ opt.label }}
            </button>
            <div class="custom-count-wrapper" :class="{ active: useCustomCount }">
              <input 
                type="number" 
                v-model.number="customCount"
                min="1"
                :max="availableWordCount"
                placeholder="自定义"
                class="custom-count-input"
                @focus="useCustomCount = true"
                @input="onCustomCountInput"
              />
            </div>
          </div>
        </div>
        
        <div class="option-group">
          <label>范围</label>
          <div class="option-pills">
            <button 
              :class="{ active: !wrongOnly && !customRange }"
              @click="wrongOnly = false; customRange = false"
            >
              全部词库
            </button>
            <button 
              :class="{ active: wrongOnly }"
              @click="wrongOnly = true; customRange = false"
            >
              仅错题
            </button>
            <button 
              :class="{ active: customRange }"
              @click="openCustomRangeSelector"
            >
              自定义
            </button>
          </div>
          <div v-if="customRange && customWordIds.length > 0" class="custom-range-info">
            已选择 {{ customWordIds.length }} 个单词
          </div>
        </div>
      </div>
      
      <!-- 开始测试按钮 -->
      <button class="start-btn" @click="startTest" :disabled="availableWordCount < minRequiredWords">
        {{ availableWordCount < minRequiredWords ? `${wrongOnly ? '错题本' : '词库'}至少需要${minRequiredWords}个单词` : '开始测试' }}
      </button>
    </div>
    
    <!-- 测试进行中 -->
    <div v-else class="test-active">
      <!-- 进度条 -->
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
      </div>
      <div class="progress-text">{{ currentIndex + 1 }} / {{ questions.length }}</div>
      
      <!-- 题目卡片 -->
      <div class="question-card" v-if="currentQuestion">
        <div class="question-prompt">{{ currentQuestion.prompt }}</div>
        
        <!-- 混合模式标签 -->
        <div v-if="selectedMode === 'mixed'" class="mode-tag">
          <component 
            :is="currentQuestion.mode === 'fill' ? Pencil : (currentQuestion.mode === 'en-to-cn' ? Languages : Languages)" 
            class="tag-icon" 
          />
          {{ currentQuestion.mode === 'fill' ? '填空' : (currentQuestion.mode === 'en-to-cn' ? '英译中' : '中译英') }}
        </div>
        
        <!-- 选择题模式 (包括混合模式中的选择题) -->
        <div v-if="currentQuestionIsChoice" class="options-list">
          <button 
            v-for="(option, idx) in currentQuestion.options" 
            :key="idx"
            class="option-btn"
            :class="getOptionClass(option)"
            @click="selectAnswer(option)"
            :disabled="showResult"
          >
            {{ option }}
          </button>
        </div>
        
        <!-- 填空拼写模式 (包括混合模式中的填空) -->
        <div v-else-if="currentQuestionIsFill" class="fill-mode">
          <div class="word-hint" v-if="currentQuestion.hint">
            提示: {{ currentQuestion.hint }}
          </div>
          <input 
            v-model="spellingInput"
            type="text"
            class="spelling-input"
            :class="{ correct: showResult && isCorrect, wrong: showResult && !isCorrect }"
            placeholder="请输入单词拼写..."
            @keyup.enter="checkSpelling"
            :disabled="showResult"
            ref="spellingInputRef"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
          />
          <button 
            v-if="!showResult" 
            class="submit-btn" 
            @click="checkSpelling"
            :disabled="!spellingInput.trim()"
          >
            提交答案
          </button>
        </div>
        
        <!-- 听写模式 -->
        <div v-else-if="selectedMode === 'dictation'" class="dictation-mode">
          <div class="dictation-prompt">
            <p>听音频，写出你听到的单词</p>
          </div>
          
          <button class="play-audio-btn" @click="playCurrentWord" :disabled="showResult">
            <Volume2 class="btn-icon" /> 播放发音
          </button>
          
          <div class="play-count">
            已播放 {{ playCount }} 次
          </div>
          
          <input 
            v-model="spellingInput"
            type="text"
            class="spelling-input"
            :class="{ correct: showResult && isCorrect, wrong: showResult && !isCorrect }"
            placeholder="输入你听到的单词..."
            @keyup.enter="checkSpelling"
            :disabled="showResult"
            ref="spellingInputRef"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
          />
          
          <div class="dictation-hint" v-if="playCount >= 3 && !showResult">
            <button class="hint-btn" @click="showDictationHint = !showDictationHint">
              <Lightbulb class="btn-icon" /> {{ showDictationHint ? '隐藏提示' : '看提示' }}
            </button>
            <p v-if="showDictationHint" class="hint-text">
              释义: {{ currentQuestion.definition }}
            </p>
          </div>
          
          <button 
            v-if="!showResult" 
            class="submit-btn" 
            @click="checkSpelling"
            :disabled="!spellingInput.trim()"
          >
            提交答案
          </button>
        </div>
        
        <div v-if="showResult" class="result-feedback">
          <div :class="['result-text', isCorrect ? 'correct' : 'wrong']">
             <component :is="isCorrect ? CheckCircle : XCircle" class="result-icon-sm" />
             {{ isCorrect ? ' 正确!' : ' 错误' }}
          </div>
          <div v-if="!isCorrect" class="correct-answer">
            正确答案: <span class="correct-word">{{ currentQuestion.correctAnswer }}</span>
          </div>
          <button class="next-btn" @click="nextQuestion">
            {{ currentIndex === questions.length - 1 ? '查看结果' : '下一题' }}
          </button>
        </div>
      </div>
      
      <button class="exit-btn" @click="exitTest">退出测试</button>
    </div>
    
    <!-- 测试结果 -->
    <Teleport to="body">
      <div v-if="showResultModal" class="modal-overlay">
        <div class="result-modal">
          <div class="result-header">
            <component 
              :is="scorePercent >= 80 ? PartyPopper : (scorePercent >= 60 ? ThumbsUp : BicepsFlexed)" 
              class="result-icon-lg" 
              :class="{ success: scorePercent >= 60, fail: scorePercent < 60 }"
            />
            <h2>测试完成!</h2>
          </div>
          
          <div class="score-display">
            <div class="score-circle">
              <span class="score-value">{{ score }}</span>
              <span class="score-total">/ {{ questions.length }}</span>
            </div>
            <div class="score-percent">{{ scorePercent }}%</div>
          </div>
          
          <div class="result-stats">
            <div class="stat">
              <span class="stat-value correct">{{ score }}</span>
              <span class="stat-label">正确</span>
            </div>
            <div class="stat">
              <span class="stat-value wrong">{{ questions.length - score }}</span>
              <span class="stat-label">错误</span>
            </div>
          </div>
          
          <div class="result-actions">
            <button class="retry-btn" @click="restartTest">再测一次</button>
            <button class="done-btn" @click="finishTest">完成</button>
          </div>
        </div>
      </div>
    </Teleport>
    
    <!-- 自定义范围选择弹窗 -->
    <Teleport to="body">
      <div v-if="showWordSelector" class="modal-overlay" @click.self="showWordSelector = false">
        <div class="word-selector-modal">
          <div class="modal-header">
            <h3>选择要测试的单词</h3>
            <button class="close-btn" @click="showWordSelector = false">×</button>
          </div>
          
          <div class="selector-toolbar">
            <input 
              v-model="selectorSearch" 
              type="text" 
              placeholder="搜索单词..." 
              class="selector-search"
            />
            <div class="select-actions">
              <button @click="selectAllWords">全选</button>
              <button @click="clearAllWords">清空</button>
            </div>
          </div>
          
          <div class="word-list-container">
            <div 
              v-for="word in filteredSelectorWords" 
              :key="word.id" 
              class="word-select-item"
              :class="{ selected: tempSelectedIds.has(word.id) }"
              @click="toggleWordSelection(word.id)"
            >
              <span class="word-text">{{ word.headWord }}</span>
              <span class="word-def">{{ word.definition }}</span>
              <span class="check-icon" v-if="tempSelectedIds.has(word.id)">✓</span>
            </div>
          </div>
          
          <div class="modal-footer">
            <span class="select-count">已选择 {{ tempSelectedIds.size }} 个单词</span>
            <div class="footer-actions">
              <button class="cancel-btn" @click="showWordSelector = false">取消</button>
              <button class="confirm-btn" @click="confirmWordSelection" :disabled="tempSelectedIds.size < minRequiredWords">
                确定 (至少{{ minRequiredWords }}个)
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </PageContainer>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import { useVocabularyStore } from '../stores/vocabulary'
import PageContainer from '../components/layout/PageContainer.vue'
import { 
  Languages, 
  Pencil, 
  Headphones, 
  Shuffle,
  Volume2,
  Lightbulb,
  CheckCircle,
  XCircle,
  PartyPopper,
  ThumbsUp,
  BicepsFlexed
} from 'lucide-vue-next'

const store = useVocabularyStore()

// Test modes
const testModes = [
  { id: 'en-to-cn', name: '英译中', icon: Languages, desc: '看英文选中文' },
  { id: 'cn-to-en', name: '中译英', icon: Languages, desc: '看中文选英文' },
  { id: 'fill', name: '填空', icon: Pencil, desc: '拼写单词' },
  { id: 'dictation', name: '听写', icon: Headphones, desc: '听音写单词' },
  { id: 'mixed', name: '混合', icon: Shuffle, desc: '随机混合模式' }
]

// Question count options
const questionOptions = [
  { label: '10题', value: 10 },
  { label: '20题', value: 20 },
  { label: '30题', value: 30 },
  { label: '50题', value: 50 },
  { label: '全部', value: -1 }  // -1 表示全部
]

// State
const selectedMode = ref('en-to-cn')
const questionCount = ref(10)
const wrongOnly = ref(false)
const customRange = ref(false)  // 自定义范围模式
const customWordIds = ref([])   // 用户选择的单词ID列表
const isTestActive = ref(false)
const questions = ref([])
const currentIndex = ref(0)
const selectedAnswer = ref(null)
const showResult = ref(false)
const isCorrect = ref(false)
const score = ref(0)
const showResultModal = ref(false)

// 混合模式下当前题目的实际模式
const currentMixedMode = ref('')

// 自定义范围选择器
const showWordSelector = ref(false)
const selectorSearch = ref('')
const tempSelectedIds = ref(new Set())

// 自定义题目数量
const useCustomCount = ref(false)
const customCount = ref(15)

// 拼写模式专用
const spellingInput = ref('')
const spellingInputRef = ref(null)

// 听写模式专用
const playCount = ref(0)
const showDictationHint = ref(false)

// 播放当前单词发音
function playCurrentWord() {
  if (!currentQuestion.value) return
  
  const word = currentQuestion.value.word || currentQuestion.value.correct
  if (!word) return
  
  const utterance = new SpeechSynthesisUtterance(word)
  utterance.lang = 'en-US'
  utterance.rate = 0.8
  speechSynthesis.speak(utterance)
  playCount.value++
}

// Computed
const currentQuestion = computed(() => questions.value[currentIndex.value])
const progressPercent = computed(() => ((currentIndex.value + 1) / questions.value.length) * 100)
const scorePercent = computed(() => Math.round((score.value / questions.value.length) * 100))

// 判断当前题目类型（支持混合模式）
const currentQuestionIsFill = computed(() => {
  if (selectedMode.value === 'fill') return true
  if (selectedMode.value === 'mixed' && currentQuestion.value?.mode === 'fill') return true
  return false
})

const currentQuestionIsChoice = computed(() => {
  if (selectedMode.value === 'en-to-cn' || selectedMode.value === 'cn-to-en') return true
  if (selectedMode.value === 'mixed' && currentQuestion.value?.mode !== 'fill') return true
  return false
})

// 可用单词数量
const availableWordCount = computed(() => {
  if (customRange.value) {
    return customWordIds.value.length
  }
  if (wrongOnly.value) {
    const wrongSet = store.getWrongWordsSet?.() || new Set()
    return store.vocabulary.filter(w => wrongSet.has(w.headWord)).length
  }
  return store.wordCount
})

// 最少需要的单词数
const minRequiredWords = computed(() => {
  return (selectedMode.value === 'fill' || selectedMode.value === 'dictation') ? 1 : 4
})

// 过滤后的选择器单词列表
const filteredSelectorWords = computed(() => {
  const search = selectorSearch.value.toLowerCase()
  if (!search) return store.vocabulary
  return store.vocabulary.filter(w => 
    w.headWord.toLowerCase().includes(search) ||
    w.definition.toLowerCase().includes(search)
  )
})

// 打开自定义范围选择器
function openCustomRangeSelector() {
  customRange.value = true
  wrongOnly.value = false
  tempSelectedIds.value = new Set(customWordIds.value)
  showWordSelector.value = true
}

// 切换单词选中状态
function toggleWordSelection(wordId) {
  const ids = tempSelectedIds.value
  if (ids.has(wordId)) {
    ids.delete(wordId)
  } else {
    ids.add(wordId)
  }
  tempSelectedIds.value = new Set(ids)
}

// 全选
function selectAllWords() {
  const ids = new Set()
  filteredSelectorWords.value.forEach(w => ids.add(w.id))
  tempSelectedIds.value = ids
}

// 清空
function clearAllWords() {
  tempSelectedIds.value = new Set()
}

// 确认选择
function confirmWordSelection() {
  customWordIds.value = Array.from(tempSelectedIds.value)
  showWordSelector.value = false
}

// 选择预设数量
function selectPresetCount(value) {
  questionCount.value = value
  useCustomCount.value = false
}

// 自定义数量输入
function onCustomCountInput() {
  if (customCount.value > 0) {
    useCustomCount.value = true
  }
}

// Methods
function shuffleArray(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function generateQuestions() {
  let wordPool = [...store.vocabulary]
  
  // 自定义范围模式
  if (customRange.value && customWordIds.value.length > 0) {
    const selectedSet = new Set(customWordIds.value)
    wordPool = wordPool.filter(w => selectedSet.has(w.id))
  } else if (wrongOnly.value) {
    const wrongSet = store.getWrongWordsSet()
    wordPool = wordPool.filter(w => wrongSet.has(w.headWord))
  }
  
  // 填空和听写模式只需要1个单词即可开始
  const minWords = (selectedMode.value === 'fill' || selectedMode.value === 'dictation') ? 1 : 4
  if (wordPool.length < minWords) {
    alert(`至少需要${minWords}个单词才能开始测试`)
    return []
  }
  
  // 确定题目数量：自定义 > 预设 > 全部(-1)
  let targetCount = questionCount.value
  if (useCustomCount.value && customCount.value > 0) {
    targetCount = customCount.value
  }
  
  // -1 表示全部
  const count = targetCount === -1 ? wordPool.length : Math.min(targetCount, wordPool.length)
  const selectedWords = shuffleArray(wordPool).slice(0, count)
  
  // 听写模式
  if (selectedMode.value === 'dictation') {
    return selectedWords.map(word => ({
      word: word.headWord,
      definition: word.definition,
      correct: word.headWord,
      correctAnswer: word.headWord,
      options: []
    }))
  }
  
  // 填空模式
  if (selectedMode.value === 'fill') {
    return selectedWords.map(word => {
      // 生成提示：显示首字母和单词长度
      const firstLetter = word.headWord.charAt(0).toUpperCase()
      const hint = `${firstLetter}${'_'.repeat(word.headWord.length - 1)} (${word.headWord.length}个字母)`
      
      return {
        word,
        prompt: word.definition,  // 显示中文释义
        correctAnswer: word.headWord,  // 正确答案是英文单词
        hint,
        options: []  // 填空模式不需要选项
      }
    })
  }
  
  // 混合模式：为每道题随机分配模式
  if (selectedMode.value === 'mixed') {
    const mixedModes = ['en-to-cn', 'cn-to-en', 'fill']
    return selectedWords.map(word => {
      const randomMode = mixedModes[Math.floor(Math.random() * mixedModes.length)]
      
      if (randomMode === 'fill') {
        const firstLetter = word.headWord.charAt(0).toUpperCase()
        const hint = `${firstLetter}${'_'.repeat(word.headWord.length - 1)} (${word.headWord.length}个字母)`
        return {
          word,
          prompt: word.definition,
          correctAnswer: word.headWord,
          hint,
          options: [],
          mode: 'fill'
        }
      } else {
        const isEnToCn = randomMode === 'en-to-cn'
        const prompt = isEnToCn ? word.headWord : word.definition
        const correctAnswer = isEnToCn ? word.definition : word.headWord
        
        const otherWords = wordPool.filter(w => w.id !== word.id)
        const wrongOptions = shuffleArray(otherWords)
          .slice(0, 3)
          .map(w => isEnToCn ? w.definition : w.headWord)
        
        const options = shuffleArray([correctAnswer, ...wrongOptions])
        
        return {
          word,
          prompt,
          correctAnswer,
          options,
          mode: randomMode
        }
      }
    })
  }
  
  // 选择题模式
  return selectedWords.map(word => {
    const isEnToCn = selectedMode.value === 'en-to-cn'
    const prompt = isEnToCn ? word.headWord : word.definition
    const correctAnswer = isEnToCn ? word.definition : word.headWord
    
    // Generate wrong options
    const otherWords = wordPool.filter(w => w.id !== word.id)
    const wrongOptions = shuffleArray(otherWords)
      .slice(0, 3)
      .map(w => isEnToCn ? w.definition : w.headWord)
    
    const options = shuffleArray([correctAnswer, ...wrongOptions])
    
    return {
      word,
      prompt,
      correctAnswer,
      options
    }
  })
}

function startTest() {
  const generatedQuestions = generateQuestions()
  if (generatedQuestions.length === 0) return
  
  questions.value = generatedQuestions
  currentIndex.value = 0
  score.value = 0
  isTestActive.value = true
  showResult.value = false
  selectedAnswer.value = null
  spellingInput.value = ''
  
  // 填空模式自动聚焦输入框
  if (selectedMode.value === 'fill') {
    nextTick(() => {
      spellingInputRef.value?.focus()
    })
  }
}

// 检查拼写答案
function checkSpelling() {
  if (showResult.value || !spellingInput.value.trim()) return
  
  const userAnswer = spellingInput.value.trim().toLowerCase()
  const correctAnswer = currentQuestion.value.correctAnswer.toLowerCase()
  
  isCorrect.value = userAnswer === correctAnswer
  showResult.value = true
  
  // 获取单词信息 - 处理不同模式的数据结构
  const question = currentQuestion.value
  const wordText = typeof question.word === 'string' ? question.word : question.word?.headWord
  const definition = question.definition || question.word?.definition || ''
  
  if (isCorrect.value) {
    score.value++
    if (question.word?.id) {
      store.recordStudy(question.word.id, true)
    }
  } else {
    store.addWrongQuestion({
      word: wordText,
      definition: definition,
      selectedAnswer: userAnswer,
      correctAnswer: correctAnswer,
      testMode: selectedMode.value
    })
    if (question.word?.id) {
      store.recordStudy(question.word.id, false)
    }
  }
}

function selectAnswer(answer) {
  if (showResult.value) return
  
  selectedAnswer.value = answer
  isCorrect.value = answer === currentQuestion.value.correctAnswer
  showResult.value = true
  
  if (isCorrect.value) {
    score.value++
    store.recordStudy(currentQuestion.value.word.id, true)
  } else {
    store.addWrongQuestion({
      word: currentQuestion.value.word.headWord,
      definition: currentQuestion.value.word.definition
    })
    store.recordStudy(currentQuestion.value.word.id, false)
  }
}

function nextQuestion() {
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++
    showResult.value = false
    selectedAnswer.value = null
    spellingInput.value = ''
    
    // 听写模式重置
    if (selectedMode.value === 'dictation') {
      playCount.value = 0
      showDictationHint.value = false
    }
    
    // 填空/听写模式自动聚焦输入框
    if (selectedMode.value === 'fill' || selectedMode.value === 'dictation') {
      nextTick(() => {
        spellingInputRef.value?.focus()
      })
    }
  } else {
    showResultModal.value = true
  }
}

function getOptionClass(option) {
  if (!showResult.value) return ''
  if (option === currentQuestion.value.correctAnswer) return 'correct'
  if (option === selectedAnswer.value && !isCorrect.value) return 'wrong'
  return ''
}

function exitTest() {
  if (confirm('确定要退出测试吗？')) {
    isTestActive.value = false
    questions.value = []
  }
}

function restartTest() {
  showResultModal.value = false
  startTest()
}

function finishTest() {
  // 更新今日学习统计
  updateTodayStats()
  
  showResultModal.value = false
  isTestActive.value = false
  questions.value = []
}

// 更新今日学习统计（用于打卡功能）
function updateTodayStats() {
  const today = new Date().toISOString().split('T')[0]
  const savedDate = localStorage.getItem('today_stats_date')
  
  let stats = { wordsLearned: 0, testsCompleted: 0, accuracy: 0, totalCorrect: 0, totalQuestions: 0 }
  
  // 如果是同一天，累加数据
  if (savedDate === today) {
    try {
      const saved = localStorage.getItem('today_stats')
      if (saved) stats = JSON.parse(saved)
    } catch (e) {}
  }
  
  // 更新统计
  stats.wordsLearned += questions.value.length  // 每道题算学习一个单词
  stats.testsCompleted += 1
  stats.totalCorrect = (stats.totalCorrect || 0) + score.value
  stats.totalQuestions = (stats.totalQuestions || 0) + questions.value.length
  stats.accuracy = stats.totalQuestions > 0 ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100) : 0
  
  // 保存到 LocalStorage
  localStorage.setItem('today_stats', JSON.stringify(stats))
  localStorage.setItem('today_stats_date', today)
  
  console.log('📊 今日学习统计已更新:', stats)
}
</script>

<style scoped>
.test-selector {
  max-width: 600px;
  margin: 0 auto;
}

.mode-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 32px;
}

.mode-card {
  background: white;
  border: 2px solid var(--primary-100, #fdeef2);
  border-radius: 16px;
  padding: 24px 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-card:hover {
  border-color: var(--primary-300, #f8a8c0);
  transform: translateY(-2px);
}

.mode-card.active {
  border-color: var(--primary-500, #ec4074);
  background: var(--primary-50, #fef7f9);
  box-shadow: 0 4px 20px rgba(236, 64, 116, 0.15);
}

.mode-icon-wrapper {
  width: 56px;
  height: 56px;
  margin: 0 auto 12px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mode-icon-svg {
  width: 28px;
  height: 28px;
  color: white;
}

.mode-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  background: var(--primary-50, #fef7f9);
  color: var(--primary-500, #ec4074);
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 24px;
}

.tag-icon {
  width: 14px;
  height: 14px;
}

.btn-icon {
  width: 16px;
  height: 16px;
}

.result-text {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.result-icon-sm {
  width: 24px;
  height: 24px;
}

.result-icon-lg {
  width: 48px;
  height: 48px;
}

.result-icon-lg.success {
  color: var(--primary-500, #ec4074);
}

.result-icon-lg.fail {
  color: #f59e0b;
}

.play-audio-btn, .hint-btn {
  display: flex !important;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.mode-icon {
  font-size: 28px;
  display: block;
}

.mode-icon-img {
  width: 32px;
  height: 32px;
}

.mode-name {
  font-weight: 600;
  font-size: 16px;
  color: var(--gray-900, #18181b);
  display: block;
  margin-bottom: 4px;
}

.mode-desc {
  font-size: 12px;
  color: var(--gray-500, #71717a);
}

.test-options {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
}

.option-group {
  margin-bottom: 20px;
}

.option-group:last-child {
  margin-bottom: 0;
}

.option-group label {
  display: block;
  font-weight: 600;
  color: var(--gray-700, #3f3f46);
  margin-bottom: 12px;
}

.option-pills {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.option-pills button {
  padding: 10px 20px;
  border: 2px solid var(--primary-100, #fdeef2);
  border-radius: 20px;
  background: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 70px;
}

.option-pills button:hover {
  border-color: var(--primary-300, #f8a8c0);
}

.option-pills button.active {
  border-color: var(--primary-500, #ec4074);
  background: var(--primary-50, #fef7f9);
  color: var(--primary-500, #ec4074);
  font-weight: 500;
}

.custom-count-wrapper {
  display: flex;
  align-items: center;
}

.custom-count-wrapper.active .custom-count-input {
  border-color: var(--primary-500, #ec4074);
  background: var(--primary-50, #fef7f9);
}

.custom-count-input {
  width: 80px;
  padding: 10px 12px;
  border: 2px solid var(--primary-100, #fdeef2);
  border-radius: 20px;
  font-size: 14px;
  text-align: center;
  outline: none;
  transition: all 0.2s;
}

.custom-count-input:focus {
  border-color: var(--primary-400, #f4729a);
}

.start-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, var(--primary-400, #f4729a), var(--primary-500, #ec4074));
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.start-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(236, 64, 116, 0.3);
}

.start-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Test Active */
.test-active {
  max-width: 600px;
  margin: 0 auto;
}

.progress-bar {
  height: 8px;
  background: var(--primary-100, #fdeef2);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-400, #f4729a), var(--primary-500, #ec4074));
  border-radius: 4px;
  transition: width 0.3s;
}

.progress-text {
  text-align: right;
  font-size: 14px;
  color: var(--gray-500, #71717a);
  margin-bottom: 24px;
}

.question-card {
  background: white;
  border-radius: 24px;
  padding: 40px 32px;
  text-align: center;
  box-shadow: 0 10px 40px rgba(248, 165, 194, 0.15);
}

.question-prompt {
  font-size: 28px;
  font-weight: 700;
  color: var(--gray-900, #18181b);
  margin-bottom: 32px;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-btn {
  padding: 16px 24px;
  border: 2px solid var(--primary-100, #fdeef2);
  border-radius: 14px;
  background: white;
  font-size: 16px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
}

.option-btn:hover:not(:disabled) {
  border-color: var(--primary-300, #f8a8c0);
  background: var(--primary-50, #fef7f9);
}

.option-btn.correct {
  border-color: #22c55e;
  background: #dcfce7;
  color: #166534;
}

.option-btn.wrong {
  border-color: #ef4444;
  background: #fee2e2;
  color: #991b1b;
}

.result-feedback {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--primary-100, #fdeef2);
}

.result-text {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
}

.result-text.correct {
  color: #22c55e;
}

.result-text.wrong {
  color: #ef4444;
}

.correct-answer {
  color: var(--gray-500, #71717a);
  margin-bottom: 16px;
}

.correct-word {
  font-weight: 600;
  color: #22c55e;
  letter-spacing: 1px;
}

/* Fill Mode Styles */
.fill-mode {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
}

.word-hint {
  font-size: 16px;
  color: var(--gray-500, #71717a);
  background: var(--primary-50, #fef7f9);
  padding: 12px 20px;
  border-radius: 10px;
  letter-spacing: 2px;
  font-family: monospace;
}

.spelling-input {
  width: 100%;
  max-width: 400px;
  padding: 16px 24px;
  font-size: 20px;
  text-align: center;
  border: 2px solid var(--primary-200, #fbd5df);
  border-radius: 14px;
  outline: none;
  transition: all 0.2s;
  letter-spacing: 2px;
}

.spelling-input:focus {
  border-color: var(--primary-400, #f4729a);
  box-shadow: 0 4px 16px rgba(236, 64, 116, 0.15);
}

.spelling-input.correct {
  border-color: #22c55e;
  background: #dcfce7;
  color: #166534;
}

.spelling-input.wrong {
  border-color: #ef4444;
  background: #fee2e2;
  color: #991b1b;
}

.submit-btn {
  padding: 14px 48px;
  background: linear-gradient(135deg, var(--primary-400, #f4729a), var(--primary-500, #ec4074));
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(236, 64, 116, 0.3);
}

/* 听写模式 */
.dictation-mode {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
}

.dictation-prompt {
  text-align: center;
  color: var(--gray-600, #52525b);
  font-size: 14px;
}

.play-audio-btn {
  padding: 20px 40px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.play-audio-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 8px 24px rgba(245, 158, 11, 0.4);
}

.play-audio-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.play-count {
  font-size: 12px;
  color: var(--gray-400, #a1a1aa);
}

.dictation-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.hint-btn {
  padding: 8px 16px;
  background: var(--primary-100, #fdeef2);
  border: none;
  border-radius: 8px;
  color: var(--primary-600, #e82a66);
  font-size: 13px;
  cursor: pointer;
}

.hint-text {
  font-size: 14px;
  color: var(--gray-600, #52525b);
  margin: 0;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.next-btn {
  padding: 14px 32px;
  background: linear-gradient(135deg, var(--primary-400, #f4729a), var(--primary-500, #ec4074));
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
}

.exit-btn {
  display: block;
  margin: 24px auto 0;
  padding: 12px 24px;
  background: transparent;
  border: 1px solid var(--gray-300, #d4d4d8);
  border-radius: 10px;
  color: var(--gray-500, #71717a);
  cursor: pointer;
}

/* Result Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.result-modal {
  background: white;
  border-radius: 28px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.result-header {
  margin-bottom: 24px;
}

.result-icon {
  font-size: 56px;
  display: block;
  margin-bottom: 8px;
}

.result-header h2 {
  margin: 0;
  font-size: 24px;
  color: var(--gray-900, #18181b);
}

.score-display {
  margin-bottom: 24px;
}

.score-circle {
  display: inline-flex;
  align-items: baseline;
  justify-content: center;
  margin-bottom: 8px;
}

.score-value {
  font-size: 64px;
  font-weight: 700;
  color: var(--primary-500, #ec4074);
}

.score-total {
  font-size: 24px;
  color: var(--gray-400, #a1a1aa);
}

.score-percent {
  font-size: 20px;
  color: var(--gray-500, #71717a);
}

.result-stats {
  display: flex;
  justify-content: center;
  gap: 48px;
  margin-bottom: 32px;
}

.stat {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 28px;
  font-weight: 600;
}

.stat-value.correct {
  color: #22c55e;
}

.stat-value.wrong {
  color: #ef4444;
}

.stat-label {
  font-size: 14px;
  color: var(--gray-500, #71717a);
}

.result-actions {
  display: flex;
  gap: 12px;
}

.retry-btn, .done-btn {
  flex: 1;
  padding: 14px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
}

.retry-btn {
  background: white;
  border: 2px solid var(--primary-200, #fbd5df);
  color: var(--primary-500, #ec4074);
}

.done-btn {
  background: linear-gradient(135deg, var(--primary-400, #f4729a), var(--primary-500, #ec4074));
  border: none;
  color: white;
}

@media (max-width: 768px) {
  .mode-cards {
    grid-template-columns: 1fr;
  }
  
  .question-prompt {
    font-size: 22px;
  }
}

/* 混合模式标签 */
.mode-tag {
  display: inline-block;
  padding: 4px 12px;
  background: linear-gradient(135deg, #f8a5c2, #f48fb1);
  color: white;
  border-radius: 12px;
  font-size: 12px;
  margin-bottom: 12px;
}

/* 自定义范围信息 */
.custom-range-info {
  margin-top: 8px;
  font-size: 13px;
  color: var(--primary-500, #ec4074);
  font-weight: 500;
}

/* 自定义范围选择弹窗 */
.word-selector-modal {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}

.word-selector-modal .modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #f0e8ef;
}

.word-selector-modal .modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #4a3f4f;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #a89ba7;
}

.selector-toolbar {
  display: flex;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid #f0e8ef;
}

.selector-search {
  flex: 1;
  padding: 10px 14px;
  border: 2px solid #fdd5e0;
  border-radius: 10px;
  font-size: 14px;
}

.selector-search:focus {
  outline: none;
  border-color: #f8a5c2;
}

.select-actions {
  display: flex;
  gap: 8px;
}

.select-actions button {
  padding: 8px 14px;
  border: 1px solid #fdd5e0;
  background: white;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  color: #6d5d6e;
}

.select-actions button:hover {
  background: #fef6f9;
  border-color: #f8a5c2;
}

.word-list-container {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  max-height: 400px;
}

.word-select-item {
  display: flex;
  align-items: center;
  padding: 12px 14px;
  border-radius: 10px;
  cursor: pointer;
  margin-bottom: 6px;
  transition: all 0.2s;
  background: #fef8fa;
}

.word-select-item:hover {
  background: #fef0f4;
}

.word-select-item.selected {
  background: linear-gradient(135deg, #fef0f4, #fce4ec);
  border: 2px solid #f8a5c2;
}

.word-text {
  font-weight: 600;
  color: #4a3f4f;
  min-width: 100px;
}

.word-def {
  flex: 1;
  color: #8a7a8a;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.check-icon {
  color: #ec4074;
  font-weight: bold;
  margin-left: 8px;
}

.word-selector-modal .modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-top: 1px solid #f0e8ef;
}

.select-count {
  font-size: 14px;
  color: #6d5d6e;
}

.footer-actions {
  display: flex;
  gap: 10px;
}

.cancel-btn {
  padding: 10px 20px;
  border: 2px solid #fdd5e0;
  background: white;
  border-radius: 10px;
  cursor: pointer;
  color: #6d5d6e;
}

.confirm-btn {
  padding: 10px 20px;
  border: none;
  background: linear-gradient(135deg, #f8a5c2, #ec4074);
  color: white;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
}

.confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
