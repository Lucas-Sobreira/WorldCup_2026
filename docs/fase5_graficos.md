# Phase 5 — Stats & Charts

## Objective

Add a dedicated Stats & Charts view with four Recharts visualizations, connected to the FastAPI backend via React Query hooks already wired in Phase 4.

## Navigation

A top-level nav bar was added to `App.jsx` with two tabs — **Bracket** and **Stats & Charts** — so both views are reachable without a router dependency.

## Charts Delivered

### 1. Goals per Match by Decade (`GoalsByDecade.jsx`)
- **Type:** BarChart (Recharts)
- **Data:** `GET /stats/goals-by-decade`
- **Default state:** peak decade highlighted in blue, rest in slate
- **Interaction:** click a bar to select it as a range anchor (see below)
- **Tooltip:** total goals, match count, avg/match for that decade

### 2. Team World Cup History (`TeamHistoryLine.jsx`)
- **Type:** LineChart with ReferenceArea and dual-line overlay
- **Data:** `GET /team/{name}/history`
- **Quick-select:** 10 popular teams as pill buttons; free-text search form
- **Stats row:** 6 career metrics (appearances, matches, win rate, goals/game, titles, finals)
- **Interaction:** reacts to decade range from GoalsByDecade (see linked filter below)

### 3. Confederation Strength (`ConfederationChart.jsx`)
- **Type:** 6 mini RadarCharts (one per confederation)
- **Data:** `GET /stats/confederation`
- **Axes:** Avg Points / Teams in ranking / Ranking Strength — all normalized 0–100
- **Color-coded** per confederation: UEFA=blue, CONMEBOL=green, CONCACAF=amber, CAF=red, AFC=purple, OFC=cyan
- **Legend bar** above with avg points for quick comparison

### 4. Win Probability Heatmap (`BracketHeatmap.jsx`)
- **Type:** HTML table with CSS background-color scale
- **Data:** reuses cached `GET /bracket` (no extra request)
- **Content:** 32 R32 teams × 5 rounds, each cell = win probability in that match
- **Color scale:** green ≥ 60% · blue 40–59% · red < 40% · transparent = did not reach
- **Sorted** by total probability sum (strongest teams at top)

## Linked Decade Filter (added mid-phase)

State lives in `StatsPage` as `selectedDecades: number[]` (max 2 items).

| Action | Result |
|--------|--------|
| Click 1 bar | Selects that decade; TeamHistoryLine zooms to 10-year window |
| Click 2nd bar | Both anchors active; bars between them tinted dark amber |
| Click 3rd bar | Resets to just that new selection |
| Click selected bar | Deselects it |
| Click badge "1970s – 2010s ✕" | Clears both anchors |

**GoalsByDecade** visual states:
- Selected anchor → amber `#f59e0b`
- In-range (between two anchors) → dark amber `#92400e`
- Out-of-range when any selection active → dimmed `#1e293b`
- No selection, peak decade → blue `#3b82f6`

**TeamHistoryLine** zoom behavior:
- XAxis domain set to `[fromDecade - 1, toDecade + 9 + 1]`
- Data filtered to the selected range (zoomed, not just highlighted)
- Stats row switches to range-scoped metrics: editions, W/D/L, GD
- Line color changes from blue to amber when a range is active
- `ReferenceArea` band over the selected window
- "Did not participate" message if team has no data in range

## File Structure

```
frontend/src/
  components/
    charts/
      GoalsByDecade.jsx
      ConfederationChart.jsx
      TeamHistoryLine.jsx
      BracketHeatmap.jsx
      StatsPage.jsx          ← holds selectedDecades state, renders 2×2 grid
  App.jsx                    ← added Nav component + view state
  index.css                  ← added app-nav, stats-page, chart-card, heatmap, filter-badge styles
```

## Build Metrics

| Metric | Value |
|--------|-------|
| JS bundle (gzip) | 204 KB (Recharts adds ~115 KB) |
| CSS (gzip) | 2.7 KB |
| Build time | ~600 ms |
| Errors | 0 |
