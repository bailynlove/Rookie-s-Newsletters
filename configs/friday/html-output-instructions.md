# Friday HTML 输出配置

> 本文件指导 Friday 将金融日报输出为 HTML 格式，存放于本仓库的 `macro-finance/YYYY-MM-DD/` 目录下。
> 此配置为 sanitized 版本，不含任何 API Key、Token、数据源凭证等敏感信息。

---

## 输出规则

### 1. 文件路径

每日生成 4 份 HTML 报告，命名规范：

```
macro-finance/YYYY-MM-DD/morning.html      # A股晨报
macro-finance/YYYY-MM-DD/a-close.html      # A股收盘分析
macro-finance/YYYY-MM-DD/evening.html      # 财经晚报
macro-finance/YYYY-MM-DD/us-premarket.html # 美股盘前宏观凝视
```

若目录不存在，自动创建。

### 2. HTML 模板规范

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Friday 宏观金融日报 — YYYY-MM-DD [morning|a-close|evening|us-premarket]</title>
  <link rel="stylesheet" href="../../assets/css/main.css">
  <script>
    document.documentElement.setAttribute('data-theme', localStorage.getItem('theme') || 'light');
  </script>
  <script type="module" src="../../assets/js/report-bookmarks.js"></script>
</head>
<body>
  <div class="report-skin report-skin-finance">
  <header class="report-header">
    <div class="container report-shell">
      <span class="badge badge-finance">宏观金融</span>
      <h1>Friday — [A股晨报|A股收盘分析|财经晚报|美股盘前宏观凝视]</h1>
      <time datetime="YYYY-MM-DDTHH:MM+08:00">YYYY年MM月DD日 HH:MM CST</time>
    </div>
  </header>

  <main class="container report-shell">
    <!-- 报告正文 -->
  </main>

  <footer class="report-footer">
    <div class="container report-shell">
      <p>Friday 首席经济学家 · 宏观金融情报流</p>
      <p><a href="../../index.html">← 返回看板</a></p>
    </div>
  </footer>
  </div>
