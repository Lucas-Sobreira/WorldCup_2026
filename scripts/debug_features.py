import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from features.feature_builder import TeamStatsCache, build_features, FEATURE_NAMES
from data.loader import load_matches, load_rankings

matches = load_matches()
rankings = load_rankings()
cache = TeamStatsCache(matches, rankings)

feat = build_features("Argentina", "France", cache, matches)

print("Argentina vs France - feature inspection:")
for name, val in zip(FEATURE_NAMES, feat):
    print(f"  {name:30s} {val:.4f}")

print()
sa = cache.get_stats("Argentina")
sf = cache.get_stats("France")
print(f"Argentina appearances: {sa['appearances']}, win_rate: {sa['win_rate']:.3f}, win_rate_recent: {sa['win_rate_recent']:.3f}")
print(f"France     appearances: {sf['appearances']}, win_rate: {sf['win_rate']:.3f}, win_rate_recent: {sf['win_rate_recent']:.3f}")
rA, pA = cache.get_ranking("Argentina")
rF, pF = cache.get_ranking("France")
print(f"Argentina rank: {rA}, points: {pA}")
print(f"France     rank: {rF}, points: {pF}")
