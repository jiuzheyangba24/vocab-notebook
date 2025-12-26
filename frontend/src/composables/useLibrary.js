import { ref } from 'vue'
import librariesData from '../data/libraries.json'

// 词库列表
export const libraries = librariesData.libraries

// 加载状态
const loadingLibrary = ref(null)
const loadingProgress = ref(0)
const importedLibraries = ref(new Set())

// 从 localStorage 恢复已导入的词库记录
function loadImportedLibraries() {
    const saved = localStorage.getItem('importedLibraries')
    if (saved) {
        try {
            const arr = JSON.parse(saved)
            importedLibraries.value = new Set(arr)
        } catch (e) {
            console.error('Failed to load imported libraries', e)
        }
    }
}

// 保存已导入的词库记录
function saveImportedLibraries() {
    localStorage.setItem('importedLibraries', JSON.stringify([...importedLibraries.value]))
}

// 初始化
loadImportedLibraries()

/**
 * 获取词库的词数（优先从缓存，否则下载）
 * @param {string} libraryId 词库ID
 * @returns {Promise<number>} 词数
 */
export async function fetchLibraryWordCount(libraryId) {
    const cacheKey = `library_cache_${libraryId}`
    const countCacheKey = `library_count_${libraryId}`

    // 首先检查是否有缓存的词数
    const cachedCount = localStorage.getItem(countCacheKey)
    if (cachedCount) {
        return parseInt(cachedCount, 10)
    }

    // 检查完整的词库缓存
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
        try {
            const data = JSON.parse(cached)
            if (Array.isArray(data)) {
                // 同时缓存词数
                localStorage.setItem(countCacheKey, data.length.toString())
                return data.length
            }
        } catch (e) {
            console.warn('Failed to parse cache for', libraryId)
        }
    }

    // 没有缓存，需要下载词库
    const library = libraries.find(lib => lib.id === libraryId)
    if (!library) return 0

    try {
        const response = await fetch(library.url)
        if (!response.ok) return library.wordCount

        const data = await response.json()
        if (Array.isArray(data)) {
            const count = data.length
            // 先缓存词数（这个很小，肯定能存）
            localStorage.setItem(countCacheKey, count.toString())

            // 尝试缓存完整数据，如果失败（空间不足）就跳过
            try {
                localStorage.setItem(cacheKey, JSON.stringify(data))
            } catch (storageError) {
                console.warn('Storage full, skipping full cache for', libraryId)
            }
            return count
        }
        return library.wordCount
    } catch (e) {
        console.warn('Failed to fetch word count for', libraryId)
        return library.wordCount
    }
}

/**
 * 下载并解析词库数据
 * @param {string} libraryId 词库ID
 * @returns {Promise<Array>} 词汇数组
 */
export async function fetchLibraryWords(libraryId) {
    const library = libraries.find(lib => lib.id === libraryId)
    if (!library) {
        throw new Error('词库不存在')
    }

    loadingLibrary.value = libraryId
    loadingProgress.value = 0

    try {
        const response = await fetch(library.url)
        if (!response.ok) {
            throw new Error('下载词库失败')
        }

        loadingProgress.value = 50

        const data = await response.json()
        loadingProgress.value = 80

        // 转换数据格式
        const words = transformLibraryData(data, libraryId)
        loadingProgress.value = 100

        return words
    } finally {
        loadingLibrary.value = null
        loadingProgress.value = 0
    }
}

/**
 * 将 GitHub 词库格式转换为应用内部格式
 */
function transformLibraryData(data, libraryId) {
    if (!Array.isArray(data)) {
        return []
    }

    return data.map(item => {
        // 构建释义字符串
        let definition = ''
        if (item.translations && Array.isArray(item.translations)) {
            definition = item.translations
                .map(t => `${t.type ? t.type + '. ' : ''}${t.translation}`)
                .join('; ')
        }

        // 构建例句/短语
        const sentences = []
        if (item.phrases && Array.isArray(item.phrases)) {
            item.phrases.slice(0, 3).forEach(p => {
                sentences.push(`${p.phrase} - ${p.translation}`)
            })
        }

        return {
            headWord: item.word,
            pronunciation: item.phonetic || item.usphone || item.ukphone || '',
            definition: definition,
            sentences: sentences,
            source: `library:${libraryId}`,
            mastery_level: 0
        }
    })
}

/**
 * 从 Free Dictionary API 获取单词音标
 * @param {string} word 单词
 * @returns {Promise<string>} 音标
 */
export async function fetchPhonetic(word) {
    try {
        const cacheKey = `phonetic_${word.toLowerCase()}`
        const cached = localStorage.getItem(cacheKey)
        if (cached) {
            return cached
        }

        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)
        if (!response.ok) {
            return ''
        }

        const data = await response.json()
        if (data && data[0] && data[0].phonetic) {
            const phonetic = data[0].phonetic
            localStorage.setItem(cacheKey, phonetic)
            return phonetic
        }

        // 尝试从 phonetics 数组获取
        if (data && data[0] && data[0].phonetics) {
            for (const p of data[0].phonetics) {
                if (p.text) {
                    localStorage.setItem(cacheKey, p.text)
                    return p.text
                }
            }
        }

        return ''
    } catch (e) {
        console.warn(`Failed to fetch phonetic for ${word}`, e)
        return ''
    }
}

/**
 * 导入词库到用户词汇表
 * @param {Array} words 词汇数组
 * @param {Object} store Pinia store
 * @param {string} libraryId 词库ID
 * @returns {Object} { added, skipped }
 */
export async function importLibraryWords(words, store, libraryId) {
    let added = 0
    let skipped = 0

    // 获取现有单词集合（用于快速查重）
    const existingWords = new Set(
        store.vocabulary.map(w => w.headWord.toLowerCase())
    )

    // 批量添加（只添加不存在的单词）
    const newWords = words.filter(word => {
        if (existingWords.has(word.headWord.toLowerCase())) {
            skipped++
            return false
        }
        return true
    })

    // 分批添加避免阻塞
    const batchSize = 100
    for (let i = 0; i < newWords.length; i += batchSize) {
        const batch = newWords.slice(i, i + batchSize)

        for (const word of batch) {
            try {
                // 直接添加到本地（不调用 API 获取更多信息）
                const newWord = {
                    ...word,
                    id: Date.now() + Math.random(),
                    createdAt: new Date().toISOString()
                }
                store.vocabulary.push(newWord)
                added++
            } catch (e) {
                console.warn(`Failed to add word: ${word.headWord}`, e)
            }
        }

        // 每批处理后保存并更新进度
        if (!store.isLoggedIn()) {
            store.saveVocabularyLocal()
        }
    }

    // 记录已导入的词库
    importedLibraries.value.add(libraryId)
    saveImportedLibraries()

    return { added, skipped }
}

/**
 * 检查词库是否已导入
 */
export function isLibraryImported(libraryId) {
    return importedLibraries.value.has(libraryId)
}

/**
 * 获取加载状态
 */
export function useLibraryState() {
    return {
        loadingLibrary,
        loadingProgress,
        importedLibraries
    }
}
