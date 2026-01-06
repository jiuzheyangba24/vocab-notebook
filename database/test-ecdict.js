// 测试 ECDICT 词典查询
const { query, closePool } = require('./connection');

async function test() {
    try {
        const result = await query(
            'SELECT word, phonetic, translation, pos, collins, tag FROM ecdict WHERE word = ?',
            ['hello']
        );
        console.log('查询结果:');
        console.log(JSON.stringify(result[0], null, 2));
    } catch (err) {
        console.error('错误:', err.message);
    } finally {
        await closePool();
    }
}

test();
