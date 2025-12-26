<template>
  <Teleport to="body">
    <div class="poster-overlay" v-if="visible" @click.self="$emit('close')">
      <div class="poster-modal">
        <div class="poster-header">
          <h3>📸 分享打卡</h3>
          <button class="close-btn" @click="$emit('close')">✕</button>
        </div>
        
        <!-- 海报预览 -->
        <div class="poster-preview" ref="posterRef">
          <div class="poster-content">
            <!-- 顶部装饰 -->
            <div class="poster-decoration">
              <span class="deco-icon">📚</span>
            </div>
            
            <!-- 主标题 -->
            <div class="poster-title">
              <h2>今日学习打卡</h2>
              <p class="date">{{ formattedDate }}</p>
            </div>
            
            <!-- 连续天数 -->
            <div class="streak-display">
              <span class="streak-number">{{ streakDays }}</span>
              <span class="streak-text">天连续打卡</span>
            </div>
            
            <!-- 学习数据 -->
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-value">{{ wordsLearned }}</span>
                <span class="stat-label">学习单词</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ testsCompleted }}</span>
                <span class="stat-label">完成测试</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ accuracy }}%</span>
                <span class="stat-label">正确率</span>
              </div>
            </div>
            
            <!-- 鼓励语 -->
            <div class="encourage-text">
              {{ encourageMessage }}
            </div>
            
            <!-- 底部信息 -->
            <div class="poster-footer">
              <span class="app-name">📖 词汇本</span>
            </div>
          </div>
        </div>
        
        <!-- 操作按钮 -->
        <div class="poster-actions">
          <button class="action-btn download" @click="downloadPoster">
            📥 保存图片
          </button>
          <button class="action-btn copy" @click="copyToClipboard">
            📋 复制图片
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import html2canvas from 'html2canvas'

const props = defineProps({
  visible: { type: Boolean, default: false },
  streakDays: { type: Number, default: 0 },
  wordsLearned: { type: Number, default: 0 },
  testsCompleted: { type: Number, default: 0 },
  accuracy: { type: Number, default: 0 }
})

const emit = defineEmits(['close'])
const posterRef = ref(null)

const formattedDate = computed(() => {
  return new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
})

const encourageMessages = [
  '坚持就是胜利！💪',
  '每天进步一点点！🌟',
  '学习使我快乐！📚',
  '知识改变命运！🎯',
  '加油，你是最棒的！🔥'
]

const encourageMessage = computed(() => {
  const index = props.streakDays % encourageMessages.length
  return encourageMessages[index]
})

async function downloadPoster() {
  if (!posterRef.value) return
  
  try {
    const canvas = await html2canvas(posterRef.value, {
      scale: 2,
      backgroundColor: null,
      useCORS: true
    })
    
    const link = document.createElement('a')
    link.download = `打卡_${new Date().toISOString().slice(0, 10)}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  } catch (e) {
    alert('保存失败，请重试')
    console.error(e)
  }
}

async function copyToClipboard() {
  if (!posterRef.value) return
  
  try {
    const canvas = await html2canvas(posterRef.value, {
      scale: 2,
      backgroundColor: null,
      useCORS: true
    })
    
    canvas.toBlob(async (blob) => {
      if (blob) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ])
        alert('已复制到剪贴板！')
      }
    })
  } catch (e) {
    alert('复制失败，请重试')
    console.error(e)
  }
}
</script>

<style scoped>
.poster-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.poster-modal {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 400px;
  overflow: hidden;
}

.poster-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.poster-header h3 {
  margin: 0;
  font-size: 18px;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f5f5f5;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
}

.poster-preview {
  padding: 20px;
}

.poster-content {
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%);
  border-radius: 20px;
  padding: 32px 24px;
  text-align: center;
  color: #333;
}

.poster-decoration {
  margin-bottom: 16px;
}

.deco-icon {
  font-size: 48px;
}

.poster-title h2 {
  margin: 0 0 8px;
  font-size: 24px;
  color: #333;
}

.poster-title .date {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.streak-display {
  margin: 24px 0;
  background: white;
  border-radius: 16px;
  padding: 20px;
  display: inline-block;
}

.streak-number {
  font-size: 48px;
  font-weight: 700;
  color: #ec4074;
}

.streak-text {
  display: block;
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin: 20px 0;
}

.stat-item {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  padding: 12px 8px;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #333;
}

.stat-label {
  display: block;
  font-size: 11px;
  color: #666;
  margin-top: 4px;
}

.encourage-text {
  font-size: 16px;
  color: #333;
  margin: 20px 0;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
}

.poster-footer {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px dashed rgba(0, 0, 0, 0.1);
}

.app-name {
  font-size: 14px;
  color: #666;
}

.poster-actions {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
}

.action-btn {
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.download {
  background: linear-gradient(135deg, #ec4074, #f472b6);
  color: white;
}

.action-btn.copy {
  background: #f5f5f5;
  color: #333;
}

.action-btn:hover {
  transform: translateY(-2px);
}
</style>
