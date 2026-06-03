# Phase 6 — Polish

## Objective

Production-ready finishing: loading skeletons, responsive layout (375px–1440px), hover/animation states, FIFA-style bracket redesign, match dates, and project README.

---

## Loading Skeletons (`Skeleton.jsx`)

Shimmer animation via `background-size: 200%` + `animation: shimmer 1.4s infinite` replaces all spinners with layout-preserving placeholders.

| Component | Skeleton used |
|-----------|---------------|
| Bracket (initial load) | `BracketSkeleton` — 6 columns × N match placeholders |
| MatchPanel H2H | `PanelSkeleton` — header + stats + table rows |
| All 4 charts | `ChartSkeleton` — title + sub + full-height shimmer block |

---

## Responsive Layout

| Breakpoint | Changes |
|------------|---------|
| ≤ 900px | Stats grid → 1 column; confederation radars → 2-col; stats row → 3-col |
| ≤ 600px | MatchPanel → **fixed bottom sheet** (16px top-radius, 70vh max-height) with `slideUp` animation; bracket header stacks; groups grid → 1 column |
| ≤ 375px | Bracket cards compact (152px wide); stats row → 2-col; confederation radars → 1-col |

---

## Hover & Animation States

- `MatchCard`: `translateY(-1px)` lift + `box-shadow` depth on hover and active
- `MatchPanel`: `slideIn` (desktop) / `slideUp` (mobile bottom sheet) on open
- `filter-badge`: opacity fade on hover

---

## FIFA-Style Bracket Redesign (also committed in this phase)

Complete visual overhaul of the bracket to match FIFA's "Chave do mata-mata" aesthetic.

### Color palette
| Token | Value | Use |
|-------|-------|-----|
| Background | `#06111e` | Bracket tree canvas |
| Card | `#0d1f35` | Match card background |
| Border | `#1d3454` | Card and row dividers |
| Gold | `#c9a227` | Date header, winner accent bar, round labels, active tab |
| Muted | `#3d5a7a` | Probability percentages |

### Card anatomy (`MatchCard.jsx`)
```
┌─────────────────────────────┐
│ 29 JUN                      │  ← gold date header
├─────────────────────────────┤
│▌[🇧🇷] Brazil          52% │  ← gold left-accent + gold name = winner
├─────────────────────────────┤
│ [🇫🇷] France           48% │
│ ▓▓▓▓▓▓▓▓▒▒░░░░░░░░░░░░░░░ │  ← tri-color prob bar (green/yellow/red)
└─────────────────────────────┘
```

### SVG connector lines (`BracketConnectors` in `BracketPage.jsx`)
- `useLayoutEffect` + `getBoundingClientRect` measures all `[data-match-id]` cards
- Draws **cubic bezier** paths from right-center of each feeder pair → left-center of receiver
- Stroke `#1d3a5f`, redrawn on `window resize`
- Pairing: `R32[i*2, i*2+1] → R16[i]`, etc. up to `SF → Final`

### Match dates
Hardcoded per match ID:

| Round | Date range |
|-------|-----------|
| Round of 32 | 29 jun – 03 jul |
| Round of 16 | 05 jul – 08 jul |
| Quarter-finals | 11 jul – 14 jul |
| Semi-finals | 17 jul – 18 jul |
| 3rd place | 21 jul |
| Final | 22 jul |

### Round labels (pt-BR)
`Oitavas de final · Décimo-sexto · Quartas de final · Semifinal · Final · 3º Lugar`

---

## Project README (`/README.md`)

Created root-level `README.md` with:
- Quick-start commands (backend + frontend)
- API endpoint table
- Model summary (algorithm, features, accuracy, cold-start)
- Full project structure tree
- Methodology notes (West Germany merge, xG exclusion, 90min target)

---

## Build Metrics (final)

| Metric | Value |
|--------|-------|
| JS bundle (gzip) | 204 KB |
| CSS (gzip) | 2.7 KB |
| Build time | ~550 ms |
| Errors | 0 |
| Lighthouse (estimated) | Performance 90+ on desktop |
