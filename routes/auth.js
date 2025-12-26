// 用户认证路由
const express = require('express');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const { query } = require('../database/connection');
const { generateToken } = require('../auth/jwt');
const { authenticate } = require('../auth/middleware');

const router = express.Router();
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 10;

/**
 * 注册新用户
 * POST /api/auth/register
 */
router.post('/register',
    // 验证输入
    body('username')
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('用户名长度必须在3-50个字符之间')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('用户名只能包含字母、数字和下划线'),
    body('email')
        .trim()
        .isEmail()
        .withMessage('请输入有效的邮箱地址')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('密码长度至少6个字符'),
    body('nickname')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('昵称长度不能超过50个字符'),
    
    async (req, res) => {
        try {
            // 检查验证错误
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    error: '输入验证失败',
                    details: errors.array() 
                });
            }
            
            const { username, email, password, nickname } = req.body;
            
            // 检查用户名是否已存在
            const existingUsers = await query(
                'SELECT user_id FROM users WHERE username = ? OR email = ?',
                [username, email]
            );
            
            if (existingUsers.length > 0) {
                return res.status(409).json({ 
                    error: '用户已存在',
                    message: '用户名或邮箱已被注册' 
                });
            }
            
            // 加密密码
            const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
            
            // 创建用户
            const result = await query(`
                INSERT INTO users (username, email, password_hash, nickname)
                VALUES (?, ?, ?, ?)
            `, [username, email, passwordHash, nickname || username]);
            
            const userId = result.insertId;
            
            // 生成token
            const token = generateToken({ userId, username, email });
            
            res.status(201).json({
                message: '注册成功',
                user: {
                    userId,
                    username,
                    email,
                    nickname: nickname || username
                },
                token
            });
            
        } catch (error) {
            console.error('注册错误:', error);
            res.status(500).json({ 
                error: '注册失败',
                message: error.message 
            });
        }
    }
);

/**
 * 用户登录
 * POST /api/auth/login
 */
router.post('/login',
    // 验证输入
    body('username')
        .trim()
        .notEmpty()
        .withMessage('请输入用户名或邮箱'),
    body('password')
        .notEmpty()
        .withMessage('请输入密码'),
    
    async (req, res) => {
        try {
            // 检查验证错误
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    error: '输入验证失败',
                    details: errors.array() 
                });
            }
            
            const { username, password } = req.body;
            
            // 查找用户（支持用户名或邮箱登录）
            const users = await query(`
                SELECT user_id, username, email, password_hash, nickname, is_active
                FROM users 
                WHERE username = ? OR email = ?
            `, [username, username]);
            
            if (users.length === 0) {
                return res.status(401).json({ 
                    error: '登录失败',
                    message: '用户名或密码错误' 
                });
            }
            
            const user = users[0];
            
            // 检查账号是否激活
            if (!user.is_active) {
                return res.status(403).json({ 
                    error: '账号已禁用',
                    message: '您的账号已被禁用，请联系管理员' 
                });
            }
            
            // 验证密码
            const passwordMatch = await bcrypt.compare(password, user.password_hash);
            
            if (!passwordMatch) {
                return res.status(401).json({ 
                    error: '登录失败',
                    message: '用户名或密码错误' 
                });
            }
            
            // 更新最后登录时间
            await query(
                'UPDATE users SET last_login_at = NOW() WHERE user_id = ?',
                [user.user_id]
            );
            
            // 生成token
            const token = generateToken({ 
                userId: user.user_id, 
                username: user.username,
                email: user.email
            });
            
            // 创建会话记录
            const sessionId = `${user.user_id}_${Date.now()}`;
            await query(`
                INSERT INTO user_sessions (session_id, user_id, token, ip_address, user_agent, expires_at)
                VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))
            `, [
                sessionId,
                user.user_id,
                token,
                req.ip || req.connection.remoteAddress,
                req.headers['user-agent'] || ''
            ]);
            
            res.json({
                message: '登录成功',
                user: {
                    userId: user.user_id,
                    username: user.username,
                    email: user.email,
                    nickname: user.nickname
                },
                token
            });
            
        } catch (error) {
            console.error('登录错误:', error);
            res.status(500).json({ 
                error: '登录失败',
                message: error.message 
            });
        }
    }
);

/**
 * 获取当前用户信息
 * GET /api/auth/me
 * 需要认证
 */
router.get('/me', authenticate, async (req, res) => {
    try {
        // 这个路由需要在server.js中添加authenticate中间件
        if (!req.user) {
            return res.status(401).json({ 
                error: '未授权',
                message: '请先登录' 
            });
        }
        
        // 获取用户详细信息
        const users = await query(`
            SELECT 
                user_id, username, email, nickname, avatar_url,
                total_study_days, total_words_learned, 
                current_streak, longest_streak,
                created_at, last_login_at
            FROM users 
            WHERE user_id = ?
        `, [req.user.userId]);
        
        if (users.length === 0) {
            return res.status(404).json({ 
                error: '用户不存在' 
            });
        }
        
        res.json({
            user: users[0]
        });
        
    } catch (error) {
        console.error('获取用户信息错误:', error);
        res.status(500).json({ 
            error: '获取用户信息失败',
            message: error.message 
        });
    }
});

/**
 * 登出
 * POST /api/auth/logout
 * 需要认证
 */
router.post('/logout', authenticate, async (req, res) => {
    try {
        if (req.user) {
            // 删除会话记录
            await query(
                'DELETE FROM user_sessions WHERE user_id = ? AND token = ?',
                [req.user.userId, req.headers.authorization?.substring(7)]
            );
        }
        
        res.json({ message: '登出成功' });
        
    } catch (error) {
        console.error('登出错误:', error);
        res.status(500).json({ 
            error: '登出失败',
            message: error.message 
        });
    }
});

module.exports = router;