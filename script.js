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

    let vocabulary = [];
    let currentIndex = 0;
    let score = 0;
    let testedWords = [];
    let wrongQuestions = JSON.parse(localStorage.getItem('wrongQuestions')) || [];
    let currentQuestionNumber = 0;
    let totalQuestions = 0;
    let currentTestMode = 'en-to-cn';
    let useWrongOnly = false; // 是否仅从错题本抽题
    
    // 从后端API加载单词
    async function loadVocabulary() {
        try {
            const response = await fetch('http://localhost:3000/api/words');
            vocabulary = await response.json();
            updateWordCount();
            showWord();
        } catch (error) {
            console.error('Error loading vocabulary:', error);
            vocabulary = [];
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
        try {
            const response = await fetch('http://localhost:3000/api/words/count');
            const data = await response.json();
            wordCountElement.textContent = `单词数量: ${data.count}`;
            
            // 如果有错题，显示查看错题按钮
            if (wrongQuestions.length > 0) {
                document.getElementById('view-wrong-questions').style.display = 'inline-block';
            }
        } catch (error) {
            console.error('Error getting word count:', error);
            wordCountElement.textContent = `单词数量: ${vocabulary.length}`;
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
        try {
            const response = await fetch('http://localhost:3000/api/words/count');
            const data = await response.json();
            
            if (data.count < 4) {
                alert('至少需要4个单词才能开始测试');
                return;
            }

            // 获取测试设置
            const testMode = document.getElementById('test-mode').value;
            const testQuantity = parseInt(document.getElementById('test-quantity').value) || 10;
            useWrongOnly = document.getElementById('use-wrong-only')?.checked || false;
            
            mainContainer.classList.add('hidden');
            testContainer.classList.remove('hidden');
            
            score = 0;
            testedWords = [];
            currentQuestionNumber = 0;
            if (useWrongOnly) {
                // 统计错题本中唯一单词数量
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
                totalQuestions = Math.min(testQuantity, data.count);
            }
            currentTestMode = testMode;
            
            updateProgress();
            await generateQuestion();
        } catch (error) {
            console.error('Error checking word count:', error);
            alert('检查单词数量时出错');
        }
    }

    let currentTestWord;

    async function generateQuestion() {
        try {
            // 从后端获取所有单词
            const response = await fetch('http://localhost:3000/api/words');
            const allWords = await response.json();
            
            // 构建题库（支持仅错题）
            let pool = allWords;
            if (useWrongOnly) {
                const wrongSet = new Set((JSON.parse(localStorage.getItem('wrongQuestions')) || []).map(q => q.word));
                pool = allWords.filter(w => wrongSet.has(w.headWord));
            }

            // 选择题需要至少4个选项来源
            const multipleChoiceModes = ['en-to-cn', 'cn-to-en', 'fill-blank'];
            if (multipleChoiceModes.includes(currentTestMode) && pool.length < 4) {
                alert('题库不足4个单词，无法进行该测试模式。请添加生词或取消仅测错题。');
                mainContainer.classList.remove('hidden');
                testContainer.classList.add('hidden');
                return;
            }

            // 随机选择一个未被测试过的单词作为问题
            const available = pool.filter(w => !testedWords.includes(w.headWord));
            if (available.length === 0) {
                // 没有可用题目（可能用户设置的题目数量超过可用池）
                nextQuestion();
                return;
            }
            currentTestWord = available[Math.floor(Math.random() * available.length)];
            
            // 根据测试模式生成不同的问题
            switch (currentTestMode) {
                case 'en-to-cn':
                    // 英译中：显示英文单词，选择中文释义
                    testWordElement.textContent = currentTestWord.headWord;
                    generateDefinitionOptions(allWords, currentTestWord.definition);
                    break;
                
                case 'cn-to-en':
                    // 中译英：显示中文释义，选择英文单词
                    testWordElement.textContent = currentTestWord.definition;
                    generateWordOptions(allWords, currentTestWord.headWord);
                    break;
                
                case 'fill-blank':
                    // 填空测试：显示带下划线的句子
                    if (currentTestWord.sentences && currentTestWord.sentences.length > 0) {
                        const sentence = currentTestWord.sentences[0];
                        const blankSentence = sentence.replace(currentTestWord.headWord, '________');
                        testWordElement.textContent = blankSentence;
                        generateWordOptions(allWords, currentTestWord.headWord);
                    } else {
                        // 如果没有例句，回退到英译中模式
                        testWordElement.textContent = currentTestWord.headWord;
                        generateDefinitionOptions(allWords, currentTestWord.definition);
                    }
                    break;
                
                case 'spelling':
                    // 单词拼写模式
                    testWordElement.textContent = `释义: ${currentTestWord.definition}`;
                    testWordElement.innerHTML += `<br><small>（请输入正确的英文单词）</small>`;
                    
                    // 创建拼写输入框
                    optionsContainer.innerHTML = `
                        <input type="text" id="spelling-input" placeholder="输入英文单词" style="padding: 10px; font-size: 16px; width: 200px;">
                        <button id="check-spelling" style="padding: 10px 20px; font-size: 16px; margin-left: 10px;">检查</button>
                    `;
                    
                    const checkButton = document.getElementById('check-spelling');
                    const spellingInput = document.getElementById('spelling-input');
                    
                    // 自动聚焦到输入框
                    spellingInput.focus();
                    
                    checkButton.addEventListener('click', () => {
                        const userInput = spellingInput.value.trim().toLowerCase();
                        const correctWord = currentTestWord.headWord.toLowerCase();
                        checkAnswer(userInput, correctWord, currentTestWord);
                    });
                    
                    // 支持回车键提交
                    spellingInput.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            checkButton.click();
                        }
                    });
                    break;
            }
            
            currentQuestionNumber++;
            updateProgress();
            
        } catch (error) {
            console.error('Error getting words for test:', error);
            alert('获取测试单词时出错');
        }
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
            
            try {
                const response = await fetch(`http://localhost:3000/api/words/${wordToDelete.headWord}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    vocabulary.splice(currentIndex, 1);
                    
                    if (vocabulary.length === 0) {
                        currentIndex = 0;
                        showEmptyState();
                    } else {
                        currentIndex = Math.min(currentIndex, vocabulary.length - 1);
                        showWord();
                    }
                    updateWordCount();
                } else {
                    alert('删除单词失败');
                }
            } catch (error) {
                console.error('Error deleting word:', error);
                alert('删除单词时出错');
            }
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
                    synonyms: wordData.synonyms?.flatMap(s => s.Hwds.map(h => h.word)) || []
                };

                // 发送到后端API
                const apiResponse = await fetch('http://localhost:3000/api/words', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(newWordEntry)
                });

                if (apiResponse.ok) {
                    const addedWord = await apiResponse.json();
                    vocabulary.push(addedWord);
                    currentIndex = vocabulary.length - 1;
                    showWord();
                    updateWordCount();
                    newWordInput.value = '';
                } else {
                    const errorData = await apiResponse.json();
                    alert(errorData.error || '添加单词时出错');
                }
            } else {
                alert('找不到该单词');
            }
        } catch (error) {
            console.error('Error adding word:', error);
            alert('添加单词时出错');
        }
    }

    addWordBtn.addEventListener('click', addWord);
    deleteWordBtn.addEventListener('click', deleteWord); // 添加事件监听器
    prevBtn.addEventListener('click', prevWord);
    toggleBtn.addEventListener('click', toggleDefinition);
    nextBtn.addEventListener('click', nextWord);
    showAllWordsBtn.addEventListener('click', showAllWords);
    closeBtn.addEventListener('click', closeAllWords);
    startTestBtn.addEventListener('click', startTest);
    nextQuestionBtn.addEventListener('click', nextQuestion);
    
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