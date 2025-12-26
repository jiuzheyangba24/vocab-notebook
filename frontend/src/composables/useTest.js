import { ref, computed } from 'vue'
import { useVocabularyStore } from '../stores/vocabulary'

export function useTest() {
    const store = useVocabularyStore()

    // 测试状态
    const isTestMode = ref(false)
    const testMode = ref('en-to-cn') // en-to-cn, cn-to-en, fill-blank, spelling
    const useWrongOnly = ref(false)
    const testQuantity = ref(10)

    const currentQuestion = ref(null)
    const currentOptions = ref([])
    const testedWords = ref([])
    const score = ref(0)
    const currentQuestionNumber = ref(0)
    const totalQuestions = ref(0)

    const showResult = ref(false)
    const isCorrect = ref(false)
    const correctAnswer = ref('')
    const testFinished = ref(false)

    // 计算属性
    const accuracy = computed(() => {
        if (totalQuestions.value === 0) return 0
        return ((score.value / totalQuestions.value) * 100).toFixed(1)
    })

    // 开始测试
    function startTest() {
        const vocabulary = store.vocabulary

        if (vocabulary.length < 4) {
            throw new Error('至少需要4个单词才能开始测试')
        }

        let pool = vocabulary
        if (useWrongOnly.value) {
            const wrongSet = store.getWrongWordsSet()
            pool = vocabulary.filter(w => wrongSet.has(w.headWord))

            if (pool.length < 4) {
                throw new Error('错题本单词不足4个，无法进行错题测试')
            }
        }

        isTestMode.value = true
        score.value = 0
        testedWords.value = []
        currentQuestionNumber.value = 0
        totalQuestions.value = Math.min(testQuantity.value, pool.length)
        testFinished.value = false
        showResult.value = false

        generateQuestion()
    }

    // 生成题目
    function generateQuestion() {
        const vocabulary = store.vocabulary

        let pool = vocabulary
        if (useWrongOnly.value) {
            const wrongSet = store.getWrongWordsSet()
            pool = vocabulary.filter(w => wrongSet.has(w.headWord))
        }

        const available = pool.filter(w => !testedWords.value.includes(w.headWord))

        if (available.length === 0) {
            finishTest()
            return
        }

        currentQuestion.value = available[Math.floor(Math.random() * available.length)]
        currentQuestionNumber.value++
        showResult.value = false

        // 根据测试模式生成选项
        switch (testMode.value) {
            case 'en-to-cn':
                correctAnswer.value = currentQuestion.value.definition
                currentOptions.value = generateOptions(vocabulary, currentQuestion.value.definition, 'definition')
                break
            case 'cn-to-en':
                correctAnswer.value = currentQuestion.value.headWord
                currentOptions.value = generateOptions(vocabulary, currentQuestion.value.headWord, 'headWord')
                break
            case 'fill-blank':
                correctAnswer.value = currentQuestion.value.headWord
                currentOptions.value = generateOptions(vocabulary, currentQuestion.value.headWord, 'headWord')
                break
            case 'spelling':
                correctAnswer.value = currentQuestion.value.headWord.toLowerCase()
                currentOptions.value = []
                break
        }
    }

    // 生成选项
    function generateOptions(allWords, correctValue, field) {
        const options = [correctValue]
        const allValues = allWords.map(w => w[field]).filter(v => v && v !== correctValue)

        while (options.length < 4 && allValues.length > 0) {
            const randomIndex = Math.floor(Math.random() * allValues.length)
            const value = allValues[randomIndex]
            if (!options.includes(value)) {
                options.push(value)
            }
            allValues.splice(randomIndex, 1)
        }

        // 打乱选项顺序
        return options.sort(() => Math.random() - 0.5)
    }

    // 检查答案
    function checkAnswer(selectedAnswer) {
        const correct = selectedAnswer === correctAnswer.value ||
            (testMode.value === 'spelling' && selectedAnswer.toLowerCase().trim() === correctAnswer.value)

        isCorrect.value = correct
        showResult.value = true

        if (correct) {
            score.value++
        } else {
            // 记录错题
            store.addWrongQuestion({
                word: currentQuestion.value.headWord,
                definition: currentQuestion.value.definition,
                selectedAnswer,
                correctAnswer: correctAnswer.value,
                testMode: testMode.value,
                questionNumber: currentQuestionNumber.value
            })
        }

        testedWords.value.push(currentQuestion.value.headWord)
    }

    // 下一题
    function nextQuestion() {
        if (testedWords.value.length >= totalQuestions.value) {
            finishTest()
        } else {
            generateQuestion()
        }
    }

    // 结束测试
    function finishTest() {
        testFinished.value = true
        showResult.value = true
    }

    // 退出测试
    function exitTest() {
        isTestMode.value = false
        testFinished.value = false
        showResult.value = false
        currentQuestion.value = null
        currentOptions.value = []
    }

    // 获取填空题的句子
    function getBlankSentence() {
        if (!currentQuestion.value) return ''
        const sentences = currentQuestion.value.sentences
        if (sentences && sentences.length > 0) {
            return sentences[0].replace(currentQuestion.value.headWord, '________')
        }
        return currentQuestion.value.headWord
    }

    return {
        // 状态
        isTestMode,
        testMode,
        useWrongOnly,
        testQuantity,
        currentQuestion,
        currentOptions,
        testedWords,
        score,
        currentQuestionNumber,
        totalQuestions,
        showResult,
        isCorrect,
        correctAnswer,
        testFinished,
        // 计算属性
        accuracy,
        // 方法
        startTest,
        generateQuestion,
        checkAnswer,
        nextQuestion,
        exitTest,
        getBlankSentence
    }
}
