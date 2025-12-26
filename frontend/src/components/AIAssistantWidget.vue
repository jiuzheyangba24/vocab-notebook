<template>
  <div 
    class="ai-widget-container"
    :style="{ left: position.x + 'px', top: position.y + 'px' }"
  >
    <!-- Chat Window -->
    <transition name="slide-up">
      <div v-if="isOpen" class="chat-window">
        <div class="chat-header" @mousedown="startDrag" @touchstart="startDrag">
          <div class="header-info">
            <div class="avatar-circle">AI</div>
            <h3>Sakura Assistant</h3>
          </div>
          <button class="close-btn" @click.stop="isOpen = false">
            <X class="icon-sm" />
          </button>
        </div>
        
        <div class="chat-messages" ref="messagesContainer">
          <div v-if="messages.length === 0" class="empty-state">
            <Bot class="empty-icon" />
            <p>你好！我是你的专属外教，<br>有什么我可以帮你的吗？</p>
            <div class="suggestions">
              <button @click="sendMessage('如何更高效地背单词？')">🌸 如何更高效地背单词？</button>
              <button @click="sendMessage('解释一下艾宾浩斯遗忘曲线')">📈 解释一下遗忘曲线</button>
            </div>
          </div>
          
          <div 
            v-for="(msg, index) in messages" 
            :key="index"
            class="message"
            :class="{ 'user-message': msg.role === 'user', 'ai-message': msg.role === 'ai' }"
          >
            <div class="message-content markdown-body" v-html="msg.role === 'ai' ? renderMarkdown(msg.content) : msg.content"></div>
          </div>
          
          <div v-if="isTyping" class="message ai-message typing">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
        </div>
        
        <div class="chat-input hover-effect">
          <input 
            v-model="inputValue" 
            @keyup.enter="handleSend"
            placeholder="输入你的问题..."
            :disabled="isTyping"
          >
          <button 
            class="send-btn" 
            @click="handleSend"
            :disabled="!inputValue.trim() || isTyping"
          >
            <Send class="icon-sm" />
          </button>
        </div>
      </div>
    </transition>

    <!-- Floating Trigger Button -->
    <button 
      class="ai-trigger" 
      @click="isOpen = !isOpen"
      @mousedown="startDrag"
      @touchstart="startDrag"
      :class="{ 'is-open': isOpen }"
    >
      <transition name="rotate">
        <MessageCircleMore v-if="!isOpen" class="trigger-icon" />
        <ChevronsDown v-else class="trigger-icon" />
      </transition>
    </button>
  </div>
</template>

<script setup>
import { ref, nextTick, watch, onMounted, onUnmounted } from 'vue'
import { MessageCircleMore, X, Send, Bot, ChevronsDown } from 'lucide-vue-next'
import { sendMessage as apiSendMessage } from '../composables/useAI'
import { marked } from 'marked'

// Configure marked to handle line breaks
marked.setOptions({
  breaks: true,
  gfm: true
})

function renderMarkdown(text) {
  try {
    return marked.parse(text)
  } catch (e) {
    console.error('Markdown parsing error:', e)
    return text
  }
}

const isOpen = ref(false)
const inputValue = ref('')
const isTyping = ref(false)
const messagesContainer = ref(null)

// Draggable Logic
const position = ref({ x: window.innerWidth - 80, y: window.innerHeight - 150 })
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })

function startDrag(e) {
  // Only drag from trigger
  if (e.target.closest('.chat-window') || e.target.closest('.close-btn')) return
  
  if (e.type === 'mousedown' || e.type === 'touchstart') {
    isDragging.value = true
    const clientX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX
    const clientY = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY
    dragOffset.value = {
      x: clientX - position.value.x,
      y: clientY - position.value.y
    }
    
    // Prevent text selection
    document.body.style.userSelect = 'none'
  }
}

function onDrag(e) {
  if (!isDragging.value) return
  
  const clientX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX
  const clientY = e.type === 'mousemove' ? e.clientY : e.touches[0].clientY
  
  // Boundary check
  let newX = clientX - dragOffset.value.x
  let newY = clientY - dragOffset.value.y
  
  const maxX = window.innerWidth - 60
  const maxY = window.innerHeight - 60
  
  newX = Math.max(10, Math.min(newX, maxX))
  newY = Math.max(10, Math.min(newY, maxY))
  
  position.value = { x: newX, y: newY }
}

function stopDrag() {
  isDragging.value = false
  document.body.style.userSelect = ''
}

// Add global event listeners for drag
onMounted(() => {
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDrag)
  window.addEventListener('touchmove', onDrag, { passive: false })
  window.addEventListener('touchend', stopDrag)
  
  // Initial position adjustments for resize
  window.addEventListener('resize', () => {
    position.value = { x: window.innerWidth - 80, y: window.innerHeight - 150 }
  })
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
  window.removeEventListener('touchmove', onDrag)
  window.removeEventListener('touchend', stopDrag)
})

const messages = ref([
  // { role: 'ai', content: '你好！我是你的专属单词助教，有什么学习上的问题都可以问我哦~' }
])

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

async function handleSend() {
  const text = inputValue.value.trim()
  if (!text || isTyping.value) return
  
  await sendMessage(text)
}

async function sendMessage(text) {
  // Add user message
  messages.value.push({ role: 'user', content: text })
  inputValue.value = ''
  scrollToBottom()
  
  // Call API
  isTyping.value = true
  
  try {
    // Format messages for API (include history)
    const history = messages.value.map(msg => ({
      role: msg.role === 'ai' ? 'assistant' : 'user',
      content: msg.content
    }))
    
    const responseText = await apiSendMessage(history)
    
    messages.value.push({ 
      role: 'ai', 
      content: responseText
    })
  } catch (error) {
    messages.value.push({ 
      role: 'ai', 
      content: 'Sorry, I encountered an error connecting to the AI service. Please try again later.'
    })
    console.error(error)
  } finally {
    isTyping.value = false
    scrollToBottom()
  }
}

