"""
Builds the 36-feature vector used for match prediction.

Features (36 total):
  Team A (14): win_rate, win_rate_recent, draw_rate,
               goals_scored, goals_conceded, goals_scored_recent, goals_conceded_recent,
               appearances, knockout_rate, wc_titles, finals_reached,
               fifa_rank, fifa_points, conf_win_rate
  Team B (14): same
  H2H    ( 3): h2h_a_wins, h2h_draws, h2h_goal_diff
  Diff   ( 5): rank_diff, points_diff, same_confederation,
               win_rate_diff, goals_balance_diff
"""

from __future__ import annotations

import numpy as np
import pandas as pd

from .cold_start import confederation_avg_stats, get_confederation

# Rounds that count as group stage only (not yet knockout)
_GROUP_ROUNDS = {"group stage", "first group stage", "first round", "group stage play-off"}

FEATURE_NAMES: list[str] = [
    # Team A (14)
    "a_win_rate", "a_win_rate_recent", "a_draw_rate",
    "a_goals_scored", "a_goals_conceded",
    "a_goals_scored_recent", "a_goals_conceded_recent",
    "a_appearances", "a_knockout_rate",
    "a_wc_titles", "a_finals_reached",
    "a_fifa_rank", "a_fifa_points", "a_conf_win_rate",
    # Team B (14)
    "b_win_rate", "b_win_rate_recent", "b_draw_rate",
    "b_goals_scored", "b_goals_conceded",
    "b_goals_scored_recent", "b_goals_conceded_recent",
    "b_appearances", "b_knockout_rate",
    "b_wc_titles", "b_finals_reached",
    "b_fifa_rank", "b_fifa_points", "b_conf_win_rate",
    # H2H (3)
    "h2h_a_wins", "h2h_draws", "h2h_goal_diff",
    # Comparative (5)
    "rank_diff", "points_diff", "same_confederation",
    "win_rate_diff", "goals_balance_diff",
]

_MAX_RANK = 211
_MAX_RECENT_EDITIONS = 3


def _is_group_stage(round_str: str) -> bool:
    return round_str.strip().lower() in _GROUP_ROUNDS


class TeamStatsCache:
    """
    Pre-computes per-team stats and confederation averages from historical data.
    Pass cutoff_year to prevent data leakage: only matches Year < cutoff_year are used.
    """

    def __init__(
        self,
        matches_df: pd.DataFrame,
        rankings_df: pd.DataFrame,
        cutoff_year: int = 9999,
    ) -> None:
        self._rankings = rankings_df
        df = matches_df[matches_df["Year"] < cutoff_year].copy()

        self._stats: dict[str, dict] = {}
        self._confederations: dict[str, str] = {}
        self._ranking_lookup: dict[str, tuple[int, float]] = {}

        teams = set(df["home_team"]) | set(df["away_team"])
        for team in teams:
            self._stats[team] = self._compute_team_stats(team, df)
            self._confederations[team] = get_confederation(team, rankings_df)

        confs = set(self._confederations.values())
        self._conf_avg: dict[str, dict] = {
            c: confederation_avg_stats(c, self._stats, self._confederations)
            for c in confs
        }

        for _, row in rankings_df.iterrows():
            self._ranking_lookup[row["team"]] = (
                int(row["rank"]),
                float(row["points"]),
            )

    def _compute_team_stats(self, team: str, df: pd.DataFrame) -> dict:
        home = df[df["home_team"] == team]
        away = df[df["away_team"] == team]
        total = len(home) + len(away)

        if total == 0:
            return self._empty_stats()

        home_wins = (home["home_score"] > home["away_score"]).sum()
        home_draws = (home["home_score"] == home["away_score"]).sum()
        away_wins = (away["away_score"] > away["home_score"]).sum()
        away_draws = (away["away_score"] == away["home_score"]).sum()

        win_rate = (home_wins + away_wins) / total
        draw_rate = (home_draws + away_draws) / total

        goals_scored = (home["home_score"].sum() + away["away_score"].sum()) / total
        goals_conceded = (home["away_score"].sum() + away["home_score"].sum()) / total

        years_played = sorted(set(home["Year"]) | set(away["Year"]), reverse=True)
        appearances = len(years_played)

        # Knockout rate
        ko_years = set()
        for yr in years_played:
            yr_matches = df[
                ((df["home_team"] == team) | (df["away_team"] == team))
                & (df["Year"] == yr)
            ]
            if any(not _is_group_stage(r) for r in yr_matches["Round"]):
                ko_years.add(yr)
        knockout_rate = len(ko_years) / appearances

        # WC titles and finals reached (Round == "Final")
        finals = df[
            ((df["home_team"] == team) | (df["away_team"] == team))
            & (df["Round"].str.strip().str.lower() == "final")
        ]
        finals_reached = float(len(finals))
        wc_titles = float(
            (finals[finals["home_team"] == team]["home_score"] >
             finals[finals["home_team"] == team]["away_score"]).sum()
            + (finals[finals["away_team"] == team]["away_score"] >
               finals[finals["away_team"] == team]["home_score"]).sum()
        )

        # Win rate and goals in last _MAX_RECENT_EDITIONS editions
        recent_years = years_played[:_MAX_RECENT_EDITIONS]
        rh = home[home["Year"].isin(recent_years)]
        ra = away[away["Year"].isin(recent_years)]
        r_total = len(rh) + len(ra)

        if r_total > 0:
            r_wins = (rh["home_score"] > rh["away_score"]).sum() + (
                ra["away_score"] > ra["home_score"]
            ).sum()
            win_rate_recent = float(r_wins / r_total)
            goals_scored_recent = float(
                (rh["home_score"].sum() + ra["away_score"].sum()) / r_total
            )
            goals_conceded_recent = float(
                (rh["away_score"].sum() + ra["home_score"].sum()) / r_total
            )
        else:
            win_rate_recent = float(win_rate)
            goals_scored_recent = float(goals_scored)
            goals_conceded_recent = float(goals_conceded)

        return {
            "win_rate": float(win_rate),
            "win_rate_recent": win_rate_recent,
            "draw_rate": float(draw_rate),
            "goals_scored": float(goals_scored),
            "goals_conceded": float(goals_conceded),
            "goals_scored_recent": goals_scored_recent,
            "goals_conceded_recent": goals_conceded_recent,
            "appearances": float(appearances),
            "knockout_rate": float(knockout_rate),
            "wc_titles": wc_titles,
            "finals_reached": finals_reached,
            "conf_win_rate": float(win_rate),  # overwritten in get_stats()
            "is_cold_start": False,
        }

    @staticmethod
    def _empty_stats() -> dict:
        return {
            "win_rate": 0.0, "win_rate_recent": 0.0, "draw_rate": 0.0,
            "goals_scored": 0.0, "goals_conceded": 0.0,
            "goals_scored_recent": 0.0, "goals_conceded_recent": 0.0,
            "appearances": 0.0, "knockout_rate": 0.0,
            "wc_titles": 0.0, "finals_reached": 0.0,
            "conf_win_rate": 0.0, "is_cold_start": True,
        }

    def get_stats(self, team: str) -> dict:
        if team in self._stats:
            s = dict(self._stats[team])
            conf = self._confederations[team]
            s["conf_win_rate"] = self._conf_avg.get(conf, {}).get("win_rate", 0.0)
            return s
        conf = get_confederation(team, self._rankings)
        avg = self._conf_avg.get(conf, self._empty_stats())
        return {**avg, "is_cold_start": True}

    def get_ranking(self, team: str) -> tuple[int, float]:
        return self._ranking_lookup.get(team, (_MAX_RANK, 0.0))

    def get_confederation(self, team: str) -> str:
        if team in self._confederations:
            return self._confederations[team]
        return get_confederation(team, self._rankings)


