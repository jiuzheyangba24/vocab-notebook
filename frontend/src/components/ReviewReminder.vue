<template>
  <div class="review-reminder" v-if="reviewStats.dueToday > 0 || hasReviewWords">
    <div class="reminder-header">
      <div class="reminder-icon">📚</div>
      <div class="reminder-info">
        <h3>今日复习</h3>
        <p>基于艾宾浩斯遗忘曲线智能推荐</p>
      </div>
    </div>
    
    <div class="review-stats">
      <div class="stat-item urgent" v-if="reviewStats.dueToday > 0">
        <span class="stat-value">{{ reviewStats.dueToday }}</span>
        <span class="stat-label">今日待复习</span>
      </div>
      <div class="stat-item" v-if="reviewStats.dueTomorrow > 0">
        <span class="stat-value">{{ reviewStats.dueTomorrow }}</span>
        <span class="stat-label">明日待复习</span>
      </div>
      <div class="stat-item" v-if="reviewStats.mastered > 0">
        <span class="stat-value">{{ reviewStats.mastered }}</span>
        <span class="stat-label">已掌握</span>
      </div>
    </div>
    
    <button class="start-review-btn" @click="startReview" v-if="reviewStats.dueToday > 0">
      🎯 开始复习 ({{ reviewStats.dueToday }} 词)
    </button>
    
    <div class="no-review" v-else-if="!hasReviewWords">
      <span>✅ 今日复习已完成！</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useVocabularyStore } from '../stores/vocabulary'
import { getReviewStats, getWordsToReview } from '../composables/useSpacedRepetition'

const router = useRouter()
const store = useVocabularyStore()

const reviewStats = computed(() => {
  return getReviewStats(store.vocabulary)
})

const hasReviewWords = computed(() => {
  return getWordsToReview(store.vocabulary).length > 0
})

function startReview() {
  router.push({ path: '/quiz', query: { mode: 'review' } })
}
</script>

<style scoped>
.review-reminder {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 20px;
  border: 2px solid #fbbf24;
}

.reminder-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.reminder-icon {
  font-size: 32px;
}

.reminder-info h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #92400e;
}

.reminder-info p {
  margin: 4px 0 0;
  font-size: 13px;
  color: #a16207;
}

.review-stats {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.stat-item {
  flex: 1;
  background: white;
  border-radius: 12px;
  padding: 12px;
  text-align: center;
}

.stat-item.urgent {
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
}

.stat-item.urgent .stat-value {
  color: #dc2626;
}

.stat-label {
  display: block;
  font-size: 11px;
  color: #6b7280;
  margin-top: 2px;
}

.start-review-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.start-review-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
}

.no-review {
  text-align: center;
  padding: 12px;
  background: #ecfdf5;
  border-radius: 10px;
  color: #059669;
  font-size: 14px;
}
</style>
