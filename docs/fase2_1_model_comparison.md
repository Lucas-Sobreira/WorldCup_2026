# Fase 2.1 — Comparação de Modelos e Melhoria de Features

## Motivação

Accuracy baseline de 53.1% com GradientBoosting + 26 features. Objetivo: melhorar usando novos features e múltiplos algoritmos.

## Novas features adicionadas (26 → 36)

| Feature | Justificativa |
|---|---|
| `goals_scored_recent` / `goals_conceded_recent` | Forma ofensiva/defensiva recente (últimas 3 edições) |
| `wc_titles` | Número de títulos mundiais — forte proxy de tradição |
| `finals_reached` | Consistência em chegar ao topo do torneio |
| `win_rate_diff` | Comparativo direto de taxas de vitória |
| `goals_balance_diff` | Saldo de gols A − saldo de gols B |

## Comparação de modelos (treino 1986–2018 / validação 2022, 64 partidas)

| Modelo | Accuracy | Log-Loss | Observação |
|---|---|---|---|
| GradientBoosting (baseline) | 53.1% | 0.983 | Modelo original com 26 features |
| GradientBoosting (36 feat.) | 54.7% | 0.983 | +1.6pp só com novas features |
| **XGBoost** | **56.2%** | **0.985** | **Escolhido: melhor equilíbrio** |
| RandomForest | 57.8% | 1.522 | Melhor accuracy mas calibração ruim |
| LightGBM | 53.1% | 0.979 | Melhor log-loss, accuracy inferior |
| Voting (GB+XGB+LGBM) | 51.6% | 1.265 | Ensemble não ajudou |
| TabPFN (HuggingFace) | — | — | Requer `TABPFN_TOKEN` (aceitar licença em https://ux.priorlabs.ai) |

## Decisão final

**XGBoost** escolhido por:
1. Segunda maior accuracy (56.2% vs 57.8% do RF)
2. Log-loss 0.985 — probabilidades bem calibradas para exibição no frontend
3. RandomForest com log-loss 1.52 produziria probabilidades pouco confiáveis para o usuário

## Sobre o TabPFN

TabPFN é um transformer zero-shot da HuggingFace (`prior-labs/tabpfn`) ideal para tabular data com <1000 amostras. Para habilitar:

```bash
# 1. Aceitar licença em https://ux.priorlabs.ai
# 2. Copiar API Key da conta
$env:TABPFN_TOKEN="seu-token"
python scripts/compare_models.py
```

## Como reproduzir

```bash
python scripts/compare_models.py   # compara todos os modelos e salva o melhor
python scripts/train_model.py      # re-treina com XGBoost (modelo atual)
```
