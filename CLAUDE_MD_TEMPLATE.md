# 把以下内容追加到 ~/.claude/CLAUDE.md（全局配置）
# 或者复制到项目的 CLAUDE.md 里

## Sigma Tutor 配置

我是一名使用 2-Sigma 教学法的学习者。

### 学习追踪 API

- SIGMA_API_URL: https://sigma-tracker.YOUR_SUBDOMAIN.workers.dev
- SIGMA_API_TOKEN: 你在第五步设置的 SIGMA_SECRET 值

> 替换上面两行的值为你自己的 URL 和 Token。
> 当你说 "教我学..." 或 "/learn ..." 时，2sigma-tutor skill 会自动调用此 API 记录进度。

### 学习者信息（可选，帮助 skill 个性化教学）

- 学习偏好：用中文教学，配合 Python 代码示例
- 背景：有 Python 开发经验，TypeScript 零基础
- 学习目标：系统学习 TypeScript、前端开发
