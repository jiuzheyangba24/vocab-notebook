<template>
    <div class="progress-panel">
        <h3>📊 学习进度</h3>
        
        <!-- 今日统计 -->
        <div class="today-stats">
            <div class="stat-item">
                <span class="stat-value">{{ todayLearned }}</span>
                <span class="stat-label">今日学习</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">{{ todayReviewed }}</span>
                <span class="stat-label">今日复习</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">{{ streak }}</span>
                <span class="stat-label">连续天数</span>
            </div>
        </div>
        
        <!-- 总体进度 -->
        <div class="overall-progress">
            <div class="progress-header">
                <span>总体掌握进度</span>
                <span class="progress-percent">{{ overallPercent }}%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" :style="{ width: overallPercent + '%' }"></div>
            </div>
        </div>
        
        <!-- 单词分布 -->
        <div class="word-distribution">
            <div class="dist-item new">
                <span class="dist-count">{{ distribution.new }}</span>
                <span class="dist-label">未学习</span>
            </div>
            <div class="dist-item learning">
                <span class="dist-count">{{ distribution.learning }}</span>
                <span class="dist-label">学习中</span>
            </div>
            <div class="dist-item mastered">
                <span class="dist-count">{{ distribution.mastered }}</span>
                <span class="dist-label">已掌握</span>
            </div>
        </div>
        
        <!-- 7天学习曲线 -->
        <div class="weekly-chart">
            <div class="chart-title">近7天学习量</div>
            <div class="chart-bars">
                <div 
                    v-for="(day, index) in weeklyData" 
                    :key="index"
                    class="chart-bar-wrapper"
                >
                    <div 
                        class="chart-bar" 
                        :style="{ height: getBarHeight(day.count) + 'px' }"
                        :title="`${day.date}: ${day.count}个单词`"
                    ></div>
                    <span class="chart-label">{{ day.label }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useVocabularyStore } from '../stores/vocabulary'

const store = useVocabularyStore()

// 学习记录存储
const studyRecords = ref([])

// 加载学习记录
onMounted(() => {
    const saved = localStorage.getItem('studyRecords')
    if (saved) {
        studyRecords.value = JSON.parse(saved)
    }
})

// 获取今日日期字符串
function getTodayStr() {
    return new Date().toISOString().slice(0, 10)
}

// 今日学习数
const todayLearned = computed(() => {
    const today = getTodayStr()
    return studyRecords.value.filter(r => 
        r.date === today && r.type === 'learn'
    ).length
})

// 今日复习数
const todayReviewed = computed(() => {
    const today = getTodayStr()
    return studyRecords.value.filter(r => 
        r.date === today && r.type === 'review'
    ).length
})

// 连续学习天数
const streak = computed(() => {
    const dates = [...new Set(studyRecords.value.map(r => r.date))].sort().reverse()
    if (dates.length === 0) return 0
    
    let count = 0
    const today = new Date()
    
    for (let i = 0; i < dates.length; i++) {
        const checkDate = new Date(today)
        checkDate.setDate(today.getDate() - i)
        const checkStr = checkDate.toISOString().slice(0, 10)
        
        if (dates.includes(checkStr)) {
            count++
        } else if (i > 0) {
            break
        }
    }
    
    return count
})

// 总体掌握进度
const overallPercent = computed(() => {
    if (store.wordCount === 0) return 0
    const mastered = store.vocabulary.filter(w => (w.mastery_level || 0) >= 80).length
    return Math.round((mastered / store.wordCount) * 100)
})

// 单词分布
const distribution = computed(() => {
    const words = store.vocabulary
    return {
        new: words.filter(w => !w.review_count || w.review_count === 0).length,
        learning: words.filter(w => w.review_count > 0 && (w.mastery_level || 0) < 80).length,
        mastered: words.filter(w => (w.mastery_level || 0) >= 80).length
    }
})

// 近7天数据
const weeklyData = computed(() => {
    const result = []
    const today = new Date()
    const dayNames = ['日', '一', '二', '三', '四', '五', '六']
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(today.getDate() - i)
        const dateStr = date.toISOString().slice(0, 10)
        const count = studyRecords.value.filter(r => r.date === dateStr).length
        
        result.push({
            date: dateStr,
            label: i === 0 ? '今' : dayNames[date.getDay()],
            count
        })
    }
    
    return result
})

// 计算柱状图高度
function getBarHeight(count) {
    const maxCount = Math.max(...weeklyData.value.map(d => d.count), 1)
    return Math.max((count / maxCount) * 60, 4)
}
</script>

<style scoped>
.progress-panel {
    background: linear-gradient(135deg, var(--sakura-300) 0%, var(--sakura-400) 100%);
    border-radius: 16px;
    padding: 20px;
    color: white;
    margin-bottom: 20px;
}

.progress-panel h3 {
    margin: 0 0 16px 0;
    font-size: 18px;
}

/* 今日统计 */
.today-stats {
    display: flex;
    justify-content: space-around;
    margin-bottom: 20px;
}

.stat-item {
    text-align: center;
}

.stat-value {
    display: block;
    font-size: 28px;
    font-weight: bold;
}

.stat-label {
    font-size: 12px;
    opacity: 0.8;
}

/* 总体进度 */
.overall-progress {
    margin-bottom: 20px;
}

.progress-header {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    margin-bottom: 8px;
}

.progress-percent {
    font-weight: bold;
}

.progress-bar {
    height: 8px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 4px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: white;
    border-radius: 4px;
    transition: width 0.3s ease;
}

/* 单词分布 */
.word-distribution {
    display: flex;
    justify-content: space-around;
    margin-bottom: 20px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
}

.dist-item {
    text-align: center;
}

.dist-count {
    display: block;
    font-size: 20px;
    font-weight: bold;
}

.dist-label {
    font-size: 11px;
    opacity: 0.8;
}

.dist-item.new .dist-count { color: #ffd43b; }
.dist-item.learning .dist-count { color: #4dabf7; }
.dist-item.mastered .dist-count { color: #69db7c; }

/* 7天图表 */
.weekly-chart {
    padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.chart-title {
    font-size: 12px;
    opacity: 0.8;
    margin-bottom: 12px;
}

.chart-bars {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    height: 80px;
}

.chart-bar-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
}

.chart-bar {
    width: 20px;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 4px 4px 0 0;
    transition: height 0.3s ease;
}

.chart-label {
    font-size: 11px;
    margin-top: 6px;
    opacity: 0.8;
}
</style>
