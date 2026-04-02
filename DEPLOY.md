# Sigma Tracker Worker — 完整部署指南

## 前提条件

- Node.js 18+（已有）
- 免费 Cloudflare 账号：https://dash.cloudflare.com/sign-up
- 信用卡**不需要**，免费计划足够个人使用

---

## 第一步：注册 Cloudflare 账号

1. 打开 https://dash.cloudflare.com/sign-up
2. 填写邮箱 + 密码注册
3. 验证邮箱（收到验证邮件，点击链接）
4. 登录后进入 Dashboard，不需要添加域名，直接用 `*.workers.dev` 子域名

---

## 第二步：安装 Wrangler 并登录

```bash
# 安装 Wrangler（Cloudflare 官方 CLI）
npm install -g wrangler

# 登录（会打开浏览器授权）
wrangler login
```

登录成功后终端显示：
```
Successfully logged in.
```

---

## 第三步：进入项目目录，安装依赖

```bash
cd D:/code/sigma-tracker-worker
npm install
```

---

## 第四步：创建 KV Namespace（数据库）

KV 是 Cloudflare 的键值存储，用来保存你的学习数据。

```bash
# 创建生产环境 KV
wrangler kv namespace create SIGMA_KV
```

输出类似：
```
✅ Successfully created namespace "SIGMA_KV"
Add the following to your wrangler.toml:
[[kv_namespaces]]
binding = "KV"
id = "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4"
```

```bash
# 创建开发预览 KV（本地测试用）
wrangler kv namespace create SIGMA_KV --preview
```

输出：
```
preview_id = "x1y2z3..."
```

**把两个 id 填入 wrangler.toml：**

```bash
# 打开 wrangler.toml，把 REPLACE_WITH_YOUR_KV_NAMESPACE_ID 替换掉
```

`wrangler.toml` 改成：
```toml
name = "sigma-tracker"
main = "src/index.ts"
compatibility_date = "2025-04-01"
compatibility_flags = ["nodejs_compat"]

[[kv_namespaces]]
binding = "KV"
id = "a1b2c3d4e5f6..."        # 换成你的 id
preview_id = "x1y2z3..."      # 换成你的 preview_id
```

---

## 第五步：设置访问密钥（Secret）

```bash
wrangler secret put SIGMA_SECRET
```

终端提示输入密钥值，输入一个你自己设定的字符串，例如：
```
sigma_abc123xyz_my_private_key
```

> 这个字符串就是你调用 API 时的 Bearer Token，记下来。

---

## 第六步：部署

```bash
wrangler deploy
```

输出类似：
```
✅ Deployed sigma-tracker
   https://sigma-tracker.<你的子域名>.workers.dev
```

记录这个 URL，后面配置 Claude Code 要用。

---

## 第七步：验证部署

```bash
# 健康检查（不需要 token）
curl https://sigma-tracker.<你的子域名>.workers.dev/health
# 返回: {"status":"ok","version":"1.0.0"}

# 测试记录学习（替换 token 和 URL）
curl -X POST https://sigma-tracker.<你的子域名>.workers.dev/record \
  -H "Authorization: Bearer sigma_abc123xyz_my_private_key" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Python/装饰器/基础装饰器",
    "mastery_level": 0.7,
    "notes": "理解了基本用法",
    "session_type": "learn"
  }'
```

返回类似：
```json
{
  "record_id": "xxx",
  "topic_path": "Python/装饰器/基础装饰器",
  "mastery_level": 0.7,
  "bkt_state": { "p_known": 0.412 },
  "next_review": "2025-04-05T14:00:00.000Z",
  "interval_days": 3
}
```

---

## 第八步：配置 Claude Code

在你的全局 `~/.claude/CLAUDE.md` 或项目 `CLAUDE.md` 里添加：

```markdown
## Sigma Tracker 配置

我的学习追踪 API：
- SIGMA_API_URL: https://sigma-tracker.<你的子域名>.workers.dev
- SIGMA_API_TOKEN: sigma_abc123xyz_my_private_key
```

> **安全提示**：CLAUDE.md 只存在本地，不会被提交到 git（除非你手动提交）。
> 不要把 token 放进公开仓库。

---

## 第九步：验证 Claude Code 集成

打开 Claude Code，输入：

```
/learn Python 装饰器
```

如果 skill 正常工作，Claude 会在教学过程中自动调用 Workers API 记录进度。你可以随时问：

```
/review-progress
```

查看进度数据。

---

## 第二台设备（跨设备同步）

在另一台电脑上：

1. 安装 Claude Code
2. 在 `~/.claude/CLAUDE.md` 里写上**同样的** URL 和 token
3. 打开 Claude Code，历史学习数据自动从云端加载，无需任何同步操作

数据存在 Cloudflare KV，全球可访问，没有设备限制。

---

## 本地开发模式

如果你想修改代码后本地测试：

```bash
cd D:/code/sigma-tracker-worker
wrangler dev
# 本地运行在 http://localhost:8787
```

本地测试时，secret 通过 `.dev.vars` 文件设置：
```bash
# 创建 .dev.vars（不要提交到 git！）
echo "SIGMA_SECRET=sigma_abc123xyz_my_private_key" > .dev.vars
```

---

## 费用说明

Cloudflare Workers 免费计划：

| 资源 | 免费额度 | 个人使用预估 |
|------|---------|------------|
| Workers 请求 | 每天 10 万次 | 每天学习 100 个知识点 ≈ 300 次请求 |
| KV 读取 | 每天 10 万次 | 够用 |
| KV 写入 | 每天 1000 次 | 够用 |
| KV 存储 | 1 GB | 学习数据很小，几 MB 量级 |

**完全免费**，无需信用卡。超出后升级到 $5/月 Workers Paid 计划。

---

## 常见问题

**Q: wrangler login 打开浏览器失败？**
```bash
wrangler login --no-browser
# 会输出一个 URL，手动复制到浏览器打开
```

**Q: 部署报错 "KV namespace not found"？**
检查 wrangler.toml 里的 id 是否正确填写，不要有多余空格。

**Q: API 返回 401 Unauthorized？**
检查 Authorization header 格式：`Bearer <token>`，Bearer 后面有空格。

**Q: 想重置所有学习数据？**
```bash
# 删除 KV namespace 里所有数据（慎用）
wrangler kv namespace delete --namespace-id <你的id>
# 然后重新创建
wrangler kv namespace create SIGMA_KV
```

**Q: 想看 KV 里存了什么？**
```bash
# 列出所有 key
wrangler kv key list --namespace-id <你的id>
```
