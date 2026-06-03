from __future__ import annotations

from fastapi import APIRouter, HTTPException

from data.loader import load_matches
from data.team_aliases import normalize
from schemas.team import TeamHistoryResponse, TeamMatch

router = APIRouter(prefix="/team", tags=["team"])

_FINAL_ROUNDS = {"Final", "finals", "Final Round"}


@router.get("/{name}/history", response_model=TeamHistoryResponse)
def team_history(name: str):
    team = normalize(name)
    df = load_matches()

    mask = (df["home_team"] == team) | (df["away_team"] == team)
    matches_df = df[mask].copy()

    if matches_df.empty:
        raise HTTPException(status_code=404, detail=f"Team '{team}' not found in history")

    appearances = sorted(matches_df["Year"].unique().tolist())
    history: list[TeamMatch] = []
    wins = draws = losses = 0
    total_goals = 0

    for _, row in matches_df.iterrows():
        is_home = row["home_team"] == team
        opponent = row["away_team"] if is_home else row["home_team"]
        gf = int(row["home_score"]) if is_home else int(row["away_score"])
        ga = int(row["away_score"]) if is_home else int(row["home_score"])
        total_goals += gf

        if gf > ga:
            result = "W"
            wins += 1
        elif gf == ga:
            result = "D"
            draws += 1
        else:
            result = "L"
            losses += 1

        history.append(
            TeamMatch(
                year=int(row["Year"]),
                round=str(row["Round"]),
                opponent=opponent,
                result=result,
                goals_for=gf,
                goals_against=ga,
            )
        )

    total_matches = len(history)
    win_rate = round(wins / total_matches, 4) if total_matches else 0.0
    goals_per_game = round(total_goals / total_matches, 2) if total_matches else 0.0

    # Count WC titles and finals
    wc_titles = 0
    finals_reached = 0
    finals_df = matches_df[matches_df["Round"].isin(_FINAL_ROUNDS)]
    for _, row in finals_df.iterrows():
        is_home = row["home_team"] == team
        gf = int(row["home_score"]) if is_home else int(row["away_score"])
        ga = int(row["away_score"]) if is_home else int(row["home_score"])
        finals_reached += 1
        if gf > ga:
            wc_titles += 1

    history.sort(key=lambda m: (m.year, m.round))

    return TeamHistoryResponse(
        team=team,
        appearances=len(appearances),
        total_matches=total_matches,
        wins=wins,
        draws=draws,
        losses=losses,
        win_rate=win_rate,
        goals_per_game=goals_per_game,
        wc_titles=wc_titles,
        finals_reached=finals_reached,
        history=history,
    )
