# Fase 2 — ML Pipeline: Documentação e Resultados

## O que foi construído

A Fase 2 implementou o pipeline completo de Machine Learning, desde a engenharia de features até a predição de partidas. São 4 módulos Python novos:

```
backend/
├── features/
│   ├── cold_start.py       # Fallback para times sem histórico
│   └── feature_builder.py  # Vetor de 26 features + TeamStatsCache
└── model/
    ├── trainer.py          # Treinamento + avaliação temporal
    └── predictor.py        # predict_match() — entrada única para predições
```

---

## Arquitetura do Modelo

### Algoritmo

```
Pipeline sklearn:
  1. StandardScaler         → normaliza as 26 features
  2. CalibratedClassifierCV → calibra as probabilidades (cv=5, isotonic)
       └── GradientBoostingClassifier
             n_estimators=300, learning_rate=0.05,
             max_depth=4, subsample=0.8
```

**Target (3 classes):**
- `0` = vitória do time visitante (após 90min + prorrogação)
- `1` = empate (placares iguais ao fim do tempo regulamentar + prorrogação)
- `2` = vitória do time mandante

Pênaltis são ignorados no target — o resultado após prorrogação é o rótulo final.

### Split Temporal (sem data leakage)

| Conjunto | Anos | Partidas |
|---|---|---|
| Treino | 1986 – 2018 | 540 partidas |
| Validação | 2022 | 64 partidas |

Para cada ano de treino Y, os stats dos times são calculados **exclusivamente com dados de anos anteriores a Y**. Isso evita que o resultado de uma partida contamine os features usados para prevê-la.

---

## As 26 Features

| # | Feature | Descrição |
|---|---|---|
| 1 | `a_win_rate` | Taxa de vitória all-time na Copa do Mundo (time A) |
| 2 | `a_win_rate_recent` | Taxa de vitória nas últimas 3 edições disputadas |
| 3 | `a_draw_rate` | Taxa de empate all-time |
| 4 | `a_goals_scored` | Média de gols marcados por partida |
| 5 | `a_goals_conceded` | Média de gols sofridos por partida |
| 6 | `a_appearances` | Número de Copas disputadas |
| 7 | `a_knockout_rate` | % de Copas em que passou da fase de grupos |
| 8 | `a_fifa_rank` | Ranking FIFA (Oct 2022) |
| 9 | `a_fifa_points` | Pontos FIFA |
| 10 | `a_conf_win_rate` | Taxa média de vitória da confederação do time |
| 11–20 | *(b\_...)* | Mesmas 10 features para o time B |
| 21 | `h2h_a_wins` | Vitórias do time A sobre B em Copas anteriores |
| 22 | `h2h_draws` | Empates históricos entre A e B |
| 23 | `h2h_goal_diff` | Saldo de gols A – B no histórico direto |
| 24 | `rank_diff` | Ranking A – Ranking B |
| 25 | `points_diff` | Pontos FIFA A – Pontos FIFA B |
| 26 | `same_confederation` | 1 se A e B pertencem à mesma confederação |

### Por que xG foi excluído

Expected Goals (xG) está disponível apenas para 13% das partidas (a partir de 2018). Incluí-lo como feature forçaria o modelo a descartar 87% dos dados históricos. xG é exibido no painel de detalhes da partida na interface, mas não entra no modelo.

---

## Cold Start

4 times do Mundial 2026 não têm histórico na Copa do Mundo:

| Time | Confederação | Tem Ranking FIFA? |
|---|---|---|
| Curacao | CONCACAF | Não |
| Cape Verde | CAF | Não |
| Jordan | AFC | Sim |
| Uzbekistan | AFC | Sim |

Para esses times, os stats individuais são substituídos pela **média dos times da mesma confederação que possuem histórico**. As predições que envolvem ao menos um time nessa situação retornam `"confidence": "low"`.

---

## Resultados de Avaliação (2022)

### Métricas no conjunto de validação

| Métrica | Valor | Critério do plano |
|---|---|---|
| Log-loss | **0.9926** | < 1.0 ✓ |
| Accuracy | **53.1%** | — |
| Partidas avaliadas | 64 | — |

*Baseline de accuracy para 3 classes equiprováveis seria 33.3%. O modelo chega a 53.1%, confirmando que os features históricos têm poder preditivo.*

---

## Exemplos de Predições

Os valores abaixo são calculados com stats de 1930–2022 completos (modo produção).  
`*` = ao menos um time é cold-start (`confidence: "low"`).

| Confronto | Prob Casa | Empate | Prob Fora |
|---|---|---|---|
| Brazil vs Argentina | 27.9% | 24.9% | **47.2%** |
| France vs England | **39.8%** | 20.4% | 39.9% |
| Germany vs Spain | 29.1% | 24.5% | **46.4%** |
| Netherlands vs Portugal | **47.2%** | 27.9% | 24.9% |
| Brazil vs France | 22.6% | 25.0% | **52.4%** |
| Argentina vs Germany | 32.8% | 21.1% | **46.1%** |
| Spain vs Brazil | 27.9% | 22.5% | **49.6%** |
| England vs Argentina | 29.8% | 28.7% | **41.5%** |
| Curacao vs Brazil `*` | 34.9% | 22.5% | 42.6% |
| Jordan vs France `*` | 21.6% | 23.6% | **54.9%** |

### Análise do confronto Argentina vs France

| Feature | Argentina | France |
|---|---|---|
| Win rate all-time | 53.4% | 53.4% |
| Win rate recente (3 ed.) | **55.6%** | **73.7%** |
| Gols marcados/jogo | 1.73 | 1.86 |
| Aparições na Copa | 18 | 16 |
| Taxa de mata-mata | 83.3% | 62.5% |
| Ranking FIFA | 3 | 4 |
| Pontos FIFA | 1773.9 | 1759.8 |
| H2H (ARG lidera) | 2 vitórias | 1 empate |

**France (45.4%) aparece levemente favorita sobre Argentina (31%)** porque seu `win_rate_recent` é significativamente superior (73.7% vs 55.6%). France venceu a Copa de 2018 e chegou à final em 2022, enquanto Argentina foi eliminada nas oitavas em 2018 — antes de ganhar o título em 2022. O histórico head-to-head favorece Argentina, mas tem peso relativamente menor no modelo calibrado.

---

## Como Usar

```bash
# Treinar o modelo (executa automaticamente na primeira chamada ao predictor)
python scripts/train_model.py

# Usar via Python
import sys; sys.path.insert(0, 'backend')
from model.predictor import predict_match

result = predict_match("Brazil", "Argentina")
# {
#   "home_team": "Brazil",
#   "away_team": "Argentina",
#   "home_prob": 0.2793,
#   "draw_prob": 0.2494,
#   "away_prob": 0.4712,
#   "confidence": "high",
#   "label_map": {0: "away_win", 1: "draw", 2: "home_win"}
# }
```

O modelo é carregado uma única vez em memória (lazy load) e reutilizado em todas as chamadas subsequentes. O artefato `backend/model/artifacts/model.joblib` é gerado em runtime e está no `.gitignore`.

---

## Próximo Passo — Fase 3 (API)

Com o predictor funcionando, a Fase 3 constrói as rotas FastAPI que expõem essas predições para o frontend:

- `GET /bracket` — árvore completa de 63 partidas com probabilidades
- `GET /match/{id}` — detalhe de uma partida + H2H
- `GET /team/{name}/history` — histórico de um time
- `GET /stats/goals-by-decade` e `/stats/confederation` — agregações pandas
