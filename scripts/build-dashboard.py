#!/usr/bin/env python3
"""
扫描 academic/ 和 macro-finance/ 目录下的 HTML 报告，
提取 JSON-LD 元数据，生成 dashboard 所需的 manifest 和趋势 JSON 文件。

Usage:
    python scripts/build-dashboard.py
"""

import json
import os
import re
from datetime import datetime, timedelta
from pathlib import Path
from collections import Counter, defaultdict
from itertools import combinations

REPO_ROOT = Path(__file__).parent.parent
ACADEMIC_DIR = REPO_ROOT / "academic"
FINANCE_DIR = REPO_ROOT / "macro-finance"
DATA_DIR = REPO_ROOT / "data"

PERIODS_ORDER = ["morning", "noon", "evening", "a-close", "us-premarket"]


def discover_reports(base_dir: Path) -> list[dict]:
    """扫描目录，发现所有 HTML 报告文件。"""
    reports = []
    if not base_dir.exists():
        return reports

    for html_file in sorted(base_dir.rglob("*.html")):
        rel = html_file.relative_to(base_dir)
        parts = rel.parts
        if len(parts) >= 2:
            date_str = parts[0]
            filename = parts[-1]
            period = filename.replace(".html", "")
            # Extract keywords from JSON-LD
            meta = extract_jsonld(html_file)
            keywords = []
            for signal in meta.get("trend_signals", [])[:3]:
                kw = signal.get("topic", "")
                if kw and kw not in keywords:
                    keywords.append(kw)
            if not keywords and meta.get("headline"):
                keywords = [meta["headline"].replace("Heimdall ", "").replace("Friday ", "").strip()]
            reports.append({
                "path": str(html_file.relative_to(REPO_ROOT)),
                "date": date_str,
                "period": period,
                "section": base_dir.name,
                "keywords": keywords,
            })

    def sort_key(r):
        try:
            dt = datetime.strptime(r["date"], "%Y-%m-%d")
        except ValueError:
            dt = datetime.min
        period_idx = PERIODS_ORDER.index(r["period"]) if r["period"] in PERIODS_ORDER else 99
        return (dt, period_idx)

    reports.sort(key=sort_key, reverse=True)
    return reports


