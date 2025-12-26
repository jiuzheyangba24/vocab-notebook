<template>
  <PageContainer title="学习统计" subtitle="查看你的学习进度">
    <div class="stats-overview">
      <div class="overview-card">
        <div class="card-icon-circle blue">
          <BookOpen class="card-icon" />
        </div>
        <div class="card-value">{{ stats.totalWords }}</div>
        <div class="card-label">总词汇量</div>
      </div>
      <div class="overview-card">
        <div class="card-icon-circle green">
          <CheckCircle class="card-icon" />
        </div>
        <div class="card-value">{{ stats.masteredWords }}</div>
        <div class="card-label">已掌握</div>
      </div>
      <div class="overview-card">
        <div class="card-icon-circle purple">
          <Activity class="card-icon" />
        </div>
        <div class="card-value">{{ stats.avgMastery }}%</div>
        <div class="card-label">平均掌握度</div>
      </div>
      <div class="overview-card">
        <div class="card-icon-circle orange">
          <RotateCw class="card-icon" />
        </div>
        <div class="card-value">{{ stats.totalReviews }}</div>
        <div class="card-label">复习次数</div>
      </div>
    </div>
    
    <!-- 导出按钮 -->
    <div class="export-section">
      <button class="export-btn" @click="handleExportCSV">
        <FileText class="btn-icon" /> 导出 CSV
      </button>
      <button class="export-btn" @click="handleExportJSON">
        <FileJson class="btn-icon" /> 导出 JSON
      </button>
      <button class="export-btn primary" @click="handleExportReport">
        <FileChartColumn class="btn-icon" /> 导出报告
      </button>
    </div>
    
    <!-- 图表区域 -->
    <div class="charts-grid">
      <!-- 饼图：掌握程度分布 -->
      <section class="chart-section">
        <h3><PieChart class="section-icon" /> 掌握程度分布</h3>
        <div class="pie-chart-container">
          <svg viewBox="0 0 200 200" class="pie-chart">
            <circle 
              v-for="(segment, index) in pieSegments" 
              :key="index"
              cx="100" 
              cy="100" 
              r="80"
              fill="none"
              :stroke="segment.color"
              stroke-width="40"
              :stroke-dasharray="segment.dashArray"
              :stroke-dashoffset="segment.dashOffset"
              :style="{ transform: 'rotate(-90deg)', transformOrigin: '100px 100px' }"
            />
            <text x="100" y="95" text-anchor="middle" class="pie-center-text">{{ stats.totalWords }}</text>
            <text x="100" y="115" text-anchor="middle" class="pie-center-label">单词</text>
          </svg>
          <div class="pie-legend">
            <div v-for="item in masteryDistribution" :key="item.label" class="legend-item">
              <span class="legend-color" :style="{ background: item.color }"></span>
              <span class="legend-label">{{ item.label }}</span>
              <span class="legend-count">{{ item.count }}</span>
            </div>
          </div>
        </div>
      </section>
      
      <!-- 折线图：学习趋势 -->
      <section class="chart-section">
        <h3><TrendingUp class="section-icon" /> 近7天学习趋势</h3>
        <div class="line-chart-container">
          <svg viewBox="0 0 320 160" class="line-chart">
            <!-- 网格线 -->
            <line x1="40" y1="20" x2="40" y2="130" stroke="#e5e5e5" stroke-width="1"/>
            <line x1="40" y1="130" x2="300" y2="130" stroke="#e5e5e5" stroke-width="1"/>
            <line x1="40" y1="75" x2="300" y2="75" stroke="#e5e5e5" stroke-width="1" stroke-dasharray="4"/>
            <line x1="40" y1="20" x2="300" y2="20" stroke="#e5e5e5" stroke-width="1" stroke-dasharray="4"/>
            
            <!-- 折线 -->
            <polyline 
              :points="lineChartPoints"
              fill="none"
              stroke="#ec4074"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            
            <!-- 数据点 -->
            <circle 
              v-for="(point, index) in chartPoints" 
              :key="index"
              :cx="point.x"
              :cy="point.y"
              r="5"
              fill="#ec4074"
              stroke="white"
              stroke-width="2"
            />
            
            <!-- X轴标签 -->
            <text 
              v-for="(day, index) in last7Days" 
              :key="'label-' + index"
              :x="40 + index * 43"
              y="148"
              text-anchor="middle"
              class="chart-label"
            >{{ day }}</text>
          </svg>
          <div class="chart-summary">
            <span>本周学习：<strong>{{ weeklyTotal }}</strong> 个单词</span>
          </div>
        </div>
      </section>
    </div>
    
    <!-- 掌握程度条形图 -->
    <section class="stats-section">
      <h3><BarChart class="section-icon" /> 掌握程度详情</h3>
      <div class="mastery-chart">
        <div class="chart-bar" v-for="(item, index) in masteryDistribution" :key="index">
          <div class="bar-label">{{ item.label }}</div>
          <div class="bar-track">
            <div 
              class="bar-fill" 
              :style="{ width: item.percent + '%', background: item.color }"
            ></div>
          </div>
          <div class="bar-count">{{ item.count }}</div>
        </div>
      </div>
    </section>
    
    <!-- 最近学习 -->
    <section class="stats-section">
      <h3><BookOpen class="section-icon" /> 最近添加的单词</h3>
      <div v-if="recentWords.length === 0" class="empty-section">
        暂无单词
      </div>
      <div v-else class="recent-list">
        <div 
          v-for="word in recentWords" 
          :key="word.id"
          class="recent-item"
        >
          <span class="word">{{ word.headWord }}</span>
          <span class="date">{{ formatDate(word.createdAt) }}</span>
        </div>
      </div>
    </section>
  </PageContainer>
