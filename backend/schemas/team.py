from __future__ import annotations
from typing import Literal
from pydantic import BaseModel


class TeamMatch(BaseModel):
    year: int
    round: str
    opponent: str
    result: Literal["W", "D", "L"]
    goals_for: int
    goals_against: int


class TeamHistoryResponse(BaseModel):
    team: str
    appearances: int
    total_matches: int
    wins: int
    draws: int
    losses: int
    win_rate: float
    goals_per_game: float
    wc_titles: int
    finals_reached: int
    history: list[TeamMatch]
