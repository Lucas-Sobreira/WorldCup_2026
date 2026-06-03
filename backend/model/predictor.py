"""
predict_match() — single entry point for all match outcome predictions.

Returns:
    {
        "home_prob": float,   # P(home_team wins in 90min+ET)
        "draw_prob": float,   # P(draw after 90min+ET / goes to pens)
        "away_prob": float,   # P(away_team wins in 90min+ET)
        "confidence": "high" | "low",   # low when either team is cold-start
        "label_map": {0: "away_win", 1: "draw", 2: "home_win"}
    }

Model is loaded lazily on first call and cached in the module.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import numpy as np

from data.loader import load_matches, load_rankings
from features.feature_builder import TeamStatsCache, build_features

_MODEL_PATH = Path(__file__).parent / "artifacts" / "model.joblib"

_pipeline = None
_cache: TeamStatsCache | None = None
_all_matches = None


def _load() -> None:
    global _pipeline, _cache, _all_matches
    if _pipeline is not None:
        return

    import joblib

    if not _MODEL_PATH.exists():
        from model.trainer import train_and_save
        train_and_save(verbose=True)

    _pipeline = joblib.load(_MODEL_PATH)
    _all_matches = load_matches()
    _cache = TeamStatsCache(_all_matches, load_rankings(), cutoff_year=9999)


def predict_match(home_team: str, away_team: str) -> dict[str, Any]:
    """
    Predict outcome probabilities for home_team vs away_team.

    In the 2026 World Cup context, "home"/"away" is just the slot label
    (no real home advantage on neutral ground). Pass teams in either order;
    flip the result externally if needed.
    """
    _load()
    assert _pipeline is not None and _cache is not None and _all_matches is not None

    feat = build_features(home_team, away_team, _cache, _all_matches)
    feat_2d = feat.reshape(1, -1)

    probs = _pipeline.predict_proba(feat_2d)[0]  # shape (3,) → [away, draw, home]

    home_stats = _cache.get_stats(home_team)
    away_stats = _cache.get_stats(away_team)
    is_cold_start = home_stats.get("is_cold_start", False) or away_stats.get("is_cold_start", False)

    return {
        "home_team": home_team,
        "away_team": away_team,
        "home_prob": round(float(probs[2]), 4),
        "draw_prob": round(float(probs[1]), 4),
        "away_prob": round(float(probs[0]), 4),
        "confidence": "low" if is_cold_start else "high",
        "label_map": {0: "away_win", 1: "draw", 2: "home_win"},
    }


def reset_cache() -> None:
    """Force reload on next call (useful after retraining)."""
    global _pipeline, _cache, _all_matches
    _pipeline = _cache = _all_matches = None