</template>

<script setup>
import { computed } from 'vue'
import { useVocabularyStore } from '../stores/vocabulary'
import PageContainer from '../components/layout/PageContainer.vue'
import { exportToCSV, exportToJSON, exportReport, getExportFilename } from '../composables/useExport'
import { 
  BookOpen, 
  CheckCircle, 
  Activity, 
  RotateCw,
  FileText,
  FileJson,
  FileChartColumn,
  PieChart,
  TrendingUp,
  BarChart
} from 'lucide-vue-next'

const store = useVocabularyStore()

const stats = computed(() => {
  const words = store.vocabulary
  const totalWords = words.length
  const masteredWords = words.filter(w => (w.mastery_level || 0) >= 80).length
  const totalReviews = words.reduce((sum, w) => sum + (w.review_count || 0), 0)
  const avgMastery = totalWords > 0 
    ? Math.round(words.reduce((sum, w) => sum + (w.mastery_level || 0), 0) / totalWords)
    : 0
  
  return { totalWords, masteredWords, totalReviews, avgMastery }
})

const masteryDistribution = computed(() => {
  const words = store.vocabulary
  const total = words.length || 1
  
  const ranges = [
    { label: '0-20%', min: 0, max: 20, color: '#ef4444' },
    { label: '21-40%', min: 21, max: 40, color: '#f97316' },
    { label: '41-60%', min: 41, max: 60, color: '#eab308' },
    { label: '61-80%', min: 61, max: 80, color: '#22c55e' },
    { label: '81-100%', min: 81, max: 100, color: '#10b981' }
  ]
  
  return ranges.map(range => {
    const count = words.filter(w => {
      const level = w.mastery_level || 0
      return level >= range.min && level <= range.max
    }).length
    return {
      ...range,
      count,
      percent: Math.round((count / total) * 100)
    }
  })
})

const recentWords = computed(() => {
  return [...store.vocabulary]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10)
})

// 饼图分段计算
const pieSegments = computed(() => {
  const total = stats.value.totalWords || 1
  const circumference = 2 * Math.PI * 80 // r=80
  let currentOffset = 0
  
  return masteryDistribution.value.map(item => {
    const ratio = item.count / total
    const dashLength = ratio * circumference
    const dashArray = `${dashLength} ${circumference - dashLength}`
    const dashOffset = -currentOffset
    currentOffset += dashLength
    
    return {
      color: item.color,
      dashArray,
      dashOffset
    }
  })
})

// 近7天日期
const last7Days = computed(() => {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    days.push(date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }).replace('/', '.'))
  }
  return days
})

// 近7天每日学习数据
const dailyLearningData = computed(() => {
  const data = []
  const words = store.vocabulary
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    const count = words.filter(w => {
      if (!w.createdAt) return false
      return w.createdAt.startsWith(dateStr)
    }).length
    
    data.push(count)
  }
  
  return data
})

// 折线图坐标点
const chartPoints = computed(() => {
  const data = dailyLearningData.value
  const maxVal = Math.max(...data, 1)
  
  return data.map((val, index) => ({
    x: 40 + index * 43,
    y: 130 - (val / maxVal) * 110
  }))
})

// 折线图 polyline points 字符串
const lineChartPoints = computed(() => {
  return chartPoints.value.map(p => `${p.x},${p.y}`).join(' ')
})

