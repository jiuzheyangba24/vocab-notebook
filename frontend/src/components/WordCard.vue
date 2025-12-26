<template>
  <div class="word-card-container">
    <div class="word-card" :class="{ 'with-details': showDetails }">
      <!-- 单词头部 -->
      <div v-if="word" class="card-header">
        <div class="word-main">{{ word.headWord }}</div>
        <div class="pronunciation">{{ word.pronunciation }}</div>
        <div class="mastery-indicator" v-if="word.mastery_level !== undefined">
          <div class="mastery-circle" :style="getMasteryStyle(word.mastery_level)">
            {{ word.mastery_level }}%
          </div>
        </div>
      </div>
      
      <div v-else class="empty-state">
        <span class="empty-icon">📝</span>
        <h3>生词本是空的</h3>
        <p>点击上方按钮添加你的第一个单词</p>
      </div>
      
      <!-- 详情区域 (带动画) -->
      <Transition name="expand">
        <div v-if="word && showDetails" class="card-body">
          <div class="divider"></div>
          
          <div class="definition-section">
            <span class="section-icon">💡</span>
            <p class="definition">{{ word.definition }}</p>
          </div>
          
          <div class="details-grid">
            <div class="detail-block sentences" v-if="hasSentences">
              <h3>
                <span class="icon">🗣️</span> 例句
              </h3>
              <div class="content-list">
                <div v-for="(sentence, index) in word.sentences" :key="index" class="list-item">
                  {{ sentence }}
                </div>
              </div>
            </div>
            
            <div class="detail-block synonyms" v-if="hasSynonyms">
              <h3>
                <span class="icon">🔄</span> 同义词
              </h3>
              <div class="tags-list">
                <span v-for="(synonym, index) in word.synonyms" :key="index" class="tag">
                  {{ synonym }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  word: {
    type: Object,
    default: null
  },
  showDetails: {
    type: Boolean,
    default: false
  }
})

const hasSentences = computed(() => {
  return props.word?.sentences && props.word.sentences.length > 0
})

const hasSynonyms = computed(() => {
  return props.word?.synonyms && props.word.synonyms.length > 0
})

function getMasteryStyle(level) {
  let color = '#fbbf24' // default warning
  if (level >= 80) color = '#4ade80' // success
  if (level < 30) color = '#f87171' // danger
  
  return {
    borderColor: color,
    color: color
  }
}
</script>

<style scoped>
/* 🌸 樱花主题 - 单词卡片 */
.word-card-container {
  width: 100%;
}

.word-card {
  background: rgba(255, 255, 255, 0.85);
  border-radius: 28px;
  padding: 48px 40px;
  text-align: center;
  box-shadow: 
    0 10px 40px rgba(248, 165, 194, 0.15),
    0 0 0 1px rgba(248, 165, 194, 0.08);
  backdrop-filter: blur(10px);
  transition: all 0.4s ease;
  position: relative;
  overflow: hidden;
}

/* 卡片装饰 */
.word-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--sakura-200), var(--sakura-300), var(--sakura-200));
  opacity: 0.6;
}

.word-card.with-details {
  box-shadow: 
    0 20px 60px rgba(248, 165, 194, 0.2),
    0 0 0 1px rgba(248, 165, 194, 0.1);
}

.card-header {
  margin-bottom: 20px;
  position: relative;
}

.word-main {
  font-family: 'Georgia', serif;
  font-size: 3.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 12px;
  line-height: 1.2;
  letter-spacing: -0.5px;
}

.pronunciation {
  font-family: 'Times New Roman', serif;
  font-style: italic;
  font-size: 1.4rem;
  color: var(--sakura-400);
  font-weight: 400;
}

.mastery-indicator {
  position: absolute;
  top: -10px;
  right: -10px;
}

.mastery-circle {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 3px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  background: white;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-light);
}

.empty-icon {
  font-size: 56px;
  margin-bottom: 20px;
  display: block;
  opacity: 0.4;
}

.empty-state h3 {
  color: var(--text-secondary);
  font-weight: 500;
  margin-bottom: 8px;
}

.empty-state p {
  font-size: 0.95rem;
}

/* 详情动画 */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  max-height: 500px;
  opacity: 1;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-10px);
}

.divider {
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, var(--sakura-200), var(--sakura-300));
  margin: 24px auto;
  border-radius: 2px;
}

.definition-section {
  text-align: center;
  margin-bottom: 28px;
}

.section-icon {
  display: none;
}

.definition {
  font-size: 1.25rem;
  color: var(--text-primary);
  font-weight: 400;
  line-height: 1.6;
}

.details-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.detail-block {
  text-align: left;
  max-width: 100%;
  background: var(--sakura-50);
  padding: 20px 24px;
  border-radius: 16px;
}

.detail-block h3 {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--sakura-400);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.detail-block .icon {
  font-size: 14px;
}

.content-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.list-item {
  font-size: 0.95rem;
  color: var(--text-secondary);
  line-height: 1.7;
  padding: 10px 14px;
  background: white;
  border-radius: 10px;
  border-left: 3px solid var(--sakura-200);
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag {
  color: var(--primary-dark);
  font-size: 0.9rem;
  background: white;
  padding: 6px 14px;
  border-radius: 20px;
  font-weight: 500;
  border: 1px solid var(--sakura-200);
}

.tag::after {
  content: none;
}
</style>

