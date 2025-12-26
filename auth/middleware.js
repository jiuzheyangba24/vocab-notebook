// 认证中间件
const { verifyToken, extractToken } = require('./jwt');
const { query } = require('../database/connection');

/**
 * 认证中间件 - 验证用户是否已登录
 */
async function authenticate(req, res, next) {
    try {
        // 提取token
        const token = extractToken(req);
        
        if (!token) {
            return res.status(401).json({ 
                error: '未授权',
                message: '请先登录' 
            });
        }
        
        // 验证token
        const decoded = verifyToken(token);
        
        if (!decoded) {
            return res.status(401).json({ 
                error: '未授权',
                message: 'Token无效或已过期' 
            });
        }
        
        // 检查用户是否存在且激活
        const users = await query(
            'SELECT user_id, username, email, nickname, is_active FROM users WHERE user_id = ?',
            [decoded.userId]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ 
                error: '未授权',
                message: '用户不存在' 
            });
        }
        
        const user = users[0];
        
        if (!user.is_active) {
            return res.status(403).json({ 
                error: '禁止访问',
                message: '账号已被禁用' 
            });
        }
        
        // 将用户信息附加到请求对象
        req.user = {
            userId: user.user_id,
            username: user.username,
            email: user.email,
            nickname: user.nickname
        };
        
        // 更新最后登录时间
        await query(
            'UPDATE users SET last_login_at = NOW() WHERE user_id = ?',
            [user.user_id]
        );
        
        next();
    } catch (error) {
        console.error('认证错误:', error);
        res.status(500).json({ 
            error: '服务器错误',
            message: '认证过程出错' 
        });
    }
}

/**
 * 可选认证中间件 - 如果有token则验证，没有也继续
 */
async function optionalAuth(req, res, next) {
    try {
        const token = extractToken(req);
        
        if (token) {
            const decoded = verifyToken(token);
            
            if (decoded) {
                const users = await query(
                    'SELECT user_id, username, email, nickname FROM users WHERE user_id = ? AND is_active = TRUE',
                    [decoded.userId]
                );
                
                if (users.length > 0) {
                    req.user = {
                        userId: users[0].user_id,
                        username: users[0].username,
                        email: users[0].email,
                        nickname: users[0].nickname
                    };
                }
            }
        }
        
        next();
    } catch (error) {
        console.error('可选认证错误:', error);
        next();
    }
}

module.exports = {
    authenticate,
    optionalAuth
};