def extract_jsonld(html_path: Path) -> dict:
    """从 HTML 文件中提取 JSON-LD 元数据。"""
    try:
        content = html_path.read_text(encoding="utf-8")
    except Exception:
        return {}

    match = re.search(r'<script type="application/ld\+json">(.*?)</script>', content, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass
    return {}


def generate_academic_trends(reports: list[dict]) -> dict:
    """生成学术趋势数据。"""
    cutoff = datetime.now() - timedelta(days=90)

    daily_counts = defaultdict(lambda: {"p0": 0, "p1": 0, "p2": 0, "total": 0})
    topic_counts = Counter()
    category_counts = Counter()
    sub_hits = Counter()
    github_topics = Counter()
    
    # For sparklines: daily topic frequencies
    daily_topic_counts = defaultdict(Counter)
    
    # For UpSet: subscription combinations
    upset_combinations = Counter()
    
    # For calendar: daily intensity
    calendar_data = {}

    for r in reports:
        try:
            dt = datetime.strptime(r["date"], "%Y-%m-%d")
        except ValueError:
            continue

        meta = extract_jsonld(REPO_ROOT / r["path"])
        date_key = r["date"]

        daily_counts[date_key]["p0"] += meta.get("p0_count", 0)
        daily_counts[date_key]["p1"] += meta.get("p1_count", 0)
        daily_counts[date_key]["p2"] += meta.get("p2_count", 0)
        daily_counts[date_key]["total"] += meta.get("p0_count", 0) + meta.get("p1_count", 0) + meta.get("p2_count", 0)

        # Calendar intensity: total papers as intensity
        calendar_data[date_key] = meta.get("p0_count", 0) + meta.get("p1_count", 0) + meta.get("p2_count", 0)

        for topic in meta.get("github_trending_topics", []):
            github_topics[topic] += 1
            daily_topic_counts[date_key][topic] += 1
        for cat in meta.get("arxiv_categories", []):
            category_counts[cat] += 1
        for sub in meta.get("subscription_hits", []):
            sub_hits[sub] += 1
        for signal in meta.get("trend_signals", []):
            topic_counts[signal.get("topic", "")] += signal.get("strength", 1)
            daily_topic_counts[date_key][signal.get("topic", "")] += signal.get("strength", 1)

        # UpSet: subscription combinations (only multi-subscription combos)
        subs = sorted(meta.get("subscription_hits", []))
        if len(subs) >= 2:
            for combo in combinations(subs, 2):
                upset_combinations[combo] += 1
        if len(subs) >= 3:
            for combo in combinations(subs, 3):
                upset_combinations[combo] += 1

    sorted_dates = sorted(daily_counts.keys())[-90:]
    daily_series = [
        {"date": d, **daily_counts[d]}
        for d in sorted_dates
    ]

    # Sparkline data: time series for top topics
    top_topic_names = [t["topic"] for t in [{"topic": t, "count": c} for t, c in topic_counts.most_common(8)]]
    sparkline_data = []
    for topic in top_topic_names:
        series = []
        for d in sorted_dates:
            series.append({"date": d, "value": daily_topic_counts[d].get(topic, 0)})
        sparkline_data.append({"topic": topic, "series": series})

    # Calendar data (last 90 days)
    calendar_list = [{"date": d, "intensity": calendar_data.get(d, 0)} for d in sorted_dates]
    max_intensity = max((x["intensity"] for x in calendar_list), default=1)
    for x in calendar_list:
        x["level"] = min(4, int(x["intensity"] / max_intensity * 4)) if max_intensity > 0 else 0

    # UpSet data
    upset_list = []
    for combo, count in upset_combinations.most_common(20):
        upset_list.append({
            "combination": list(combo),
            "count": count,
            "size": len(combo)
        })

    return {
        "generated_at": datetime.now().isoformat(),
        "daily_series": daily_series,
        "calendar_data": calendar_list,
        "sparkline_data": sparkline_data,
        "top_topics": [{"topic": t, "count": c} for t, c in topic_counts.most_common(15)],
        "top_categories": [{"category": c, "count": n} for c, n in category_counts.most_common(10)],
        "top_subscriptions": [{"subscription": s, "count": n} for s, n in sub_hits.most_common(10)],
        "top_github_topics": [{"topic": t, "count": n} for t, n in github_topics.most_common(10)],
        "upset_data": upset_list,
    }


def generate_finance_trends(reports: list[dict]) -> dict:
    """生成金融趋势数据。"""
    cutoff = datetime.now() - timedelta(days=90)

    daily_data = {}
    risk_levels = Counter()
    trend_signals = Counter()
    
    # For risk matrix: risk per category per day
    risk_matrix = defaultdict(lambda: defaultdict(str))
    
    # For calendar: sentiment as intensity
    calendar_data = {}

    for r in reports:
        try:
            dt = datetime.strptime(r["date"], "%Y-%m-%d")
        except ValueError:
            continue

        meta = extract_jsonld(REPO_ROOT / r["path"])
        date_key = r["date"]

        if date_key not in daily_data:
            daily_data[date_key] = {
                "date": date_key,
                "sentiment": None,
                "confidence": None,
                "indices": {},
            }

        if meta.get("market_sentiment") is not None:
            daily_data[date_key]["sentiment"] = meta["market_sentiment"]
        if meta.get("confidence") is not None:
            daily_data[date_key]["confidence"] = meta["confidence"]

        for name, data in meta.get("key_indices", {}).items():
            if name not in daily_data[date_key]["indices"]:
                daily_data[date_key]["indices"][name] = data

        # Risk level mapping
        risk_cats = meta.get("risk_categories", {})
        if risk_cats:
            for cat, level in risk_cats.items():
                risk_matrix[date_key][cat] = level
                risk_levels[level] += 1
        else:
            # Backward compatibility: single risk_level field
            risk_level = meta.get("risk_level", "unknown")
            risk_levels[risk_level] += 1
            risk_matrix[date_key]["市场"] = risk_level
        
        # Calendar: sentiment as intensity
        sentiment = meta.get("market_sentiment", 0)
        calendar_data[date_key] = max(calendar_data.get(date_key, 0), sentiment)

        for signal in meta.get("trend_signals", []):
            trend_signals[signal.get("topic", "")] += signal.get("strength", 1)

    sorted_dates = sorted(daily_data.keys())[-90:]
    daily_series = [daily_data[d] for d in sorted_dates]

    # Calendar data
    calendar_list = [{"date": d, "intensity": calendar_data.get(d, 0)} for d in sorted_dates]
    max_intensity = max((x["intensity"] for x in calendar_list), default=100)
    for x in calendar_list:
        x["level"] = min(4, int(x["intensity"] / max_intensity * 4)) if max_intensity > 0 else 0

    # Risk matrix: reshape for grid heatmap
    # Use last 14 days for the grid
    recent_dates = sorted_dates[-14:]
    # Dynamically discover all risk categories from data
    all_categories = sorted({cat for day in risk_matrix.values() for cat in day.keys()})
    if not all_categories:
        all_categories = ["市场"]
    risk_grid = []
    for cat in all_categories:
        row = []
        for d in recent_dates:
            level = risk_matrix[d].get(cat, "unknown")
            row.append({"date": d, "level": level})
        risk_grid.append({"category": cat, "values": row})

    return {
        "generated_at": datetime.now().isoformat(),
        "daily_series": daily_series,
        "calendar_data": calendar_list,
        "risk_grid": risk_grid,
        "risk_distribution": [{"level": l, "count": c} for l, c in risk_levels.most_common()],
        "top_trend_signals": [{"topic": t, "count": c} for t, c in trend_signals.most_common(10)],
    }


def main():
    DATA_DIR.mkdir(exist_ok=True)

    academic_reports = discover_reports(ACADEMIC_DIR)
    finance_reports = discover_reports(FINANCE_DIR)

    manifest = {
        "generated_at": datetime.now().isoformat(),
        "academic": academic_reports,
        "macro_finance": finance_reports,
    }

    academic_trends = generate_academic_trends(academic_reports)
    finance_trends = generate_finance_trends(finance_reports)

    (DATA_DIR / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (DATA_DIR / "trends-academic.json").write_text(
        json.dumps(academic_trends, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (DATA_DIR / "trends-finance.json").write_text(
        json.dumps(finance_trends, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    print(f"Generated manifest.json with {len(academic_reports)} academic + {len(finance_reports)} finance reports")
    print(f"Generated trends-academic.json: {len(academic_trends['daily_series'])} days, {len(academic_trends.get('upset_data', []))} upset combos, {len(academic_trends.get('sparkline_data', []))} sparklines")
    print(f"Generated trends-finance.json: {len(finance_trends['daily_series'])} days, {len(finance_trends.get('risk_grid', []))} risk categories")


if __name__ == "__main__":
    main()
