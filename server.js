const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { query, testConnection } = require('./database/connection');
const { authenticate, optionalAuth } = require('./auth/middleware');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // 服务静态文件

// 测试用户ID（用于未登录用户，兼容旧版本）
const DEFAULT_USER_ID = 1;

// 获取当前用户ID（如果已登录则使用登录用户，否则使用默认用户）
function getCurrentUserId(req) {
    return req.user ? req.user.userId : DEFAULT_USER_ID;
}

// ============================================
// 认证路由
// ============================================
app.use('/api/auth', authRoutes);

// ============================================
// API路由（单词管理）
// ============================================

// 获取所有单词（支持可选认证）
app.get('/api/words', optionalAuth, async (req, res) => {
    try {
        const userId = getCurrentUserId(req);
        const words = await query(`
            SELECT 
                word_id as id,
                word as headWord,
                translation as definition,
                phonetic as pronunciation,
                example_sentence as sentences,
                mastery_level,
                review_count,
                correct_count,
                wrong_count,
                created_at as createdAt
            FROM words
            WHERE user_id = ? AND is_deleted = FALSE
            ORDER BY created_at DESC
        `, [userId]);
        
        // 转换sentences字段为数组
        const formattedWords = words.map(word => ({
            ...word,
            sentences: word.sentences ? word.sentences.split('\n').filter(s => s.trim()) : []
        }));
        
        res.json(formattedWords);
    } catch (error) {
        console.error('获取单词失败:', error);
        res.status(500).json({ error: '获取单词失败', message: error.message });
    }
});

// 添加新单词（支持可选认证）
app.post('/api/words', optionalAuth, async (req, res) => {
    try {
        const userId = getCurrentUserId(req);
        const { headWord, pronunciation, definition, sentences, synonyms } = req.body;
        
        // 验证必填字段
        if (!headWord || !definition) {
            return res.status(400).json({ error: '单词和释义为必填项' });
        }
        
        // 检查单词是否已存在
        const existing = await query(
            'SELECT word_id FROM words WHERE user_id = ? AND word = ? AND is_deleted = FALSE',
            [userId, headWord.toLowerCase()]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ error: '该单词已存在' });
        }
        
        // 插入新单词
        const result = await query(`
            INSERT INTO words (
                user_id,
                word,
                translation,
                phonetic,
                example_sentence
            ) VALUES (?, ?, ?, ?, ?)
        `, [
            userId,
            headWord,
            definition,
            pronunciation || '',
            sentences ? sentences.join('\n') : ''
        ]);
        
        // 返回新创建的单词
        const newWord = {
            id: result.insertId,
            headWord,
            pronunciation: pronunciation || '',
            definition,
            sentences: sentences || [],
            synonyms: synonyms || [],
            createdAt: new Date().toISOString()
        };
        
        res.json(newWord);
    } catch (error) {
        console.error('添加单词失败:', error);
        res.status(500).json({ error: '添加单词失败', message: error.message });
    }
});

// 删除单词（软删除，支持可选认证）
app.delete('/api/words/:id', optionalAuth, async (req, res) => {
    try {
        const userId = getCurrentUserId(req);
        const id = parseInt(req.params.id);
        
        if (isNaN(id)) {
            return res.status(400).json({ error: '无效的单词ID' });
        }
        
        // 软删除：标记为已删除而不是真正删除
        const result = await query(
            'UPDATE words SET is_deleted = TRUE WHERE word_id = ? AND user_id = ?',
            [id, userId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: '单词不存在' });
        }
        
        res.json({ message: '单词删除成功' });
    } catch (error) {
        console.error('删除单词失败:', error);
        res.status(500).json({ error: '删除单词失败', message: error.message });
    }
});

// 获取单词数量（支持可选认证）
app.get('/api/words/count', optionalAuth, async (req, res) => {
    try {
        const userId = getCurrentUserId(req);
        const result = await query(
            'SELECT COUNT(*) as count FROM words WHERE user_id = ? AND is_deleted = FALSE',
            [userId]
        );
        res.json({ count: result[0].count });
    } catch (error) {
        console.error('获取单词数量失败:', error);
        res.status(500).json({ error: '获取单词数量失败', message: error.message });
    }
});

