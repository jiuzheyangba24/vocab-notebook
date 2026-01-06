/**
 * ============================================
 * 数据库连接配置和工具函数
 * ============================================
 * 
 * 这个文件负责：
 * 1. 创建 MySQL 数据库连接池
 * 2. 提供查询、事务等工具函数
 * 3. 管理数据库连接的生命周期
 * 
 * 依赖：mysql2/promise （支持 async/await 的 MySQL 驱动）
 */

const mysql = require('mysql2/promise');  // MySQL 驱动，promise 版本
require('dotenv').config();                // 加载 .env 环境变量

// ============================================
// 1. 创建数据库连接池
// ============================================
/**
 * 连接池（Connection Pool）的优势：
 * - 复用连接：避免每次请求都创建新连接
 * - 提高性能：减少连接创建/销毁的开销
 * - 控制并发：限制最大连接数，防止数据库过载
 * 
 * 配置参数说明：
 * - host: 数据库服务器地址（从环境变量读取）
 * - port: 数据库端口，默认 3306
 * - user: 数据库用户名
 * - password: 数据库密码
 * - database: 数据库名称
 * - waitForConnections: 无可用连接时是否等待
 * - connectionLimit: 连接池最大连接数（10个）
 * - queueLimit: 等待队列最大长度（0=无限制）
 * - enableKeepAlive: 启用 TCP 保活机制
 */
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',     // 数据库主机
    port: process.env.DB_PORT || 3306,            // 数据库端口
    user: process.env.DB_USER || 'root',          // 用户名
    password: process.env.DB_PASSWORD,             // 密码（必须在 .env 中设置）
    database: process.env.DB_NAME || 'vocab_learning_system',  // 数据库名
    waitForConnections: true,   // 当没有可用连接时，是否等待
    connectionLimit: 10,        // 最大连接数
    queueLimit: 0,              // 等待队列大小（0表示不限制）
    enableKeepAlive: true,      // TCP 保活
    keepAliveInitialDelay: 0    // 保活初始延迟
});

// ============================================
// 2. 测试数据库连接
// ============================================
/**
 * 测试数据库是否能够正常连接
 * 
 * 用途：服务器启动时检查数据库可用性
 * 
 * @returns {Promise<boolean>} 连接成功返回 true，失败返回 false
 */
async function testConnection() {
    try {
        // 尝试获取一个连接
        const connection = await pool.getConnection();
        console.log('✅ 数据库连接成功！');

        // 释放连接回连接池（重要！否则连接会被耗尽）
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ 数据库连接失败:', error.message);
        return false;
    }
}

// ============================================
// 3. 执行 SQL 查询
// ============================================
/**
 * 执行 SQL 查询（支持参数化查询）
 * 
 * 参数化查询的好处：
 * - 防止 SQL 注入攻击
 * - 自动处理特殊字符转义
 * 
 * @param {string} sql - SQL 语句，使用 ? 作为占位符
 * @param {Array} params - 参数数组，按顺序替换 ?
 * @returns {Promise<Array>} 查询结果
 * 
 * 使用示例：
 * const users = await query('SELECT * FROM users WHERE id = ?', [1]);
 * const result = await query('INSERT INTO words (word) VALUES (?)', ['apple']);
 */
async function query(sql, params = []) {
    try {
        // pool.execute 自动从池中获取连接、执行查询、释放连接
        // 返回值是 [rows, fields]，我们只需要 rows
        const [results] = await pool.execute(sql, params);
        return results;
    } catch (error) {
        console.error('数据库查询错误:', error.message);
        throw error;  // 向上抛出错误，让调用者处理
    }
}

// ============================================
// 4. 执行数据库事务
// ============================================
/**
 * 执行数据库事务
 * 
 * 事务的特性（ACID）：
 * - 原子性：事务中的操作要么全部成功，要么全部失败
 * - 一致性：事务前后数据保持一致
 * - 隔离性：事务之间互不干扰
 * - 持久性：事务完成后数据持久保存
 * 
 * @param {Function} callback - 事务操作回调函数
 * @returns {Promise<any>} 事务执行结果
 * 
 * 使用示例：
 * const result = await transaction(async (conn) => {
 *     await conn.execute('INSERT INTO users ...', [...]);
 *     await conn.execute('INSERT INTO words ...', [...]);
 *     return { success: true };
 * });
 */
async function transaction(callback) {
    // 从池中获取一个专用连接（事务必须在同一连接上执行）
    const connection = await pool.getConnection();

    try {
        // 开始事务
        await connection.beginTransaction();

        // 执行事务操作
        const result = await callback(connection);

        // 提交事务
        await connection.commit();
        return result;
    } catch (error) {
        // 发生错误时回滚事务
        await connection.rollback();
        throw error;
    } finally {
        // 无论成功失败，最后都要释放连接
        connection.release();
    }
}

// ============================================
// 5. 关闭连接池
// ============================================
/**
 * 关闭数据库连接池
 * 
 * 用途：应用关闭时优雅地断开所有数据库连接
 * 
 * 注意：通常在进程退出时调用，如：
 * process.on('SIGTERM', async () => {
 *     await closePool();
 *     process.exit(0);
 * });
 */
async function closePool() {
    try {
        await pool.end();
        console.log('数据库连接池已关闭');
    } catch (error) {
        console.error('关闭连接池失败:', error.message);
    }
}

// ============================================
// 6. 导出模块
// ============================================
module.exports = {
    pool,           // 连接池实例（高级用法）
    query,          // 查询函数（最常用）
    transaction,    // 事务函数
    testConnection, // 连接测试
    closePool       // 关闭连接池
};