</body>
</html>
```

### 3. 报告皮肤（Report Skin）

Friday 报告必须采用项目统一的 **报告皮肤 (Report Skin)**：参考附件的窄栏技术手册风格，但不照搬技能手册的内容结构。报告皮肤只用于未来新生成的报告，不需要批量改写历史报告。

**权威来源：** 本文件是 Friday HTML 样式规范的权威来源。Hermes profile 只定义 Friday 的身份与任务，不承载本项目 HTML 样式决策。

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
- 深色/强调背景模块必须同时设置文字颜色，或使用 `--report-*` 主题变量保证白色/黑色模式都可读
- 标题：section 标题使用细线分隔、uppercase/letter-spacing 的技术手册风格
- 动效：允许轻微 `fadeUp` 入场动画；不要使用夸张闪烁，除非是重大风险警示
- Friday accent：金绿/琥珀色系，表达市场、风险、资金流与宏观判断

**必须保留的语义结构：**
- JSON-LD 元数据
- `<section class="macro-factors">`
- `<section class="risk-assessment">`
- `<section class="market-outlook">`
- `<section class="sentiment">`
- `<div class="discovery-card">`
- `<table class="data-table">`
- 隐私过滤规则
- 返回看板链接

**不要照搬附件内容组件：** 不要生成 `core-grid`、`flow-step`、技能流程表等教程结构。日报不是技能手册，附件只提供视觉方向。

每份报告的 `<head>` 中，在全局 CSS 和 `report-bookmarks.js` 之后加入如下内联样式，并可按当日报告内容做小幅扩展：

```html
<style>
  :root {
    --report-bg: #faf8f0;
    --report-surface: #ffffff;
    --report-surface-2: #f2eddd;
    --report-border: #ded4b8;
    --report-text: #231f16;
    --report-muted: #766b55;
    --report-accent: #8a6f12;
    --report-accent-2: #1b7f55;
    --report-danger: #b42318;
    --report-shadow: 0 8px 26px rgba(50, 38, 16, 0.08);
  }

  [data-theme="dark"] {
    --report-bg: #0f0d08;
    --report-surface: #18150e;
    --report-surface-2: #221e13;
    --report-border: #3d3421;
    --report-text: #f0eadc;
    --report-muted: #a99d80;
    --report-accent: #ffd166;
    --report-accent-2: #7fffca;
    --report-danger: #ff786b;
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
    opacity: 0.32;
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

  .badge-finance {
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
  .risk-assessment,
  .market-outlook,
  .sentiment,
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
  .risk-assessment,
  .market-outlook,
  .sentiment,
  details {
    color: var(--report-muted);
  }

  .discovery-card strong,
  a {
    color: var(--report-accent);
  }

  .breaking-alert,
  .risk-high {
    border-color: color-mix(in srgb, var(--report-danger), var(--report-border) 35%);
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

  .privacy-notice {
    background: var(--report-surface-2);
    border: 1px dashed var(--report-border);
    border-radius: 6px;
    color: var(--report-muted);
    padding: 14px 16px;
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
    .risk-assessment,
    .market-outlook,
    .sentiment,
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

### 4. 正文结构要求（卡片/气泡风格）

每个独立条目（如单只股票分析、单个宏观事件）使用 `<div class="discovery-card">` 包裹，形成卡片气泡效果：

```html
<div class="discovery-card">
  <h3>事件/标的名称</h3>
  <p><strong>数据:</strong> 关键数值</p>
  <p><strong>信号:</strong> 解读</p>
</div>
```

### 样式规则（重要）

**全局 CSS 禁止修改** — `assets/css/main.css` 是 dashboard 首页和所有报告共享的样式文件。
- ❌ **绝对不要**读取、修改或重写 `assets/css/main.css`
- ✅ 你的 HTML 中只需要 `<link rel="stylesheet" href="../../assets/css/main.css">` 引用它
- ✅ 如果需要当前报告独有的视觉效果（如突发利空的高亮边框、特殊数据展示），在 `<head>` 中内联 `<style>` 标签实现

内联样式必须使用上方报告皮肤变量；如需突发利空警示，只在当前 HTML 内扩展 `.breaking-alert`，不要修改全局 CSS。

语义化标签规范：
- `<section class="macro-factors">` — L1-L4 宏观因子（每个因子用 discovery-card）
- `<table class="data-table">` — 指数数据、板块涨跌、资金流向表格
- `<section class="risk-assessment">` — 反面论据 + 风险提示（每个风险用 discovery-card）
- `<section class="market-outlook">` — 明日关注点
- `<section class="sentiment">` — 情绪评分、置信度

### 5. 数据元数据（JSON-LD）

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": "Friday A股收盘分析",
  "datePublished": "2026-05-14T15:05:00+08:00",
  "agent": "friday",
  "section": "macro-finance",
  "period": "a-close",
  "market_sentiment": 58,
  "confidence": 0.70,
  "key_indices": {
    "上证综指": {"value": 4177.92, "change": -1.52},
    "创业板指": {"value": 3951.14, "change": -2.16},
    "科创50": {"value": 1012.27, "change": 1.23},
    "恒生指数": {"value": 26389.04, "change": 0.00}
  },
  "risk_level": "medium",
  "risk_categories": {
    "A股整体": "medium",
    "科技股": "high",
    "港股": "low-mid",
    "美股": "mid",
    "债市": "low",
    "商品": "mid"
  },
  "trend_signals": [
    {"topic": "美联储政策", "strength": 5, "direction": "rising"},
    {"topic": "中美关系", "strength": 3, "direction": "stable"}
  ]
}
</script>
```

---

## ⚠️ 隐私过滤规则（强制）

**本仓库为公开仓库，所有 HTML 输出必须通过 GitHub Pages 公开访问。以下内容必须过滤删除：**

### 必须删除的章节

1. **持仓标的评估**
   - 标题关键词：`持仓标的评估`、`持仓评估`、`portfolio`
   - 删除整个章节（从标题到下一个同级标题之间的全部内容）

2. **观望标的评估**
   - 标题关键词：`观望标的评估`、`观望`、`watchlist`
   - 删除整个章节

3. **操作建议中的个人化建议**
   - 删除含有以下关键词的段落：
     - "建议继续持有"
     - "建议关注建仓机会"
     - "建议观望"
     - "建议卖出"
     - "操作建议" 表格中包含具体标的的行
   - **保留**：纯市场方向判断（如"A股今日有望延续上涨态势"）

4. **FRIDAY评估总结中的持仓部分**
   - 删除"持仓标的评估"小节
   - 保留"整体市场评估"和"明日展望"

### 可以保留的内容

- L1-L4 宏观因子（不含个人持仓）
- A股/港股/美股指数数据
- 板块涨跌排名
- 资金流向（南向资金、北向资金）
- 反面论据和风险提示
- 明日关注点
- 情绪评分和置信度

### 替换策略

如果某节内容全部敏感，整节删除。
如果某节内容部分敏感，删除敏感段落，保留市场分析部分。

在删除处可插入占位提示：

```html
<div class="privacy-notice">
  <p>⚠️ 个人持仓分析已根据隐私策略过滤。完整分析请查看私有数据源。</p>
</div>
```

---

## 趋势数据更新

每次生成报告后，同步更新 `data/trends-finance.json`。格式见 `scripts/generate-trends.py` 说明。
