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
</head>
<body>
  <header class="report-header">
    <div class="container">
      <span class="badge badge-academic">学术情报</span>
      <h1>Heimdall — [晨间简报|午间论文|晚间趋势]</h1>
      <time datetime="YYYY-MM-DDTHH:MM+08:00">YYYY年MM月DD日 HH:MM CST</time>
    </div>
  </header>

  <main class="container">
    <!-- 报告正文 -->
  </main>

  <footer class="report-footer">
    <div class="container">
      <p>Heimdall AI Sentinel · 学术情报流</p>
      <p><a href="../../index.html">← 返回看板</a></p>
    </div>
  </footer>
</body>
</html>
```

### 4. 正文结构要求（卡片/气泡风格）

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

**内联样式示例**（仅影响当前报告）：
```html
<head>
  <link rel="stylesheet" href="../../assets/css/main.css">
  <style>
    /* 当前报告独有的样式，如突发新闻闪烁效果 */
    .breaking-news {
      border: 2px solid var(--accent-danger);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(207, 34, 46, 0.4); }
      50% { box-shadow: 0 0 0 8px rgba(207, 34, 46, 0); }
    }
  </style>
</head>
```

语义化标签规范：
- `<section class="priority-p0">` — P0 级发现容器（内部放 discovery-card）
- `<section class="priority-p1">` — P1 级发现容器
- `<section class="priority-p2">` — P2 级发现容器
- `<table class="data-table">` — 数据表格（GitHub 项目、论文列表等）
- `<section class="trend-analysis">` — 趋势分析段落
- `<section class="subscription-hits">` — 订阅命中
- `<section class="action-items">` — 待处理事项（checkbox 列表）
- `<details>` — 搜索困难与报错（折叠区域，默认收起）

### 5. 数据元数据（JSON-LD）

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

### 6. 趋势数据更新

每次生成报告后，同步更新 `data/trends-academic.json`。格式见 `scripts/generate-trends.py` 说明。

---

## 隐私注意事项

- 不要包含 Discord Channel ID
- 不要包含任何 MCP server endpoint URL
- 不要包含本地文件路径（如 `/Users/xxx/...`）
- 路由建议中的内部 agent 名称（Jarvis/Banner/Pepper）可以保留，这是工作流的一部分