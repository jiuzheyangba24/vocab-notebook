<template>
  <PageContainer title="AI 助手" subtitle="智能学习伙伴">
    <!-- 快捷功能 -->
    <div class="quick-features">
      <button class="feature-btn" @click="showWordLookup">
        <span class="feature-icon">🔍</span>
        <span>查单词</span>
      </button>
      <button class="feature-btn" @click="showStudyPlan">
        <span class="feature-icon">📅</span>
        <span>背诵计划</span>
      </button>
      <button class="feature-btn" @click="getAdvice">
        <span class="feature-icon">💡</span>
        <span>学习建议</span>
      </button>
    </div>
    
    <!-- 聊天区域 -->
    <div class="chat-container" ref="chatContainer">
      <div v-if="messages.length === 0" class="welcome-message">
        <div class="welcome-icon">🤖</div>
        <h3>你好！我是你的 AI 学习助手</h3>
        <p>你可以问我单词释义、学习方法、背诵技巧等问题</p>
      </div>
      
      <div v-for="(msg, idx) in messages" :key="idx" class="message" :class="msg.role">
        <div class="message-avatar">
          {{ msg.role === 'user' ? '👤' : '🤖' }}
        </div>
        <div class="message-content">
          <div class="message-text" v-html="formatMessage(msg.content)"></div>
        </div>
      </div>
      
      <div v-if="isLoading" class="message assistant">
        <div class="message-avatar">🤖</div>
        <div class="message-content">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 输入区域 -->
    <div class="input-area">
      <input 
        v-model="inputText"
        type="text"
        placeholder="输入你的问题..."
        @keypress.enter="sendMessage"
        :disabled="isLoading"
        class="chat-input"
      />
      <button 
        class="send-btn" 
        @click="sendMessage"
        :disabled="!inputText.trim() || isLoading"
      >
        {{ isLoading ? '⏳' : '发送' }}
      </button>
    </div>
    
    <!-- 查词弹窗 -->
    <Teleport to="body">
      <div v-if="showLookupModal" class="modal-overlay" @click.self="showLookupModal = false">
        <div class="modal-card">
          <div class="modal-header">
            <h3>🔍 查单词</h3>
            <button class="close-btn" @click="showLookupModal = false">×</button>
          </div>
          <div class="modal-body">
            <input 
              v-model="lookupWord"
              type="text"
              placeholder="输入要查询的单词..."
              @keypress.enter="doLookupWord"
              autofocus
              class="word-input"
            />
            <button class="lookup-btn" @click="doLookupWord" :disabled="!lookupWord.trim()">
              查询
            </button>
          </div>
        </div>
      </div>
    </Teleport>
    
    <!-- 背诵计划弹窗 -->
    <Teleport to="body">
      <div v-if="showPlanModal" class="modal-overlay" @click.self="showPlanModal = false">
        <div class="modal-card">
          <div class="modal-header">
            <h3>📅 生成背诵计划</h3>
            <button class="close-btn" @click="showPlanModal = false">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>单词数量</label>
              <input v-model.number="planWordCount" type="number" min="1" class="form-input" />
            </div>
            <div class="form-group">
              <label>计划天数</label>
              <input v-model.number="planDays" type="number" min="1" class="form-input" />
            </div>
            <button class="lookup-btn" @click="doGeneratePlan">
              生成计划
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </PageContainer>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { useVocabularyStore } from '../stores/vocabulary'
import PageContainer from '../components/layout/PageContainer.vue'
import { sendMessage as sendAIMessage, lookupWord as aiLookupWord, generateStudyPlan, getLearningAdvice } from '../composables/useAI'

const store = useVocabularyStore()

// State
const messages = ref([])
const inputText = ref('')
const isLoading = ref(false)
const chatContainer = ref(null)

// Modal state
const showLookupModal = ref(false)
const showPlanModal = ref(false)
const lookupWord = ref('')
const planWordCount = ref(50)
const planDays = ref(7)

// Methods
function formatMessage(text) {
  // 将换行转换为 <br>，将 ** 转换为加粗
  return text
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
}

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || isLoading.value) return
  
  messages.value.push({ role: 'user', content: text })
  inputText.value = ''
  isLoading.value = true
  
  await scrollToBottom()
  
  try {
    const response = await sendAIMessage(
      messages.value.map(m => ({ role: m.role, content: m.content }))
    )
    messages.value.push({ role: 'assistant', content: response })
  } catch (error) {
    messages.value.push({ 
      role: 'assistant', 
      content: '抱歉，出了点问题：' + error.message 
    })
  } finally {
    isLoading.value = false
    await scrollToBottom()
  }
}

