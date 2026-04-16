# Sigma Tracker Worker

Cloudflare Workers + KV 实现的学习追踪后端。  
提供 BKT（贝叶斯知识追踪）+ SM-2（间隔重复）算法的 REST API，供 Claude Code 的 `2sigma-tutor` skill 调用。

## 架构

```
Claude Code (2sigma-tutor skill)
    │  WebFetch
    ▼
Cloudflare Workers  ←── SIGMA_SECRET (Bearer Token)
    │  KV read/write
    ▼
Cloudflare KV (学习数据持久化 + 自动跨设备同步)
```

## 部署（5分钟）

### 1. 安装 Wrangler

```bash
npm install -g wrangler
wrangler login
```

### 2. 创建 KV Namespace

```bash
wrangler kv:namespace create SIGMA_KV
# 输出类似: id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

wrangler kv:namespace create SIGMA_KV --preview
# 输出类似: preview_id = "yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy"
```

把两个 id 填入 `wrangler.toml`：
```toml
[[kv_namespaces]]
binding = "KV"
id = "填入上面的 id"
preview_id = "填入上面的 preview_id"
```

### 3. 设置密钥

```bash
wrangler secret put SIGMA_SECRET
# 输入一个随机字符串，例如: sigma_abc123xyz
```

### 4. 部署

```bash
npm install
wrangler deploy
# 输出: https://sigma-tracker.<your-subdomain>.workers.dev
```

### 5. 测试

```bash
curl https://sigma-tracker.<your>.workers.dev/health
# {"status":"ok","version":"1.0.0"}

curl -X POST https://sigma-tracker.<your>.workers.dev/record \
  -H "Authorization: Bearer sigma_abc123xyz" \
  -H "Content-Type: application/json" \
  -d '{"topic":"Python/装饰器/基础装饰器","mastery_level":0.7}'
```

---

## 在 Claude Code 中使用

在项目 `CLAUDE.md` 或全局 `~/.claude/CLAUDE.md` 中添加：

```markdown
## Sigma Tracker

学习追踪 API:
- SIGMA_API_URL: https://sigma-tracker.<你的子域名>.workers.dev
- SIGMA_API_TOKEN: (替换为你的真实 token)
```

`2sigma-tutor` skill 会自动通过 `WebFetch` 调用这些端点，替代本地 MCP 服务。

---

## API 参考

所有请求需要 `Authorization: Bearer <token>` header。

### POST /record

记录一次学习交互，更新 BKT 知识状态和 SM-2 复习计划。

```json
{
  "topic": "Python/装饰器/带参数装饰器",
  "mastery_level": 0.75,
  "notes": "理解了工厂函数模式",
  "session_type": "learn"
}
```

响应：
```json
{
  "topic_id": "...",
  "topic_path": "Python/装饰器/带参数装饰器",
  "mastery_level": 0.75,
  "bkt_state": { "p_known": 0.412, "p_correct": 0.381 },
  "next_review": "2025-04-05T14:00:00.000Z",
  "interval_days": 3
}
```

### GET /progress

查询学习进度。

```
GET /progress?topic=Python&period=7d
```

参数：
- `topic`（可选）：主题名称过滤
- `period`：`7d` / `30d` / `1w` / `all`（默认）

### GET /review-plan

获取今日复习计划（SM-2 调度）。

```
GET /review-plan?limit=20&include_future=true
```

### GET /mastery/:topic

评估主题掌握度，检查先决知识弱点。

```
GET /mastery/Python%2F装饰器?threshold=0.6
```

### POST /topics

管理知识树。

```json
{ "action": "list" }
{ "action": "add", "path": "Python/装饰器/类装饰器" }
{ "action": "rename", "id": "xxx", "name": "新名称" }
{ "action": "delete", "id": "xxx" }
```

### POST /prerequisites

管理先决知识关系。

```json
{ "action": "add", "topic": "带参数装饰器", "prerequisites": ["基础装饰器"] }
{ "action": "list", "topic": "带参数装饰器" }
```

---

## 本地开发

```bash
wrangler dev
# 本地运行在 http://localhost:8787
```

---

## 免费额度说明

Cloudflare Workers 免费计划：
- 每天 10 万次请求（每次学习打点 = ~3 次 KV 操作）
- KV 每天 10 万次读，1000 次写
- 存储 1GB

对于个人学习追踪完全够用。超出后 $5/月 可升级。
