from __future__ import annotations
from pydantic import BaseModel


class GoalsByDecadeItem(BaseModel):
    decade: int
    total_goals: int
    matches: int
    avg_per_match: float


class ConfederationItem(BaseModel):
    confederation: str
    teams_in_ranking: int
    avg_rank: float
    avg_points: float


class GoalsByDecadeResponse(BaseModel):
    data: list[GoalsByDecadeItem]


class ConfederationResponse(BaseModel):
    data: list[ConfederationItem]
