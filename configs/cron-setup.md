# Cron Job 配置指南

## 概述

Heimdall 和 Friday 需要通过定时任务自动生成日报并推送到本仓库。

## 定时安排

### Heimdall（学术情报）

| 时段 | 时间 | 说明 |
|------|------|------|
| morning | 08:30 | 合并早盘预取 + 晨间简报 |
| noon | 12:30 | 合并论文扫描 + 午间解读 + 傍晚雷达 |
| evening | 20:30 | 合并晚间趋势 + 夜间维护 |

### Friday（宏观金融）

| 时段 | 时间 | 说明 |
|------|------|------|
| morning | 07:30 | A股晨报 |
| a-close | 15:05 | A股收盘分析（收盘后5分钟）|
| evening | 18:05 | 财经晚报 |
| us-premarket | 22:00 | 美股盘前宏观凝视 |

### 冲突避免

- Heimdall 和 Friday 的定时**不重叠**（最近间隔 1 小时）
- 各自使用独立的文件锁（`/tmp/heimdall-cron.lock` 和 `/tmp/friday-cron.lock`）
- 脚本内部使用 `git pull --rebase` + 推送重试机制
- 即使同时运行，由于写入不同目录（`academic/` vs `macro-finance/`），文件冲突概率极低

## 注册 Cron Job

使用 `hermes cron create` 注册：

### Heimdall

```bash
# Morning
hermes cron create \
  --name "heimdall-morning" \
  "30 8 * * *" \
  "cd /Users/bailynlove/Documents/2-Area/ai-tools/rookie-s-news && ./scripts/cron-heimdall.sh morning"

# Noon
hermes cron create \
  --name "heimdall-noon" \
  "30 12 * * *" \
  "cd /Users/bailynlove/Documents/2-Area/ai-tools/rookie-s-news && ./scripts/cron-heimdall.sh noon"

# Evening
hermes cron create \
  --name "heimdall-evening" \
  "30 20 * * *" \
  "cd /Users/bailynlove/Documents/2-Area/ai-tools/rookie-s-news && ./scripts/cron-heimdall.sh evening"
```

### Friday

```bash
# Morning
hermes cron create \
  --name "friday-morning" \
  "30 7 * * *" \
  "cd /Users/bailynlove/Documents/2-Area/ai-tools/rookie-s-news && ./scripts/cron-friday.sh morning"

# A-Close
hermes cron create \
  --name "friday-a-close" \
  "5 15 * * *" \
  "cd /Users/bailynlove/Documents/2-Area/ai-tools/rookie-s-news && ./scripts/cron-friday.sh a-close"

# Evening
hermes cron create \
  --name "friday-evening" \
  "5 18 * * *" \
  "cd /Users/bailynlove/Documents/2-Area/ai-tools/rookie-s-news && ./scripts/cron-friday.sh evening"

# US Premarket
hermes cron create \
  --name "friday-us-premarket" \
  "0 22 * * *" \
  "cd /Users/bailynlove/Documents/2-Area/ai-tools/rookie-s-news && ./scripts/cron-friday.sh us-premarket"
```

## 脚本工作原理

1. **获取锁** — 防止同一 agent 的多个实例同时运行
2. **git pull --rebase** — 拉取最新代码，避免推送冲突
3. **生成报告** — 调用 `heimdall chat` 或 `friday chat`，传入配置中的 prompt
4. **验证文件** — 检查 HTML 文件是否成功生成
5. **git commit** — 自动提交
6. **git push（带重试）** — 最多重试 3 次，每次失败后先 `pull --rebase`

## 手动测试

在配置 cron 之前，先手动测试脚本：

```bash
cd /Users/bailynlove/Documents/2-Area/ai-tools/rookie-s-news
./scripts/cron-heimdall.sh morning
./scripts/cron-friday.sh morning
```

## 查看 Cron 状态

```bash
hermes cron list
```

## 故障排查

- 如果推送持续失败，检查 GitHub 认证是否过期
- 如果报告生成失败，检查 agent 的 API 额度或网络状态
- 查看 `/tmp/heimdall-cron.lock` 或 `/tmp/friday-cron.lock` 判断是否有任务卡住
