<div align="center">

# 📘 Vocab Notebook
### 英语四级/六级 & 考研词汇生词本

一个轻量级、跨平台的英语词汇学习工具。
支持 PWA 离线使用、Android 原生体验，助你高效备考。

[在线体验](https://jiuzheyangba24.github.io/vocab-notebook/) · [下载 APK](https://github.com/jiuzheyangba24/vocab-notebook/releases) · [报告问题](https://github.com/jiuzheyangba24/vocab-notebook/issues)

![License](https://img.shields.io/github/license/jiuzheyangba24/vocab-notebook)
![GitHub stars](https://img.shields.io/github/stars/jiuzheyangba24/vocab-notebook?style=social)
![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Android%20%7C%20PWA-blue)

</div>

---

## ✨ 核心亮点

- **📱 多端支持**：网页版 (GitHub Pages)、PWA (可安装到桌面/手机)、Android 原生 App。
- **🔌 离线可用**：基于 Service Worker 缓存，无网也能背单词。
- **💾 数据自由**：词库存储在本地 (LocalStorage)，支持 JSON 导入/导出，数据由你掌控。
- **🎯 科学测验**：
    - **英译中 / 中译英**：双向互译，强化记忆。
    - **填空测试**：结合例句语境，提升实战能力。
    - **单词拼写**：键盘输入检查，杜绝"提笔忘字"。
- **📝 智能错题本**：自动记录答错单词，支持"仅测错题"，精准攻克薄弱点。
- **⚡️ 高效管理**：
    - 自动调用第三方 API 获取释义、音标、例句。
    - 支持批量添加、一键清空错题。

## 📸 预览

> (建议在此处上传截图：主页、测试界面、错题本)

| 主页 | 测试模式 | 错题本 |
|:---:|:---:|:---:|
| ![Home](https://via.placeholder.com/200x400?text=Home) | ![Test](https://via.placeholder.com/200x400?text=Test) | ![Wrong](https://via.placeholder.com/200x400?text=Wrong) |

## 🚀 快速开始

### 1. 在线使用 (推荐)
直接访问 GitHub Pages：
👉 **[https://jiuzheyangba24.github.io/vocab-notebook/](https://jiuzheyangba24.github.io/vocab-notebook/)**

### 2. 安装 Android App
前往 [Releases](https://github.com/jiuzheyangba24/vocab-notebook/releases) 页面下载最新的 `.apk` 安装包。

### 3. 本地开发
如果你想二次开发或在本地运行：

```bash
# 克隆仓库
git clone https://github.com/jiuzheyangba24/vocab-notebook.git

# 进入目录
cd vocab-notebook

# 安装依赖
npm install

# 启动开发服务器
npm start
```
访问 `http://localhost:3000` 即可。

## 🛠️ 技术栈

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **PWA**: Manifest, Service Worker (Cache Strategy)
- **Mobile**: Capacitor (Android Build)
- **Backend (Local)**: Node.js + Express (可选，仅用于本地开发时的 JSON 文件读写)
- **Deployment**: GitHub Pages (Static Hosting)

## 📂 目录结构

```text
.
├── android/            # Android 工程文件 (Capacitor)
├── www/                # 静态资源构建目录 (发布用)
│   ├── index.html
│   ├── style.css
│   └── script.js
├── index.html          # 开发源文件
├── script.js           # 核心逻辑
├── service-worker.js   # PWA 离线缓存策略
├── capacitor.config.json # Capacitor 配置
└── vocabulary.json     # 默认词库
```

## 🤝 贡献

欢迎提交 Issue 或 Pull Request！
1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📄 许可证

本项目采用 [MIT](LICENSE) 许可证。
