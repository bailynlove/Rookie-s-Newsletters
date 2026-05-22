# ADR-0001: CSS Architecture — Unified Framework + Per-Page Inline Styles

## Status

Accepted

## Context

Rookie's News has two autonomous agents (Heimdall for academic intelligence, Friday for macro-finance) generating HTML reports daily. All reports share a single CSS file (`assets/css/main.css`) which is also consumed by the dashboard homepage (`index.html`).

We needed to decide how to manage styles:

- **Option A: Independent CSS** — Each agent generates its own CSS file. Maximum creative freedom, but risks visual inconsistency between reports and the dashboard.
- **Option B: Unified CSS only** — A single shared CSS file, agents output fixed-format HTML. Consistent but agents cannot invent new visual treatments for special content (breaking news, novel data visualizations).
- **Option C: Hybrid** — Unified CSS for the shared framework, but agents may inline `<style>` tags in individual HTML reports for report-specific visuals.

## Decision

We chose **Option C: Unified Framework + Per-Page Inline Styles**.

Rules:
1. `assets/css/main.css` is the global shared stylesheet. **Agents must NOT read, modify, or rewrite it.**
2. Agents reference it via `<link rel="stylesheet" href="../../assets/css/main.css">`.
3. Agents may add inline `<style>` tags inside their own HTML `<head>` for unique visual effects (e.g., a flashing border on breaking news, a custom chart layout). These styles affect only the current report.

## Consequences

### Positive

- Dashboard stability: the homepage and all visualizations (calendar heatmap, sparklines, upset plot, risk matrix, theme toggle) are protected from agent interference.
- Creative freedom preserved: agents can still innovate visually on a per-report basis.
- No file proliferation: we avoid N different CSS files scattered across agent outputs.

### Negative

- Inline styles cannot be cached separately (minor concern for single-page reports).
- If an agent creates a particularly good inline style, promoting it to the global CSS requires a manual human step.
- Agents must be explicitly instructed not to touch the global CSS; forgetting this instruction leads to incidents like Issue #3.

## History

- **2026-05-22**: Heimdall agent was instructed to "read configs/heimdall/html-output-instructions.md and assets/css/main.css". It proceeded to rewrite `main.css` from 1142 lines down to 410 lines, destroying all dashboard component styles. (Issue #3)
- **2026-05-22**: Decision formalized and documented after grill-with-docs session.