watch(isOpen, (val) => {
  if (val) {
    scrollToBottom()
  }
})
</script>

<style scoped>
/* Sakura Theme Styles */
.ai-trigger {
  width: 56px;
  height: 56px;
  border-radius: 28px;
  background: linear-gradient(135deg, #fbcfe8, #f472b6); /* Pink gradient */
  border: 2px solid rgba(255, 255, 255, 0.5);
  color: #db2777; /* Rose-600 */
  box-shadow: 0 8px 24px rgba(244, 114, 182, 0.4);
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s, box-shadow 0.2s;
  pointer-events: auto;
  user-select: none;
}

.ai-trigger:active {
  cursor: grabbing;
  transform: scale(0.95);
}

.ai-trigger:hover {
  transform: scale(1.05);
  box-shadow: 0 12px 30px rgba(244, 114, 182, 0.5);
}

.ai-trigger.is-open {
  background: white;
  color: #db2777;
}

.trigger-icon {
  width: 28px;
  height: 28px;
}

/* Chat Window */
.chat-window {
  width: 360px;
  height: 550px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform-origin: bottom right;
  pointer-events: auto;
  border: 1px solid rgba(251, 207, 232, 0.5);
}

.chat-header {
  padding: 16px 20px;
  background: linear-gradient(135deg, #fbcfe8, #f472b6);
  color: #831843; /* Rose-900 */
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255,255,255,0.3);
}

.header-info h3 {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
  color: #831843;
}

.avatar-circle {
  width: 32px;
  height: 32px;
  background: rgba(255,255,255,0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  color: #db2777;
}

.close-btn {
  background: rgba(255,255,255,0.3);
  border: none;
  color: #831843;
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255,255,255,0.5);
}

.chat-messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: rgba(255, 241, 242, 0.3); /* Rose-50 with opacity */
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9ca3af;
  text-align: center;
}

.empty-icon {
  width: 48px;
  height: 48px;
  color: #cbd5e1;
  margin-bottom: 12px;
}

.suggestions button {
  background: white;
  border: 1px solid #fecdd3; /* Rose-200 */
  padding: 12px;
  border-radius: 12px;
  color: #db2777;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(244, 114, 182, 0.1);
}

.suggestions button:hover {
  background: #fff1f2; /* Rose-50 */
  border-color: #f472b6;
  transform: translateY(-1px);
}

.ai-message {
  align-self: flex-start;
  background: white;
  color: #374151;
  border-bottom-left-radius: 4px;
  box-shadow: 0 4px 12px rgba(244, 114, 182, 0.1);
  border: 1px solid #fff1f2;
}

.user-message {
  align-self: flex-end;
  background: linear-gradient(135deg, #fbcfe8, #f472b6);
  color: #831843;
  border-bottom-right-radius: 4px;
  box-shadow: 0 4px 12px rgba(244, 114, 182, 0.2);
}

.chat-input {
  padding: 16px;
  background: white;
  border-top: 1px solid #fce7f3;
  display: flex;
  gap: 10px;
  align-items: center;
}

.chat-input input {
  flex: 1;
  border: 2px solid #fce7f3;
  border-radius: 20px;
  padding: 10px 16px;
  font-size: 14px;
  outline: none;
  transition: all 0.2s;
  background: #fff1f2;
}

.chat-input input:focus {
  border-color: #f472b6;
  background: white;
}

.send-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f472b6;
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(244, 114, 182, 0.3);
}

.send-btn:not(:disabled):hover {
  background: #ec4899;
  transform: scale(1.05);
}

.dot {
  background: #fda4af;
}

.ai-widget-container {
  position: fixed;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  pointer-events: none; /* Container passes clicks */
  transition: none; /* No transition on container to allow smooth dragging */
}

/* Ensure children catch pointer events */
.ai-widget-container > * {
  pointer-events: auto;
}

.icon-sm {
  width: 18px;
  height: 18px;
}

/* Transitions */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}

.rotate-enter-active,
.rotate-leave-active {
  transition: all 0.3s ease;
  position: absolute; /* Stack icons */
}

.rotate-enter-from {
  opacity: 0;
  transform: rotate(-90deg);
}

.rotate-leave-to {
  opacity: 0;
  transform: rotate(90deg);
}

/* Markdown Styles */
.markdown-body {
  font-size: 14px;
  line-height: 1.6;
}

.markdown-body :deep(p) {
  margin: 0 0 8px 0;
}

.markdown-body :deep(p:last-child) {
  margin-bottom: 0;
}

.markdown-body :deep(ul), 
.markdown-body :deep(ol) {
  padding-left: 20px;
  margin: 8px 0;
}

.markdown-body :deep(li) {
  margin-bottom: 4px;
}

.markdown-body :deep(strong) {
  font-weight: 600;
  color: #db2777; /* Rose-600 */
}

.markdown-body :deep(code) {
  background: rgba(244, 114, 182, 0.1);
  padding: 2px 4px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.9em;
  color: #be185d; /* Rose-700 */
}

.markdown-body :deep(pre) {
  background: #fdf2f8; /* Rose-50 */
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 8px 0;
  border: 1px solid #fce7f3;
}

.markdown-body :deep(pre code) {
  background: transparent;
  padding: 0;
  color: #374151;
}

.markdown-body :deep(h3), 
.markdown-body :deep(h4) {
  font-size: 15px;
  font-weight: 700;
  margin: 12px 0 8px 0;
  color: #831843;
}
</style>
