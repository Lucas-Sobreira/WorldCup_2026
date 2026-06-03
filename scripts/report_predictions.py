"""Gera resultados de predicao para multiplos confrontos."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from model.predictor import predict_match

matchups = [
    ("Brazil", "Argentina"),
    ("France", "England"),
    ("Germany", "Spain"),
    ("Netherlands", "Portugal"),
    ("Brazil", "France"),
    ("Argentina", "Germany"),
    ("Spain", "Brazil"),
    ("England", "Argentina"),
    ("Curacao", "Brazil"),
    ("Jordan", "France"),
]

print(f"{'Confronto':<35} {'Prob Casa':>10} {'Empate':>8} {'Prob Fora':>10} {'Conf':>6}")
print("-" * 75)
for home, away in matchups:
    r = predict_match(home, away)
    conf = "*" if r["confidence"] == "low" else ""
    print(f"{home+' vs '+away:<35} {r['home_prob']:>9.1%} {r['draw_prob']:>7.1%} {r['away_prob']:>9.1%} {conf:>6}")