async function scrollToBottom() {
  await nextTick()
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

function showWordLookup() {
  lookupWord.value = ''
  showLookupModal.value = true
}

function showStudyPlan() {
  planWordCount.value = store.wordCount || 50
  planDays.value = 7
  showPlanModal.value = true
}

async function doLookupWord() {
  const word = lookupWord.value.trim()
  if (!word) return
  
  showLookupModal.value = false
  messages.value.push({ role: 'user', content: `请解释单词 "${word}"` })
  isLoading.value = true
  
  await scrollToBottom()
  
  try {
    const response = await aiLookupWord(word)
    messages.value.push({ role: 'assistant', content: response })
  } catch (error) {
    messages.value.push({ 
      role: 'assistant', 
      content: '抱歉，查询失败：' + error.message 
    })
  } finally {
    isLoading.value = false
    await scrollToBottom()
  }
}

async function doGeneratePlan() {
  showPlanModal.value = false
  messages.value.push({ 
    role: 'user', 
    content: `请帮我制定背诵 ${planWordCount.value} 个单词、${planDays.value} 天完成的计划` 
  })
  isLoading.value = true
  
  await scrollToBottom()
  
  try {
    const response = await generateStudyPlan(planWordCount.value, planDays.value)
    messages.value.push({ role: 'assistant', content: response })
  } catch (error) {
    messages.value.push({ 
      role: 'assistant', 
      content: '抱歉，生成计划失败：' + error.message 
    })
  } finally {
    isLoading.value = false
    await scrollToBottom()
  }
}

async function getAdvice() {
  const stats = {
    totalWords: store.wordCount,
    masteryRate: store.vocabulary.length > 0 
      ? Math.round(store.vocabulary.reduce((acc, w) => acc + (w.mastery_level || 0), 0) / store.vocabulary.length)
      : 0,
    wrongCount: store.wrongCount,
    streakDays: parseInt(localStorage.getItem('streak_days') || '0')
  }
  
  messages.value.push({ 
    role: 'user', 
    content: '请根据我的学习情况给我一些建议' 
  })
  isLoading.value = true
  
  await scrollToBottom()
  
  try {
    const response = await getLearningAdvice(stats)
    messages.value.push({ role: 'assistant', content: response })
  } catch (error) {
    messages.value.push({ 
      role: 'assistant', 
      content: '抱歉，获取建议失败：' + error.message 
    })
  } finally {
    isLoading.value = false
    await scrollToBottom()
  }
}
</script>

<style scoped>
.quick-features {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.feature-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: white;
  border: 2px solid var(--primary-100, #fdeef2);
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.feature-btn:hover {
  border-color: var(--primary-400, #f4729a);
  background: var(--primary-50, #fef7f9);
  transform: translateY(-2px);
}

.feature-icon {
  font-size: 24px;
}

.feature-btn span:last-child {
  font-size: 13px;
  font-weight: 500;
  color: var(--gray-700, #3f3f46);
}

/* Chat Container */
.chat-container {
  background: white;
  border-radius: 20px;
  padding: 20px;
  min-height: 300px;
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 16px;
  border: 1px solid var(--primary-100, #fdeef2);
}

.welcome-message {
  text-align: center;
  padding: 40px 20px;
  color: var(--gray-500, #71717a);
}

.welcome-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.welcome-message h3 {
  color: var(--gray-800, #27272a);
  margin: 0 0 8px;
}

.welcome-message p {
  margin: 0;
  font-size: 14px;
}

/* Messages */
.message {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--primary-100, #fdeef2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.message.user .message-avatar {
  background: #e0e7ff;
}

.message-content {
  max-width: 75%;
}

.message-text {
  background: var(--primary-50, #fef7f9);
  padding: 12px 16px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--gray-800, #27272a);
}

.message.user .message-text {
  background: linear-gradient(135deg, var(--primary-400, #f4729a), var(--primary-500, #ec4074));
  color: white;
}

.message-text code {
  background: rgba(0, 0, 0, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}

/* Typing Indicator */
.typing-indicator {
  display: flex;
  gap: 6px;
  padding: 12px 16px;
  background: var(--primary-50, #fef7f9);
  border-radius: 16px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: var(--primary-300, #f8a8c0);
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-8px);
  }
}

/* Input Area */
.input-area {
  display: flex;
  gap: 12px;
}

.chat-input {
  flex: 1;
  padding: 14px 20px;
  border: 2px solid var(--primary-200, #fbd5df);
  border-radius: 14px;
  font-size: 15px;
  outline: none;
}

.chat-input:focus {
  border-color: var(--primary-400, #f4729a);
}

.send-btn {
  padding: 14px 24px;
  background: linear-gradient(135deg, var(--primary-400, #f4729a), var(--primary-500, #ec4074));
  color: white;
  border: none;
  border-radius: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(236, 64, 116, 0.3);
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

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: var(--gray-700, #3f3f46);
  margin-bottom: 8px;
}

.word-input, .form-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--primary-200, #fbd5df);
  border-radius: 12px;
  font-size: 15px;
  outline: none;
  box-sizing: border-box;
  margin-bottom: 16px;
}

.word-input:focus, .form-input:focus {
  border-color: var(--primary-400, #f4729a);
}

.lookup-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, var(--primary-400, #f4729a), var(--primary-500, #ec4074));
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
}

.lookup-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
