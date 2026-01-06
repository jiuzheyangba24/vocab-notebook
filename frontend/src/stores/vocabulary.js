/**
 * ============================================
 * Pinia 状态管理 - 词汇数据 Store
 * ============================================
 * 
 * Pinia 是 Vue 3 官方推荐的状态管理库，用于：
 * 1. 在多个组件间共享数据
 * 2. 集中管理应用状态
 * 3. 提供响应式数据
 * 
 * 本 Store 管理：
 * - vocabulary: 用户的单词列表
 * - wrongQuestions: 错题本
 * - currentIndex: 当前学习的单词索引
 * 
 * 数据来源：
 * - 登录用户：从后端 API 加载
 * - 游客用户：从 LocalStorage 加载
 */

import { defineStore } from 'pinia'       // Pinia 核心函数
import { ref, computed } from 'vue'        // Vue 响应式 API
import { wordsApi } from '../composables/useApi'  // 后端 API 封装

// ============================================
// 定义 Store
// ============================================
/**
 * useVocabularyStore - 词汇管理 Store
 * 
 * 使用 Composition API 风格定义
 * 
 * 用法示例：
 * import { useVocabularyStore } from '@/stores/vocabulary'
 * const store = useVocabularyStore()
 * await store.loadVocabulary()
 * console.log(store.wordCount)
 */