def _h2h_stats(
    team_a: str, team_b: str, prior_matches: pd.DataFrame
) -> tuple[int, int, float]:
    ab = prior_matches[
        (prior_matches["home_team"] == team_a) & (prior_matches["away_team"] == team_b)
    ]
    ba = prior_matches[
        (prior_matches["home_team"] == team_b) & (prior_matches["away_team"] == team_a)
    ]
    a_wins = int(
        (ab["home_score"] > ab["away_score"]).sum()
        + (ba["away_score"] > ba["home_score"]).sum()
    )
    draws = int(
        (ab["home_score"] == ab["away_score"]).sum()
        + (ba["home_score"] == ba["away_score"]).sum()
    )
    goal_diff = float(
        (ab["home_score"] - ab["away_score"]).sum()
        + (ba["away_score"] - ba["home_score"]).sum()
    )
    return a_wins, draws, goal_diff


def build_features(
    team_a: str,
    team_b: str,
    cache: TeamStatsCache,
    prior_matches: pd.DataFrame,
) -> np.ndarray:
    """Returns a (36,) float array ready for the sklearn pipeline."""
    sa = cache.get_stats(team_a)
    sb = cache.get_stats(team_b)
    rank_a, pts_a = cache.get_ranking(team_a)
    rank_b, pts_b = cache.get_ranking(team_b)
    conf_a = cache.get_confederation(team_a)
    conf_b = cache.get_confederation(team_b)

    h2h_wins, h2h_draws, h2h_gdiff = _h2h_stats(team_a, team_b, prior_matches)

    vec = [
        # Team A
        sa["win_rate"], sa["win_rate_recent"], sa["draw_rate"],
        sa["goals_scored"], sa["goals_conceded"],
        sa["goals_scored_recent"], sa["goals_conceded_recent"],
        sa["appearances"], sa["knockout_rate"],
        sa["wc_titles"], sa["finals_reached"],
        float(rank_a), float(pts_a), sa["conf_win_rate"],
        # Team B
        sb["win_rate"], sb["win_rate_recent"], sb["draw_rate"],
        sb["goals_scored"], sb["goals_conceded"],
        sb["goals_scored_recent"], sb["goals_conceded_recent"],
        sb["appearances"], sb["knockout_rate"],
        sb["wc_titles"], sb["finals_reached"],
        float(rank_b), float(pts_b), sb["conf_win_rate"],
        # H2H
        float(h2h_wins), float(h2h_draws), h2h_gdiff,
        # Comparative
        float(rank_a - rank_b),
        float(pts_a - pts_b),
        float(conf_a == conf_b),
        sa["win_rate"] - sb["win_rate"],
        (sa["goals_scored"] - sa["goals_conceded"]) - (sb["goals_scored"] - sb["goals_conceded"]),
    ]

    return np.array(vec, dtype=np.float32)
