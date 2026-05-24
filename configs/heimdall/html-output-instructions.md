# Heimdall HTML 输出配置

> 本文件指导 Heimdall 将日报输出为 HTML 格式，存放于本仓库的 `academic/YYYY-MM-DD/` 目录下。
> 此配置为 sanitized 版本，不含任何 API Key、Token、Discord Channel ID 等敏感信息。

---

## 输出规则

### 1. 文件路径与命名

每日生成 3 份 HTML 报告，存放于日期目录下：

```
academic/YYYY-MM-DD/HH-mm-keywords.html
```

**命名规则：**
- 目录：`academic/YYYY-MM-DD/`（按日期分组）
- 文件：`HH-mm-keywords.html`
- `HH-mm`：生成时间（08-00 / 12-00 / 17-00）
- `keywords`：3-5 个关键词，用连字符连接，一眼能看出文件核心内容

**示例：**
```
academic/2026-05-22/12-00-agent-mcp-arxiv-rust.html    # 午间：Agent框架、MCP生态、arXiv论文、Rust趋势
academic/2026-05-22/08-00-github-model-release.html    # 晨间：GitHub热门、模型发布
academic/2026-05-22/17-00-trend-radar-review.html      # 晚间：趋势分析、雷达更新、P0回顾
```

**关键词选择原则：**
- 从本报告 P0/P1 发现中提取最高频/最重要的主题词
- 优先选择技术领域词（agent、mcp、rust）而非泛词（news、update）
- 3-5 个词，按重要性排序
- 全小写，连字符分隔

若日期目录不存在，自动创建。

### 2. 内容合并规则

将原来的 7 份报告精简为 3 份：

| 新文件 | 合并来源 | 时间窗口 |
|--------|----------|----------|
| morning.html | 早盘预取(0750) + 晨间简报(0830) | 最近 24 小时 |
| noon.html | 论文专题扫描(1130) + 午间解读(1200) + 傍晚雷达(1730) | 最近 2 天 + 订阅命中 |
| evening.html | 晚间趋势(2000) + 夜间维护(2015) | 趋势分析 + radar 更新 |

### 3. HTML 模板规范

每份报告使用以下 HTML 骨架：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Heimdall 学术情报日报 — YYYY-MM-DD [morning|noon|evening]</title>
  <link rel="stylesheet" href="../../assets/css/main.css">
  <script>
    document.documentElement.setAttribute('data-theme', localStorage.getItem('theme') || 'light');
  </script>
  <script type="module" src="../../assets/js/report-bookmarks.js"></script>
</head>
<body>
  <div class="report-skin report-skin-academic">
  <header class="report-header">
    <div class="container report-shell">
      <span class="badge badge-academic">学术情报</span>
      <h1>Heimdall — [晨间简报|午间论文|晚间趋势]</h1>
      <time datetime="YYYY-MM-DDTHH:MM+08:00">YYYY年MM月DD日 HH:MM CST</time>
    </div>
  </header>

  <main class="container report-shell">
    <!-- 报告正文 -->
  </main>

  <footer class="report-footer">
    <div class="container report-shell">
      <p>Heimdall AI Sentinel · 学术情报流</p>
      <p><a href="../../index.html">← 返回看板</a></p>
    </div>
  </footer>
  </div>