// 本周学习总数
const weeklyTotal = computed(() => {
  return dailyLearningData.value.reduce((sum, val) => sum + val, 0)
})

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

// 导出功能
function handleExportCSV() {
  const filename = getExportFilename('vocabulary')
  exportToCSV(store.vocabulary, filename)
}

function handleExportJSON() {
  const filename = getExportFilename('vocabulary')
  exportToJSON(store.vocabulary, filename)
}

function handleExportReport() {
  const filename = getExportFilename('learning_report')
  const reportStats = {
    ...stats.value,
    distribution: masteryDistribution.value
  }
  exportReport(reportStats, store.vocabulary, filename)
}
</script>

<style scoped>
/* Export Section */
.export-section {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.export-btn {
  flex: 1;
  padding: 12px 16px;
  background: white;
  border: 2px solid var(--primary-200, #fbd5df);
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  color: var(--gray-700, #3f3f46);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.export-btn:hover {
  border-color: var(--primary-400, #f4729a);
  background: var(--primary-50, #fef7f9);
}

.btn-icon {
  width: 16px;
  height: 16px;
}

.section-icon {
  width: 18px;
  height: 18px;
  color: var(--primary-500, #ec4074);
  vertical-align: text-bottom;
  margin-right: 6px;
}

.export-btn.primary {
  background: linear-gradient(135deg, var(--primary-400, #f4729a), var(--primary-500, #ec4074));
  border-color: transparent;
  color: white;
}

.export-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(236, 64, 116, 0.3);
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.overview-card {
  background: white;
  border-radius: 16px;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1px solid var(--primary-100, #fdeef2);
  transition: transform 0.2s;
}

.overview-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(248, 165, 194, 0.15);
}

.card-icon-circle {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.card-icon-circle.blue { background: #e0f2fe; color: #0ea5e9; }
.card-icon-circle.green { background: #dcfce7; color: #22c55e; }
.card-icon-circle.purple { background: #f3e8ff; color: #a855f7; }
.card-icon-circle.orange { background: #ffedd5; color: #f97316; }

.card-icon {
  width: 24px;
  height: 24px;
}

.card-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--gray-900, #18181b);
}

.card-label {
  font-size: 13px;
  color: var(--gray-500, #71717a);
  margin-top: 4px;
}

.stats-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
  border: 1px solid var(--primary-100, #fdeef2);
}

.stats-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--gray-700, #3f3f46);
  margin: 0 0 20px;
  display: flex;
  align-items: center;
}

.mastery-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chart-bar {
  display: grid;
  grid-template-columns: 70px 1fr 40px;
  align-items: center;
  gap: 12px;
}

.bar-label {
  font-size: 13px;
  color: var(--gray-600, #52525b);
}

.bar-track {
  height: 12px;
  background: var(--gray-100, #f4f4f5);
  border-radius: 6px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.5s ease;
}

.bar-count {
  font-size: 13px;
  color: var(--gray-500, #71717a);
  text-align: right;
}

.empty-section {
  text-align: center;
  padding: 24px;
  color: var(--gray-400, #a1a1aa);
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recent-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--primary-50, #fef7f9);
  border-radius: 10px;
}

.recent-item .word {
  font-weight: 500;
  color: var(--gray-700, #3f3f46);
}

.recent-item .date {
  font-size: 12px;
  color: var(--gray-400, #a1a1aa);
}

/* Charts Grid */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.chart-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid var(--primary-100, #fdeef2);
}

.chart-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--gray-700, #3f3f46);
  margin: 0 0 20px;
  display: flex;
  align-items: center;
}

/* Pie Chart */
.pie-chart-container {
  display: flex;
  align-items: center;
  gap: 24px;
}

.pie-chart {
  width: 140px;
  height: 140px;
  flex-shrink: 0;
}

.pie-center-text {
  font-size: 28px;
  font-weight: 700;
  fill: var(--gray-800, #27272a);
}

.pie-center-label {
  font-size: 12px;
  fill: var(--gray-500, #71717a);
}

.pie-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.legend-label {
  color: var(--gray-600, #52525b);
}

.legend-count {
  color: var(--gray-400, #a1a1aa);
  margin-left: auto;
}

/* Line Chart */
.line-chart-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.line-chart {
  width: 100%;
  height: auto;
}

.chart-label {
  font-size: 10px;
  fill: var(--gray-500, #71717a);
}

.chart-summary {
  text-align: center;
  font-size: 14px;
  color: var(--gray-600, #52525b);
}

.chart-summary strong {
  color: var(--primary-500, #ec4074);
  font-weight: 600;
}
</style>
