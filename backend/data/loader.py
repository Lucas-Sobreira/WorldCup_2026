"""
Loads the three source CSVs and caches them as module-level DataFrames.
All team names are normalized via team_aliases.normalize().
"""

from __future__ import annotations

import functools
from pathlib import Path

import pandas as pd

from .team_aliases import normalize

_DATASET = Path(__file__).parent.parent.parent / "dataset"


def _apply_aliases(df: pd.DataFrame, *cols: str) -> pd.DataFrame:
    for col in cols:
        if col in df.columns:
            df[col] = df[col].map(normalize)
    return df


@functools.cache
def load_matches() -> pd.DataFrame:
    """
    Returns all 1930-2022 matches (~964 rows after dedup) with normalized names.
    Key columns: home_team, away_team, home_score, away_score, Year, Round, Date.
    """
    df = pd.read_csv(
        _DATASET / "matches_1930_2022.csv",
        encoding="utf-8",
        encoding_errors="replace",
    )
    df["Date"] = pd.to_datetime(df["Date"], errors="coerce")
    df["Year"] = df["Year"].astype(int)
    df["home_score"] = pd.to_numeric(df["home_score"], errors="coerce")
    df["away_score"] = pd.to_numeric(df["away_score"], errors="coerce")
    df = _apply_aliases(df, "home_team", "away_team")
    return df.reset_index(drop=True)


@functools.cache
def load_rankings() -> pd.DataFrame:
    """
    Returns FIFA rankings (Oct 2022) with normalized team names.
    Columns: team, team_code, association, rank, previous_rank, points, previous_points.
    Note: 'USA' is normalized to 'United States'.
    """
    df = pd.read_csv(
        _DATASET / "fifa_ranking_2022-10-06.csv",
        encoding="utf-8",
        encoding_errors="replace",
    )
    df = _apply_aliases(df, "team")
    return df.reset_index(drop=True)


@functools.cache
def load_world_cups() -> pd.DataFrame:
    """
    Returns tournament-level summaries for all 22 World Cups.
    Columns: Year, Host, Teams, Champion, Runner-Up, TopScorrer, Attendance, AttendanceAvg, Matches.
    """
    df = pd.read_csv(
        _DATASET / "world_cup.csv",
        encoding="utf-8",
        encoding_errors="replace",
    )
    df["Year"] = df["Year"].astype(int)
    df = _apply_aliases(df, "Champion", "Runner-Up")
    return df.reset_index(drop=True)
