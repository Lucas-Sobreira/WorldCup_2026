from __future__ import annotations
from pydantic import BaseModel
from .bracket import MatchPred


class H2HMatch(BaseModel):
    year: int
    round: str
    home_team: str
    away_team: str
    home_score: int
    away_score: int


class MatchDetailResponse(BaseModel):
    home_team: str
    away_team: str
    prediction: MatchPred
    h2h_matches: list[H2HMatch]
    h2h_summary: dict[str, int]   # {"home_wins": n, "draws": n, "away_wins": n}
    home_xg: float | None
    away_xg: float | None