// 更新单词学习记录（支持可选认证）
app.post('/api/words/:id/study', optionalAuth, async (req, res) => {
    try {
        const userId = getCurrentUserId(req);
        const wordId = parseInt(req.params.id);
        const { isCorrect, timeSpent } = req.body;
        
        if (isNaN(wordId)) {
            return res.status(400).json({ error: '无效的单词ID' });
        }
        
        // 记录学习
        await query(`
            INSERT INTO study_records (user_id, word_id, study_mode, is_correct, time_spent, study_date)
            VALUES (?, ?, 'review', ?, ?, CURDATE())
        `, [userId, wordId, isCorrect, timeSpent || 0]);
        
        // 更新单词统计
        if (isCorrect) {
            await query(`
                UPDATE words 
                SET review_count = review_count + 1,
                    correct_count = correct_count + 1,
                    mastery_level = LEAST(100, mastery_level + 5),
                    last_reviewed_at = NOW()
                WHERE word_id = ?
            `, [wordId]);
        } else {
            await query(`
                UPDATE words 
                SET review_count = review_count + 1,
                    wrong_count = wrong_count + 1,
                    mastery_level = GREATEST(0, mastery_level - 3),
                    last_reviewed_at = NOW()
                WHERE word_id = ?
            `, [wordId]);
            
            // 添加到错题本
            await query(`
                INSERT INTO wrong_questions (user_id, word_id, wrong_count, last_wrong_at)
                VALUES (?, ?, 1, NOW())
                ON DUPLICATE KEY UPDATE
                    wrong_count = wrong_count + 1,
                    last_wrong_at = NOW()
            `, [userId, wordId]);
        }
        
        res.json({ message: '学习记录已保存' });
    } catch (error) {
        console.error('保存学习记录失败:', error);
        res.status(500).json({ error: '保存学习记录失败', message: error.message });
    }
});

// 获取学习统计（支持可选认证）
app.get('/api/stats', optionalAuth, async (req, res) => {
    try {
        const userId = getCurrentUserId(req);
        const stats = await query(`
            SELECT 
                COUNT(*) as totalWords,
                SUM(CASE WHEN mastery_level >= 80 THEN 1 ELSE 0 END) as masteredWords,
                AVG(mastery_level) as avgMastery,
                SUM(review_count) as totalReviews
            FROM words
            WHERE user_id = ? AND is_deleted = FALSE
        `, [userId]);
        
        const wrongWords = await query(`
            SELECT COUNT(*) as count
            FROM wrong_questions
            WHERE user_id = ? AND is_mastered = FALSE
        `, [userId]);
        
        res.json({
            totalWords: stats[0].totalWords || 0,
            masteredWords: stats[0].masteredWords || 0,
            avgMastery: Math.round(stats[0].avgMastery || 0),
            totalReviews: stats[0].totalReviews || 0,
            wrongWords: wrongWords[0].count || 0
        });
    } catch (error) {
        console.error('获取统计失败:', error);
        res.status(500).json({ error: '获取统计失败', message: error.message });
    }
});

// 健康检查
app.get('/api/health', async (req, res) => {
    const dbConnected = await testConnection();
    res.json({
        status: 'ok',
        database: dbConnected ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

// ============================================
// 启动服务器
// ============================================
async function startServer() {
    try {
        // 测试数据库连接
        console.log('🔍 测试数据库连接...');
        const connected = await testConnection();
        
        if (!connected) {
            console.error('❌ 数据库连接失败！请检查配置。');
            process.exit(1);
        }
        
        // 启动服务器
        app.listen(PORT, () => {
            console.log('✨ 服务器启动成功！');
            console.log(`📍 地址: http://localhost:${PORT}`);
            console.log(`🗄️  数据库: ${process.env.DB_NAME}`);
            console.log(`👤 默认用户ID: ${DEFAULT_USER_ID}`);
            console.log('\n按 Ctrl+C 停止服务器\n');
        });
    } catch (error) {
        console.error('❌ 服务器启动失败:', error);
        process.exit(1);
    }
}

startServer().catch(console.error);