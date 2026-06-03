# PRD — World Cup 2026 Prediction App

## Tech Stack

| Layer     | Technology                   |
| --------- | ---------------------------- |
| Front-End | React, JavaScript, HTML, CSS |
| Back-End  | Python (FastAPI or Flask)    |
| Data      | pandas, scikit-learn         |

---

## Goals

1. Display the full 2026 World Cup knockout bracket with predicted match results.
2. Show visualizations that help users understand the predictions and historical patterns.
3. Allow users to explore predictions per match and see the supporting data.

---

## Features

### Knockout Bracket

- Interactive bracket showing all rounds: Round of 32 → Round of 16 → Quarterfinals → Semifinals → Final.
- Each match card shows: team flags, team names, predicted score or win probability.
- Bracket auto-advances predicted winners to the next round.

### Match Detail View

- Clicking a match opens a side panel with:
  - Head-to-head historical results between the two teams.
  - Current FIFA ranking of each team.
  - Model confidence / win probability breakdown.

### Visualizations (ideas)

- **Historical performance by team**: wins, goals scored, World Cup titles.
- **Win probability chart**: horizontal bar showing % for each team in a match.
- **Goals distribution**: average goals per match over the decades.
- **Confederation strength**: how teams from each confederation historically perform.
- **Bracket progression heatmap**: probability of each team reaching each round.

---

## Architecture

```
React (front-end)
    │  HTTP (fetch/axios)
    ▼
Python API (FastAPI)
    │  pandas / scikit-learn
    ▼
CSV Dataset  ←  ML Model (trained offline)
```

- The ML model is trained offline and its predictions are served via the API.
- The front-end never reads CSVs directly — all data comes through the API.

### Backend Endpoints (suggested)

| Method | Route                        | Description                              |
|--------|------------------------------|------------------------------------------|
| GET    | `/bracket`                   | Full predicted bracket (all rounds)      |
| GET    | `/match/{id}`                | Single match prediction + head-to-head   |
| GET    | `/team/{name}/history`       | Historical stats for a team              |
| GET    | `/stats/goals-by-decade`     | Aggregated goals data for chart          |
| GET    | `/stats/confederation`       | Confederation win rates                  |

---

## Data Sources

- `dataset/matches_1930_2022.csv` — historical match results used for model training.
- `dataset/fifa_ranking_2022-10-06.csv` — team ranking features.
- `dataset/world_cup.csv` — tournament-level context.
- [FIFA 2026 standings](https://www.fifa.com/pt/tournaments/mens/worldcup/canadamexicousa2026/standings) — live group stage results for bracket seeding.

---

## Out of Scope

- Live match tracking / real-time score updates.
- User accounts or saved predictions.
- Website deployed on github pages.
