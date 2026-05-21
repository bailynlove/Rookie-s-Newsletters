#!/bin/bash
# Friday 宏观金融日报定时推送脚本
# 用法: ./scripts/cron-friday.sh <morning|a-close|evening|us-premarket>

set -euo pipefail

PERIOD="${1:-morning}"
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_DIR"

# 日期
DATE_STR=$(date +%Y-%m-%d)
TIME_STR=$(date +%H:%M)

# 防止并发冲突：macOS 兼容的 PID 文件锁
LOCK_FILE="/tmp/friday-cron.lock"
if [ -f "$LOCK_FILE" ]; then
  LOCK_PID=$(cat "$LOCK_FILE" 2>/dev/null)
  if [ -n "$LOCK_PID" ] && kill -0 "$LOCK_PID" 2>/dev/null; then
    echo "[$(date)] Friday cron already running (PID $LOCK_PID), skipping."
    exit 0
  fi
  echo "Stale lock file (PID $LOCK_PID), removing."
fi
echo $$ > "$LOCK_FILE"

echo "[$(date)] Starting Friday $PERIOD report..."

# 1. 先拉取最新代码，避免冲突
git pull --rebase origin main || {
  echo "[$(date)] Git pull failed, aborting."
  exit 1
}

# 2. 创建日期目录
mkdir -p "macro-finance/$DATE_STR"

# 3. 生成报告（带隐私过滤提示）
friday chat -Q --max-turns 80 \
  -q "请阅读 configs/friday/html-output-instructions.md，按照规范生成今天的宏观金融日报 HTML 报告。
时段: $PERIOD
保存路径: macro-finance/$DATE_STR/$PERIOD.html
⚠️ 重要：必须过滤删除持仓标的评估和观望标的评估章节！这是公开仓库！
内容基于今天的真实市场数据（A股/港股/美股），使用 L1-L4 框架，中文撰写。"

# 4. 检查文件是否生成
if [ ! -f "macro-finance/$DATE_STR/$PERIOD.html" ]; then
  echo "[$(date)] Report generation failed: macro-finance/$DATE_STR/$PERIOD.html not found."
  exit 1
fi

# 5. 提交并推送（带重试）
git add macro-finance/
git commit -m "auto(friday): $PERIOD macro-finance report for $DATE_STR" || true

MAX_RETRIES=3
RETRY=0
while [ $RETRY -lt $MAX_RETRIES ]; do
  if git push origin main; then
    echo "[$(date)] Push successful."
    break
  fi
  RETRY=$((RETRY + 1))
  echo "[$(date)] Push failed, retry $RETRY/$MAX_RETRIES..."
  git pull --rebase origin main
  sleep 5
done

if [ $RETRY -eq $MAX_RETRIES ]; then
  echo "[$(date)] Push failed after $MAX_RETRIES retries."
  exit 1
fi

echo "[$(date)] Friday $PERIOD report done."