export const useVocabularyStore = defineStore('vocabulary', () => {

    // ============================================
    // 1. 响应式状态 (State)
    // ============================================

    // 单词列表 - 用户所有的单词
    const vocabulary = ref([])

    // 当前单词索引 - 用于翻页浏览
    const currentIndex = ref(0)

    // 错题本 - 用户答错的单词
    const wrongQuestions = ref([])

    // 加载状态 - 用于显示加载动画
    const isLoading = ref(false)

    // ============================================
    // 2. 计算属性 (Getters)
    // ============================================

    /**
     * 当前单词 - 基于 currentIndex 获取
     */
    const currentWord = computed(() => {
        if (vocabulary.value.length === 0) return null
        return vocabulary.value[currentIndex.value]
    })

    /**
     * 单词总数
     */
    const wordCount = computed(() => vocabulary.value.length)

    /**
     * 错题数量
     */
    const wrongCount = computed(() => wrongQuestions.value.length)

    // ============================================
    // 3. 辅助函数
    // ============================================

    /**
     * 检查用户是否已登录
     * 依据：LocalStorage 中是否有 JWT Token
     */
    function isLoggedIn() {
        return !!localStorage.getItem('token')
    }

    // ============================================
    // 4. 核心方法 (Actions)
    // ============================================

    /**
     * 加载词汇数据
     * 
     * 这是最重要的方法，在应用启动时调用
     * 
     * 流程：
     * 1. 判断是否登录
     * 2. 登录用户：从后端 API 获取数据
     * 3. 游客用户：从 LocalStorage 获取数据
     * 4. 如果发现本地有未同步的数据，后台同步到服务器
     */
    async function loadVocabulary() {
        isLoading.value = true
        try {
            if (isLoggedIn()) {
                // ======== 登录用户 ========
                // 从后端 API 加载单词列表
                const dbWords = await wordsApi.getAll()

                // 检查 LocalStorage 中是否有未同步的单词（用户之前是游客，现在登录了）
                const localWords = localStorage.getItem('vocabulary')
                if (localWords) {
                    const localData = JSON.parse(localWords)
                    if (Array.isArray(localData) && localData.length > 0) {
                        // 找出数据库中没有的单词
                        const dbWordSet = new Set((dbWords || []).map(w => (w.headWord || '').toLowerCase()))
                        const unsyncedWords = localData.filter(w => !dbWordSet.has((w.headWord || '').toLowerCase()))

                        if (unsyncedWords.length > 0) {
                            console.log(`发现 ${unsyncedWords.length} 个未同步的单词，正在同步...`)
                            // 后台异步同步单词到数据库
                            syncWordsToDatabase(unsyncedWords).then(count => {
                                if (count > 0) {
                                    console.log(`成功同步 ${count} 个单词到数据库`)
                                    localStorage.removeItem('vocabulary')  // 清空本地缓存
                                    loadVocabulary()  // 重新加载
                                }
                            })
                        } else {
                            localStorage.removeItem('vocabulary')
                        }
                    }
                }

                vocabulary.value = dbWords || []
            } else {
                // ======== 游客用户 ========
                // 从 LocalStorage 加载
                const stored = localStorage.getItem('vocabulary')
                vocabulary.value = stored ? JSON.parse(stored) : []
            }

            // 加载错题本（所有用户都从 LocalStorage 加载）
            const storedWrong = localStorage.getItem('wrongQuestions')
            if (storedWrong) {
                wrongQuestions.value = JSON.parse(storedWrong) || []
            }
        } catch (e) {
            console.error('Load vocabulary error:', e)
            // 网络错误时降级到 LocalStorage
            if (!isLoggedIn()) {
                const stored = localStorage.getItem('vocabulary')
                vocabulary.value = stored ? JSON.parse(stored) : []
            }
        } finally {
            isLoading.value = false
        }
    }

    /**
     * 后台同步单词到数据库
     * 
     * 用途：当游客登录后，将之前保存在本地的单词同步到服务器
     * 
     * @param {Array} words - 需要同步的单词数组
     * @returns {Promise<number>} 成功同步的数量
     */
    async function syncWordsToDatabase(words) {
        let syncedCount = 0
        for (const word of words) {
            try {
                await wordsApi.add({
                    headWord: word.headWord,
                    definition: word.definition,
                    pronunciation: word.pronunciation || '',
                    sentences: word.sentences || []
                })
                syncedCount++
            } catch (e) {
                // 单词已存在或其他错误，跳过
            }
        }
        return syncedCount
    }

    /**
     * 保存词汇到 LocalStorage
     * 仅供游客用户使用
     */
    function saveVocabularyLocal() {
        localStorage.setItem('vocabulary', JSON.stringify(vocabulary.value))
    }

    /**
     * 添加新单词
     * 
     * @param {Object} word - 单词对象 { headWord, definition, pronunciation, sentences }
     * @throws {Error} 如果单词已存在
     * 
     * 流程：
     * 1. 检查单词是否已存在
     * 2. 登录用户：调用后端 API
     * 3. 游客用户：保存到 LocalStorage
     */
    async function addWord(word) {
        // 检查重复
        const exists = vocabulary.value.some(
            w => (w.headWord || '').toLowerCase() === word.headWord.toLowerCase()
        )
        if (exists) {
            throw new Error('该单词已存在')
        }

        if (isLoggedIn()) {
            // 登录用户：调用后端 API
            try {
                const newWord = await wordsApi.add(word)
                vocabulary.value.push(newWord)
                currentIndex.value = vocabulary.value.length - 1
            } catch (error) {
                const message = error.response?.data?.error || '添加单词失败'
                throw new Error(message)
            }
        } else {
            // 游客用户：保存到 LocalStorage
            const newWord = {
                ...word,
                id: Date.now(),  // 使用时间戳作为临时 ID
                createdAt: new Date().toISOString()
            }
            vocabulary.value.push(newWord)
            saveVocabularyLocal()
            currentIndex.value = vocabulary.value.length - 1
        }
    }

    /**
     * 删除当前单词
     * 
     * 采用软删除策略（后端标记为已删除，前端从列表移除）
     */
    async function deleteWord() {
        if (vocabulary.value.length === 0) return

        const wordToDelete = vocabulary.value[currentIndex.value]

        if (isLoggedIn() && wordToDelete.id) {
            // 登录用户：调用后端 API
            try {
                await wordsApi.delete(wordToDelete.id)
            } catch (error) {
                console.error('Delete word error:', error)
                throw new Error('删除单词失败')
            }
        }

        // 从本地列表移除
        vocabulary.value.splice(currentIndex.value, 1)

        if (!isLoggedIn()) {
            saveVocabularyLocal()
        }

        // 调整当前索引
        if (vocabulary.value.length === 0) {
            currentIndex.value = 0
        } else {
            currentIndex.value = Math.min(currentIndex.value, vocabulary.value.length - 1)
        }
    }

    /**
     * 切换到下一个单词
     * 循环浏览（到达末尾回到开头）
     */
    function nextWord() {
        if (vocabulary.value.length > 0) {
            currentIndex.value = (currentIndex.value + 1) % vocabulary.value.length
        }
    }

    /**
     * 切换到上一个单词
     * 循环浏览（到达开头跳到末尾）
     */
    function prevWord() {
        if (vocabulary.value.length > 0) {
            currentIndex.value = (currentIndex.value - 1 + vocabulary.value.length) % vocabulary.value.length
        }
    }

    /**
     * 导出词库为 JSON 文件
     * 
     * 生成一个 JSON 文件并触发浏览器下载
     */
    function exportVocabulary() {
        const payload = {
            version: 1,
            exportedAt: new Date().toISOString(),
            words: vocabulary.value
        }
        // 创建 Blob 对象
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)

        // 创建临时下载链接并触发点击
        const a = document.createElement('a')
        a.href = url
        a.download = `vocabulary-${new Date().toISOString().slice(0, 10)}.json`
        a.click()

        // 清理 URL 对象
        URL.revokeObjectURL(url)
    }

    /**
     * 导入词库
     * 
     * @param {Object|Array} data - 导入的数据（可以是数组或包含 words 字段的对象）
     * @returns {Promise<number>} 导入后的总单词数
     * 
     * 支持格式：
     * 1. 直接数组：[{ headWord, definition, ... }]
     * 2. 包装对象：{ words: [...] }
     */
    async function importVocabulary(data) {
        // 标准化输入数据
        const list = Array.isArray(data) ? data : Array.isArray(data.words) ? data.words : []
        if (list.length === 0) {
            throw new Error('文件中未找到词库数据')
        }

        // 格式化每个单词
        const normalized = list
            .filter(w => w && typeof w.headWord === 'string' && w.headWord.trim() !== '')
            .map(w => ({
                id: w.id ?? Date.now() + Math.floor(Math.random() * 1000),
                headWord: w.headWord,
                pronunciation: w.pronunciation || '',
                definition: w.definition || '',
                sentences: Array.isArray(w.sentences) ? w.sentences : [],
                synonyms: Array.isArray(w.synonyms) ? w.synonyms : [],
                createdAt: w.createdAt || new Date().toISOString()
            }))

        if (isLoggedIn()) {
            // 登录用户：逐个添加到后端（跳过已存在的）
            let addedCount = 0
            for (const word of normalized) {
                const exists = vocabulary.value.some(
                    w => (w.headWord || '').toLowerCase() === word.headWord.toLowerCase()
                )
                if (!exists) {
                    try {
                        const newWord = await wordsApi.add(word)
                        vocabulary.value.push(newWord)
                        addedCount++
                    } catch (e) {
                        console.warn(`Failed to add word: ${word.headWord}`, e)
                    }
                }
            }
            return vocabulary.value.length
        } else {
            // 游客用户：合并到本地（去重）
            const map = new Map(vocabulary.value.map(w => [String(w.headWord).toLowerCase(), w]))
            normalized.forEach(w => {
                const k = w.headWord.toLowerCase()
                if (!map.has(k)) map.set(k, w)
            })

            vocabulary.value = Array.from(map.values())
            saveVocabularyLocal()
            currentIndex.value = Math.min(currentIndex.value, Math.max(0, vocabulary.value.length - 1))

            return vocabulary.value.length
        }
    }

    // ============================================
    // 5. 错题本相关方法
    // ============================================

    /**
     * 添加错题
     * @param {Object} question - 错题信息
     */
    function addWrongQuestion(question) {
        wrongQuestions.value.push({
            ...question,
            timestamp: new Date().toISOString()
        })
        localStorage.setItem('wrongQuestions', JSON.stringify(wrongQuestions.value))
    }

    /**
     * 清空错题本
     */
    function clearWrongQuestions() {
        wrongQuestions.value = []
        localStorage.removeItem('wrongQuestions')
    }

    /**
     * 获取错题单词集合（用于快速查找）
     */
    function getWrongWordsSet() {
        return new Set(wrongQuestions.value.map(q => q.word))
    }

    // ============================================
    // 6. 学习记录
    // ============================================

    /**
     * 记录学习结果
     * 
     * @param {number} wordId - 单词 ID
     * @param {boolean} isCorrect - 是否答对
     * @param {number} timeSpent - 用时（秒）
     * 
     * 功能：
     * 1. 更新本地单词的掌握度
     * 2. 登录用户同步记录到后端
     */
    async function recordStudy(wordId, isCorrect, timeSpent = 0) {
        // 更新本地词库的掌握程度
        const wordIndex = vocabulary.value.findIndex(w => w.id === wordId)
        if (wordIndex !== -1) {
            const word = vocabulary.value[wordIndex]
            const currentMastery = word.mastery_level || 0

            if (isCorrect) {
                // 答对：提升掌握度 +5（最高100）
                word.mastery_level = Math.min(100, currentMastery + 5)
                word.correct_count = (word.correct_count || 0) + 1
            } else {
                // 答错：降低掌握度 -3（最低0）
                word.mastery_level = Math.max(0, currentMastery - 3)
                word.wrong_count = (word.wrong_count || 0) + 1
            }
            word.review_count = (word.review_count || 0) + 1

            // 游客用户保存到 LocalStorage
            if (!isLoggedIn()) {
                saveVocabularyLocal()
            }
        }

        // 登录用户同步到后端
        if (isLoggedIn() && wordId) {
            try {
                await wordsApi.study(wordId, { isCorrect, timeSpent })
            } catch (e) {
                console.warn('Failed to record study:', e)
            }
        }
    }

    // ============================================
    // 7. 导出 Store 接口
    // ============================================
    return {
        // 状态
        vocabulary,         // 单词列表
        currentIndex,       // 当前索引
        wrongQuestions,     // 错题本
        isLoading,          // 加载状态

        // 计算属性
        currentWord,        // 当前单词
        wordCount,          // 单词总数
        wrongCount,         // 错题数量

        // 方法
        isLoggedIn,         // 检查登录状态
        loadVocabulary,     // 加载词汇
        saveVocabularyLocal, // 保存到本地
        addWord,            // 添加单词
        deleteWord,         // 删除单词
        nextWord,           // 下一个
        prevWord,           // 上一个
        exportVocabulary,   // 导出
        importVocabulary,   // 导入
        addWrongQuestion,   // 添加错题
        clearWrongQuestions, // 清空错题
        getWrongWordsSet,   // 获取错题集合
        recordStudy         // 记录学习
    }
})
