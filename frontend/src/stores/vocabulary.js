import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { wordsApi } from '../composables/useApi'

export const useVocabularyStore = defineStore('vocabulary', () => {
    // 状态
    const vocabulary = ref([])
    const currentIndex = ref(0)
    const wrongQuestions = ref([])
    const isLoading = ref(false)

    // 计算属性
    const currentWord = computed(() => {
        if (vocabulary.value.length === 0) return null
        return vocabulary.value[currentIndex.value]
    })

    const wordCount = computed(() => vocabulary.value.length)

    const wrongCount = computed(() => wrongQuestions.value.length)

    // 检查是否已登录
    function isLoggedIn() {
        return !!localStorage.getItem('token')
    }

    // 方法
    async function loadVocabulary() {
        isLoading.value = true
        try {
            if (isLoggedIn()) {
                // 登录用户：从后端加载
                const dbWords = await wordsApi.getAll()

                // 检查是否有 LocalStorage 中未同步的单词
                const localWords = localStorage.getItem('vocabulary')
                if (localWords) {
                    const localData = JSON.parse(localWords)
                    if (Array.isArray(localData) && localData.length > 0) {
                        // 找出数据库中没有的单词
                        const dbWordSet = new Set((dbWords || []).map(w => (w.headWord || '').toLowerCase()))
                        const unsyncedWords = localData.filter(w => !dbWordSet.has((w.headWord || '').toLowerCase()))

                        if (unsyncedWords.length > 0) {
                            console.log(`发现 ${unsyncedWords.length} 个未同步的单词，正在同步...`)
                            // 后台同步未上传的单词
                            syncWordsToDatabase(unsyncedWords).then(count => {
                                if (count > 0) {
                                    console.log(`成功同步 ${count} 个单词到数据库`)
                                    // 同步完成后清空 LocalStorage
                                    localStorage.removeItem('vocabulary')
                                    // 重新加载
                                    loadVocabulary()
                                }
                            })
                        } else {
                            // 所有单词都已同步，清空 LocalStorage
                            localStorage.removeItem('vocabulary')
                        }
                    }
                }

                vocabulary.value = dbWords || []
            } else {
                // 游客用户：从 localStorage 加载
                const stored = localStorage.getItem('vocabulary')
                vocabulary.value = stored ? JSON.parse(stored) : []
            }

            // 加载错题本（始终从 localStorage）
            const storedWrong = localStorage.getItem('wrongQuestions')
            if (storedWrong) {
                wrongQuestions.value = JSON.parse(storedWrong) || []
            }
        } catch (e) {
            console.error('Load vocabulary error:', e)
            // 降级到 localStorage（仅在网络错误时）
            if (!isLoggedIn()) {
                const stored = localStorage.getItem('vocabulary')
                vocabulary.value = stored ? JSON.parse(stored) : []
            }
        } finally {
            isLoading.value = false
        }
    }

    // 后台同步单词到数据库
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
                // 单词已存在，跳过
            }
        }
        return syncedCount
    }

    function saveVocabularyLocal() {
        localStorage.setItem('vocabulary', JSON.stringify(vocabulary.value))
    }

    async function addWord(word) {
        // 检查是否已存在
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
            // 游客用户：保存到 localStorage
            const newWord = {
                ...word,
                id: Date.now(),
                createdAt: new Date().toISOString()
            }
            vocabulary.value.push(newWord)
            saveVocabularyLocal()
            currentIndex.value = vocabulary.value.length - 1
        }
    }

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

        if (vocabulary.value.length === 0) {
            currentIndex.value = 0
        } else {
            currentIndex.value = Math.min(currentIndex.value, vocabulary.value.length - 1)
        }
    }

    function nextWord() {
        if (vocabulary.value.length > 0) {
            currentIndex.value = (currentIndex.value + 1) % vocabulary.value.length
        }
    }

    function prevWord() {
        if (vocabulary.value.length > 0) {
            currentIndex.value = (currentIndex.value - 1 + vocabulary.value.length) % vocabulary.value.length
        }
    }

    function exportVocabulary() {
        const payload = {
            version: 1,
            exportedAt: new Date().toISOString(),
            words: vocabulary.value
        }
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `vocabulary-${new Date().toISOString().slice(0, 10)}.json`
        a.click()
        URL.revokeObjectURL(url)
    }

    async function importVocabulary(data) {
        const list = Array.isArray(data) ? data : Array.isArray(data.words) ? data.words : []
        if (list.length === 0) {
            throw new Error('文件中未找到词库数据')
        }

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
            // 登录用户：逐个添加到后端
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
            // 游客用户：合并到 localStorage
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

    // 错题本相关
    function addWrongQuestion(question) {
        wrongQuestions.value.push({
            ...question,
            timestamp: new Date().toISOString()
        })
        localStorage.setItem('wrongQuestions', JSON.stringify(wrongQuestions.value))
    }

    function clearWrongQuestions() {
        wrongQuestions.value = []
        localStorage.removeItem('wrongQuestions')
    }

    function getWrongWordsSet() {
        return new Set(wrongQuestions.value.map(q => q.word))
    }

    // 记录学习（更新本地掌握度 + 登录用户同步到后端）
    async function recordStudy(wordId, isCorrect, timeSpent = 0) {
        // 更新本地词库的掌握程度
        const wordIndex = vocabulary.value.findIndex(w => w.id === wordId)
        if (wordIndex !== -1) {
            const word = vocabulary.value[wordIndex]
            const currentMastery = word.mastery_level || 0

            if (isCorrect) {
                word.mastery_level = Math.min(100, currentMastery + 5)
                word.correct_count = (word.correct_count || 0) + 1
            } else {
                word.mastery_level = Math.max(0, currentMastery - 3)
                word.wrong_count = (word.wrong_count || 0) + 1
            }
            word.review_count = (word.review_count || 0) + 1

            // 游客用户保存到 localStorage
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

    return {
        // 状态
        vocabulary,
        currentIndex,
        wrongQuestions,
        isLoading,
        // 计算属性
        currentWord,
        wordCount,
        wrongCount,
        // 方法
        isLoggedIn,
        loadVocabulary,
        saveVocabularyLocal,
        addWord,
        deleteWord,
        nextWord,
        prevWord,
        exportVocabulary,
        importVocabulary,
        addWrongQuestion,
        clearWrongQuestions,
        getWrongWordsSet,
        recordStudy
    }
})
