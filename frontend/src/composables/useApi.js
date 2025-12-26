import axios from 'axios'

// 创建 axios 实例
const api = axios.create({
    baseURL: '/api',
    timeout: 10000
})

// 请求拦截器
api.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    error => Promise.reject(error)
)

// 响应拦截器
api.interceptors.response.use(
    response => response.data,
    error => {
        console.error('API Error:', error)
        return Promise.reject(error)
    }
)

/**
 * 从外部 API 获取单词信息
 * @param {string} word - 要查询的单词
 * @returns {Promise<object>} 单词数据
 */
export async function fetchWordInfo(word) {
    try {
        const response = await fetch(`https://v2.xxapi.cn/api/englishwords?word=${encodeURIComponent(word)}`)
        const data = await response.json()

        if (data.code === 200 && data.data && data.data.word) {
            const wordData = data.data
            return {
                headWord: wordData.word,
                pronunciation: wordData.ukphone || wordData.usphone || '',
                definition: wordData.translations?.[0]?.tran_cn || '无释义',
                sentences: wordData.sentences?.map(s => `${s.s_content} - ${s.s_cn}`) || [],
                synonyms: wordData.synonyms?.flatMap(s => s.Hwds.map(h => h.word)) || []
            }
        }
        throw new Error('未找到该单词')
    } catch (error) {
        console.error('Fetch word info error:', error)
        throw error
    }
}

/**
 * 认证相关 API
 */
export const authApi = {
    login: (username, password) => api.post('/auth/login', { username, password }),
    register: (data) => api.post('/auth/register', data),
    logout: () => api.post('/auth/logout'),
    getMe: () => api.get('/auth/me')
}

/**
 * 单词相关 API
 */
export const wordsApi = {
    getAll: () => api.get('/words'),
    add: (word) => api.post('/words', word),
    delete: (id) => api.delete(`/words/${id}`),
    getCount: () => api.get('/words/count'),
    study: (id, data) => api.post(`/words/${id}/study`, data)
}

/**
 * 统计相关 API
 */
export const statsApi = {
    get: () => api.get('/stats'),
    health: () => api.get('/health')
}

export default api
