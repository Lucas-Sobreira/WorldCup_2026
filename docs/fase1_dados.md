# Fase 1 — Camada de Dados

## O que foi feito

Configuração da base de dados, normalização de nomes e estrutura do bracket 2026.

## Arquivos criados

| Arquivo | Descrição |
|---|---|
| `backend/data/team_aliases.py` | Mapa de normalização: "West Germany"→"Germany", "Korea Republic"→"South Korea", etc. |
| `backend/data/loader.py` | `load_matches()`, `load_rankings()`, `load_world_cups()` com `@functools.cache` |
| `backend/data/bracket_2026.json` | 48 times, 12 grupos oficiais (A–L), 16 slots R32 |
| `scripts/seed_bracket.py` | Valida o JSON e reporta times sem histórico |
| `backend/requirements.txt` | FastAPI, uvicorn, pandas, scikit-learn, joblib |

## Datasets (`dataset/`)

| Arquivo | Linhas | Colunas | Conteúdo |
|---|---|---|---|
| `matches_1930_2022.csv` | 964 | 43 | Todas as partidas, placares, rounds, xG |
| `fifa_ranking_2022-10-06.csv` | 211 | 7 | Rankings FIFA antes do Qatar 2022 |
| `world_cup.csv` | 22 | 9 | Resumos por torneio (campeão, artilheiro, etc.) |

## Decisões técnicas

- **Encoding**: `encoding_errors="replace"` para lidar com caracteres especiais em nomes de estádios
- **Aliases**: West Germany e Germany DR → Germany (17 aparições históricas unificadas)
- **Grupos 2026**: Fonte oficial FIFA Draw (dezembro 2025)

## Times sem histórico na Copa (cold-start identificados)

| Time | Grupo | Tem ranking FIFA? |
|---|---|---|
| Curacao | E | Não |
| Cape Verde | H | Não |
| Jordan | J | Sim |
| Uzbekistan | K | Sim |

## Verificação

```
python scripts/seed_bracket.py
# Total teams: 48 ✓
# Round of 32 slots: 16 ✓
# Validation passed.
```
