import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from model.predictor import predict_match
from features.feature_builder import build_features, TeamStatsCache, FEATURE_NAMES
from data.loader import load_matches, load_rankings

# Sanity check 1: Argentina vs France
result = predict_match("Argentina", "France")
print("Argentina vs France:")
for k, v in result.items():
    print(f"  {k}: {v}")

print()

# Sanity check 2: Brazil vs Germany
result2 = predict_match("Brazil", "Germany")
print("Brazil vs Germany:")
print(f"  home_prob(BRA): {result2['home_prob']}")
print(f"  draw_prob:      {result2['draw_prob']}")
print(f"  away_prob(GER): {result2['away_prob']}")
print(f"  confidence:     {result2['confidence']}")

print()

# Sanity check 3: Cold-start team
result3 = predict_match("Curacao", "Argentina")
print("Curacao vs Argentina (cold-start):")
print(f"  confidence: {result3['confidence']}")
print(f"  home_prob(CUR): {result3['home_prob']}")
print(f"  away_prob(ARG): {result3['away_prob']}")

print()

# Feature shape check
matches = load_matches()
rankings = load_rankings()
cache = TeamStatsCache(matches, rankings)
feat = build_features("Brazil", "Argentina", cache, matches)
print(f"Feature vector shape: {feat.shape}  (expected (26,))")
print(f"Feature names count: {len(FEATURE_NAMES)}")
print(f"Sample values: {feat[:5].tolist()}")
