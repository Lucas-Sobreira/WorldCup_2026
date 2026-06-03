# Plano: World Cup 2026 Prediction Web App

## Context

Greenfield project. Apenas datasets CSV existem. O objetivo é um app web com bracket interativo do Mundial 2026, predições por ML, painel de detalhes por partida e gráficos históricos. Stack: Python FastAPI (backend) + React/Vite (frontend).

---

## Estrutura de Pastas

```
worldCup/
├── backend/
│   ├── main.py                  # FastAPI app, lifespan (treina modelo), CORS
│   ├── requirements.txt
│   ├── data/
│   │   ├── loader.py            # Carrega os 3 CSVs, cache em módulo, normaliza encoding
│   │   ├── team_aliases.py      # "West Germany"→"Germany", etc.
│   │   └── bracket_2026.json   # Estático: 48 times, 12 grupos, slots do R32
│   ├── features/
│   │   ├── feature_builder.py  # Vetor de 26 features + TeamStatsCache
│   │   └── cold_start.py       # Fallback via média da confederação
│   ├── model/
│   │   ├── trainer.py          # Constrói dataset, treina, serializa
│   │   ├── predictor.py        # predict_match() → {home_prob, draw_prob, away_prob}
│   │   └── artifacts/          # model.joblib, scaler.joblib (gerados em runtime)
│   ├── routers/
│   │   ├── bracket.py          # GET /bracket
│   │   ├── match.py            # GET /match/{id}
│   │   ├── team.py             # GET /team/{name}/history
│   │   └── stats.py            # GET /stats/goals-by-decade, /stats/confederation
│   └── schemas/                # Pydantic models para cada router
│
└── frontend/
    ├── package.json (Vite + React)
    └── src/
        ├── api/client.js           # Axios instance + wrappers
        ├── hooks/                  # useBracket, useMatch, useTeamHistory (React Query)
        ├── components/
        │   ├── bracket/            # BracketPage, BracketColumn, MatchCard, ConnectorLine
        │   ├── panel/              # MatchPanel, HeadToHead, ModelConfidence
        │   ├── charts/             # WinProbBar, GoalsByDecade, ConfederationChart,
        │   │                       # TeamHistoryLine, BracketHeatmap
        │   └── shared/             # TeamFlag, LoadingSpinner, ErrorBoundary
        └── styles/
```

---

## Modelo de ML

**Features (26 total)** — `feature_builder.py`:
- Win rate histórico (all-time + últimos 3 torneios com peso 2x)
- Média de gols marcados/sofridos por jogo
- Aparições e taxa de classificação ao mata-mata
- Head-to-head: wins, draws, saldo de gols (neutro se sem histórico)
- FIFA ranking: rank absoluto, pontos, diferença entre os times
- Taxa de vitória por confederação + flag `same_confederation`

**Decisões críticas:**
- **Não usar xG** como feature — existe apenas em 13% das partidas (2018+). Exibir só no painel.
- **West Germany → Germany** merged. Documentar na UI como nota metodológica.
- **Alvo**: resultado em 90min+prorrogação (W/D/L), não pênaltis.
- **Algoritmo**: `GradientBoostingClassifier` + `CalibratedClassifierCV` dentro de sklearn Pipeline com `StandardScaler`.
- **Split temporal**: treinar com 1986–2018, validar em 2022 (sem data leakage).
- **Cold start**: times sem histórico recebem média da confederação + flag `"confidence": "low"` na resposta.
- **Treino em startup**: 964 linhas × 26 features → < 2s. Sem script separado.

---

## Bracket 2026

- 2026: 48 times, 12 grupos de 4. Top 2 de cada grupo (24) + 8 melhores 3ºs = 32 avançam.
- `bracket_2026.json` é **estático e commitado**. Gerado uma vez via `scripts/seed_bracket.py`:
  1. Hardcode dos 48 times qualificados oficiais
  2. Roda predição de fase de grupos → seleciona os 32 classificados
  3. Monta slots R32 conforme formato oficial FIFA 2026
