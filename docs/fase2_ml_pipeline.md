# Fase 2 — ML Pipeline

## Arquivos criados

| Arquivo | Descrição |
|---|---|
| `backend/features/cold_start.py` | Fallback por média da confederação para times sem histórico |
| `backend/features/feature_builder.py` | `TeamStatsCache` + `build_features()` → ndarray(36,) |
| `backend/model/trainer.py` | Treinamento + avaliação temporal sem data leakage |
| `backend/model/predictor.py` | `predict_match()` com lazy load e flag de cold-start |

## Features (36 total)

| Grupo | Qtd | Features |
|---|---|---|
| Por time (×2) | 28 | win_rate, win_rate_recent, draw_rate, goals_scored, goals_conceded, goals_scored_recent, goals_conceded_recent, appearances, knockout_rate, wc_titles, finals_reached, fifa_rank, fifa_points, conf_win_rate |
| H2H | 3 | h2h_a_wins, h2h_draws, h2h_goal_diff |
| Comparativos | 5 | rank_diff, points_diff, same_confederation, win_rate_diff, goals_balance_diff |

## Metodologia

- **Target**: 0=away_win, 1=draw, 2=home_win (resultado após 90min+prorrogação; pênaltis ignorados)
- **Split temporal**: treino 1986–2018 (540 partidas), validação 2022 (64 partidas)
- **Anti-leakage**: `TeamStatsCache(cutoff_year=Y)` — stats calculados apenas de anos anteriores a Y

## Resultados

| Métrica | Valor |
|---|---|
| Accuracy (val 2022) | 56.2% (XGBoost) |
| Log-loss (val 2022) | 0.985 |
| Baseline (3 classes) | 33.3% |

## Uso

```python
from model.predictor import predict_match
result = predict_match("Brazil", "Argentina")
# {"home_prob": 0.28, "draw_prob": 0.25, "away_prob": 0.47, "confidence": "high"}
```
