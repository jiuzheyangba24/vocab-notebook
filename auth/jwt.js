// JWT Token 管理
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * 生成JWT Token
 * @param {Object} payload - 要编码的数据（通常是用户信息）
 * @returns {String} JWT token
 */
function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN
    });
}

/**
 * 验证JWT Token
 * @param {String} token - JWT token
 * @returns {Object|null} 解码后的数据，如果无效则返回null
 */
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        console.error('Token验证失败:', error.message);
        return null;
    }
}

/**
 * 从请求头中提取token
 * @param {Object} req - Express请求对象
 * @returns {String|null} token或null
 */
function extractToken(req) {
    // 从Authorization header中提取
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    
    // 从cookie中提取（如果有）
    if (req.cookies && req.cookies.token) {
        return req.cookies.token;
    }
    
    return null;
}

module.exports = {
    generateToken,
    verifyToken,
    extractToken,
    JWT_SECRET,
    JWT_EXPIRES_IN
};