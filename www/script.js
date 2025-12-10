document.addEventListener('DOMContentLoaded', () => {
    const wordElement = document.getElementById('word');
    const pronunciationElement = document.getElementById('pronunciation');
    const definitionElement = document.getElementById('definition');
    const sentencesElement = document.getElementById('sentences');
    const synonymsElement = document.getElementById('synonyms');
    const detailsElement = document.getElementById('details');
    const wordCountElement = document.getElementById('word-count');

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
    const deleteWordBtn = document.getElementById('delete-word');

    const prevBtn = document.getElementById('prev-word');
    const toggleBtn = document.getElementById('toggle-definition');
    const nextBtn = document.getElementById('next-word');
    const exportBtn = document.getElementById('export-words');
    const importBtn = document.getElementById('import-words');
    const importFileInput = document.getElementById('import-file');

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
    let useWrongOnly = false;
    
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

    function clearWrongQuestions() {
        if (confirm('确定要清空所有错题记录吗？')) {
            wrongQuestions = [];
            localStorage.removeItem('wrongQuestions');
            document.getElementById('wrong-questions-list').innerHTML = '<p>暂无错题记录</p>';
            updateWordCount();
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
        currentTestWord = available[Math.floor(Math.random() * available.length);
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
        const options = [correctDefinition];
        while (options.length < 4) {
            const randomWord = allWords[Math.floor(Math.random() * allWords.length)];
            if (randomWord.definition !== correctDefinition && !options.includes(randomWord.definition)) {
                options.push(randomWord.definition);
            }
        }
        options.sort(() => Math.random() - 0.5);
        displayOptions(options, correctDefinition);
    }

    function generateWordOptions(allWords, correctWord) {
        const options = [correctWord];
        while (options.length < 4) {
            const randomWord = allWords[Math.floor(Math.random() * allWords.length)];
            if (randomWord.headWord !== correctWord && !options.includes(randomWord.headWord)) {
                options.push(randomWord.headWord);
            }
        }
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

    function exportVocabulary() {}
});