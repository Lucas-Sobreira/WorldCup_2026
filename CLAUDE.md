# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

Web app that predicts 2026 FIFA World Cup match outcomes using ML trained on historical data (1930–2022). Stack: **Python FastAPI** backend + **React/Vite** frontend.

Live standings reference: https://www.fifa.com/pt/tournaments/mens/worldcup/canadamexicousa2026/standings

## Commands

```bash
# Backend — run from worldCup/ root
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000

# Validate bracket data
python scripts/seed_bracket.py

# Frontend (once scaffolded)
cd frontend && npm install && npm run dev   # http://localhost:5173
```

All `python` commands must be run from `worldCup/` root so that `sys.path` picks up `backend/` correctly. The loaders resolve `dataset/` via `Path(__file__).parent.parent.parent / "dataset"`.

## Architecture

### Data layer (`backend/data/`)

- **`loader.py`** — Three `@functools.cache` functions: `load_matches()` (964 rows), `load_rankings()` (211 teams), `load_world_cups()` (22 tournaments). All team names are normalized on load.
- **`team_aliases.py`** — Single source of truth for name normalization. `normalize(name)` maps historical variants → canonical 2026 names (e.g. `"West Germany"→"Germany"`, `"Korea Republic"→"South Korea"`, `"USA"→"United States"`). **Always go through `normalize()` before any team lookup.**
- **`bracket_2026.json`** — Static, committed file. 48 teams across 12 groups (A–L) + 16 Round-of-32 slots. This is the source for all bracket API responses.

### ML pipeline (`backend/features/` + `backend/model/`) — Phase 2, not yet built

- **`feature_builder.py`** — `TeamStatsCache` + `build_features(team_a, team_b)` → array shape `(26,)`. Features: historical win rate (all-time + last 3 tournaments weighted 2×), goals per game, knockout qualification rate, head-to-head record, FIFA ranking delta, confederation win rate.
- **`cold_start.py`** — Fallback for teams without World Cup history. Known cold-start teams: **Curacao, Cape Verde** (also no FIFA ranking), **Jordan, Uzbekistan**.
- **`trainer.py`** — `GradientBoostingClassifier` + `CalibratedClassifierCV` in a sklearn `Pipeline` with `StandardScaler`. Temporal split: train 1986–2018, validate 2022. Target: 90min+ET result (W/D/L), not penalties.
- **`predictor.py`** — `predict_match(team_a, team_b)` → `{home_prob, draw_prob, away_prob}`. Artifacts written to `backend/model/artifacts/` (gitignored, regenerated at startup).

### API (`backend/routers/`) — Phase 3, not yet built

| Route | File | Notes |
|---|---|---|
| `GET /bracket` | `bracket.py` | Returns full 63-match tree in one response (~15 KB) |
| `GET /match/{id}` | `match.py` | Detail + H2H |
| `GET /team/{name}/history` | `team.py` | Historical record |
| `GET /stats/goals-by-decade` | `stats.py` | Pandas aggregation |
| `GET /stats/confederation` | `stats.py` | Pandas aggregation |

CORS is configured for `localhost:5173` only. Model is trained in FastAPI `lifespan` at startup (< 2 s for 964 rows × 26 features).

### Frontend (`frontend/`) — Phase 4–6, not yet built

React Query v5 for all fetching. Recharts for charts. Bracket layout: CSS Flexbox + SVG `ConnectorLine`. Spacing formula: `marginBottom = (2^(round-1) - 1) × 88px`.

## Key design decisions

- **xG excluded from features** — present in only 13% of matches (2018+). Show in UI panel only.
- **West Germany merged into Germany** — document as a methodological note in the UI.
- **`bracket_2026.json` is static and committed** — generated once by `scripts/seed_bracket.py`, not regenerated at runtime.
- **Model target is 90min+ET result**, not penalty shootout winner.

## GitHub

- Main branch: `main`
- Feature branches: `feature/<description>`
- Use the `data-scientist` skill for ML modeling tasks and `data-analyst` for pandas/stats work.
