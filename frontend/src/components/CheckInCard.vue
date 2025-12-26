<template>
  <div class="checkin-card" :class="{ 'checked-in': isCheckedInToday }">
    <div class="checkin-header">
      <div class="streak-info">
        <div class="streak-icon-wrapper">
          <Flame class="streak-icon" :class="{ active: streakDays > 0 }" />
        </div>
        <div class="streak-text">
          <span class="streak-count">{{ streakDays }}</span>
          <span class="streak-label">天连续打卡</span>
        </div>
      </div>
      <div class="checkin-status" v-if="isCheckedInToday">
        <span class="checked-badge">✅ 今日已打卡</span>
      </div>
    </div>
    
    <div class="checkin-body">
      <div class="today-progress">
        <div class="progress-label">
          <span>今日学习进度</span>
          <span class="progress-value">{{ todayStats.wordsLearned }}/{{ dailyGoal }} 个单词</span>
        </div>
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: progressPercent + '%' }"
          ></div>
        </div>
      </div>
      
      <div class="today-stats">
        <div class="mini-stat">
          <span class="mini-value">{{ todayStats.wordsLearned }}</span>
          <span class="mini-label">学习单词</span>
        </div>
        <div class="mini-stat">
          <span class="mini-value">{{ todayStats.testsCompleted }}</span>
          <span class="mini-label">完成测试</span>
        </div>
        <div class="mini-stat">
          <span class="mini-value">{{ todayStats.accuracy }}%</span>
          <span class="mini-label">正确率</span>
        </div>
      </div>
    </div>
    
    <button 
      v-if="!isCheckedInToday && canCheckIn"
      class="checkin-btn"
      @click="checkIn"
    >
      🎯 立即打卡
    </button>
    
    <!-- 已打卡时显示分享按钮 -->
    <button 
      v-if="isCheckedInToday"
      class="share-btn"
      @click="showSharePoster = true"
    >
      <Camera class="btn-icon" /> 分享打卡成就
    </button>
    
    <div v-else-if="!canCheckIn" class="checkin-hint">
      完成学习 {{ dailyGoal }} 个单词后可打卡
    </div>
    
    <!-- 分享海报 -->
    <SharePoster 
      :visible="showSharePoster"
      :streak-days="streakDays"
      :words-learned="todayStats.wordsLearned"
      :tests-completed="todayStats.testsCompleted"
      :accuracy="todayStats.accuracy"
      @close="showSharePoster = false"
    />
    
    <!-- 打卡日历 (Small Version) -->
    <div class="calendar-section">
      <div class="calendar-header">
        <div class="calendar-title-wrap">
          <Calendar class="calendar-icon" />
          <span class="calendar-title">本月打卡</span>
        </div>
        <span class="calendar-month">{{ currentMonthName }}</span>
      </div>
      <div class="calendar-grid">
        <div class="weekday-header">
          <span v-for="day in weekDays" :key="day">{{ day }}</span>
        </div>
        <div class="days-grid">
          <div 
            v-for="(day, index) in calendarDays" 
            :key="index"
            class="day-cell"
            :class="{ 
              empty: !day,
              today: day && isToday(day),
              'checked-in': day && isDayCheckedIn(day),
              future: day && isFuture(day)
            }"
          >
            <span v-if="day">{{ day }}</span>
            <div v-if="day && isDayCheckedIn(day)" class="check-dot"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import SharePoster from './SharePoster.vue'
import { Flame, Calendar, Camera } from 'lucide-vue-next'

const props = defineProps({
  dailyGoal: {
    type: Number,
    default: 10
  }
})

const emit = defineEmits(['checkin'])

// State
const checkInRecords = ref([])
const todayStats = ref({
  wordsLearned: 0,
  testsCompleted: 0,
  accuracy: 0
})
const showSharePoster = ref(false)

// Computed
const today = computed(() => new Date().toISOString().split('T')[0])

