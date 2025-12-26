<div align="center">

# 🌸 Vocab Notebook
### 智能英语词汇学习系统

一个现代化的全栈英语词汇学习应用，支持 AI 智能助手、科学复习算法、精美樱花主题，帮助你高效备考四六级和考研词汇。

[在线体验](https://jiuzheyangba24.github.io/vocab-notebook/) · [下载 APK](https://github.com/jiuzheyangba24/vocab-notebook/releases) · [报告问题](https://github.com/jiuzheyangba24/vocab-notebook/issues)

![License](https://img.shields.io/github/license/jiuzheyangba24/vocab-notebook)
![Vue](https://img.shields.io/badge/Vue-3.5-42b883)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933)
![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Android%20%7C%20PWA-blue)

</div>

---

## ✨ 核心功能

### 📚 词库管理
- **多词库支持**：内置初中、高中、四级、六级、考研等官方词库
- **自定义词库**：支持手动添加单词，自动获取释义和例句
- **批量导入**：支持 JSON/CSV 格式导入导出词库

### 🎯 科学学习
- **艾宾浩斯记忆曲线**：智能安排复习时间，科学抗遗忘
- **多种测试模式**：英译中、中译英、填空、拼写等
- **掌握度追踪**：实时显示每个单词的学习进度

### 🤖 AI 智能助手
- **浮动小部件**：可拖拽的 AI 助手，随时随地提问
- **单词查询**：详细解释单词含义、用法和例句
- **学习建议**：根据学习数据提供个性化建议
- **Markdown 渲染**：AI 回复支持代码块、列表等格式化显示

### 📊 学习统计
- **可视化图表**：掌握度分布、学习趋势、每日统计
- **打卡日历**：记录连续学习天数，激励坚持
- **分享成就**：一键生成学习海报分享到社交平台

### 🎨 精美界面
- **樱花主题**：浪漫的樱花飘落动画登录页
- **毛玻璃效果**：现代 Glassmorphism 设计风格
- **响应式布局**：完美适配桌面端和移动端

---

## 📸 界面预览

| 登录页 | 首页仪表盘 | AI 助手 |
|:---:|:---:|:---:|
| 🌸 樱花动画背景 | 📊 学习进度总览 | 🤖 智能问答 |

| 词库浏览 | 学习界面 | 统计分析 |
|:---:|:---:|:---:|
| 📚 分类词库管理 | 📝 卡片式学习 | 📈 可视化图表 |

---

## 🚀 快速开始

### 环境要求
- Node.js 18+
- MySQL 8.0+
- npm 或 pnpm

### 1. 克隆项目
```bash
git clone https://github.com/jiuzheyangba24/vocab-notebook.git
cd vocab-notebook
```

### 2. 安装依赖
```bash
# 安装后端依赖
npm install

# 安装前端依赖
cd frontend
npm install
cd ..
```

### 3. 配置数据库
```bash
# 创建 .env 文件
cp .env.example .env

# 编辑 .env 文件，配置 MySQL 连接信息
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=vocab_learning_system

# 导入数据库结构
mysql -u root -p < database/schema.sql
```

### 4. 启动项目
```bash
# 启动后端服务 (端口 3000)
npm run start

# 新开终端，启动前端开发服务器 (端口 5173)
cd frontend
npm run dev
```

访问 `http://localhost:5173` 开始使用！

---

## 🛠️ 技术栈

### 前端
- **框架**: Vue 3 + Composition API
- **构建**: Vite 7
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **样式**: SCSS + CSS Variables
- **图标**: Lucide Vue Next
- **图表**: HTML5 Canvas (自定义实现)
- **图片生成**: html2canvas
- **Markdown**: marked

### 后端
- **运行时**: Node.js
- **框架**: Express.js
- **数据库**: MySQL 8.0
- **认证**: JWT (JSON Web Token)
- **密码加密**: bcrypt

### AI 服务
- **提供商**: 阿里云 DashScope (通义千问)
- **模型**: qwen-turbo

### 部署
- **前端**: GitHub Pages / Vercel
- **移动端**: Capacitor (Android)
- **PWA**: Service Worker 离线缓存

---

## 📂 项目结构

```text
vocab-notebook/
├── frontend/                 # Vue 3 前端项目
│   ├── src/
│   │   ├── components/       # 可复用组件
│   │   │   ├── layout/       # 布局组件 (Header, Nav, Container)
│   │   │   ├── AIAssistantWidget.vue  # AI 助手浮动组件
│   │   │   ├── SakuraBackground.vue   # 樱花动画背景
│   │   │   └── ...
│   │   ├── views/            # 页面组件
│   │   │   ├── DashboardView.vue      # 首页仪表盘
│   │   │   ├── LibraryView.vue        # 词库管理
│   │   │   ├── StudyView.vue          # 学习界面
│   │   │   ├── QuizView.vue           # 测试界面
│   │   │   ├── StatisticsView.vue     # 统计分析
│   │   │   └── ...
│   │   ├── composables/      # 组合式函数
│   │   │   ├── useAI.js      # AI API 封装
│   │   │   ├── useApi.js     # 后端 API 封装
│   │   │   └── useSpacedRepetition.js # 间隔重复算法
│   │   ├── stores/           # Pinia 状态管理
│   │   └── router/           # 路由配置
│   └── package.json
├── database/                 # 数据库相关
│   ├── schema.sql            # 数据库结构
│   └── connection.js         # 数据库连接配置
├── auth/                     # 认证模块
│   └── middleware.js         # JWT 中间件
├── server.js                 # Express 后端入口
├── android/                  # Capacitor Android 工程
└── package.json              # 后端依赖
```

---

## 📊 数据库设计

主要数据表：
- `users` - 用户信息 (用户名、密码、学习统计)
- `words` - 单词数据 (单词、释义、例句、掌握度)
- `study_records` - 学习记录 (学习模式、正确率)
- `wrong_questions` - 错题本
- `daily_statistics` - 每日统计
- `study_plans` - 学习计划

---

## 🤝 贡献

欢迎提交 Issue 或 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

---

## 📄 许可证

本项目采用 [MIT](LICENSE) 许可证。

---

<div align="center">

**Made with ❤️ by [jiuzheyangba24](https://github.com/jiuzheyangba24)**

⭐ 如果这个项目对你有帮助，请给一个 Star！

</div>
