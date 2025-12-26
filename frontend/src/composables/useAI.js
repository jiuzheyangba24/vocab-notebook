// AI API 服务 - 使用 DashScope (通义千问) API
const API_KEY = 'sk-01641e0fd0564b098ccf251ad74918ff'
const API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'

// 系统提示词
const SYSTEM_PROMPT = `你是一个专业的英语词汇学习助手。你的主要功能包括：
1. 解释英语单词的含义、用法、例句
2. 帮助用户制定背诵计划
3. 提供学习建议和技巧
4. 回答英语学习相关问题

请用简洁友好的中文回答用户问题。如果用户询问单词，请提供：
- 音标
- 中文释义
- 词性
- 例句（中英对照）
- 相关词汇`

/**
 * 发送消息给 AI
 * @param {Array} messages - 消息历史 [{role: 'user'|'assistant', content: string}]
 * @returns {Promise<string>} AI 的回复
 */
export async function sendMessage(messages) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'qwen-turbo',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    ...messages
                ],
                temperature: 0.7,
                max_tokens: 1000
            })
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || '请求失败')
        }

        const data = await response.json()
        return data.choices[0].message.content
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
    const messages = [
        { role: 'user', content: `请详细解释单词 "${word}" 的含义和用法` }
    ]
    return sendMessage(messages)
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
