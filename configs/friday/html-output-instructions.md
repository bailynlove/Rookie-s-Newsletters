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
</head>
<body>
  <header class="report-header">
    <div class="container">
      <span class="badge badge-finance">宏观金融</span>
      <h1>Friday — [A股晨报|A股收盘分析|财经晚报|美股盘前宏观凝视]</h1>
      <time datetime="YYYY-MM-DDTHH:MM+08:00">YYYY年MM月DD日 HH:MM CST</time>
    </div>
  </header>

  <main class="container">
    <!-- 报告正文 -->
  </main>

  <footer class="report-footer">
    <div class="container">
      <p>Friday 首席经济学家 · 宏观金融情报流</p>
      <p><a href="../../index.html">← 返回看板</a></p>
    </div>
  </footer>
</body>
</html>
```

### 3. 正文结构要求（卡片/气泡风格）

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

**内联样式示例**（仅影响当前报告）：
```html
<head>
  <link rel="stylesheet" href="../../assets/css/main.css">
  <style>
    /* 当前报告独有的样式，如突发利空警示效果 */
    .breaking-alert {
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
- `<section class="macro-factors">` — L1-L4 宏观因子（每个因子用 discovery-card）
- `<table class="data-table">` — 指数数据、板块涨跌、资金流向表格
- `<section class="risk-assessment">` — 反面论据 + 风险提示（每个风险用 discovery-card）
- `<section class="market-outlook">` — 明日关注点
- `<section class="sentiment">` — 情绪评分、置信度

### 4. 数据元数据（JSON-LD）

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
