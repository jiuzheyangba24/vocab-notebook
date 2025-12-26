// 测试数据库连接
const { testConnection, query, closePool } = require('./connection');

async function runTests() {
    console.log('🔍 开始测试数据库连接...\n');
    
    // 测试1: 基本连接
    console.log('测试1: 基本连接');
    const connected = await testConnection();
    if (!connected) {
        console.log('\n❌ 连接失败，请检查：');
        console.log('1. MySQL服务是否运行');
        console.log('2. .env文件中的配置是否正确');
        console.log('3. 数据库是否已创建');
        process.exit(1);
    }
    
    // 测试2: 查询数据库信息
    console.log('\n测试2: 查询数据库信息');
    try {
        const dbInfo = await query('SELECT DATABASE() as current_db, VERSION() as version');
        console.log('✅ 当前数据库:', dbInfo[0].current_db);
        console.log('✅ MySQL版本:', dbInfo[0].version);
    } catch (error) {
        console.error('❌ 查询失败:', error.message);
    }
    
    // 测试3: 检查表是否存在
    console.log('\n测试3: 检查数据表');
    try {
        const tables = await query(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_TYPE = 'BASE TABLE'
        `);
        console.log(`✅ 找到 ${tables.length} 个数据表:`);
        tables.forEach(table => {
            console.log(`   - ${table.TABLE_NAME}`);
        });
    } catch (error) {
        console.error('❌ 查询表失败:', error.message);
    }
    
    // 测试4: 检查视图
    console.log('\n测试4: 检查视图');
    try {
        const views = await query(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_TYPE = 'VIEW'
        `);
        console.log(`✅ 找到 ${views.length} 个视图:`);
        views.forEach(view => {
            console.log(`   - ${view.TABLE_NAME}`);
        });
    } catch (error) {
        console.error('❌ 查询视图失败:', error.message);
    }
    
    // 测试5: 查询测试用户
    console.log('\n测试5: 查询测试用户');
    try {
        const users = await query('SELECT user_id, username, email, nickname FROM users');
        console.log(`✅ 找到 ${users.length} 个用户:`);
        users.forEach(user => {
            console.log(`   - ${user.username} (${user.email}) - ${user.nickname}`);
        });
    } catch (error) {
        console.error('❌ 查询用户失败:', error.message);
    }
    
    // 测试6: 测试插入和删除
    console.log('\n测试6: 测试数据操作');
    try {
        // 插入测试数据
        const insertResult = await query(
            'INSERT INTO words (user_id, word, translation) VALUES (?, ?, ?)',
            [1, 'test', '测试']
        );
        console.log('✅ 插入测试数据成功, ID:', insertResult.insertId);
        
        // 查询刚插入的数据
        const testWord = await query('SELECT * FROM words WHERE word_id = ?', [insertResult.insertId]);
        console.log('✅ 查询测试数据成功:', testWord[0].word);
        
        // 删除测试数据
        await query('DELETE FROM words WHERE word_id = ?', [insertResult.insertId]);
        console.log('✅ 删除测试数据成功');
    } catch (error) {
        console.error('❌ 数据操作失败:', error.message);
    }
    
    console.log('\n✨ 所有测试完成！');
    console.log('数据库连接正常，可以开始使用。\n');
    
    await closePool();
}

// 运行测试
runTests().catch(error => {
    console.error('测试过程出错:', error);
    process.exit(1);
});