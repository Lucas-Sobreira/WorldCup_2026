from __future__ import annotations
from typing import Literal
from pydantic import BaseModel


class MatchPred(BaseModel):
    match_id: str
    home_team: str
    away_team: str
    home_prob: float
    draw_prob: float
    away_prob: float
    predicted_winner: Literal["home", "draw", "away"]
    confidence: Literal["high", "low"]


class TeamStanding(BaseModel):
    team: str
    played: int
    points: int
    goals_for: int
    goals_against: int
    goal_diff: int
    position: int


class GroupData(BaseModel):
    group: str
    teams: list[str]
    matches: list[MatchPred]
    standings: list[TeamStanding]
    qualifiers: list[str]   # top-2 that advance directly
    third_place: str        # 3rd-place team (may advance as best 3rd)


class KnockoutMatch(BaseModel):
    id: str
    round: str
    home_team: str
    away_team: str
    prediction: MatchPred
    predicted_winner: str


class BracketResponse(BaseModel):
    edition: int
    groups: dict[str, GroupData]
    round_of_32: list[KnockoutMatch]
    round_of_16: list[KnockoutMatch]
    quarter_finals: list[KnockoutMatch]
    semi_finals: list[KnockoutMatch]
    third_place_match: KnockoutMatch
    final: KnockoutMatch
    predicted_champion: str
