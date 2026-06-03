"""
Fallback for teams with no World Cup history.
Provides confederation mapping and average-stats computation.
"""

from __future__ import annotations

import pandas as pd

# Teams absent from the FIFA ranking CSV → manual confederation assignment
_EXTRA_CONFEDERATIONS: dict[str, str] = {
    "Curacao": "CONCACAF",
    "Cape Verde": "CAF",
    "DR Congo": "CAF",        # Zaire in historical data
    "South Sudan": "CAF",
}

# Fallback if a confederation has no representative with history
_GLOBAL_FALLBACK_CONF = "UEFA"


def get_confederation(team: str, rankings_df: pd.DataFrame) -> str:
    row = rankings_df[rankings_df["team"] == team]
    if not row.empty:
        return row.iloc[0]["association"]
    return _EXTRA_CONFEDERATIONS.get(team, _GLOBAL_FALLBACK_CONF)


def confederation_avg_stats(
    confederation: str,
    all_team_stats: dict[str, dict],
    team_confederations: dict[str, str],
) -> dict:
    """
    Average stats across all teams in `confederation` that have WC history.
    Falls back to global average if confederation has no representatives.
    """
    members = [
        t for t, s in all_team_stats.items()
        if team_confederations.get(t) == confederation and s["appearances"] > 0
    ]
    if not members:
        members = [t for t, s in all_team_stats.items() if s["appearances"] > 0]

    def _avg(key: str) -> float:
        vals = [all_team_stats[t][key] for t in members]
        return sum(vals) / len(vals) if vals else 0.0

    return {
        "win_rate": _avg("win_rate"),
        "win_rate_recent": _avg("win_rate_recent"),
        "draw_rate": _avg("draw_rate"),
        "goals_scored": _avg("goals_scored"),
        "goals_conceded": _avg("goals_conceded"),
        "appearances": _avg("appearances"),
        "knockout_rate": _avg("knockout_rate"),
        "conf_win_rate": _avg("win_rate"),
        "is_cold_start": True,
    }
