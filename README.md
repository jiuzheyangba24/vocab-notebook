# vocab-notebook

一个轻量的生词本与测验应用，包含后端数据库持久化、错题本复习、测试统计与键盘快捷操作。适合个人英语词汇学习与巩固。

## 功能概览
- 生词管理：查看当前词、上一词/下一词、添加、按 `id` 删除。
- 后端 API：Node.js + Express 提供词库读写（JSON 文件持久化）。
- 测试模式：英译中 / 中译英 / 填空测试 / 单词拼写。
- 测试设置：可选择测试模式、题目数量，并支持“仅测错题”。
- 错题本：自动记录错题，支持查看与一键清空。
- 统计与反馈：每题即时反馈；结束时显示答对数、答错数、正确率与总题数。
- 键盘快捷键：
  - 空格键：在测试中智能触发“显示答案/下一题”，拼写模式会自动聚焦输入框。
  - 回车键：拼写模式提交答案。

## 目录结构
```
./
├── index.html        # 前端页面
├── script.js         # 前端逻辑（含测试、错题本、快捷键）
├── style.css         # 基本样式
├── server.js         # 后端服务（Express 静态与 API）
├── vocabulary.json   # 词库数据库（JSON 持久化）
├── api_response.json # 示例接口响应（用于参考）
├── package.json      # 项目配置与脚本
├── .gitignore        # Git 忽略文件
└── README.md         # 项目说明
```

## 快速开始
- 环境要求：Node.js 16+（推荐 LTS）。
- 安装依赖：
  ```bash
  npm install
  ```
- 启动服务器：
  ```bash
  npm start
  # 或开发模式自动重启：
  npm run dev
  ```
- 打开浏览器访问：`http://localhost:3000`

## 使用说明
- 在“测试设置”中选择测试模式与题目数量。
- 可勾选“仅测错题”从错题本抽题（自动去重并按唯一词数限制题量）。
- 测试时：
  - 选择题直接点击选项；
  - 拼写模式在输入框输入英文单词并“检查”，支持回车提交；
  - 按空格键可快速显示答案并进入下一题。
- 测试结束会显示详细统计；错题会记录到本地浏览器 `localStorage` 的 `wrongQuestions`。

## 后端 API
- `GET /api/words`：获取全部单词。
- `GET /api/words/count`：获取词数 `{ count: number }`。
- `POST /api/words`：新增单词。
- `DELETE /api/words/:id`：按 `id` 删除单词。

### 数据结构示例（`vocabulary.json`）
```json
[
  {
    "id": "uuid-or-number",
    "headWord": "hello",
    "definition": "喂；你好",
    "sentences": ["Hello, John! How are you?"],
    "synonyms": ["hallo"],
    "pronunciation": "hə'ləʊ"
  }
]
```

## 常见问题
- 无法开始选择题测试：请确保题库（或错题池）至少包含 4 个单词。
- 删除失败：后端删除接口使用 `id`，前端需要传递 `word.id`，不是 `headWord`。
- 计数接口路径：前端应请求 `GET /api/words/count`（不是 `/api/word-count`）。
- 端口占用：默认端口为 `3000`，如需修改可在 `server.js` 中调整。

## 推送到 GitHub
仓库已初始化并设置主分支为 `main`。如需推送：
```bash
# 绑定远程（替换为你的地址）
git remote set-url origin https://github.com/<your-username>/vocab-notebook.git
# 提交并推送
git add -A
git commit -m "更新说明"
git push -u origin main
```

## 后续规划（建议）
- 错题按原始测试模式进行定向复习。
- 导入/导出词库与错题本。
- 更细粒度统计（按词、按模式、时间维度）。

如需我帮你补充截图、演示 GIF 或中英文双语说明，告诉我你偏好内容即可，我会继续完善。