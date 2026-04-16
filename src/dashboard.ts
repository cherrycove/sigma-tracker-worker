export function renderDashboard(): Response {
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Sigma Tracker</title>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700;900&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%23FF90E8'/%3E%3Crect x='2' y='2' width='60' height='60' rx='12' fill='%23FF90E8' stroke='%23000' stroke-width='3'/%3E%3Ctext x='32' y='46' font-family='serif' font-size='40' font-weight='900' text-anchor='middle' fill='%23000'%3E%CE%A3%3C/text%3E%3C/svg%3E">
<style>
  :root {
    --black: #000000;
    --white: #ffffff;
    --bg-cream: #F4F0EA;
    --candy-pink:   #FF90E8;
    --candy-yellow: #FFC900;
    --candy-blue:   #00E5FF;
    --candy-green:  #00D26A;
    --candy-orange: #FF4911;
    --border-thick: 3px solid var(--black);
    --border-thin:  2px solid var(--black);
    --shadow-solid: 4px 4px 0px var(--black);
    --shadow-hover: 6px 6px 0px var(--black);
    --radius-box:   12px;
    --radius-pill:  999px;
    --font-ui:   'Space Grotesk', -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
    --font-data: 'Space Mono', "PingFang SC", "Microsoft YaHei", monospace;
    --transition: all 150ms cubic-bezier(0.4,0,0.2,1);
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: var(--font-ui);
    background-color: var(--bg-cream);
    background-image: radial-gradient(var(--black) 1px, transparent 1px);
    background-size: 24px 24px;
    color: var(--black);
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* ── 粗野卡片 ── */
  .brutal-box {
    background: var(--white);
    border: var(--border-thick);
    border-radius: var(--radius-box);
    box-shadow: var(--shadow-solid);
    transition: var(--transition);
  }
  .brutal-box:hover {
    transform: translate(-2px,-2px);
    box-shadow: var(--shadow-hover);
  }

  /* ── 按钮 ── */
  .btn {
    font-family: var(--font-ui);
    font-weight: 700;
    padding: 8px 18px;
    background: var(--white);
    border: var(--border-thin);
    border-radius: var(--radius-pill);
    box-shadow: 2px 2px 0px var(--black);
    cursor: pointer;
    transition: var(--transition);
    font-size: 14px;
    white-space: nowrap;
  }
  .btn:hover { background: var(--candy-yellow); transform: translate(-1px,-1px); box-shadow: 3px 3px 0 var(--black); }
  .btn:active { transform: translate(2px,2px); box-shadow: none; }
  .btn-dark { background: var(--black); color: var(--white); }
  .btn-dark:hover { background: #222; }

  /* ── 顶部栏 ── */
  .topbar {
    background: var(--candy-pink);
    border-bottom: var(--border-thick);
    padding: 0 32px;
    height: 72px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 20;
  }
  .topbar-logo { font-size: 24px; font-weight: 900; letter-spacing: -1px; }
  .topbar-right { display: flex; align-items: center; gap: 14px; }
  .badge-overdue {
    background: var(--candy-orange);
    color: var(--white);
    font-size: 13px;
    font-weight: 700;
    padding: 6px 14px;
    border: var(--border-thin);
    border-radius: var(--radius-pill);
    box-shadow: 2px 2px 0 var(--black);
    transform: rotate(-3deg);
    display: none;
  }

  .main { padding: 40px 32px; max-width: 1400px; margin: 0 auto; }

  /* ── 登录页 ── */
  #login-screen {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: calc(100vh - 72px);
    padding: 40px 24px;
  }
  .login-card {
    background: var(--white);
    border: var(--border-thick);
    border-radius: var(--radius-box);
    box-shadow: var(--shadow-solid);
    padding: 48px 40px;
    width: 100%;
    max-width: 420px;
    text-align: center;
  }
  .login-card h1 { font-size: 32px; font-weight: 900; letter-spacing: -1px; margin-bottom: 8px; }
  .login-card p  { color: #555; font-size: 15px; margin-bottom: 32px; }
  .login-card input {
    width: 100%;
    font-family: var(--font-ui);
    font-weight: 700;
    padding: 14px 16px;
    border: var(--border-thick);
    border-radius: var(--radius-box);
    font-size: 16px;
    margin-bottom: 14px;
    outline: none;
    background: var(--bg-cream);
    transition: var(--transition);
  }
  .login-card input:focus { background: var(--candy-blue); box-shadow: 3px 3px 0 var(--black); transform: translate(-1px,-1px); }
  .login-btn {
    width: 100%;
    padding: 14px;
    background: var(--black);
    color: var(--white);
    border: none;
    border-radius: var(--radius-pill);
    font-family: var(--font-ui);
    font-size: 16px;
    font-weight: 900;
    cursor: pointer;
    letter-spacing: 1px;
    transition: var(--transition);
  }
  .login-btn:hover { background: #222; transform: translate(-2px,-2px); box-shadow: 4px 4px 0 var(--black); }
  #login-error { color: var(--candy-orange); font-size: 13px; font-weight: 700; margin-top: 12px; min-height: 18px; }

  /* ── 统计卡片 ── */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 24px;
    margin-bottom: 40px;
  }
  .stat-card {
    padding: 24px;
    position: relative;
    overflow: hidden;
  }
  .bg-pink   { background: var(--candy-pink); }
  .bg-green  { background: var(--candy-green); }
  .bg-blue   { background: var(--candy-blue); }
  .bg-yellow { background: var(--candy-yellow); }
  .bg-orange { background: var(--candy-orange); }
  .stat-card .label { font-size: 14px; font-weight: 900; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
  .stat-card .value { font-family: var(--font-data); font-size: 52px; font-weight: 700; line-height: 1; }
  .stat-card .deco-icon { position: absolute; right: -8px; bottom: -12px; font-size: 80px; opacity: 0.25; transform: rotate(15deg); }

  /* ── 两栏 ── */
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 40px; }
  @media (max-width: 800px) { .two-col { grid-template-columns: 1fr; } }

  .panel { padding: 32px; }

  .section-title {
    font-size: 20px;
    font-weight: 900;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .highlight-block {
    display: inline-block;
    padding: 4px 12px;
    border: var(--border-thin);
    border-radius: 6px;
    box-shadow: 2px 2px 0 var(--black);
    transform: rotate(-2deg);
    font-weight: 900;
    font-size: 16px;
    letter-spacing: 1px;
  }
  .panel-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 18px;
    flex-wrap: wrap;
  }
  .pager-summary {
    font-size: 13px;
    font-weight: 700;
    color: #444;
  }
  .pager-controls {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .pager-select {
    font-family: var(--font-ui);
    font-size: 13px;
    font-weight: 700;
    padding: 8px 12px;
    border: var(--border-thin);
    border-radius: var(--radius-pill);
    background: var(--white);
    box-shadow: 2px 2px 0 var(--black);
    outline: none;
    cursor: pointer;
  }
  .pager-nav {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .pager-btn {
    min-width: 70px;
    padding: 8px 14px;
    font-size: 13px;
  }
  .pager-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    transform: none;
    box-shadow: 2px 2px 0 var(--black);
  }
  .pager-page {
    min-width: 92px;
    text-align: center;
    font-family: var(--font-data);
    font-size: 13px;
    font-weight: 700;
  }

  /* ── 复习列表 ── */
  .review-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 16px;
    border: var(--border-thin);
    border-radius: 8px;
    margin-bottom: 12px;
    background: var(--white);
    box-shadow: 2px 2px 0 var(--black);
    transition: var(--transition);
  }
  .review-item:last-child { margin-bottom: 0; }
  .review-item:hover { background: var(--bg-cream); transform: translate(-2px,-2px); box-shadow: 4px 4px 0 var(--black); }
  .review-item .name { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
  .review-item .meta { font-family: var(--font-data); font-size: 12px; font-weight: 700; color: #555; }
  .brutal-tag {
    padding: 5px 12px;
    border: var(--border-thin);
    border-radius: var(--radius-pill);
    font-size: 12px;
    font-weight: 900;
    white-space: nowrap;
    flex-shrink: 0;
    box-shadow: 1px 1px 0 var(--black);
  }
  .tag-urgent { background: var(--candy-orange); color: var(--white); }
  .tag-warn   { background: var(--candy-yellow); }
  .tag-good   { background: var(--candy-green); }

  /* ── 树搜索 ── */
  .tree-search { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
  .tree-search input {
    flex: 1;
    min-width: 180px;
    font-family: var(--font-ui);
    padding: 12px 16px;
    border: var(--border-thick);
    border-radius: var(--radius-box);
    font-size: 15px;
    font-weight: 700;
    outline: none;
    background: var(--bg-cream);
    box-shadow: 2px 2px 0 var(--black);
    transition: var(--transition);
  }
  .tree-search input:focus { background: var(--candy-blue); box-shadow: 4px 4px 0 var(--black); transform: translate(-2px,-2px); }

  /* ── 知识树节点 ── */
  .tree-node { user-select: none; margin-bottom: 8px; }

  .node-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border: var(--border-thin);
    border-radius: 8px;
    box-shadow: 2px 2px 0 var(--black);
    transition: var(--transition);
    background: var(--white);
    cursor: default;
  }
  .node-row.parent-row {
    background: var(--candy-yellow);
    border: var(--border-thick);
    cursor: pointer;
  }
  .node-row.parent-row:hover { background: #ffd533; transform: translateX(4px); }
  .node-row.leaf-row:hover   { background: var(--bg-cream); transform: translateX(4px); }

  .toggle-icon {
    font-size: 13px;
    font-weight: 900;
    width: 18px;
    text-align: center;
    flex-shrink: 0;
    transition: transform 0.18s;
    color: var(--black);
  }
  .toggle-icon.open { transform: rotate(90deg); }
  .toggle-icon.leaf { opacity: 0; pointer-events: none; }

  .node-icon { font-size: 20px; flex-shrink: 0; line-height: 1; }
  .node-info { flex: 1; min-width: 0; }
  .node-name { font-size: 15px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .node-meta { font-family: var(--font-data); font-size: 12px; font-weight: 700; margin-top: 3px; color: #444; }

  .node-children {
    padding-left: 20px;
    margin-left: 22px;
    border-left: 3px solid var(--black);
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 8px;
    margin-bottom: 12px;
  }
  .node-children.collapsed { display: none; }

  /* 粗野进度条 */
  .progress-wrap { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
  .brutal-progress {
    width: 80px; height: 14px;
    background: var(--white);
    border: 2px solid var(--black);
    border-radius: var(--radius-pill);
    overflow: hidden;
  }
  .progress-fill { height: 100%; border-right: 2px solid var(--black); }
  .fill-green  { background: var(--candy-green); }
  .fill-blue   { background: var(--candy-blue); }
  .fill-yellow { background: var(--candy-yellow); }
  .fill-red    { background: var(--candy-orange); }
  .progress-text { font-family: var(--font-data); font-size: 13px; font-weight: 700; width: 38px; text-align: right; }

  /* ── 按钮群 ── */
  .node-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }

  .learn-btn, .del-btn {
    display: none;
    padding: 4px 10px;
    background: var(--white);
    border: 2px solid var(--black);
    border-radius: var(--radius-pill);
    font-size: 12px;
    font-weight: 900;
    cursor: pointer;
    box-shadow: 1px 1px 0 var(--black);
    transition: var(--transition);
    flex-shrink: 0;
  }
  .learn-btn {
    color: var(--candy-green);
  }
  .learn-btn:hover { background: var(--candy-green); color: var(--white); transform: translate(-1px,-1px); box-shadow: 2px 2px 0 var(--black); }
  .del-btn {
    color: var(--candy-orange);
  }
  .del-btn:hover { background: var(--candy-orange); color: var(--white); transform: translate(-1px,-1px); box-shadow: 2px 2px 0 var(--black); }
  .leaf-row:hover .learn-btn,
  .leaf-row:hover .del-btn { display: block; }
  .learn-btn:active, .del-btn:active { transform: translate(1px,1px); box-shadow: none; }

  /* ── 空状态 & 加载 ── */
  .empty { padding: 40px 0; text-align: center; font-weight: 700; color: #888; }
  .loading {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    min-height: calc(100vh - 72px);
    gap: 16px; font-weight: 900; font-size: 18px;
  }
  .spinner {
    width: 40px; height: 40px;
    border: 4px solid var(--black);
    border-top-color: var(--candy-pink);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── 确认弹窗 ── */
  .modal-overlay {
    display: none;
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 100;
    align-items: center; justify-content: center;
    padding: 24px;
  }
  .modal-overlay.open { display: flex; }
  .modal {
    background: var(--white);
    border: var(--border-thick);
    border-radius: var(--radius-box);
    box-shadow: var(--shadow-hover);
    padding: 36px;
    max-width: 400px;
    width: 100%;
  }
  .modal h3 { font-size: 22px; font-weight: 900; margin-bottom: 12px; }
  .modal p  { font-size: 15px; color: #444; line-height: 1.6; }
  .modal .topic-hint { color: var(--black); font-weight: 700; }
  .modal .warn { color: var(--candy-orange); font-size: 13px; font-weight: 700; margin-top: 10px; }
  .modal-actions { display: flex; gap: 12px; margin-top: 28px; justify-content: flex-end; }
  .btn-delete {
    padding: 10px 24px;
    background: var(--candy-orange);
    color: var(--white);
    border: var(--border-thin);
    border-radius: var(--radius-pill);
    font-family: var(--font-ui);
    font-size: 15px;
    font-weight: 900;
    cursor: pointer;
    box-shadow: 2px 2px 0 var(--black);
    transition: var(--transition);
  }
  .btn-delete:hover { transform: translate(-1px,-1px); box-shadow: 3px 3px 0 var(--black); }
  .btn-delete:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
</head>
<body>

<!-- ── 顶部栏（始终可见） ── -->
<div class="topbar">
  <div class="topbar-logo">Σ SIGMA TRACKER</div>
  <div class="topbar-right">
    <div class="badge-overdue" id="overdue-badge"></div>
    <button class="btn" id="btn-refresh" onclick="refreshData()" style="display:none">刷新数据</button>
    <button class="btn btn-dark" id="btn-logout" onclick="logout()" style="display:none">退出登录</button>
  </div>
</div>

<!-- ── 删除确认弹窗 ── -->
<div class="modal-overlay" id="del-modal">
  <div class="modal">
    <h3>⚠️ 删除确认</h3>
    <p>确定删除 <span class="topic-hint" id="del-topic-name"></span> 吗？</p>
    <p class="warn" id="del-cascade-warn"></p>
    <div class="modal-actions">
      <button class="btn" onclick="closeDelModal()">取消</button>
      <button class="btn-delete" id="del-confirm-btn" onclick="confirmDelete()">确认删除</button>
    </div>
  </div>
</div>

<!-- ── 学习对话框 ── -->
<div id="learn-modal" class="modal-overlay">
  <div class="modal">
    <h3>📚 记录学习</h3>
    <p>主题: <span class="topic-hint" id="learn-topic-name"></span></p>
    <label style="display: block; margin-top: 20px; font-weight: 700; margin-bottom: 8px;">掌握度 (0-1)</label>
    <div style="display: flex; gap: 8px; align-items: center;">
      <input type="range" id="mastery-slider" min="0" max="1" step="0.1" value="0.7" style="flex: 1; height: 8px; cursor: pointer;">
      <input type="number" id="mastery-input" min="0" max="1" step="0.1" value="0.7" style="width: 60px; padding: 6px 8px; border: 2px solid var(--black); border-radius: 6px; font-family: var(--font-data); font-weight: 700;">
    </div>
    <p style="font-size: 13px; color: #666; margin-top: 8px;">0 = 完全遗忘，0.5 = 有印象，1 = 完全掌握</p>
    <div class="modal-actions">
      <button class="btn" onclick="closeLearnModal()">取消</button>
      <button class="btn-delete" id="learn-confirm-btn" onclick="confirmLearn()" style="background: var(--candy-green); color: var(--white);">确认学习</button>
    </div>
  </div>
</div>
<div id="login-screen">
  <div class="login-card">
    <h1>Σ SIGMA<br>TRACKER</h1>
    <p>基于 BKT + SM-2 的个人知识追踪系统</p>
    <input type="password" id="token-input" placeholder="输入 API Token" />
    <button class="login-btn" onclick="doLogin()">进入系统 →</button>
    <div id="login-error"></div>
  </div>
</div>

<!-- ── 加载中 ── -->
<div id="loading" style="display:none">
  <div class="loading">
    <div class="spinner"></div>
    <div>加载数据中…</div>
  </div>
</div>

<!-- ── 主界面 ── -->
<div id="app" style="display:none">
  <div class="main">
    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="brutal-box stat-card bg-pink">
        <div class="label">总知识点</div>
        <div class="value" id="stat-total">—</div>
        <div class="deco-icon">📚</div>
      </div>
      <div class="brutal-box stat-card bg-green">
        <div class="label">已掌握</div>
        <div class="value" id="stat-mastered">—</div>
        <div class="deco-icon">✨</div>
      </div>
      <div class="brutal-box stat-card bg-blue">
        <div class="label">学习中</div>
        <div class="value" id="stat-progress">—</div>
        <div class="deco-icon">🚀</div>
      </div>
      <div class="brutal-box stat-card bg-yellow">
        <div class="label">待入门</div>
        <div class="value" id="stat-beginning">—</div>
        <div class="deco-icon">🌱</div>
      </div>
      <div class="brutal-box stat-card bg-orange" style="color:#fff">
        <div class="label">待复习</div>
        <div class="value" id="stat-overdue">—</div>
        <div class="deco-icon">💥</div>
      </div>
    </div>

    <!-- 复习面板 -->
    <div class="two-col">
      <div class="brutal-box panel">
        <div class="section-title">
          <span class="highlight-block" style="background:var(--candy-orange);color:#fff;">今日重点</span>
          死磕到底
        </div>
        <div class="panel-toolbar" id="review-controls"></div>
        <div id="review-list"></div>
      </div>
      <div class="brutal-box panel">
        <div class="section-title">
          <span class="highlight-block" style="background:var(--candy-blue);">雷达预警</span>
          即将到期
        </div>
        <div class="panel-toolbar" id="upcoming-controls"></div>
        <div id="upcoming-list"></div>
      </div>
    </div>

    <!-- 知识树 -->
    <div class="brutal-box panel">
      <div class="section-title">
        <span class="highlight-block" style="background:var(--candy-green);">技能树</span>
        知识拓扑图
      </div>
      <div class="tree-search">
        <input type="text" id="tree-search" placeholder="搜索知识点…" oninput="filterTree(this.value)" />
        <button class="btn" style="background:var(--candy-yellow)" onclick="expandAll()">展开全部</button>
        <button class="btn" onclick="collapseAll()">折叠节点</button>
      </div>
      <div id="topics-list"></div>
    </div>
  </div>
</div>

<script>
const API = window.location.origin;
const REVIEW_FETCH_LIMIT = 1000;
const REVIEW_PAGE_SIZES = [10, 20, 50, 100];
const REVIEW_PANEL_CONFIG = {
  due: {
    controlsId: 'review-controls',
    listId: 'review-list',
    emptyText: '🎉 今日无待复习内容',
  },
  upcoming: {
    controlsId: 'upcoming-controls',
    listId: 'upcoming-list',
    emptyText: '近 7 天暂无到期内容',
  },
};
let TOKEN = localStorage.getItem('sigma_token') || '';
let _allTopics = [];
let _reviewPanels = {
  due: { items: [], page: 1, pageSize: 10 },
  upcoming: { items: [], page: 1, pageSize: 10 },
};

// ── 自动登录 ─────────────────────────────────────────────────
if (TOKEN) tryLoad();

async function doLogin() {
  TOKEN = document.getElementById('token-input').value.trim();
  if (!TOKEN) return;
  const err = document.getElementById('login-error');
  err.textContent = '验证中…';
  try {
    const r = await fetch(API + '/progress', { headers: { Authorization: 'Bearer ' + TOKEN } });
    if (r.status === 401) { err.textContent = '❌ Token 错误，请重试'; return; }
    localStorage.setItem('sigma_token', TOKEN);
    err.textContent = '';
    tryLoad();
  } catch(e) { err.textContent = '连接失败：' + e.message; }
}

document.getElementById('token-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') doLogin();
});

function logout() {
  localStorage.removeItem('sigma_token');
  TOKEN = '';
  document.getElementById('app').style.display = 'none';
  document.getElementById('loading').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('btn-refresh').style.display = 'none';
  document.getElementById('btn-logout').style.display = 'none';
}

function auth() { return { Authorization: 'Bearer ' + TOKEN }; }

// ── 加载 ─────────────────────────────────────────────────────
async function tryLoad() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('loading').style.display = 'block';
  document.getElementById('app').style.display = 'none';
  await refreshData();
}

async function refreshData() {
  try {
    const [progRes, reviewRes] = await Promise.all([
      fetch(API + '/progress', { headers: auth() }),
      fetch(API + '/review-plan?include_future=true&limit=' + REVIEW_FETCH_LIMIT, { headers: auth() }),
    ]);
    if (progRes.status === 401) { logout(); return; }
    const prog   = await progRes.json();
    const review = await reviewRes.json();
    _allTopics = prog.topics || [];
    renderStats(prog.summary);
    renderReviews(review.due_reviews, review.upcoming_reviews);
    renderTree(_allTopics);
    document.getElementById('loading').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    document.getElementById('btn-refresh').style.display = '';
    document.getElementById('btn-logout').style.display = '';
  } catch(e) {
    document.getElementById('loading').innerHTML =
      '<div class="loading"><div style="font-size:48px">💥</div><div>加载失败：' + e.message + '</div></div>';
  }
}

// ── 统计 ─────────────────────────────────────────────────────
function renderStats(s) {
  document.getElementById('stat-total').textContent     = s.total_topics;
  document.getElementById('stat-mastered').textContent  = s.mastered;
  document.getElementById('stat-progress').textContent  = s.in_progress;
  document.getElementById('stat-beginning').textContent = s.beginning;
  document.getElementById('stat-overdue').textContent   = s.overdue_reviews;
  const badge = document.getElementById('overdue-badge');
  if (s.overdue_reviews > 0) {
    badge.textContent = '💥 ' + s.overdue_reviews + ' 待复习';
    badge.style.display = 'block';
  } else {
    badge.style.display = 'none';
  }
}

// ── 复习列表 ─────────────────────────────────────────────────
function renderReviews(due, upcoming) {
  setReviewPanelItems('due', due || []);
  setReviewPanelItems('upcoming', (upcoming || []).filter(r => r.days_until <= 7));
  renderReviewPanel('due');
  renderReviewPanel('upcoming');
}

function setReviewPanelItems(panelKey, items) {
  const panel = _reviewPanels[panelKey];
  _reviewPanels = {
    ..._reviewPanels,
    [panelKey]: {
      ...panel,
      items,
      page: clampReviewPage(panel.page, items.length, panel.pageSize),
    },
  };
}

function setReviewPageSize(panelKey, rawValue) {
  const pageSize = parseInt(rawValue, 10);
  if (!REVIEW_PAGE_SIZES.includes(pageSize)) return;
  const panel = _reviewPanels[panelKey];
  _reviewPanels = {
    ..._reviewPanels,
    [panelKey]: {
      ...panel,
      pageSize,
      page: 1,
    },
  };
  renderReviewPanel(panelKey);
}

function changeReviewPage(panelKey, delta) {
  const panel = _reviewPanels[panelKey];
  const page = clampReviewPage(panel.page + delta, panel.items.length, panel.pageSize);
  if (page === panel.page) return;
  _reviewPanels = {
    ..._reviewPanels,
    [panelKey]: {
      ...panel,
      page,
    },
  };
  renderReviewPanel(panelKey);
}

function renderReviewPanel(panelKey) {
  const config = REVIEW_PANEL_CONFIG[panelKey];
  const panel = _reviewPanels[panelKey];
  const listEl = document.getElementById(config.listId);
  const controlsEl = document.getElementById(config.controlsId);
  const pageCount = reviewPageCount(panel.items.length, panel.pageSize);
  const items = reviewPageItems(panel.items, panel.page, panel.pageSize);

  controlsEl.innerHTML = reviewControlsHtml(panelKey, panel.items.length, panel.page, pageCount, panel.pageSize);
  listEl.innerHTML = items.length === 0
    ? '<div class="empty">' + config.emptyText + '</div>'
    : items.map(item => reviewItemHtml(panelKey, item)).join('');
}

function reviewControlsHtml(panelKey, total, page, pageCount, pageSize) {
  const options = REVIEW_PAGE_SIZES.map(size =>
    '<option value="' + size + '"' + (size === pageSize ? ' selected' : '') + '>' + size + ' 条/页</option>'
  ).join('');
  return \`<div class="pager-summary">共 \${total} 条</div>
    <div class="pager-controls">
      <select class="pager-select" onchange="setReviewPageSize('\${panelKey}', this.value)">\${options}</select>
      <div class="pager-nav">
        <button class="btn pager-btn" onclick="changeReviewPage('\${panelKey}', -1)" \${page <= 1 ? 'disabled' : ''}>上一页</button>
        <span class="pager-page">\${page} / \${pageCount}</span>
        <button class="btn pager-btn" onclick="changeReviewPage('\${panelKey}', 1)" \${page >= pageCount ? 'disabled' : ''}>下一页</button>
      </div>
    </div>\`;
}

function reviewItemHtml(panelKey, item) {
  return panelKey === 'due' ? dueReviewItemHtml(item) : upcomingReviewItemHtml(item);
}

function dueReviewItemHtml(item) {
  const tagCls = item.priority === 'high' ? 'tag-urgent' : 'tag-warn';
  const tagTxt = item.priority === 'high' ? '紧急' : '常规';
  return \`<div class="review-item">
    <div>
      <div class="name">\${esc(item.topic_name)}</div>
      <div class="meta">逾期 \${item.overdue_days.toFixed(1)} 天 · 掌握度 \${(item.p_known*100).toFixed(0)}%</div>
    </div>
    <span class="brutal-tag \${tagCls}">\${tagTxt}</span>
  </div>\`;
}

function upcomingReviewItemHtml(item) {
  return \`<div class="review-item">
    <div>
      <div class="name">\${esc(item.topic_name)}</div>
      <div class="meta">\${item.days_until.toFixed(1)} 天后 · 掌握度 \${(item.p_known*100).toFixed(0)}%</div>
    </div>
    <span class="brutal-tag tag-good">平稳</span>
  </div>\`;
}

function reviewPageCount(total, pageSize) {
  return Math.max(1, Math.ceil(total / pageSize));
}

function clampReviewPage(page, total, pageSize) {
  return Math.min(Math.max(1, page), reviewPageCount(total, pageSize));
}

function reviewPageItems(items, page, pageSize) {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

// ── 知识树 ───────────────────────────────────────────────────
const PARENT_COLORS = ['var(--candy-yellow)', 'var(--candy-pink)', 'var(--candy-blue)', 'var(--candy-green)'];
const PARENT_ICONS  = ['📂', '📖', '🗂️', '🔷'];
const LEAF_ICONS = { mastered: '✅', strong: '🔵', developing: '🟡', beginning: '🔴' };

function buildTree(topics) {
  const map = {};
  topics.forEach(t => { map[t.topic_id] = { ...t, children: [] }; });
  const roots = [];
  topics.forEach(t => {
    if (t.parent_id && map[t.parent_id]) map[t.parent_id].children.push(map[t.topic_id]);
    else if (!t.parent_id) roots.push(map[t.topic_id]);
  });
  function sortNode(n) { n.children.sort((a,b) => a.topic_name.localeCompare(b.topic_name,'zh')); n.children.forEach(sortNode); }
  roots.sort((a,b) => a.topic_name.localeCompare(b.topic_name,'zh'));
  roots.forEach(sortNode);
  return roots;
}

function getAllLeafPKnown(node) {
  if (node.children.length === 0) return [node.p_known];
  return node.children.flatMap(getAllLeafPKnown);
}
function countLeaves(node) {
  if (node.children.length === 0) return 1;
  return node.children.reduce((s,c) => s + countLeaves(c), 0);
}
function countMastered(node) {
  if (node.children.length === 0) return node.p_known >= 0.8 ? 1 : 0;
  return node.children.reduce((s,c) => s + countMastered(c), 0);
}
function avgPKnown(node) {
  const vals = getAllLeafPKnown(node);
  return vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : node.p_known;
}

function statusInfo(status) {
  return { mastered:'已掌握', strong:'较强', developing:'巩固中', beginning:'待入门' }[status] || status;
}
function statusTagCls(status) {
  return { mastered:'tag-good', strong:'tag-good', developing:'tag-warn', beginning:'tag-urgent' }[status] || 'tag-warn';
}
function fillCls(pct) {
  return pct >= 80 ? 'fill-green' : pct >= 60 ? 'fill-blue' : pct >= 40 ? 'fill-yellow' : 'fill-red';
}

function nodeHtml(node, depth, expandedIds) {
  const isLeaf = node.children.length === 0;
  const id = node.topic_id;

  if (isLeaf) {
    const pct  = Math.round(node.p_known * 100);
    const icon = node.last_studied ? (LEAF_ICONS[node.status] || '⚪') : '⚪';
    const meta = node.last_studied
      ? '最近学习: ' + fmtDate(node.last_studied) + (node.overdue ? ' · ⚠️过期' : '')
      : '尚未学习';
    return \`<div class="tree-node">
      <div class="node-row leaf-row">
        <span class="toggle-icon leaf">›</span>
        <div class="node-icon">\${icon}</div>
        <div class="node-info">
          <div class="node-name">\${esc(node.topic_name)}</div>
          <div class="node-meta">\${meta}</div>
        </div>
        <div class="progress-wrap">
          <span class="brutal-tag \${statusTagCls(node.status)}" style="font-size:11px">\${statusInfo(node.status)}</span>
          <div class="brutal-progress"><div class="progress-fill \${fillCls(pct)}" style="width:\${pct}%"></div></div>
          <div class="progress-text">\${pct}%</div>
        </div>
        <div class="node-actions">
          <button class="learn-btn" data-learn-path="\${node.topic_path || node.topic_name}" data-learn-name="\${esc(node.topic_name)}">📚 学习</button>
          <button class="del-btn"
            data-del-id="\${id}"
            data-del-name="\${esc(node.topic_name)}"
            data-is-parent="false"
            data-child-count="0">✕ 删除</button>
        </div>
      </div>
    </div>\`;
  }

  const colorIdx = Math.min(depth, PARENT_COLORS.length - 1);
  const bgColor  = PARENT_COLORS[colorIdx];
  const icon     = PARENT_ICONS[Math.min(depth, PARENT_ICONS.length-1)];
  const total    = countLeaves(node);
  const mastered = countMastered(node);
  const pct      = Math.round(avgPKnown(node) * 100);
  const isOpen   = expandedIds.has(id);
  const childrenHtml = node.children.map(c => nodeHtml(c, depth+1, expandedIds)).join('');

  return \`<div class="tree-node">
    <div class="node-row parent-row" data-toggle-id="\${id}" style="background:\${bgColor}">
      <span class="toggle-icon \${isOpen?'open':''}" id="arrow-\${id}">›</span>
      <div class="node-icon">\${icon}</div>
      <div class="node-info">
        <div class="node-name">\${esc(node.topic_name)}</div>
        <div class="node-meta">\${mastered}/\${total} 已掌握</div>
      </div>
      <div class="progress-wrap">
        <div class="brutal-progress"><div class="progress-fill \${fillCls(pct)}" style="width:\${pct}%"></div></div>
        <div class="progress-text">\${pct}%</div>
      </div>
      <button class="del-btn"
        data-del-id="\${id}"
        data-del-name="\${esc(node.topic_name)}"
        data-is-parent="true"
        data-child-count="\${total}">✕ 删除</button>
    </div>
    <div class="node-children \${isOpen?'':'collapsed'}" id="children-\${id}">
      \${childrenHtml}
    </div>
  </div>\`;
}

function renderTree(topics, searchText) {
  const el = document.getElementById('topics-list');
  if (!topics || topics.length === 0) { el.innerHTML = '<div class="empty">暂无学习记录</div>'; return; }
  const roots = buildTree(topics);
  const expandedIds = new Set(roots.map(r => r.topic_id));
  if (searchText) {
    const q = searchText.toLowerCase();
    function collect(node) {
      if (node.topic_name.toLowerCase().includes(q)) {
        expandedIds.add(node.topic_id);
        node.children.forEach(c => expandedIds.add(c.topic_id));
      }
      node.children.forEach(collect);
    }
    roots.forEach(collect);
  }
  el.innerHTML = roots.map(r => nodeHtml(r, 0, expandedIds)).join('');
}

// 事件委托
document.getElementById('topics-list').addEventListener('click', function(e) {
  const learnBtn = e.target.closest('.learn-btn');
  if (learnBtn) {
    e.stopPropagation();
    openLearnModal(learnBtn.dataset.learnPath, learnBtn.dataset.learnName);
    return;
  }
  const delBtn = e.target.closest('.del-btn');
  if (delBtn) {
    e.stopPropagation();
    openDelModal(delBtn.dataset.delId, delBtn.dataset.delName, delBtn.dataset.isParent === 'true', parseInt(delBtn.dataset.childCount || '0'));
    return;
  }
  const row = e.target.closest('.parent-row');
  if (row && row.dataset.toggleId) toggleNode(row.dataset.toggleId);
});

function toggleNode(id) {
  const ch = document.getElementById('children-' + id);
  const ar = document.getElementById('arrow-' + id);
  if (!ch) return;
  const open = !ch.classList.contains('collapsed');
  ch.classList.toggle('collapsed', open);
  ar.classList.toggle('open', !open);
}

let _searchTimer = null;
function filterTree(val) {
  clearTimeout(_searchTimer);
  _searchTimer = setTimeout(() => renderTree(_allTopics, val.trim() || undefined), 200);
}
function expandAll() {
  document.querySelectorAll('.node-children').forEach(el => el.classList.remove('collapsed'));
  document.querySelectorAll('.toggle-icon:not(.leaf)').forEach(el => el.classList.add('open'));
}
function collapseAll() {
  document.querySelectorAll('.node-children').forEach(el => el.classList.add('collapsed'));
  document.querySelectorAll('.toggle-icon:not(.leaf)').forEach(el => el.classList.remove('open'));
}

// ── 学习功能 ─────────────────────────────────────────────────
let _learnTopicPath = null;

function openLearnModal(topicPath, name) {
  _learnTopicPath = topicPath;
  document.getElementById('learn-topic-name').textContent = '"' + name + '"';
  document.getElementById('mastery-slider').value = '0.7';
  document.getElementById('mastery-input').value = '0.7';
  document.getElementById('learn-confirm-btn').disabled = false;
  document.getElementById('learn-confirm-btn').textContent = '确认学习';
  document.getElementById('learn-modal').classList.add('open');
}
function closeLearnModal() {
  _learnTopicPath = null;
  document.getElementById('learn-modal').classList.remove('open');
}
document.getElementById('learn-modal').addEventListener('click', e => { if (e.target === e.currentTarget) closeLearnModal(); });
document.getElementById('mastery-slider').addEventListener('input', function() {
  document.getElementById('mastery-input').value = this.value;
});
document.getElementById('mastery-input').addEventListener('input', function() {
  const v = Math.max(0, Math.min(1, parseFloat(this.value) || 0));
  this.value = v;
  document.getElementById('mastery-slider').value = v;
});

async function confirmLearn() {
  if (!_learnTopicPath) return;
  const mastery = parseFloat(document.getElementById('mastery-input').value);
  if (isNaN(mastery) || mastery < 0 || mastery > 1) {
    alert('掌握度必须在 0-1 之间');
    return;
  }
  const btn = document.getElementById('learn-confirm-btn');
  btn.disabled = true; btn.textContent = '提交中…';
  try {
    const res = await fetch(API + '/record', {
      method: 'POST',
      headers: { ...auth(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: _learnTopicPath, mastery_level: mastery })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status + ': ' + (await res.text()));
    closeLearnModal();
    await refreshData();
  } catch(e) {
    btn.disabled = false; btn.textContent = '确认学习';
    alert('提交失败：' + e.message);
  }
}
let _delTopicId = null;

function openDelModal(topicId, name, isParent, childCount) {
  _delTopicId = topicId;
  document.getElementById('del-topic-name').textContent = '"' + name + '"';
  document.getElementById('del-cascade-warn').textContent = isParent && childCount > 0
    ? '⚠️ 父节点！将同时删除其下 ' + childCount + ' 个子知识点及所有学习记录，操作不可撤销。'
    : '删除后所有学习记录将一并清除，操作不可撤销。';
  document.getElementById('del-confirm-btn').disabled = false;
  document.getElementById('del-confirm-btn').textContent = '确认删除';
  document.getElementById('del-modal').classList.add('open');
}
function closeDelModal() {
  _delTopicId = null;
  document.getElementById('del-modal').classList.remove('open');
}
document.getElementById('del-modal').addEventListener('click', e => { if (e.target === e.currentTarget) closeDelModal(); });

async function confirmDelete() {
  if (!_delTopicId) return;
  const btn = document.getElementById('del-confirm-btn');
  btn.disabled = true; btn.textContent = '删除中…';
  try {
    const r = await fetch(API + '/topics/' + encodeURIComponent(_delTopicId), { method: 'DELETE', headers: auth() });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    closeDelModal();
    await refreshData();
  } catch(e) {
    btn.disabled = false; btn.textContent = '确认删除';
    alert('删除失败：' + e.message);
  }
}

// ── 工具函数 ─────────────────────────────────────────────────
function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function fmtDate(iso) {
  const d = new Date(iso), now = new Date();
  const diff = Math.floor((now-d)/86400000);
  if (diff === 0) return '今天';
  if (diff === 1) return '昨天';
  if (diff < 30)  return diff + ' 天前';
  return d.toLocaleDateString('zh-CN', { month:'short', day:'numeric' });
}
</script>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
