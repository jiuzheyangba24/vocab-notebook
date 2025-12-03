document.addEventListener('DOMContentLoaded', () => {
    const wordElement = document.getElementById('word');
    const pronunciationElement = document.getElementById('pronunciation');
    const definitionElement = document.getElementById('definition');
    const sentencesElement = document.getElementById('sentences');
    const synonymsElement = document.getElementById('synonyms');
    const detailsElement = document.getElementById('details');
    const wordCountElement = document.getElementById('word-count'); // 获取单词计数元素

    const showAllWordsBtn = document.getElementById('show-all-words');
    const allWordsModal = document.getElementById('all-words-modal');
    const closeBtn = document.querySelector('.close-btn');
    const allWordsList = document.getElementById('all-words-list');

    const startTestBtn = document.getElementById('start-test-btn');
    const testContainer = document.getElementById('test-container');
    const mainContainer = document.querySelector('.container');
    const testWordElement = document.getElementById('test-word');
    const optionsContainer = document.getElementById('options-container');
    const nextQuestionBtn = document.getElementById('next-question-btn');
    const testResultElement = document.getElementById('test-result');

    const newWordInput = document.getElementById('new-word-input');
    const addWordBtn = document.getElementById('add-word-btn');
    const deleteWordBtn = document.getElementById('delete-word'); // 获取删除按钮

    const prevBtn = document.getElementById('prev-word');
    const toggleBtn = document.getElementById('toggle-definition');
    const nextBtn = document.getElementById('next-word');
    const exportBtn = document.getElementById('export-words');
    const importBtn = document.getElementById('import-words');
    const importFileInput = document.getElementById('import-file');

    // 批量添加相关元素
    const batchAddBtn = document.getElementById('batch-add-btn');
    const batchAddModal = document.getElementById('batch-add-modal');
    const closeBatchModal = document.getElementById('close-batch-modal');
    const batchWordsInput = document.getElementById('batch-words-input');
    const startBatchAddBtn = document.getElementById('start-batch-add');
    const cancelBatchAddBtn = document.getElementById('cancel-batch-add');
    const batchProgress = document.getElementById('batch-progress');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const batchResults = document.getElementById('batch-results');

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js');
    }

    let vocabulary = [];
    let currentIndex = 0;
    let score = 0;
    let testedWords = [];
    let wrongQuestions = JSON.parse(localStorage.getItem('wrongQuestions')) || [];
    let currentQuestionNumber = 0;
    let totalQuestions = 0;
    let currentTestMode = 'en-to-cn';
    let useWrongOnly = false; // 是否仅从错题本抽题
    let isBatchAdding = false; // 批量添加状态标志
    
    async function loadVocabulary() {
        try {
            const stored = localStorage.getItem('vocabulary');
            if (stored) {
                vocabulary = JSON.parse(stored) || [];
            } else {
                try {
                    const resp = await fetch('vocabulary.json');
                    const data = await resp.json();
                    vocabulary = Array.isArray(data) ? data : [];
                    localStorage.setItem('vocabulary', JSON.stringify(vocabulary));
                } catch (_) {
                    vocabulary = [];
                    localStorage.setItem('vocabulary', JSON.stringify(vocabulary));
                }
            }
            updateWordCount();
            showWord();
        } catch (_) {
            vocabulary = [];
            localStorage.setItem('vocabulary', JSON.stringify(vocabulary));
            updateWordCount();
            showWord();
        }
    }

    function showWord() {
        if (vocabulary.length === 0) {
            wordElement.textContent = '生词本是空的';
            pronunciationElement.textContent = '';
            definitionElement.textContent = '';
            sentencesElement.innerHTML = '';
            synonymsElement.innerHTML = '';
            detailsElement.style.display = 'none';
            return;
        }

        const word = vocabulary[currentIndex];
        wordElement.textContent = word.headWord;
        pronunciationElement.textContent = word.pronunciation || '';
        definitionElement.textContent = word.definition || '';

        sentencesElement.innerHTML = '<h3>例句:</h3>';
        if (word.sentences && word.sentences.length > 0) {
            word.sentences.forEach(sentence => {
                const p = document.createElement('p');
                p.textContent = sentence;
                sentencesElement.appendChild(p);
            });
        } else {
            sentencesElement.innerHTML += '<p>无</p>';
        }

        synonymsElement.innerHTML = '<h3>同义词:</h3>';
        if (word.synonyms && word.synonyms.length > 0) {
            word.synonyms.forEach(synonym => {
                const p = document.createElement('p');
                p.textContent = synonym;
                synonymsElement.appendChild(p);
            });
        } else {
            synonymsElement.innerHTML += '<p>无</p>';
        }

        detailsElement.style.display = 'none';
    }

    async function updateWordCount() {
        wordCountElement.textContent = String(vocabulary.length);
        if (wrongQuestions.length > 0) {
            document.getElementById('view-wrong-questions').style.display = 'inline-block';
        }
    }

    function updateProgress() {
        const progressElement = document.getElementById('progress-text');
        progressElement.textContent = `第 ${currentQuestionNumber}/${totalQuestions} 题`;
    }

    function toggleDefinition() {
        if (detailsElement.style.display === 'none') {
            detailsElement.style.display = 'block';
        } else {
            detailsElement.style.display = 'none';
        }
    }

    function nextWord() {
        if (vocabulary.length > 0) {
            currentIndex = (currentIndex + 1) % vocabulary.length;
            showWord();
        }
    }

    function prevWord() {
        if (vocabulary.length > 0) {
            currentIndex = (currentIndex - 1 + vocabulary.length) % vocabulary.length;
            showWord();
        }
    }

    function showAllWords() {
        allWordsList.innerHTML = '';
        vocabulary.forEach(word => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${word.headWord}</strong>: ${word.definition}`;
            allWordsList.appendChild(li);
        });
        allWordsModal.style.display = 'block';
    }

    // 查看错题本
    function showWrongQuestions() {
        const wrongQuestionsList = document.getElementById('wrong-questions-list');
        wrongQuestionsList.innerHTML = '';
        
        if (wrongQuestions.length === 0) {
            wrongQuestionsList.innerHTML = '<p>暂无错题记录</p>';
        } else {
            wrongQuestions.forEach((question, index) => {
                const div = document.createElement('div');
                div.className = 'wrong-question';
                div.innerHTML = `
                    <p><strong>单词:</strong> ${question.word}</p>
                    <p><strong>释义:</strong> ${question.definition}</p>
                    <p><strong>你的答案:</strong> ${question.selectedAnswer}</p>
                    <p><strong>正确答案:</strong> ${question.correctAnswer}</p>
                    <p><strong>测试模式:</strong> ${question.testMode}</p>
                    <p><strong>时间:</strong> ${new Date(question.timestamp).toLocaleString()}</p>
                    <hr>
                `;
                wrongQuestionsList.appendChild(div);
            });
        }
        
        document.getElementById('wrong-questions-modal').style.display = 'block';
    }

    // 清空错题本
    function clearWrongQuestions() {
        if (confirm('确定要清空所有错题记录吗？')) {
            wrongQuestions = [];
            localStorage.removeItem('wrongQuestions');
            document.getElementById('wrong-questions-list').innerHTML = '<p>暂无错题记录</p>';
            updateWordCount(); // 更新显示，隐藏查看错题按钮
        }
    }

    function closeAllWords() {
        allWordsModal.style.display = 'none';
    }

    async function startTest() {
        const count = vocabulary.length;
        if (count < 4) {
            alert('至少需要4个单词才能开始测试');
            return;
        }
        const testMode = document.getElementById('test-mode').value;
        const testQuantity = parseInt(document.getElementById('test-quantity').value) || 10;
        useWrongOnly = document.getElementById('use-wrong-only')?.checked || false;
        mainContainer.classList.add('hidden');
        testContainer.classList.remove('hidden');
        score = 0;
        testedWords = [];
        currentQuestionNumber = 0;
        if (useWrongOnly) {
            const uniqueWrongWords = Array.from(new Set((JSON.parse(localStorage.getItem('wrongQuestions')) || []).map(q => q.word)));
            const wrongCount = uniqueWrongWords.length;
            if (wrongCount === 0) {
                alert('错题本为空，无法进行错题测试。请先进行正常测试或添加错题。');
                mainContainer.classList.remove('hidden');
                testContainer.classList.add('hidden');
                return;
            }
            totalQuestions = Math.min(testQuantity, wrongCount);
        } else {
            totalQuestions = Math.min(testQuantity, count);
        }
        currentTestMode = testMode;
        updateProgress();
        await generateQuestion();
    }

    let currentTestWord;

    async function generateQuestion() {
        const allWords = vocabulary.slice();
        let pool = allWords;
        if (useWrongOnly) {
            const wrongSet = new Set((JSON.parse(localStorage.getItem('wrongQuestions')) || []).map(q => q.word));
            pool = allWords.filter(w => wrongSet.has(w.headWord));
        }
        const multipleChoiceModes = ['en-to-cn', 'cn-to-en', 'fill-blank'];
        if (multipleChoiceModes.includes(currentTestMode) && pool.length < 4) {
            alert('题库不足4个单词，无法进行该测试模式。请添加生词或取消仅测错题。');
            mainContainer.classList.remove('hidden');
            testContainer.classList.add('hidden');
            return;
        }
        const available = pool.filter(w => !testedWords.includes(w.headWord));
        if (available.length === 0) {
            nextQuestion();
            return;
        }
        currentTestWord = available[Math.floor(Math.random() * available.length)];
        switch (currentTestMode) {
            case 'en-to-cn':
                testWordElement.textContent = currentTestWord.headWord;
                generateDefinitionOptions(allWords, currentTestWord.definition);
                break;
            case 'cn-to-en':
                testWordElement.textContent = currentTestWord.definition;
                generateWordOptions(allWords, currentTestWord.headWord);
                break;
            case 'fill-blank':
                if (currentTestWord.sentences && currentTestWord.sentences.length > 0) {
                    const sentence = currentTestWord.sentences[0];
                    const blankSentence = sentence.replace(currentTestWord.headWord, '________');
                    testWordElement.textContent = blankSentence;
                    generateWordOptions(allWords, currentTestWord.headWord);
                } else {
                    testWordElement.textContent = currentTestWord.headWord;
                    generateDefinitionOptions(allWords, currentTestWord.definition);
                }
                break;
            case 'spelling':
                testWordElement.textContent = `释义: ${currentTestWord.definition}`;
                testWordElement.innerHTML += `<br><small>（请输入正确的英文单词）</small>`;
                optionsContainer.innerHTML = `
                    <input type="text" id="spelling-input" placeholder="输入英文单词" style="padding: 10px; font-size: 16px; width: 200px;">
                    <button id="check-spelling" style="padding: 10px 20px; font-size: 16px; margin-left: 10px;">检查</button>
                `;
                const checkButton = document.getElementById('check-spelling');
                const spellingInput = document.getElementById('spelling-input');
                spellingInput.focus();
                checkButton.addEventListener('click', () => {
                    const userInput = spellingInput.value.trim().toLowerCase();
                    const correctWord = currentTestWord.headWord.toLowerCase();
                    checkAnswer(userInput, correctWord, currentTestWord);
                });
                spellingInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        checkButton.click();
                    }
                });
                break;
        }
        currentQuestionNumber++;
        updateProgress();
    }

    function generateDefinitionOptions(allWords, correctDefinition) {
        // 生成释义选项
        const options = [correctDefinition];
        while (options.length < 4) {
            const randomWord = allWords[Math.floor(Math.random() * allWords.length)];
            if (randomWord.definition !== correctDefinition && !options.includes(randomWord.definition)) {
                options.push(randomWord.definition);
            }
        }
        
        // 打乱选项顺序并显示
        options.sort(() => Math.random() - 0.5);
        displayOptions(options, correctDefinition);
    }

    function generateWordOptions(allWords, correctWord) {
        // 生成单词选项
        const options = [correctWord];
        while (options.length < 4) {
            const randomWord = allWords[Math.floor(Math.random() * allWords.length)];
            if (randomWord.headWord !== correctWord && !options.includes(randomWord.headWord)) {
                options.push(randomWord.headWord);
            }
        }
        
        // 打乱选项顺序并显示
        options.sort(() => Math.random() - 0.5);
        displayOptions(options, correctWord);
    }

    function displayOptions(options, correctAnswer) {
        optionsContainer.innerHTML = '';
        options.forEach(option => {
            const button = document.createElement('button');
            button.textContent = option;
            button.classList.add('option-btn');
            button.addEventListener('click', () => {
                checkAnswer(option, correctAnswer, currentTestWord);
            });
            optionsContainer.appendChild(button);
        });
    }

    function checkAnswer(selectedOption, correctAnswer, currentTestWord) {
        const isCorrect = selectedOption === correctAnswer;
        
        if (isCorrect) {
            score++;
            testResultElement.innerHTML = `<span style="color: green; font-weight: bold;">第${currentQuestionNumber}题回答正确！</span>`;
        } else {
            testResultElement.innerHTML = `<span style="color: red;">错误！正确答案是：${correctAnswer}</span>`;
            
            // 记录错题
            const wrongQuestion = {
                word: currentTestWord.headWord,
                definition: currentTestWord.definition,
                selectedAnswer: selectedOption,
                correctAnswer: correctAnswer,
                testMode: currentTestMode,
                timestamp: new Date().toISOString(),
                questionNumber: currentQuestionNumber
            };
            
            wrongQuestions.push(wrongQuestion);
            localStorage.setItem('wrongQuestions', JSON.stringify(wrongQuestions));
        }

        testedWords.push(currentTestWord.headWord);

        const optionButtons = optionsContainer.querySelectorAll('.option-btn');
        optionButtons.forEach(button => {
            button.disabled = true;
            if (button.textContent === correctAnswer) {
                button.style.backgroundColor = 'green';
            }
        });
        
        testResultElement.classList.remove('hidden');
        nextQuestionBtn.style.display = 'block';
    }

    function nextQuestion() {
        if (testedWords.length === totalQuestions) {
            // 测试结束，显示统计信息
            const correctCount = score;
            const wrongCount = totalQuestions - score;
            const accuracy = totalQuestions > 0 ? ((score / totalQuestions) * 100).toFixed(1) : 0;
            
            testResultElement.innerHTML = `
                <div style="text-align: center; font-size: 18px; margin-bottom: 10px;">
                    <strong>测试结束！</strong>
                </div>
                <div style="display: flex; justify-content: space-around; margin-bottom: 15px;">
                    <div style="color: green;">
                        <div style="font-size: 24px; font-weight: bold;">${correctCount}</div>
                        <div>答对</div>
                    </div>
                    <div style="color: red;">
                        <div style="font-size: 24px; font-weight: bold;">${wrongCount}</div>
                        <div>答错</div>
                    </div>
                    <div style="color: blue;">
                        <div style="font-size: 24px; font-weight: bold;">${accuracy}%</div>
                        <div>正确率</div>
                    </div>
                </div>
                <div>总题数: ${totalQuestions}</div>
            `;
            testResultElement.style.color = 'blue';
            nextQuestionBtn.disabled = true;
            return;
        }
        generateQuestion();
        testResultElement.classList.add('hidden');
    }

    async function deleteWord() {
        if (vocabulary.length === 0) {
            alert('生词本为空');
            return;
        }

        if (confirm('确定要删除这个单词吗？')) {
            const wordToDelete = vocabulary[currentIndex];
            const byId = wordToDelete && wordToDelete.id != null;
            if (byId) {
                vocabulary = vocabulary.filter(w => w.id !== wordToDelete.id);
            } else {
                const hw = (wordToDelete.headWord || '').toLowerCase();
                vocabulary = vocabulary.filter(w => (w.headWord || '').toLowerCase() !== hw);
            }
            localStorage.setItem('vocabulary', JSON.stringify(vocabulary));
            if (vocabulary.length === 0) {
                currentIndex = 0;
                showWord();
            } else {
                currentIndex = Math.min(currentIndex, vocabulary.length - 1);
                showWord();
            }
            updateWordCount();
        }
    }

    async function addWord() {
        const newWord = newWordInput.value.trim();
        if (newWord === '') {
            alert('请输入一个单词');
            return;
        }

        try {
            const response = await fetch(`https://v2.xxapi.cn/api/englishwords?word=${newWord}`);
            const data = await response.json();
            
            if (data.code === 200 && data.data && data.data.word) {
                const wordData = data.data;
                const newWordEntry = {
                    headWord: wordData.word,
                    pronunciation: wordData.ukphone || wordData.usphone || '',
                    definition: wordData.translations?.[0]?.tran_cn || '无释义',
                    sentences: wordData.sentences?.map(s => `${s.s_content} - ${s.s_cn}`) || [],
                    synonyms: wordData.synonyms?.flatMap(s => s.Hwds.map(h => h.word)) || [],
                    id: Date.now(),
                    createdAt: new Date().toISOString()
                };
                const exists = vocabulary.some(w => (w.headWord || '').toLowerCase() === newWordEntry.headWord.toLowerCase());
                if (exists) {
                    alert('该单词已存在');
                    return;
                }
                vocabulary.push(newWordEntry);
                localStorage.setItem('vocabulary', JSON.stringify(vocabulary));
                currentIndex = vocabulary.length - 1;
                showWord();
                updateWordCount();
                newWordInput.value = '';
            } else {
                alert('找不到该单词');
            }
        } catch (error) {
            console.error('Error adding word:', error);
            alert('添加单词时出错');
        }
    }

    function exportVocabulary() {
        const payload = { version: 1, exportedAt: new Date().toISOString(), words: vocabulary };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vocabulary-${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function importVocabularyFromFile(file) {
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const parsed = JSON.parse(reader.result);
                const list = Array.isArray(parsed) ? parsed : Array.isArray(parsed.words) ? parsed.words : [];
                if (!Array.isArray(list) || list.length === 0) {
                    alert('文件中未找到词库数据');
                    return;
                }
                const normalized = list.filter(w => w && typeof w.headWord === 'string' && w.headWord.trim() !== '').map(w => ({
                    id: w.id ?? Date.now() + Math.floor(Math.random() * 1000),
                    headWord: w.headWord,
                    pronunciation: w.pronunciation || '',
                    definition: w.definition || '',
                    sentences: Array.isArray(w.sentences) ? w.sentences : [],
                    synonyms: Array.isArray(w.synonyms) ? w.synonyms : [],
                    createdAt: w.createdAt || new Date().toISOString()
                }));
                const map = new Map(vocabulary.map(w => [String(w.headWord).toLowerCase(), w]));
                normalized.forEach(w => {
                    const k = w.headWord.toLowerCase();
                    if (!map.has(k)) map.set(k, w);
                });
                vocabulary = Array.from(map.values());
                localStorage.setItem('vocabulary', JSON.stringify(vocabulary));
                currentIndex = Math.min(currentIndex, Math.max(0, vocabulary.length - 1));
                showWord();
                updateWordCount();
                alert(`导入完成，合并后共有 ${vocabulary.length} 条`);
            } catch (e) {
                alert('导入失败：不是合法的 JSON 文件');
            }
        };
        reader.onerror = () => alert('读取文件失败');
        reader.readAsText(file, 'utf-8');
    }

    // 批量添加单词功能
    function showBatchAddModal() {
        batchWordsInput.value = '';
        batchProgress.classList.add('hidden');
        batchResults.innerHTML = '';
        startBatchAddBtn.disabled = false;
        batchAddModal.style.display = 'block';
    }

    function closeBatchAddModalFunc() {
        if (isBatchAdding) {
            if (!confirm('批量添加正在进行中，确定要取消吗？')) {
                return;
            }
            isBatchAdding = false;
        }
        batchAddModal.style.display = 'none';
    }

    async function startBatchAdd() {
        const inputText = batchWordsInput.value.trim();
        if (!inputText) {
            alert('请输入要添加的单词');
            return;
        }

        const words = inputText.split('\n')
            .map(w => w.trim())
            .filter(w => w.length > 0)
            .filter(w => /^[a-zA-Z\s-]+$/.test(w));

        if (words.length === 0) {
            alert('没有找到有效的英文单词');
            return;
        }

        const uniqueWords = [...new Set(words.map(w => w.toLowerCase()))];

        if (confirm(`准备添加 ${uniqueWords.length} 个单词，确定继续吗？`)) {
            await batchAddWords(uniqueWords);
        }
    }

    async function batchAddWords(words) {
        isBatchAdding = true;
        startBatchAddBtn.disabled = true;
        batchProgress.classList.remove('hidden');
        batchResults.innerHTML = '';

        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;

        for (let i = 0; i < words.length; i++) {
            if (!isBatchAdding) {
                addResultItem(`批量添加已取消`, 'result-error');
                break;
            }

            const word = words[i];
            const progress = ((i + 1) / words.length * 100).toFixed(0);
            progressFill.style.width = `${progress}%`;
            progressText.textContent = `正在添加: ${i + 1}/${words.length} - ${word}`;

            try {
                const exists = vocabulary.some(w =>
                    (w.headWord || '').toLowerCase() === word.toLowerCase()
                );

                if (exists) {
                    addResultItem(`${word} - 已存在，跳过`, 'result-skip');
                    skipCount++;
                    await sleep(100);
                    continue;
                }

                const response = await fetch(`https://v2.xxapi.cn/api/englishwords?word=${word}`);
                const data = await response.json();

                if (data.code === 200 && data.data && data.data.word) {
                    const wordData = data.data;
                    const newWordEntry = {
                        headWord: wordData.word,
                        pronunciation: wordData.ukphone || wordData.usphone || '',
                        definition: wordData.translations?.[0]?.tran_cn || '无释义',
                        sentences: wordData.sentences?.map(s => `${s.s_content} - ${s.s_cn}`) || [],
                        synonyms: wordData.synonyms?.flatMap(s => s.Hwds.map(h => h.word)) || [],
                        id: Date.now() + i,
                        createdAt: new Date().toISOString()
                    };

                    vocabulary.push(newWordEntry);
                    addResultItem(`${word} - 添加成功`, 'result-success');
                    successCount++;
                } else {
                    addResultItem(`${word} - 未找到`, 'result-error');
                    errorCount++;
                }

                await sleep(500);

            } catch (error) {
                console.error(`Error adding word ${word}:`, error);
                addResultItem(`${word} - 添加失败`, 'result-error');
                errorCount++;
                await sleep(500);
            }
        }

        localStorage.setItem('vocabulary', JSON.stringify(vocabulary));
        updateWordCount();
        showWord();

        progressText.innerHTML = `
            <strong>批量添加完成！</strong><br>
            成功: ${successCount} | 跳过: ${skipCount} | 失败: ${errorCount}
        `;
        startBatchAddBtn.disabled = false;
        isBatchAdding = false;
    }

    function addResultItem(text, className) {
        const div = document.createElement('div');
        div.className = `result-item ${className}`;
        div.textContent = text;
        batchResults.appendChild(div);
        batchResults.scrollTop = batchResults.scrollHeight;
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    addWordBtn.addEventListener('click', addWord);
    deleteWordBtn.addEventListener('click', deleteWord);
    prevBtn.addEventListener('click', prevWord);
    toggleBtn.addEventListener('click', toggleDefinition);
    nextBtn.addEventListener('click', nextWord);
    showAllWordsBtn.addEventListener('click', showAllWords);
    closeBtn.addEventListener('click', closeAllWords);
    startTestBtn.addEventListener('click', startTest);
    nextQuestionBtn.addEventListener('click', nextQuestion);
    exportBtn.addEventListener('click', exportVocabulary);
    importBtn.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) importVocabularyFromFile(file);
        importFileInput.value = '';
    });
    
    // 批量添加事件监听器
    batchAddBtn.addEventListener('click', showBatchAddModal);
    closeBatchModal.addEventListener('click', closeBatchAddModalFunc);
    cancelBatchAddBtn.addEventListener('click', closeBatchAddModalFunc);
    startBatchAddBtn.addEventListener('click', startBatchAdd);
    
    // 错题本相关事件监听器
    document.getElementById('view-wrong-questions').addEventListener('click', showWrongQuestions);
    document.getElementById('close-wrong-modal').addEventListener('click', () => {
        document.getElementById('wrong-questions-modal').style.display = 'none';
    });
    document.getElementById('clear-wrong-questions').addEventListener('click', clearWrongQuestions);

    // 全局键盘事件监听器
    document.addEventListener('keydown', (event) => {
        // 只在测试模式下响应空格键
        if (event.code === 'Space' && !testContainer.classList.contains('hidden')) {
            event.preventDefault(); // 防止页面滚动
            
            // 检查是否在拼写模式
            const spellingInput = document.getElementById('spelling-input');
            if (spellingInput && document.activeElement !== spellingInput) {
                // 如果在拼写模式但输入框没有焦点，则聚焦到输入框
                spellingInput.focus();
                return;
            }
            
            // 如果当前正在显示题目（没有显示结果），则先显示答案
            if (testResultElement.classList.contains('hidden')) {
                // 模拟点击第一个选项（对于选择题）
                const firstOption = optionsContainer.querySelector('.option-btn');
                if (firstOption) {
                    firstOption.click();
                }
            } else {
                // 如果已经显示了结果，则进入下一题
                nextQuestionBtn.click();
            }
        }
    });

    // 初始化显示
    loadVocabulary();
});