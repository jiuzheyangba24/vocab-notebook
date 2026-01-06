/**
 * ============================================
 * JWT (JSON Web Token) 管理模块
 * ============================================
 * 
 * JWT 是一种用于用户认证的令牌机制，主要用于：
 * 1. 用户登录后颁发令牌
 * 2. 后续请求携带令牌证明身份
 * 3. 无需在服务器存储会话信息（无状态）
 * 
 * JWT 结构：
 * Header.Payload.Signature
 * - Header: 算法类型
 * - Payload: 用户信息（userId, username等）
 * - Signature: 签名（防篡改）
 * 
 * 依赖: jsonwebtoken
 */

const jwt = require('jsonwebtoken');  // JWT 库
require('dotenv').config();            // 环境变量

// ============================================
// 配置常量
// ============================================

// JWT 密钥 - 用于签名和验证 Token
// ⚠️ 重要：生产环境必须设置强密码！
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Token 过期时间 - 默认 7 天
// 支持格式：'60'(秒), '2h'(小时), '7d'(天)
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// ============================================
// 1. 生成 Token
// ============================================
/**
 * 生成 JWT Token
 * 
 * 用途：用户登录成功后，生成一个 Token 返回给前端
 * 前端保存这个 Token，后续请求时带上它
 * 
 * @param {Object} payload - 要编码到 Token 中的数据
 * @returns {String} 生成的 JWT Token
 * 
 * 使用示例：
 * const token = generateToken({ userId: 1, username: 'admin' });
 * // 返回类似：eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQ...
 */
function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN  // 设置过期时间
    });
}

// ============================================
// 2. 验证 Token
// ============================================
/**
 * 验证并解码 JWT Token
 * 
 * 验证内容：
 * - 签名是否正确（防篡改）
 * - Token 是否过期
 * 
 * @param {String} token - 要验证的 JWT Token
 * @returns {Object|null} 解码后的 payload，验证失败返回 null
 * 
 * 使用示例：
 * const decoded = verifyToken(token);
 * if (decoded) {
 *     console.log(decoded.userId);  // 访问 Token 中的数据
 * }
 */
function verifyToken(token) {
    try {
        // jwt.verify 会验证签名和过期时间
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        // 常见错误：
        // - TokenExpiredError: Token 已过期
        // - JsonWebTokenError: Token 格式错误或签名无效
        console.error('Token验证失败:', error.message);
        return null;
    }
}

// ============================================
// 3. 从请求中提取 Token
// ============================================
/**
 * 从 HTTP 请求中提取 Token
 * 
 * 支持两种方式：
 * 1. Authorization 请求头（推荐）：Bearer <token>
 * 2. Cookie：token=<token>
 * 
 * @param {Object} req - Express 请求对象
 * @returns {String|null} Token 字符串，未找到返回 null
 * 
 * 前端发送 Token 的方式：
 * fetch('/api/words', {
 *     headers: {
 *         'Authorization': 'Bearer ' + token
 *     }
 * });
 */
function extractToken(req) {
    // 方式1：从 Authorization 请求头提取
    // 格式：Authorization: Bearer eyJhbGciOi...
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        // 去掉 "Bearer " 前缀（7个字符）
        return authHeader.substring(7);
    }

    // 方式2：从 Cookie 提取（需要 cookie-parser 中间件）
    if (req.cookies && req.cookies.token) {
        return req.cookies.token;
    }

    return null;
}

// ============================================
// 4. 导出模块
// ============================================
module.exports = {
    generateToken,   // 生成 Token
    verifyToken,     // 验证 Token
    extractToken,    // 提取 Token
    JWT_SECRET,      // 密钥（高级用法）
    JWT_EXPIRES_IN   // 过期时间
};