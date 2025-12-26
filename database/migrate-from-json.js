// 将JSON数据迁移到MySQL数据库
const fs = require('fs').promises;
const { query, testConnection, closePool } = require('./connection');

async function migrateData() {
    console.log('🚀 开始数据迁移...\n');
    
    // 测试连接
    const connected = await testConnection();
    if (!connected) {
        console.log('❌ 数据库连接失败，请先检查连接');
        process.exit(1);
    }
    
    try {
        // 读取JSON文件
        console.log('📖 读取 vocabulary.json...');
        const jsonData = await fs.readFile('./vocabulary.json', 'utf8');
        const words = JSON.parse(jsonData);
        console.log(`✅ 找到 ${words.length} 个单词\n`);
        
        // 使用测试用户 (user_id = 1)
        const userId = 1;
        
        let successCount = 0;
        let errorCount = 0;
        const errors = [];
        
        console.log('📝 开始迁移单词...');
        
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            
            try {
                // 转换ISO日期为MySQL格式
                let createdAt = new Date();
                if (word.createdAt) {
                    createdAt = new Date(word.createdAt);
                }
                const mysqlDate = createdAt.toISOString().slice(0, 19).replace('T', ' ');
                
                // 插入单词
                await query(`
                    INSERT INTO words (
                        user_id,
                        word,
                        translation,
                        phonetic,
                        example_sentence,
                        created_at
                    ) VALUES (?, ?, ?, ?, ?, ?)
                `, [
                    userId,
                    word.headWord || '',
                    word.definition || '',
                    word.pronunciation || '',
                    word.sentences ? word.sentences.join('\n') : '',
                    mysqlDate
                ]);
                
                successCount++;
                
                // 显示进度
                if ((i + 1) % 10 === 0 || i === words.length - 1) {
                    const progress = Math.round(((i + 1) / words.length) * 100);
                    console.log(`   进度: ${i + 1}/${words.length} (${progress}%)`);
                }
                
            } catch (error) {
                errorCount++;
                errors.push({
                    word: word.headWord,
                    error: error.message
                });
            }
        }
        
        console.log('\n✨ 迁移完成！');
        console.log(`✅ 成功: ${successCount} 个单词`);
        
        if (errorCount > 0) {
            console.log(`❌ 失败: ${errorCount} 个单词`);
            console.log('\n失败详情:');
            errors.forEach(err => {
                console.log(`   - ${err.word}: ${err.error}`);
            });
        }
        
        // 验证迁移结果
        console.log('\n🔍 验证迁移结果...');
        const result = await query('SELECT COUNT(*) as count FROM words WHERE user_id = ?', [userId]);
        console.log(`✅ 数据库中现有 ${result[0].count} 个单词`);
        
        // 显示一些示例
        console.log('\n📚 示例单词:');
        const samples = await query('SELECT word, translation, phonetic FROM words WHERE user_id = ? LIMIT 5', [userId]);
        samples.forEach(w => {
            console.log(`   - ${w.word} [${w.phonetic}]: ${w.translation}`);
        });
        
    } catch (error) {
        console.error('❌ 迁移过程出错:', error.message);
        process.exit(1);
    } finally {
        await closePool();
    }
}

// 运行迁移
migrateData().catch(error => {
    console.error('迁移失败:', error);
    process.exit(1);
});