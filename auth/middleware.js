/**
 * ============================================
 * 认证中间件（Authentication Middleware）
 * ============================================
 * 
 * 中间件是 Express 中的核心概念，用于在请求到达路由处理器之前
 * 执行预处理操作。
 * 
 * 本文件包含两个认证中间件：
 * 1. authenticate - 强制认证，未登录用户被拒绝
 * 2. optionalAuth - 可选认证，未登录用户也能继续
 * 
 * 认证流程：
 * 请求 → 提取Token → 验证Token → 查询用户 → 附加用户信息 → 下一个处理器
 */

const { verifyToken, extractToken } = require('./jwt');  // JWT 工具函数
const { query } = require('../database/connection');      // 数据库查询

// ============================================
// 1. 强制认证中间件
// ============================================
/**
 * 强制认证中间件
 * 
 * 功能：验证用户是否已登录，未登录则拒绝访问
 * 
 * 使用场景：需要登录才能访问的 API
 * 例如：修改个人信息、查看私密数据
 * 
 * 使用方法：
 * app.get('/api/profile', authenticate, (req, res) => {
 *     // req.user 包含当前登录用户信息
 *     res.json(req.user);
 * });
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * @param {Function} next - 调用下一个中间件/路由处理器
 */
async function authenticate(req, res, next) {
    try {
        // -------- 第1步：提取 Token --------
        // 从请求头的 Authorization 字段提取 Bearer Token
        // 格式：Authorization: Bearer <token>
        const token = extractToken(req);

        // 如果没有 Token，返回 401 未授权错误
        if (!token) {
            return res.status(401).json({
                error: '未授权',
                message: '请先登录'
            });
        }

        // -------- 第2步：验证 Token --------
        // 解码 Token，验证签名和过期时间
        const decoded = verifyToken(token);

        // Token 无效或已过期
        if (!decoded) {
            return res.status(401).json({
                error: '未授权',
                message: 'Token无效或已过期'
            });
        }

        // -------- 第3步：查询用户 --------
        // 根据 Token 中的 userId 查询数据库
        const users = await query(
            'SELECT user_id, username, email, nickname, is_active FROM users WHERE user_id = ?',
            [decoded.userId]
        );

        // 用户不存在（可能已被删除）
        if (users.length === 0) {
            return res.status(401).json({
                error: '未授权',
                message: '用户不存在'
            });
        }

        const user = users[0];

        // 用户账号被禁用
        if (!user.is_active) {
            return res.status(403).json({  // 403 Forbidden
                error: '禁止访问',
                message: '账号已被禁用'
            });
        }

        // -------- 第4步：附加用户信息到请求 --------
        // 将用户信息添加到 req.user，后续路由可以使用
        req.user = {
            userId: user.user_id,
            username: user.username,
            email: user.email,
            nickname: user.nickname
        };

        // -------- 第5步：更新最后登录时间 --------
        await query(
            'UPDATE users SET last_login_at = NOW() WHERE user_id = ?',
            [user.user_id]
        );

        // 继续执行下一个中间件或路由处理器
        next();
    } catch (error) {
        console.error('认证错误:', error);
        res.status(500).json({
            error: '服务器错误',
            message: '认证过程出错'
        });
    }
}

// ============================================
// 2. 可选认证中间件
// ============================================
/**
 * 可选认证中间件
 * 
 * 功能：如果有 Token 则验证，没有也允许继续访问
 * 
 * 使用场景：支持游客访问，但登录用户有额外功能的 API
 * 例如：获取单词列表，游客用默认用户，登录用户用自己的
 * 
 * 使用方法：
 * app.get('/api/words', optionalAuth, (req, res) => {
 *     if (req.user) {
 *         // 已登录用户
 *     } else {
 *         // 游客
 *     }
 * });
 * 
 * 注意：此中间件不会因认证失败而拒绝请求
 */
async function optionalAuth(req, res, next) {
    try {
        // 尝试提取 Token
        const token = extractToken(req);

        // 如果有 Token，尝试验证
        if (token) {
            const decoded = verifyToken(token);

            if (decoded) {
                // Token 有效，查询用户
                const users = await query(
                    'SELECT user_id, username, email, nickname FROM users WHERE user_id = ? AND is_active = TRUE',
                    [decoded.userId]
                );

                // 用户存在，附加到请求
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

        // 无论有没有 Token，都继续执行
        // 如果 req.user 未定义，表示未登录（游客模式）
        next();
    } catch (error) {
        // 发生错误也继续执行（降级为游客模式）
        console.error('可选认证错误:', error);
        next();
    }
}

// ============================================
// 3. 导出中间件
// ============================================
module.exports = {
    authenticate,   // 强制认证
    optionalAuth    // 可选认证
};