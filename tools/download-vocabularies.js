/**
 * 下载 KyleBing 词库数据到本地
 * 
 * 使用方法：node tools/download-vocabularies.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const vocabularies = [
    {
        id: 'chuzhong',
        name: '初中词汇',
        url: 'https://raw.githubusercontent.com/KyleBing/english-vocabulary/master/json/1-初中-顺序.json'
    },
    {
        id: 'gaozhong',
        name: '高中词汇',
        url: 'https://raw.githubusercontent.com/KyleBing/english-vocabulary/master/json/2-高中-顺序.json'
    },
    {
        id: 'cet4',
        name: '四级词汇',
        url: 'https://raw.githubusercontent.com/KyleBing/english-vocabulary/master/json/3-CET4-顺序.json'
    },
    {
        id: 'cet6',
        name: '六级词汇',
        url: 'https://raw.githubusercontent.com/KyleBing/english-vocabulary/master/json/4-CET6-顺序.json'
    },
    {
        id: 'kaoyan',
        name: '考研词汇',
        url: 'https://raw.githubusercontent.com/KyleBing/english-vocabulary/master/json/5-考研-顺序.json'
    },
    {
        id: 'toefl',
        name: '托福词汇',
        url: 'https://raw.githubusercontent.com/KyleBing/english-vocabulary/master/json/6-托福-顺序.json'
    },
    {
        id: 'sat',
        name: 'SAT词汇',
        url: 'https://raw.githubusercontent.com/KyleBing/english-vocabulary/master/json/7-SAT-顺序.json'
    }
];

const outputDir = path.join(__dirname, '..', 'frontend', 'public', 'vocabularies');

// 确保输出目录存在
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

function downloadFile(url, destPath, name) {
    return new Promise((resolve, reject) => {
        console.log(`📥 下载 ${name}...`);

        const request = (urlToFetch) => {
            https.get(urlToFetch, (response) => {
                // 处理重定向
                if (response.statusCode === 301 || response.statusCode === 302) {
                    request(response.headers.location);
                    return;
                }

                if (response.statusCode !== 200) {
                    reject(new Error(`HTTP ${response.statusCode}`));
                    return;
                }

                let data = '';
                response.on('data', (chunk) => {
                    data += chunk;
                });

                response.on('end', () => {
                    try {
                        // 验证 JSON 格式
                        const parsed = JSON.parse(data);
                        fs.writeFileSync(destPath, JSON.stringify(parsed, null, 2), 'utf-8');
                        console.log(`   ✅ ${name}: ${parsed.length} 词`);
                        resolve(parsed.length);
                    } catch (e) {
                        reject(new Error(`JSON 解析失败: ${e.message}`));
                    }
                });
            }).on('error', reject);
        };

        request(url);
    });
}

async function main() {
    console.log('========================================');
    console.log('   下载 KyleBing 词库数据');
    console.log('========================================\n');
    console.log(`📂 输出目录: ${outputDir}\n`);

    let totalWords = 0;

    for (const vocab of vocabularies) {
        const destPath = path.join(outputDir, `${vocab.id}.json`);
        try {
            const count = await downloadFile(vocab.url, destPath, vocab.name);
            totalWords += count;
        } catch (e) {
            console.error(`   ❌ ${vocab.name}: ${e.message}`);
        }
    }

    console.log('\n========================================');
    console.log(`   下载完成！共 ${totalWords.toLocaleString()} 词`);
    console.log('========================================\n');
}

main();
