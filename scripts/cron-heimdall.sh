#!/bin/bash
# Heimdall 学术日报定时推送脚本
# 用法: ./scripts/cron-heimdall.sh <morning|noon|evening>

set -euo pipefail

PERIOD="${1:-morning}"
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_DIR"

# 日期
DATE_STR=$(date +%Y-%m-%d)
TIME_STR=$(date +%H:%M)

# 防止并发冲突：简单的文件锁
LOCK_FILE="/tmp/heimdall-cron.lock"
exec 200>"$LOCK_FILE"
if ! flock -n 200; then
  echo "[$(date)] Heimdall cron already running, skipping."
  exit 0
fi

echo "[$(date)] Starting Heimdall $PERIOD report..."

# 1. 先拉取最新代码，避免冲突
git pull --rebase origin main || {
  echo "[$(date)] Git pull failed, aborting."
  exit 1
}

# 2. 创建日期目录
mkdir -p "academic/$DATE_STR"

# 3. 生成报告
heimdall chat -Q --max-turns 80 \
  -q "请阅读 configs/heimdall/html-output-instructions.md，按照规范生成今天的学术日报 HTML 报告。
时段: $PERIOD
保存路径: academic/$DATE_STR/$PERIOD.html
内容基于今天的真实数据（GitHub Trending、arXiv、HackerNews），使用 P0/P1/P2 分级，中文撰写。"

# 4. 检查文件是否生成
if [ ! -f "academic/$DATE_STR/$PERIOD.html" ]; then
  echo "[$(date)] Report generation failed: academic/$DATE_STR/$PERIOD.html not found."
  exit 1
fi

# 5. 提交并推送（带重试）
git add academic/
git commit -m "auto(heimdall): $PERIOD academic report for $DATE_STR" || true

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

echo "[$(date)] Heimdall $PERIOD report done."
