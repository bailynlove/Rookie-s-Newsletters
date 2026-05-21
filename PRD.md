# PRD: Rookie's News — 学术情报 · 宏观金融看板 v2

## Problem Statement

用户运营两个自主智能体（Heimdall 负责学术情报，Friday 负责宏观金融），它们目前将日报以 Markdown 格式输出到本地 Obsidian vault。用户希望：

1. 将这些日报转换为 HTML 格式，便于在浏览器中阅读
2. 通过 GitHub Pages 免费托管，在电脑和手机上随时查看
3. 有一个直观的管理看板首页，能一眼看到最新的 newsletter
4. 学术日报和金融日报分开展示，互不干扰
5. 由于仓库是公开的，Friday 的金融日报必须过滤掉个人持仓信息
6. 看板需要丰富的趋势可视化，帮助用户快速洞察情报变化

当前痛点：
- Markdown 在移动设备上阅读体验差
- 报告分散在本地文件夹，无法远程访问
- 没有统一的入口和趋势概览
- 手动转换格式和维护网站成本过高
- 缺乏数据可视化手段来发现长期趋势和关联模式

## Solution

构建一个完全静态的网站架构，由智能体直接输出 HTML 报告到本仓库，GitHub Actions 自动扫描报告元数据、生成趋势 JSON、部署到 GitHub Pages。

核心设计：
- **双分区架构**：`academic/`（Heimdall）和 `macro-finance/`（Friday）
- **Agent 直出 HTML**：Agent 的配置中嵌入 HTML 模板和 JSON-LD 元数据规范，Agent 直接生成符合规范的 HTML 文件
- **自动趋势聚合**：Python 脚本扫描所有 HTML 中的 JSON-LD，生成 dashboard 所需的 manifest 和趋势数据
- **隐私过滤内建**：Friday 的 HTML 生成配置中强制删除持仓和观望标的章节
- **零依赖前端**：纯 CSS + 原生 JS，无外部图表库或框架
- **白天/夜间模式**：CSS 变量切换，状态保存在 localStorage
- **多维可视化**：日历热图、折线图、柱状图、词云图、UpSet 共振图、风险矩阵、Sparkline 阵列

## User Stories

1. As a user, I want Heimdall's daily academic reports to be viewable in a browser, so that I can read them on my phone without opening Obsidian.
2. As a user, I want Friday's macro-finance reports to be viewable in a browser, so that I can check market analysis on any device.
3. As a user, I want a single dashboard homepage showing the latest reports from both agents, so that I can see what's new at a glance.
4. As a user, I want the academic dashboard to show trending topics from GitHub, HuggingFace, and arXiv over the last 7 days, so that I can spot emerging research directions.
5. As a user, I want the finance dashboard to show key index movements (SSE, ChiNext, NASDAQ, Hang Seng) and sentiment trends, so that I can quickly gauge market conditions.
6. As a user, I want Friday's reports to hide my personal stock holdings and watchlist, so that my portfolio remains private in a public repository.
7. As a user, I want the site to update automatically when new reports are pushed, so that I don't need to manually rebuild or deploy.
8. As a user, I want to browse historical reports by date, so that I can look back at past analysis.
9. As a user, I want the site to work well on mobile, so that I can read reports on my phone during commutes.
10. As a user, I want the dashboard to show a 7-day sparkline of paper volume (P0/P1/P2 counts), so that I can see if research activity is accelerating.
11. As a user, I want the finance panel to show a sentiment gauge and confidence trend, so that I can track Friday's market conviction over time.
12. As a user, I want Heimdall to consolidate its 7 daily reports into 3 (morning/noon/evening), so that the archive is less cluttered and easier to navigate.
13. As a user, I want the site to have a light theme by default with optional dark mode, so that it's comfortable to read in any lighting condition.
14. As a user, I want each report to link back to the dashboard, so that I can easily return to the overview after reading a specific report.
15. As a user, I want the trend data to be generated automatically from report metadata, so that I don't need to maintain separate statistics.
16. As a developer, I want the agent output configurations to be stored in the repo (sanitized, without API keys), so that the setup is documented and reproducible.
17. As a developer, I want the build script to extract metadata from HTML files without parsing the full DOM, so that the build remains fast and simple.
18. As a user, I want error logs and MCP health check sections in Heimdall's reports to be collapsible by default, so that they don't clutter the reading experience.
19. As a user, I want P0-level findings to be visually highlighted in academic reports, so that critical items stand out immediately.
20. As a user, I want to switch between bar charts and word clouds for academic trends, so that I can choose the visualization style that works best for me.
21. As a user, I want a calendar heatmap showing daily academic activity intensity, so that I can see patterns in research output over time.
22. As a user, I want a risk matrix heatmap in the finance panel, so that I can visualize risk levels across asset categories and time.
23. As a user, I want an UpSet plot showing cross-subscription resonance, so that I can see which papers hit multiple subscription topics simultaneously.
24. As a user, I want sparkline arrays showing per-topic trends over time, so that I can track individual topic trajectories.
25. As a user, I want the "recent updates" section to be collapsible and responsive, so that it doesn't overwhelm the dashboard on first load.

