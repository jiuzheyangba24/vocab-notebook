// AI API 服务 - 通过后端代理调用
// ============================================
// 所有 AI 请求都通过自己的后端 API 进行
// 后端会代理调用通义千问服务
// ============================================

/**
 * 发送消息给 AI
 * @param {Array} messages - 消息历史 [{role: 'user'|'assistant', content: string}]
 * @returns {Promise<string>} AI 的回复
 */
export async function sendMessage(messages) {
    try {
        const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages })
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || '请求失败')
        }

        const data = await response.json()
        return data.reply
    } catch (error) {
        console.error('AI API Error:', error)
        throw new Error('AI 服务暂时不可用，请稍后重试')
    }
}

/**
 * 查询单词详情
 * @param {string} word - 要查询的单词
 * @returns {Promise<string>} 单词解释
 */
export async function lookupWord(word) {
    try {
        const response = await fetch('/api/ai/lookup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ word })
        })

        if (!response.ok) {
            throw new Error('查询失败')
        }

        const data = await response.json()
        return data.explanation
    } catch (error) {
        console.error('AI Lookup Error:', error)
        throw new Error('AI 服务暂时不可用，请稍后重试')
    }
}

/**
 * 生成背诵计划
 * @param {number} wordCount - 要背诵的单词数量
 * @param {number} days - 计划天数
 * @returns {Promise<string>} 背诵计划
 */
export async function generateStudyPlan(wordCount, days) {
    const messages = [
        {
            role: 'user',
            content: `我有 ${wordCount} 个单词需要背诵，希望在 ${days} 天内完成。请帮我制定一个合理的背诵计划，包括每日任务和复习安排。`
        }
    ]
    return sendMessage(messages)
}

/**
 * 获取学习建议
 * @param {object} stats - 学习统计数据
 * @returns {Promise<string>} 学习建议
 */
export async function getLearningAdvice(stats) {
    const messages = [
        {
            role: 'user',
            content: `根据我的学习数据，请给我一些建议：
- 已学单词：${stats.totalWords} 个
- 掌握率：${stats.masteryRate}%
- 错题数：${stats.wrongCount} 个
- 连续打卡：${stats.streakDays} 天`
        }
    ]
    return sendMessage(messages)
}