</body>
</html>
```

### 4. 报告皮肤（Report Skin）

Heimdall 报告必须采用项目统一的 **报告皮肤 (Report Skin)**：参考附件的窄栏技术手册风格，但不照搬技能手册的内容结构。报告皮肤只用于未来新生成的报告，不需要批量改写历史报告。

**权威来源：** 本文件是 Heimdall HTML 样式规范的权威来源。Hermes profile 只定义 Heimdall 的身份与任务，不承载本项目 HTML 样式决策。

**主题边界：**
- ✅ 必须同时支持白色模式和黑色模式
- ✅ 使用 CSS 变量和 `[data-theme="dark"]` 覆盖暗色变量
- ✅ 允许一段只读 theme bootstrap：读取 `localStorage.theme` 并设置 `document.documentElement.dataset.theme`
- ❌ 不要在单篇报告里添加主题切换按钮
- ❌ 不要写入 `localStorage.theme`
- ✅ 主题由 dashboard 首页统一管理；报告只负责读取并兼容变量

**视觉语言：**
- 窄内容栏：`report-shell` 最大宽度约 860px，居中，移动端保留舒适边距
- 字体：标题使用醒目的 display/sans 字体栈，正文使用 mono/technical 字体栈；不要引用外部字体服务
- 背景：低对比度底色 + 轻微噪点纹理，保证浅色/深色都可读
- 卡片：低圆角（4-6px）、细边框、克制 hover，不使用大圆角营销卡片
- 标题：section 标题使用细线分隔、uppercase/letter-spacing 的技术手册风格
- 动效：允许轻微 `fadeUp` 入场动画；不要使用夸张闪烁，除非是 P0 突发警示
- Heimdall accent：青绿/蓝绿色系，表达学术雷达、研究信号、技术发现

**必须保留的语义结构：**
- JSON-LD 元数据
- `<section class="priority-p0|priority-p1|priority-p2">`
- `<div class="discovery-card p0|p1|p2">`
- `<table class="data-table">`
- `<section class="trend-analysis">`
- `<section class="subscription-hits">`
- `<section class="action-items">`
- 返回看板链接

**不要照搬附件内容组件：** 不要生成 `core-grid`、`flow-step`、技能流程表等教程结构。日报不是技能手册，附件只提供视觉方向。

每份报告的 `<head>` 中，在全局 CSS 和 `report-bookmarks.js` 之后加入如下内联样式，并可按当日报告内容做小幅扩展：

```html
<style>
  :root {
    --report-bg: #f7f9f7;
    --report-surface: #ffffff;
    --report-surface-2: #eef4f1;
    --report-border: #d8e2dc;
    --report-text: #18201c;
    --report-muted: #607268;
    --report-accent: #0f8f78;
    --report-accent-2: #1870a8;
    --report-danger: #cf222e;
    --report-shadow: 0 8px 26px rgba(16, 40, 32, 0.08);
  }

  [data-theme="dark"] {
    --report-bg: #0a0f0d;
    --report-surface: #111814;
    --report-surface-2: #17211c;
    --report-border: #2a3a32;
    --report-text: #e7f0ea;
    --report-muted: #8aa095;
    --report-accent: #7fffca;
    --report-accent-2: #6af7ff;
    --report-danger: #ff6b7a;
    --report-shadow: none;
  }

  body {
    background: var(--report-bg);
    color: var(--report-text);
    font-family: "SF Mono", "JetBrains Mono", "Cascadia Code", "Noto Sans Mono SC", monospace;
  }

  .report-skin {
    min-height: 100vh;
    position: relative;
    overflow-x: hidden;
  }

  .report-skin::before {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    opacity: 0.35;
    background-image: radial-gradient(var(--report-border) 0.7px, transparent 0.7px);
    background-size: 18px 18px;
  }

  .report-shell {
    max-width: 860px;
    position: relative;
    z-index: 1;
  }

  .report-header {
    background: transparent;
    border-bottom: 1px solid var(--report-border);
    padding: 56px 0 40px;
  }

  .report-header h1 {
    margin-top: 18px;
    font-family: "Trebuchet MS", "Noto Sans SC", sans-serif;
    font-size: clamp(2rem, 5vw, 3.2rem);
    line-height: 1.08;
    letter-spacing: 0;
    color: var(--report-text);
  }

  .report-header time,
  .report-meta {
    display: block;
    margin-top: 12px;
    color: var(--report-muted);
    font-size: 0.8125rem;
  }

  .badge-academic {
    border: 1px solid var(--report-accent);
    border-radius: 3px;
    background: transparent;
    color: var(--report-accent);
    letter-spacing: 0.18em;
  }

  main.report-shell {
    padding-top: 42px;
    padding-bottom: 72px;
  }

  main.report-shell > section {
    margin: 0 0 48px;
    animation: reportFadeUp 0.5s ease both;
  }

  section > h2 {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 18px;
    color: var(--report-muted);
    font-size: 0.72rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
  }

  section > h2::after {
    content: "";
    flex: 1;
    height: 1px;
    background: var(--report-border);
  }

  .discovery-card,
  .trend-analysis,
  .subscription-hits,
  .action-items,
  details {
    background: var(--report-surface);
    border: 1px solid var(--report-border);
    border-radius: 6px;
    box-shadow: var(--report-shadow);
  }

  .discovery-card {
    padding: 20px;
  }

  .discovery-card + .discovery-card {
    margin-top: 12px;
  }

  .discovery-card h3 {
    color: var(--report-text);
    font-family: "Trebuchet MS", "Noto Sans SC", sans-serif;
    letter-spacing: 0;
  }

  .discovery-card p,
  .trend-analysis,
  .subscription-hits,
  .action-items,
  details {
    color: var(--report-muted);
  }

  .discovery-card strong,
  a {
    color: var(--report-accent);
  }

  .discovery-card.p0 {
    border-color: color-mix(in srgb, var(--report-danger), var(--report-border) 45%);
  }

  .discovery-card.p1 {
    border-color: color-mix(in srgb, var(--report-accent), var(--report-border) 50%);
  }

  .data-table {
    background: var(--report-surface);
    border: 1px solid var(--report-border);
    border-collapse: collapse;
    border-radius: 6px;
    overflow: hidden;
    font-size: 0.8125rem;
  }

  .data-table th {
    background: var(--report-surface-2);
    color: var(--report-muted);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .data-table td,
  .data-table th {
    border-color: var(--report-border);
  }

  .report-footer {
    background: transparent;
    border-top: 1px solid var(--report-border);
    color: var(--report-muted);
  }

  @keyframes reportFadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 640px) {
    .report-header {
      padding: 36px 0 28px;
    }

    .discovery-card,
    .trend-analysis,
    .subscription-hits,
    .action-items,
    details {
      padding: 16px;
    }

    .data-table {
      display: block;
      overflow-x: auto;
      white-space: nowrap;
    }
  }
