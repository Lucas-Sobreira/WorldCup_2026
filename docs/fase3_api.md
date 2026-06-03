# Phase 3 — FastAPI REST API

## Objective

Expose the ML model and tournament simulation as a REST API consumed by the React frontend.

## Stack

- **FastAPI** 0.136+ with async lifespan (model warm-up on startup)
- **Uvicorn** ASGI server
- **Pydantic v2** schemas for request/response validation
- **CORS** enabled for `http://localhost:5173` (Vite dev server)

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/bracket` | Full 2026 WC simulation (63 matches) |
| GET | `/stats/goals-by-decade` | Goals per decade (1930–2022) |
| GET | `/stats/confederation` | Confederation ranking stats |
| GET | `/match/{team_a}/{team_b}` | Match prediction + H2H history |
| GET | `/team/{name}/history` | Team full World Cup history |

## Architecture

```
backend/
  main.py                  # FastAPI app + lifespan + CORS + router mounts
  routers/
    bracket.py             # Full tournament simulation
    stats.py               # Pandas aggregations over historical data
    match.py               # Single-match prediction + H2H lookup
    team.py                # Team history aggregation
  schemas/
    bracket.py             # BracketResponse, GroupData, KnockoutMatch, MatchPred, TeamStanding
    match.py               # MatchDetailResponse, H2HMatch
    team.py                # TeamHistoryResponse, TeamMatch
    stats.py               # GoalsByDecadeResponse, ConfederationResponse
```

## Bracket Simulation Logic

1. **Group stage** (72 matches): predict all C(4,2)=6 matches per group × 12 groups  
   - Points: Win=3, Draw=1, Loss=0  
   - Simulated score: Win=2-1, Draw=1-1, Loss=1-2  
2. **3rd-place selection**: rank all 12 third-place teams by points → goal_diff → goals_for; top 8 advance  
3. **Round of 32** (16 matches): resolve bracket slots (1A, 2C, 3rd_ABCD…)  
4. **R16 → QF → SF → Final** (15 matches): knockout, draw resolved by `eff = prob + draw_prob/2`  
5. **Third-place play-off**: semi-final losers  

The bracket is **cached** with `@lru_cache(maxsize=1)` — computed once per server session.

## Startup Behavior

- If `model/artifacts/model.joblib` exists → loaded immediately  
- If missing → `train_and_save()` is called automatically (≈60s)  
- A warm-up prediction (Brazil vs Argentina) is made to pre-load all data structures  

## Validation Results (Smoke Tests)

| Endpoint | Result |
|----------|--------|
| `/health` | `{"status": "ok", "version": "1.0.0"}` |
| `/stats/goals-by-decade` | 9 decade rows (1930–2020), avg 4.23 goals in 1930s |
| `/stats/confederation` | 6 confederations, CONMEBOL/UEFA ranked highest |
| `/team/Brazil/history` | 22 appearances, 76 wins, 4 WC titles |
| `/match/Brazil/Argentina` | away (Argentina) predicted, H2H: 2W-1D-1L |
| `/bracket` | France predicted champion (beats Brazil in Final) |

## Running the Server

```bash
cd backend
uvicorn main:app --reload --port 8000
```

Interactive docs: http://localhost:8000/docs
