# World Cup 2026 Predictor

ML-powered bracket predictor for the 2026 FIFA World Cup. Simulates all 63 matches using a gradient-boosted model trained on historical data (1930–2022).

## Stack

| Layer | Tech |
|-------|------|
| Backend | Python 3.11 · FastAPI · scikit-learn · XGBoost · pandas |
| Frontend | React 19 · Vite · React Query v5 · Recharts · Axios |
| Model | XGBoost + CalibratedClassifierCV · 36 features · temporal split |

## Quick Start

### Backend

```bash
# From project root
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000
```

The model trains automatically on first startup (~60s). Subsequent starts load from cache.

API docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

Both servers must be running simultaneously. CORS is configured for `localhost:5173`.

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /bracket` | Full 63-match tournament simulation |
| `GET /match/{team_a}/{team_b}` | Prediction + head-to-head history |
| `GET /team/{name}/history` | Team's complete World Cup record |
| `GET /stats/goals-by-decade` | Goals per match by decade (1930–2022) |
| `GET /stats/confederation` | FIFA confederation strength metrics |
| `GET /health` | Health check |

## Model

- **Algorithm:** XGBoost + isotonic calibration (CalibratedClassifierCV)
- **Features:** 36 — win rate, recent form, goals scored/conceded, knockout rate, WC titles, FIFA ranking delta, head-to-head record, confederation strength
- **Train/val split:** 1986–2018 train · 2022 validation (no data leakage)
- **Accuracy:** 56.2% · Log-loss: 0.985
- **Cold-start:** teams with no WC history (Curacao, Cape Verde, Jordan, Uzbekistan) receive confederation average stats and are flagged `confidence: "low"`

## Project Structure

```
worldCup/
├── backend/
│   ├── main.py               # FastAPI app + lifespan
│   ├── data/                 # Loaders, team aliases, bracket JSON
│   ├── features/             # Feature builder, cold-start fallback
│   ├── model/                # Trainer, predictor, artifacts/
│   ├── routers/              # bracket, match, team, stats
│   └── schemas/              # Pydantic response models
├── frontend/
│   └── src/
│       ├── api/              # Axios client
│       ├── hooks/            # React Query hooks
│       └── components/
│           ├── bracket/      # BracketPage, MatchCard, WinProbBar
│           ├── panel/        # MatchPanel, H2H table
│           ├── charts/       # GoalsByDecade, TeamHistoryLine, ConfederationChart, BracketHeatmap
│           └── shared/       # TeamFlag, Skeleton, ErrorBoundary
├── dataset/                  # Source CSVs (matches, rankings, world cups)
├── docs/                     # Phase-by-phase documentation
└── scripts/                  # seed_bracket.py, train_model.py, compare_models.py
```

## Methodology Notes

- **West Germany** is merged into Germany throughout (pre-1990 matches count toward Germany's record)
- **Match target:** 90 min + extra time result — not penalty shootout outcome
- **xG** is displayed in the match panel when available (2018+) but excluded from model features (only 13% coverage)
