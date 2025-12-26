/**
 * 艾宾浩斯遗忘曲线复习算法
 * 基于 SM-2 算法简化版
 */

// 复习间隔（天数）：1, 2, 4, 7, 15, 30, 60, 120
const REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30, 60, 120]

/**
 * 计算下次复习时间
 * @param {number} reviewCount - 已复习次数
 * @param {boolean} remembered - 是否记住了
 * @returns {Date} 下次复习时间
 */
export function calculateNextReview(reviewCount, remembered) {
    let intervalIndex = reviewCount

    if (!remembered) {
        // 如果没记住，重置到第一个间隔
        intervalIndex = 0
    } else {
        // 记住了，进入下一个间隔
        intervalIndex = Math.min(reviewCount, REVIEW_INTERVALS.length - 1)
    }

    const days = REVIEW_INTERVALS[intervalIndex]
    const nextDate = new Date()
    nextDate.setDate(nextDate.getDate() + days)
    nextDate.setHours(0, 0, 0, 0)

    return nextDate
}

/**
 * 判断单词是否需要复习
 * @param {object} word - 单词对象
 * @returns {boolean} 是否需要复习
 */
export function needsReview(word) {
    if (!word.nextReviewDate) return false

    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const reviewDate = new Date(word.nextReviewDate)
    reviewDate.setHours(0, 0, 0, 0)

    return reviewDate <= now
}

/**
 * 获取待复习单词列表
 * @param {Array} vocabulary - 单词列表
 * @returns {Array} 待复习单词
 */
export function getWordsToReview(vocabulary) {
    return vocabulary.filter(word => needsReview(word))
}

/**
 * 计算复习统计
 * @param {Array} vocabulary - 单词列表
 * @returns {object} 统计数据
 */
export function getReviewStats(vocabulary) {
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    let dueToday = 0
    let dueTomorrow = 0
    let dueThisWeek = 0
    let mastered = 0 // 已完成所有复习阶段

    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const weekEnd = new Date(now)
    weekEnd.setDate(weekEnd.getDate() + 7)

    vocabulary.forEach(word => {
        if (!word.nextReviewDate) return

        const reviewDate = new Date(word.nextReviewDate)
        reviewDate.setHours(0, 0, 0, 0)

        // 检查是否已完成所有复习阶段
        if ((word.reviewCount || 0) >= REVIEW_INTERVALS.length) {
            mastered++
            return
        }

        if (reviewDate <= now) {
            dueToday++
        } else if (reviewDate <= tomorrow) {
            dueTomorrow++
        } else if (reviewDate <= weekEnd) {
            dueThisWeek++
        }
    })

    return { dueToday, dueTomorrow, dueThisWeek, mastered }
}

/**
 * 更新单词的复习状态
 * @param {object} word - 单词对象
 * @param {boolean} remembered - 是否记住
 * @returns {object} 更新后的单词
 */
export function updateWordReview(word, remembered) {
    const reviewCount = remembered ? (word.reviewCount || 0) + 1 : 0
    const nextReviewDate = calculateNextReview(reviewCount, remembered)

    return {
        ...word,
        reviewCount,
        nextReviewDate: nextReviewDate.toISOString(),
        lastReviewDate: new Date().toISOString(),
        mastery_level: Math.min(100, (reviewCount / REVIEW_INTERVALS.length) * 100)
    }
}

/**
 * 初始化单词的复习状态（添加新词时调用）
 * @param {object} word - 单词对象
 * @returns {object} 带复习状态的单词
 */
export function initWordReview(word) {
    if (word.nextReviewDate) return word

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    return {
        ...word,
        reviewCount: 0,
        nextReviewDate: tomorrow.toISOString(),
        lastReviewDate: null
    }
}
