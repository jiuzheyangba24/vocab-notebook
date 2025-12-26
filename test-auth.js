// 测试认证API
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// 测试数据
const testUser = {
    username: 'testuser2',
    email: 'testuser2@example.com',
    password: 'test123456',
    nickname: '测试用户2'
};

let authToken = '';

async function testRegister() {
    console.log('\n📝 测试用户注册...');
    try {
        const response = await axios.post(`${BASE_URL}/auth/register`, testUser);
        console.log('✅ 注册成功!');
        console.log('   用户ID:', response.data.user.userId);
        console.log('   用户名:', response.data.user.username);
        console.log('   Token:', response.data.token.substring(0, 20) + '...');
        authToken = response.data.token;
        return true;
    } catch (error) {
        if (error.response?.status === 409) {
            console.log('⚠️  用户已存在，跳过注册');
            return false;
        }
        console.error('❌ 注册失败:', error.response?.data || error.message);
        return false;
    }
}

async function testLogin() {
    console.log('\n🔐 测试用户登录...');
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            username: testUser.username,
            password: testUser.password
        });
        console.log('✅ 登录成功!');
        console.log('   用户ID:', response.data.user.userId);
        console.log('   用户名:', response.data.user.username);
        console.log('   Token:', response.data.token.substring(0, 20) + '...');
        authToken = response.data.token;
        return true;
    } catch (error) {
        console.error('❌ 登录失败:', error.response?.data || error.message);
        return false;
    }
}

async function testGetUserInfo() {
    console.log('\n👤 测试获取用户信息...');
    try {
        const response = await axios.get(`${BASE_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        console.log('✅ 获取用户信息成功!');
        console.log('   用户名:', response.data.user.username);
        console.log('   邮箱:', response.data.user.email);
        console.log('   昵称:', response.data.user.nickname);
        console.log('   学习天数:', response.data.user.total_study_days);
        console.log('   学习单词数:', response.data.user.total_words_learned);
        return true;
    } catch (error) {
        console.error('❌ 获取用户信息失败:', error.response?.data || error.message);
        return false;
    }
}

async function testAddWord() {
    console.log('\n📚 测试添加单词（需要认证）...');
    try {
        const response = await axios.post(`${BASE_URL}/words`, {
            headWord: 'authenticate',
            pronunciation: 'ɔːˈθentɪkeɪt',
            definition: '验证，鉴定',
            sentences: ['Please authenticate your identity.']
        }, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        console.log('✅ 添加单词成功!');
        console.log('   单词:', response.data.headWord);
        console.log('   释义:', response.data.definition);
        return true;
    } catch (error) {
        console.error('❌ 添加单词失败:', error.response?.data || error.message);
        return false;
    }
}

async function testGetWords() {
    console.log('\n📖 测试获取单词列表（需要认证）...');
    try {
        const response = await axios.get(`${BASE_URL}/words`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        console.log('✅ 获取单词列表成功!');
        console.log('   单词总数:', response.data.length);
        if (response.data.length > 0) {
            console.log('   第一个单词:', response.data[0].headWord);
        }
        return true;
    } catch (error) {
        console.error('❌ 获取单词列表失败:', error.response?.data || error.message);
        return false;
    }
}

async function testLogout() {
    console.log('\n👋 测试登出...');
    try {
        const response = await axios.post(`${BASE_URL}/auth/logout`, {}, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        console.log('✅ 登出成功!');
        return true;
    } catch (error) {
        console.error('❌ 登出失败:', error.response?.data || error.message);
        return false;
    }
}

async function runTests() {
    console.log('🚀 开始测试认证系统...\n');
    console.log('=' .repeat(50));
    
    // 测试注册
    const registered = await testRegister();
    
    // 如果注册失败（用户已存在），则测试登录
    if (!registered) {
        await testLogin();
    }
    
    // 测试获取用户信息
    if (authToken) {
        await testGetUserInfo();
        await testGetWords();
        await testAddWord();
        await testLogout();
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✨ 测试完成!\n');
}

// 运行测试
runTests().catch(error => {
    console.error('测试过程出错:', error);
    process.exit(1);
});