- `GET /bracket` lê o JSON, chama `predict_match()` para as 63 partidas e propaga vencedores.
- Retorna **toda a árvore em um único response** (~15KB) — o frontend precisa de todos os 63 jogos simultâneos.

---

## Backend — Ordem de Implementação

### Fase 1 — Dados (base de tudo)
1. `data/team_aliases.py` — mapa de normalização
2. `data/loader.py` — `load_matches()`, `load_rankings()`, `load_world_cups()` com cache
3. `data/bracket_2026.json` — 48 times, 12 grupos, 32 slots R32
4. `scripts/seed_bracket.py` — gera o JSON acima

### Fase 2 — ML Pipeline
5. `features/feature_builder.py` — `TeamStatsCache` + `build_features(team_a, team_b)`
6. `features/cold_start.py` — fallback por confederação
7. `model/trainer.py` — `build_training_data()` + pipeline sklearn
8. `model/predictor.py` — `predict_match()` com cold-start detection

### Fase 3 — API
9. `schemas/` — todos os Pydantic models
10. `routers/bracket.py` — árvore completa de 63 partidas
11. `routers/stats.py` — agregações pandas puras
12. `routers/match.py` — detalhe + H2H
13. `routers/team.py` — histórico por time
14. `main.py` — lifespan, CORS (`localhost:5173`), routers

---

## Frontend — Ordem de Implementação

**Bibliotecas:** Recharts (gráficos), React Query v5 (fetch/cache), Axios, Vite.  
**Bracket layout:** CSS Flexbox puro + SVG `ConnectorLine` — sem lib de terceiros.  
**Fórmula de espaçamento:** `marginBottom = (2^(round-1) - 1) × 88px`

### Fase 4 — Core
1. `api/client.js` + hooks (`useBracket`, `useMatch`, `useTeamHistory`)
2. Shared: `TeamFlag` (flagcdn.com + fallback badge), `LoadingSpinner`, `ErrorBoundary`
3. `MatchCard` + `WinProbBar` — unidade atômica, perfeita antes do layout
4. `BracketPage` — 6 colunas (R32→Final), ConnectorLine SVG, click abre painel
5. `MatchPanel` — slide-in, H2H table, ModelConfidence mini-chart

### Fase 5 — Gráficos
6. `GoalsByDecade` — BarChart (Recharts), dados de `/stats/goals-by-decade`
7. `ConfederationChart` — RadarChart, `/stats/confederation`
8. `TeamHistoryLine` — LineChart, rota `/team/:name`
9. `BracketHeatmap` — grid times × rodadas, probabilidade de avançar

### Fase 6 — Polish
10. Loading skeletons para bracket e painel
11. Error states para todos os endpoints
12. CSS: hover states, animação do painel, responsivo até 375px
13. `README.md` com instruções de setup

---

## Verificação (como testar)

| Etapa | Verificação |
|---|---|
| Loader | `load_matches()` retorna 964 linhas com dtypes corretos |
| Features | `build_features("Brazil", "Argentina")` retorna array shape `(26,)` |
| Modelo | Argentina vs França → Argentina com 50–58% win prob; log-loss CV < 1.0 |
| API | `uvicorn main:app` inicia em < 10s; `GET /bracket` retorna 200 com 63 partidas |
| Bracket UI | Renderiza sem scroll horizontal em 1440px; MatchCard clicável |
| Gráficos | Todos funcionam em mobile (375px); tooltip ao hover |

---

## Arquivos Críticos

- `backend/data/loader.py` — fundação; encoding, aliases e dtypes devem estar certos antes de tudo
- `backend/data/bracket_2026.json` — toda resposta do `/bracket` deriva daqui
- `backend/features/feature_builder.py` — qualidade do modelo depende inteiramente deste arquivo
- `backend/model/trainer.py` — split temporal correto é essencial para evitar data leakage
- `frontend/src/components/bracket/BracketPage.jsx` — algoritmo de espaçamento do bracket implementado uma vez, reutilizado para as 6 rodadas