## Implementation Decisions

### Agent HTML Output Architecture

Instead of a traditional md→html build pipeline, the agents themselves generate HTML directly. This decision was made because:
- Agents already structure their output semantically (P0/P1/P2 sections, tables, trend analysis)
- A generic markdown→html converter would lose the semantic richness (priority colors, collapsible sections, etc.)
- It removes a build step and a class of conversion bugs

Each agent has a configuration file in `configs/<agent>/html-output-instructions.md` that specifies:
- HTML template skeleton with shared CSS link
- Semantic section classes (`priority-p0`, `priority-p1`, `data-table`, `trend-analysis`, etc.)
- Card/bubble style for individual items using `discovery-card`
- JSON-LD metadata block in `<head>` for machine-readable extraction
- File naming conventions and directory structure

### JSON-LD Metadata Contract

Each HTML report embeds a `<script type="application/ld+json">` block containing:
- For academic: `p0_count`, `p1_count`, `p2_count`, `subscription_hits`, `github_trending_topics`, `arxiv_categories`, `trend_signals`
- For finance: `market_sentiment`, `confidence`, `key_indices`, `risk_level`, `trend_signals`

The `scripts/build-dashboard.py` script uses regex to extract these blocks, then aggregates them into:
- `data/manifest.json` — list of all reports with path/date/period
- `data/trends-academic.json` — 90-day daily series, calendar heatmap data, sparkline time-series, UpSet combination frequencies, top topics/subscriptions/GitHub topics
- `data/trends-finance.json` — 90-day daily series with sentiment/confidence/indices, calendar heatmap data, risk grid matrix, risk distribution, top trend signals

### Dashboard Frontend

The homepage (`index.html`) is a vanilla JS single-page app with tab-based navigation:
- Two tabs: "📚 学术情报" and "💹 宏观金融"
- Each tab occupies the full width when active
- Uses pure CSS + SVG for all visualizations

**Academic Panel Visualizations:**
1. **Latest report card** — links to today's reports
2. **Collapsible recent updates** — 3-column grid on desktop (10 items), 1-column on mobile (5 items)
3. **Calendar Heatmap** — 90-day grid showing daily paper intensity (CSS Grid, 5 color levels)
4. **Sparkline Array** — per-topic mini line charts over time (SVG polyline)
5. **Topic Trends** — toggle between bar chart view (3 columns: GitHub/arXiv/Community) and word cloud view
6. **UpSet Plot** — cross-subscription resonance visualization (HTML/CSS Grid: top bars + bottom dot matrix)

**Finance Panel Visualizations:**
1. **Latest report card** — links to today's reports
2. **Collapsible recent updates**
3. **Index Cards** — 4-column grid showing key indices with up/down indicators
4. **Calendar Heatmap** — 90-day sentiment intensity grid
5. **Sentiment Line Chart** — SVG line chart with area fill
6. **Confidence Line Chart** — SVG line chart
7. **Risk Matrix Heatmap** — SVG/CSS grid showing risk levels per category per date (discrete 5-level HSL color scale)
8. **Trend Signal Bars** — horizontal bar chart of macro signal frequencies

### Privacy Filtering for Friday

The privacy filter is applied at generation time by the agent itself:
- Delete entire sections titled "持仓标的评估" or containing "portfolio"
- Delete entire sections titled "观望标的评估" or containing "watchlist"
- Remove table rows in "操作建议" that reference specific tickers with personal advice
- Keep market-direction analysis even if it contains opinions

### Report Consolidation

Heimdall currently generates 7 reports per day. These are consolidated to 3:
- `morning` = 早盘预取 (07:50) + 晨间简报 (08:30)
- `noon` = 论文专题扫描 (11:30) + 午间解读 (12:00) + 傍晚雷达 (17:30)
- `evening` = 晚间趋势 (20:00) + 夜间维护 (20:15)

Friday retains its 4 reports per day:
- `morning` = A股晨报
- `a-close` = A股收盘分析
- `evening` = 财经晚报
- `us-premarket` = 美股盘前宏观凝视

### GitHub Actions Workflow

