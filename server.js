const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3000;
const DB_FILE = './vocabulary.json';

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // 服务静态文件

// 初始化数据库文件
async function initializeDatabase() {
    try {
        await fs.access(DB_FILE);
        console.log('Database file exists');
    } catch (error) {
        // 文件不存在，创建初始数据库
        await fs.writeFile(DB_FILE, JSON.stringify([]));
        console.log('Created new database file');
    }
}

// 读取所有单词
async function readWords() {
    try {
        const data = await fs.readFile(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading database:', error);
        return [];
    }
}

// 保存单词到数据库
async function saveWords(words) {
    try {
        await fs.writeFile(DB_FILE, JSON.stringify(words, null, 2));
    } catch (error) {
        console.error('Error saving database:', error);
        throw error;
    }
}

// API路由

// 获取所有单词
app.get('/api/words', async (req, res) => {
    try {
        const words = await readWords();
        res.json(words);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 添加新单词
app.post('/api/words', async (req, res) => {
    try {
        const { headWord, pronunciation, definition, sentences, synonyms } = req.body;
        const words = await readWords();
        
        // 检查单词是否已存在
        const wordExists = words.some(word => word.headWord.toLowerCase() === headWord.toLowerCase());
        if (wordExists) {
            res.status(400).json({ error: 'Word already exists' });
            return;
        }
        
        const newWord = {
            id: Date.now(), // 使用时间戳作为ID
            headWord,
            pronunciation: pronunciation || '',
            definition: definition || '',
            sentences: sentences || [],
            synonyms: synonyms || [],
            createdAt: new Date().toISOString()
        };
        
        words.push(newWord);
        await saveWords(words);
        
        res.json(newWord);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 删除单词
app.delete('/api/words/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const words = await readWords();
        
        const initialLength = words.length;
        const filteredWords = words.filter(word => word.id !== id);
        
        if (filteredWords.length === initialLength) {
            res.status(404).json({ error: 'Word not found' });
            return;
        }
        
        await saveWords(filteredWords);
        res.json({ message: 'Word deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 获取单词数量
app.get('/api/words/count', async (req, res) => {
    try {
        const words = await readWords();
        res.json({ count: words.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 启动服务器
async function startServer() {
    await initializeDatabase();
    
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`Vocabulary database: ${DB_FILE}`);
    });
}

startServer().catch(console.error);