</style>
```

### 5. 正文结构要求（卡片/气泡风格）

每个发现条目使用 `<div class="discovery-card p0|p1|p2">` 包裹，形成卡片气泡效果：

```html
<div class="discovery-card p0">
  <h3>发现标题</h3>
  <p><strong>来源:</strong> <a href="...">链接</a></p>
  <p><strong>重要性:</strong> 说明为什么值得关注</p>
  <p><strong>评分:</strong> <span class="stars">★★★★★</span> (9.2/10)</p>
  <p><strong>建议路由:</strong> → Jarvis（某评估）</p>
</div>
```

### 样式规则（重要）

**全局 CSS 禁止修改** — `assets/css/main.css` 是 dashboard 首页和所有报告共享的样式文件。
- ❌ **绝对不要**读取、修改或重写 `assets/css/main.css`
- ✅ 你的 HTML 中只需要 `<link rel="stylesheet" href="../../assets/css/main.css">` 引用它
- ✅ 如果需要当前报告独有的视觉效果（如突发新闻的高亮边框、特殊动画），在 `<head>` 中内联 `<style>` 标签实现

内联样式必须使用上方报告皮肤变量；如需突发新闻高亮，只在当前 HTML 内扩展 `.breaking-news`，不要修改全局 CSS。

语义化标签规范：
- `<section class="priority-p0">` — P0 级发现容器（内部放 discovery-card）
- `<section class="priority-p1">` — P1 级发现容器
- `<section class="priority-p2">` — P2 级发现容器
- `<table class="data-table">` — 数据表格（GitHub 项目、论文列表等）
- `<section class="trend-analysis">` — 趋势分析段落
- `<section class="subscription-hits">` — 订阅命中
- `<section class="action-items">` — 待处理事项（checkbox 列表）
- `<details>` — 搜索困难与报错（折叠区域，默认收起）

### 6. 数据元数据（JSON-LD）

在每个 HTML 文件的 `<head>` 中嵌入 JSON-LD，供趋势分析脚本读取：

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": "Heimdall 晨间简报",
  "datePublished": "2026-05-17T08:00:00+08:00",
  "agent": "heimdall",
  "section": "academic",
  "period": "morning",
  "p0_count": 4,
  "p1_count": 8,
  "p2_count": 5,
  "subscription_hits": ["self-improving-agent", "llm-fault-localization"],
  "github_trending_topics": ["agent-framework", "mcp", "rust"],
  "arxiv_categories": ["cs.AI", "cs.SE"],
  "trend_signals": [
    {"topic": "Agent-Native 软件栈", "strength": 5, "direction": "rising"},
    {"topic": "MCP 生态", "strength": 4, "direction": "stable"}
  ]
}
</script>
```

### 7. 趋势数据更新

每次生成报告后，同步更新 `data/trends-academic.json`。格式见 `scripts/generate-trends.py` 说明。

---

## 隐私注意事项

- 不要包含 Discord Channel ID
- 不要包含任何 MCP server endpoint URL
- 不要包含本地文件路径（如 `/Users/xxx/...`）
- 路由建议中的内部 agent 名称（Jarvis/Banner/Pepper）可以保留，这是工作流的一部分
