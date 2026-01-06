/**
 * ============================================
 * ECDICT 词典数据导入脚本
 * ============================================
 * 
 * 功能：下载并导入 ECDICT 开源词典数据到 MySQL
 * 
 * 使用方法：
 *   node database/import-ecdict.js
 * 
 * 数据来源：https://github.com/skywind3000/ECDICT
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const https = require('https');
const { query, testConnection, closePool } = require('./connection');

// ECDICT 下载地址（GitHub Release）
const ECDICT_CSV_URL = 'https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv';
const LOCAL_CSV_PATH = path.join(__dirname, 'ecdict.csv');
const LOCAL_CSV_PATH_ALT = path.join(__dirname, 'ECDICT-1.0.28', 'ecdict.csv'); // 解压后的子目录

// 批量插入配置
const BATCH_SIZE = 500;  // 每批插入条数
const SKIP_HEADER = true; // 跳过CSV表头

/**
 * 下载文件
 */
async function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        console.log(`📥 开始下载: ${url}`);

        const file = fs.createWriteStream(destPath);

        const request = (urlToFetch) => {
            https.get(urlToFetch, (response) => {
                // 处理重定向
                if (response.statusCode === 301 || response.statusCode === 302) {
                    request(response.headers.location);
                    return;
                }

                if (response.statusCode !== 200) {
                    reject(new Error(`下载失败: HTTP ${response.statusCode}`));
                    return;
                }

                const totalBytes = parseInt(response.headers['content-length'] || 0);
                let downloadedBytes = 0;

                response.on('data', (chunk) => {
                    downloadedBytes += chunk.length;
                    if (totalBytes > 0) {
                        const percent = ((downloadedBytes / totalBytes) * 100).toFixed(1);
                        process.stdout.write(`\r下载进度: ${percent}%`);
                    }
                });

                response.pipe(file);

                file.on('finish', () => {
                    file.close();
                    console.log('\n✅ 下载完成！');
                    resolve();
                });
            }).on('error', (err) => {
                fs.unlink(destPath, () => { });
                reject(err);
            });
        };

        request(url);
    });
}

/**
 * 解析 CSV 行（处理带引号的字段）
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);

    return result;
}

/**
 * 批量插入数据
 */
async function insertBatch(batch) {
    if (batch.length === 0) return;

    const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
    const values = batch.flat();

    const sql = `
        INSERT INTO ecdict (word, phonetic, definition, translation, pos, collins, oxford, tag, bnc, frq, exchange, detail)
        VALUES ${placeholders}
        ON DUPLICATE KEY UPDATE
            phonetic = VALUES(phonetic),
            definition = VALUES(definition),
            translation = VALUES(translation),
            pos = VALUES(pos),
            collins = VALUES(collins),
            oxford = VALUES(oxford),
            tag = VALUES(tag),
            bnc = VALUES(bnc),
            frq = VALUES(frq),
            exchange = VALUES(exchange),
            detail = VALUES(detail)
    `;

    await query(sql, values);
}

/**
 * 导入 CSV 数据到数据库
 */
async function importCSV(csvPath) {
    console.log(`📂 开始导入: ${csvPath}`);

    const fileStream = fs.createReadStream(csvPath, { encoding: 'utf-8' });
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let lineCount = 0;
    let importedCount = 0;
    let batch = [];
    let isFirstLine = true;

    for await (const line of rl) {
        lineCount++;

        // 跳过表头
        if (isFirstLine && SKIP_HEADER) {
            isFirstLine = false;
            continue;
        }

        try {
            // CSV 格式: word,phonetic,definition,translation,pos,collins,oxford,tag,bnc,frq,exchange,detail,audio
            const fields = parseCSVLine(line);

            if (fields.length < 12 || !fields[0]) continue;

            const record = [
                fields[0]?.trim() || '',           // word
                fields[1]?.trim() || '',           // phonetic
                fields[2]?.trim() || '',           // definition
                fields[3]?.trim() || '',           // translation
                fields[4]?.trim() || '',           // pos
                fields[5] ? parseInt(fields[5]) || null : null, // collins
                fields[6] ? parseInt(fields[6]) || null : null, // oxford
                fields[7]?.trim() || '',           // tag
                fields[8] ? parseInt(fields[8]) || null : null, // bnc
                fields[9] ? parseInt(fields[9]) || null : null, // frq
                fields[10]?.trim() || '',          // exchange
                fields[11]?.trim() || ''           // detail
            ];

            batch.push(record);

            if (batch.length >= BATCH_SIZE) {
                await insertBatch(batch);
                importedCount += batch.length;
                process.stdout.write(`\r已导入: ${importedCount} 条`);
                batch = [];
            }
        } catch (err) {
            console.error(`\n行 ${lineCount} 解析错误:`, err.message);
        }
    }

    // 处理剩余数据
    if (batch.length > 0) {
        await insertBatch(batch);
        importedCount += batch.length;
    }

    console.log(`\n✅ 导入完成！共 ${importedCount} 条记录`);
    return importedCount;
}

/**
 * 创建表（如果不存在）
 */
async function createTable() {
    console.log('📋 检查/创建 ecdict 表...');

    const schemaPath = path.join(__dirname, 'ecdict_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // 只执行 CREATE TABLE 语句
    const createTableSQL = schema
        .split(';')
        .find(s => s.includes('CREATE TABLE'))
        ?.trim();

    if (createTableSQL) {
        await query(createTableSQL);
        console.log('✅ 表结构已就绪');
    }
}

/**
 * 主函数
 */
async function main() {
    console.log('========================================');
    console.log('   ECDICT 词典数据导入工具');
    console.log('========================================\n');

    try {
        // 1. 测试数据库连接
        console.log('🔍 测试数据库连接...');
        const connected = await testConnection();
        if (!connected) {
            throw new Error('数据库连接失败');
        }

        // 2. 创建表
        await createTable();

        // 3. 检查本地文件是否存在（优先检查子目录）
        let csvPath = null;
        if (fs.existsSync(LOCAL_CSV_PATH_ALT)) {
            csvPath = LOCAL_CSV_PATH_ALT;
            console.log(`📂 找到文件: ${csvPath}`);
        } else if (fs.existsSync(LOCAL_CSV_PATH)) {
            csvPath = LOCAL_CSV_PATH;
            console.log(`📂 找到文件: ${csvPath}`);
        }

        if (!csvPath) {
            console.log('\n⚠️  本地未找到 ecdict.csv 文件');
            console.log('📝 请手动下载 ECDICT 数据文件：');
            console.log('   1. 访问 https://github.com/skywind3000/ECDICT/releases');
            console.log('   2. 下载 Source code (zip)');
            console.log('   3. 解压后放到 database/ 目录下');
            console.log(`   4. 再次运行此脚本\n`);
            return;
        }

        // 4. 导入数据
        const count = await importCSV(csvPath);

        console.log('\n========================================');
        console.log(`   导入成功！共 ${count} 条词典记录`);
        console.log('========================================\n');

    } catch (error) {
        console.error('\n❌ 导入失败:', error.message);
    } finally {
        await closePool();
    }
}

// 执行主函数
main();