const isCheckedInToday = computed(() => {
  return checkInRecords.value.includes(today.value)
})

const streakDays = computed(() => {
  if (checkInRecords.value.length === 0) return 0
  
  let streak = 0
  const now = new Date()
  
  for (let i = 0; i <= 365; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    if (checkInRecords.value.includes(dateStr)) {
      streak++
    } else if (i > 0) {
      // 如果不是今天且中断了，就停止计数
      break
    }
  }
  
  return streak
})

const progressPercent = computed(() => {
  return Math.min(100, Math.round((todayStats.value.wordsLearned / props.dailyGoal) * 100))
})

const canCheckIn = computed(() => {
  return todayStats.value.wordsLearned >= props.dailyGoal
})

// 日历相关
const weekDays = ['日', '一', '二', '三', '四', '五', '六']

const currentMonthName = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}年${now.getMonth() + 1}月`
})

const calendarDays = computed(() => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  
  // 本月第一天是星期几
  const firstDay = new Date(year, month, 1).getDay()
  // 本月有多少天
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  
  // 生成日历数组，空格填充前面
  const days = []
  for (let i = 0; i < firstDay; i++) {
    days.push(null) // 空格
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }
  
  return days
})

function isToday(day) {
  const now = new Date()
  return day === now.getDate()
}

function isFuture(day) {
  const now = new Date()
  return day > now.getDate()
}

function isDayCheckedIn(day) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  return checkInRecords.value.includes(dateStr)
}

// Methods
function loadCheckInRecords() {
  const saved = localStorage.getItem('checkin_records')
  if (saved) {
    try {
      checkInRecords.value = JSON.parse(saved)
    } catch (e) {
      console.warn('Failed to load check-in records')
    }
  }
}

function loadTodayStats() {
  const saved = localStorage.getItem('today_stats')
  const savedDate = localStorage.getItem('today_stats_date')
  
  if (saved && savedDate === today.value) {
    try {
      todayStats.value = JSON.parse(saved)
    } catch (e) {
      console.warn('Failed to load today stats')
    }
  } else {
    // 新的一天，重置统计
    todayStats.value = { wordsLearned: 0, testsCompleted: 0, accuracy: 0 }
    saveTodayStats()
  }
}

function saveTodayStats() {
  localStorage.setItem('today_stats', JSON.stringify(todayStats.value))
  localStorage.setItem('today_stats_date', today.value)
}

function checkIn() {
  if (isCheckedInToday.value || !canCheckIn.value) return
  
  checkInRecords.value.push(today.value)
  localStorage.setItem('checkin_records', JSON.stringify(checkInRecords.value))
  emit('checkin', streakDays.value)
}

// 暴露方法供父组件调用
function recordLearning(count = 1) {
  todayStats.value.wordsLearned += count
  saveTodayStats()
}

function recordTest(correct, total) {
  todayStats.value.testsCompleted++
  if (total > 0) {
    const currentTotal = todayStats.value.testsCompleted
    const prevAccuracy = todayStats.value.accuracy
    const newAccuracy = Math.round((correct / total) * 100)
    todayStats.value.accuracy = Math.round(
      (prevAccuracy * (currentTotal - 1) + newAccuracy) / currentTotal
    )
  }
  saveTodayStats()
}

defineExpose({ recordLearning, recordTest })

onMounted(() => {
  loadCheckInRecords()
  loadTodayStats()
})
</script>

<style scoped>
.checkin-card {
  background: linear-gradient(135deg, #fff5f7, #ffeef3);
  border-radius: 20px;
  padding: 24px;
  border: 2px solid var(--primary-200, #fbd5df);
  margin-bottom: 24px;
}

.checkin-card.checked-in {
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
  border-color: #86efac;
}

.checkin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

/* Streak Styles */
.streak-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.streak-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

.streak-icon {
  width: 28px;
  height: 28px;
  color: #fb923c;
  transition: all 0.3s;
}

.streak-icon.active {
  color: #f97316;
  filter: drop-shadow(0 0 4px rgba(249, 115, 22, 0.4));
}

.streak-text {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.streak-count {
  font-size: 32px;
  font-weight: 700;
  color: var(--primary-500, #ec4074);
}

.checked-in .streak-count {
  color: #22c55e;
}

.streak-label {
  font-size: 14px;
  color: var(--gray-600, #52525b);
}

.checked-badge {
  background: #22c55e;
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}

.checkin-body {
  margin-bottom: 20px;
}

.today-progress {
  margin-bottom: 16px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--gray-600, #52525b);
}

.progress-value {
  font-weight: 600;
  color: var(--primary-500, #ec4074);
}

.checked-in .progress-value {
  color: #22c55e;
}

.progress-bar {
  height: 10px;
  background: white;
  border-radius: 5px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-400, #f4729a), var(--primary-500, #ec4074));
  border-radius: 5px;
  transition: width 0.3s;
}

.checked-in .progress-fill {
  background: linear-gradient(90deg, #4ade80, #22c55e);
}

.today-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.mini-stat {
  background: white;
  border-radius: 12px;
  padding: 12px;
  text-align: center;
}

.mini-value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: var(--gray-800, #27272a);
}

.mini-label {
  display: block;
  font-size: 12px;
  color: var(--gray-500, #71717a);
  margin-top: 2px;
}

.checkin-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, var(--primary-400, #f4729a), var(--primary-500, #ec4074));
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.checkin-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(236, 64, 116, 0.3);
}

.checkin-hint {
  text-align: center;
  font-size: 14px;
  color: var(--gray-500, #71717a);
  padding: 12px;
  background: white;
  border-radius: 10px;
  margin-bottom: 16px;
}

.share-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #8b5cf6, #d946ef);
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.share-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.4);
  background: linear-gradient(135deg, #7c3aed, #c026d3);
}

.btn-icon {
  width: 20px;
  height: 20px;
}

/* Calendar Styles */
.calendar-section {
  margin-top: 20px;
  background: white;
  border-radius: 16px;
  padding: 16px;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.calendar-title-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.calendar-icon {
  width: 16px;
  height: 16px;
  color: var(--primary-500, #ec4074);
}

.calendar-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--gray-700, #3f3f46);
}

.calendar-month {
  font-size: 12px;
  color: var(--gray-400, #a1a1aa);
}

.calendar-grid {
  display: flex;
  flex-direction: column;
  gap: 2px; /* Smaller gap */
}

.weekday-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-size: 10px; /* Smaller font */
  color: var(--gray-400, #a1a1aa);
  padding-bottom: 4px;
  gap: 2px; /* Match gap with days-grid for alignment */
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.day-cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 11px; /* Smaller font */
  color: var(--gray-600, #52525b);
  border-radius: 8px; /* Slightly more rounded */
  position: relative;
  height: 28px; /* Fixed smaller height */
  transition: all 0.2s;
}

.day-cell.empty {
  background: transparent;
}

.day-cell.today {
  background: var(--primary-50, #fef7f9);
  font-weight: 700;
  color: var(--primary-600, #e82a66);
  border: 1px solid var(--primary-100, #fdeef2);
}

.day-cell.checked-in {
  background: linear-gradient(135deg, #4ade80, #22c55e); /* Bright Green */
  color: white;
  font-weight: 700;
  box-shadow: 0 4px 10px rgba(34, 197, 94, 0.3);
  border: none; /* Remove border if it was 'today' */
}

/* Hide dot for checked-in days as the whole cell is highlighted */
.day-cell.checked-in .check-dot {
  display: none;
}

/* Keep dot only for today if NOT checked in (though logic implies today will be checked in if checked in) */
.day-cell.today .check-dot {
  bottom: 2px;
}

.day-cell.future {
  color: var(--gray-300, #d4d4d8);
}

</style>