The workflow (`deploy.yml`) has two jobs:
1. **Build**: Runs `scripts/build-dashboard.py` to regenerate JSON data files, then uploads the entire repo as a Pages artifact
2. **Deploy**: Deploys the artifact to GitHub Pages

Triggers on every push to `main` and on manual dispatch.

### CSS Design System

A single shared stylesheet (`assets/css/main.css`) serves all pages:
- CSS custom properties for theming with `[data-theme="dark"]` override
- Light mode by default
- Academic accent: blue, Finance accent: green
- Priority colors: red (P0), orange (P1), purple (P2)
- Responsive breakpoints: mobile-first, single column below 768px
- Font stack: system fonts + Noto Sans SC for CJK

### Cron Job Automation

Shell scripts (`scripts/cron-heimdall.sh`, `scripts/cron-friday.sh`) handle:
1. File lock to prevent concurrent runs
2. `git pull --rebase origin main`
3. Agent report generation via `hermes chat`
4. `git commit` + `git push` with 3-retry fallback

Schedules are staggered to avoid overlap:
- Heimdall: 08:30, 12:30, 20:30
- Friday: 07:30, 15:05, 18:05, 22:00

## Testing Decisions

### What Makes a Good Test

Tests should verify external behavior and data contracts, not implementation details:
- Given a directory of HTML files with valid JSON-LD, does `build-dashboard.py` produce correct manifest and trend JSON?
- Given a trend JSON file, does the dashboard render without JS errors?
- Does the CSS render correctly on both desktop and mobile viewport sizes?

### Modules to Test

1. **`scripts/build-dashboard.py`** — Unit tests for:
   - `discover_reports()`: correctly finds and sorts HTML files
   - `extract_jsonld()`: correctly parses JSON-LD from HTML with various edge cases
   - `generate_academic_trends()`: correct aggregation of daily counts, topic rankings, calendar data, sparkline series, UpSet combinations
   - `generate_finance_trends()`: correct sentiment series, index extraction, risk grid, calendar data

2. **Dashboard JavaScript (in `index.html`)** — Browser-based tests for:
   - Rendering with empty manifest (shows empty state)
   - Rendering with malformed JSON (shows error state)
   - Responsive layout at 375px, 768px, 1440px viewports
   - Theme toggle functionality
   - Tab switching functionality
   - Collapsible section toggle

3. **CSS** — Visual regression tests or manual checklist for:
   - Light/dark theme renders correctly
   - All interactive elements have hover/focus states
   - Text remains readable at 200% zoom
   - Calendar heatmap color levels visible in both themes
   - Risk matrix color levels visible in both themes

### Prior Art

This repo is newly initialized. There are no existing tests to build upon. Tests should be added in a `tests/` directory using Python's built-in `unittest` for the build script and a simple HTML test page for the frontend.

## Out of Scope

1. **Real-time updates** — The site is statically rebuilt on push. There is no WebSocket or server-side push for live updates.
2. **Search functionality** — No full-text search across reports. Users browse by date or use browser find (Ctrl+F).
3. **Authentication / access control** — GitHub Pages is public. All non-filtered content is world-readable. Private portfolio analysis remains in the local Obsidian vault.
4. **Multi-language support** — Reports are in Chinese. The UI is in Chinese. No i18n framework is included.
5. **Email / notification delivery** — The site is pull-based (user visits the URL). No push notifications or email digests.
6. **Backfill of historical reports** — Only new reports generated after this PRD's implementation will be in HTML format. Historical Markdown reports in the Obsidian vault are not migrated.
7. **External chart libraries (Chart.js, D3, ECharts, etc.)** — All visualizations are CSS/SVG-only to minimize dependencies and load time.
8. **Commenting or discussion** — No user-generated content on the site.
9. **Bump Chart / Streamgraph** — Recommended by opus-4.7 but not yet implemented due to data requirements (need historical ranking data / category proportions).
10. **Radial Gauge** — Recommended by opus-4.7 but not yet implemented (can be added when single-metric "current water level" visualization is needed).

## Further Notes

- The `AGENTS.md` and `docs/agents/` files from the `setup-matt-pocock-skills` setup should remain in the repo but are not part of the public site content.
- The `CONTEXT.md` domain glossary should be updated as new terminology emerges from agent outputs.
- If the volume of reports grows significantly (>1000 files), the build script may need optimization (caching, incremental updates).
- The site URL will be `https://bailynlove.github.io/Rookie-s-Newsletters/` based on the repo name.
- For local development, users can run `python -m http.server` in the repo root to preview the site before pushing.
- Future enhancements from opus-4.7 recommendations: Bump Chart for topic ranking changes, Streamgraph for category composition, Radial Gauge for single-metric dashboards.
