# Phase 4 — React/Vite Frontend (Core)

## Objective

Build the interactive bracket UI that consumes the FastAPI backend and lets users explore all 63 predicted matches of the 2026 World Cup.

## Stack

- **Vite + React 19** — scaffolded with `npm create vite@latest --template react`
- **React Query v5** (`@tanstack/react-query`) — server-state caching; `staleTime: Infinity` so bracket is fetched once per session
- **Axios** — HTTP client with 60s timeout (bracket endpoint can take ~20s first call)
- **Recharts** — installed, used in Phase 5
- **Pure CSS** — dark theme via CSS custom properties, no UI framework

## File Structure

```
frontend/src/
  api/client.js               # Axios instance + named fetch helpers
  hooks/index.js              # useBracket, useMatch, useTeamHistory, useGoalsByDecade, useConfederation
  components/
    bracket/
      BracketPage.jsx         # Root page: header, tabs (Bracket / Groups), layout
      BracketColumn.jsx       # Single round column with label + match list
      MatchCard.jsx           # Clickable card: flags, names, probs, winner highlight
      WinProbBar.jsx          # Tricolor bar (green=home, yellow=draw, red=away)
      ConnectorLine.jsx       # SVG cubic bezier connecting match cards across rounds
    panel/
      MatchPanel.jsx          # Slide-in aside: prediction detail + H2H table
    shared/
      TeamFlag.jsx            # flagcdn.com img with text fallback
      LoadingSpinner.jsx      # Centered spinner with message
      ErrorBoundary.jsx       # Class component catch-all with retry button
  index.css                   # All styles (CSS custom properties, dark theme)
  App.jsx                     # QueryClientProvider + ErrorBoundary + BracketPage
```

## Features Delivered

### Bracket tab
- **5 round columns**: Round of 32 → R16 → QF → SF → Final
- **Third-place play-off** column alongside the Final
- Each `MatchCard` shows both teams with country flags, win % per side, and highlights the predicted winner in gold
- Clicking any card opens the `MatchPanel` side panel
- Predicted champion displayed in the header

### Groups tab
- 12-group grid, each showing full standings (Pos / Team / Played / Pts / GD)
- Top-2 rows highlighted as qualifiers

### Match Panel (slide-in)
- Confidence badge: **High confidence** (green) or **Low confidence — cold start** (amber)
- Large probability display: home% / Draw% / away% with full `WinProbBar`
- xG row shown only when available (2018+ matches in dataset)
- Head-to-head table: all historical WC meetings, score highlighted by result

## Design Decisions

- **`staleTime: Infinity`** on bracket query — simulation is deterministic, no need to refetch
- **No connector SVG drawn in Phase 4** — `ConnectorLine.jsx` exists but bracket layout uses `justify-content: space-around` which provides visual alignment without DOM measurement; connectors wired in Phase 6 polish
- **flagcdn.com** chosen over bundled SVGs — zero bundle cost, covers all 48 nations; `onError` hides broken images silently
- **Cold-start badge** on `MatchCard` surfaces model uncertainty to the user without blocking the prediction

## Validation

| Check | Result |
|---|---|
| `npm run build` | 0 errors, 278 KB JS / 7.4 KB CSS (gzipped: 89 KB / 2 KB) |
| Bracket loads | ~20s first call (63 predictions), cached instantly after |
| Brazil → Final | Correct — model accumulates historical WC performance match by match |
| MatchPanel H2H | Brazil vs Argentina: 2W–1D–1L, all 4 historical meetings shown |
| Groups tab | All 12 groups, top-2 highlighted, standings sorted by pts/GD/GF |
| Flags | Render for all 48 qualified nations; fallback letter badge for unknowns |
