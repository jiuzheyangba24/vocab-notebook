// 查看 ECDICT 词典数据
const db = require('./connection');

async function showDictionary() {
    console.log('=========================================');
    console.log('        ECDICT 词典数据示例');
    console.log('=========================================\n');

    // 统计总数
    const countResult = await db.query('SELECT COUNT(*) as total FROM ecdict');
    console.log('词条总数:', countResult[0].total.toLocaleString(), '\n');

    // 查看常见单词
    console.log('--- 常见单词示例 ---');
    const common = ['hello', 'world', 'love', 'happy', 'study'];
    for (const word of common) {
        const result = await db.query(
            'SELECT word, phonetic, translation, collins, tag FROM ecdict WHERE word = ?',
            [word]
        );
        if (result.length > 0) {
            const r = result[0];
            console.log(`\n${r.word}`);
            console.log(`  音标: ${r.phonetic || '无'}`);
            console.log(`  释义: ${r.translation}`);
            console.log(`  柯林斯: ${r.collins || '未评级'}星`);
            console.log(`  考试: ${r.tag || '无'}`);
        }
    }

    await db.closePool();
}

showDictionary().catch(console.error);
