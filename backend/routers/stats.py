from __future__ import annotations

from fastapi import APIRouter

from data.loader import load_matches, load_rankings
from schemas.stats import ConfederationResponse, GoalsByDecadeResponse

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/goals-by-decade", response_model=GoalsByDecadeResponse)
def goals_by_decade():
    df = load_matches().copy()
    df["decade"] = (df["Year"] // 10) * 10

    rows = []
    for decade, grp in df.groupby("decade"):
        total = int(grp["home_score"].sum() + grp["away_score"].sum())
        matches = len(grp)
        rows.append(
            {
                "decade": int(decade),
                "total_goals": total,
                "matches": matches,
                "avg_per_match": round(total / matches, 2) if matches else 0.0,
            }
        )
    return {"data": rows}


@router.get("/confederation", response_model=ConfederationResponse)
def confederation_stats():
    rankings = load_rankings()

    results = []
    for conf, grp in rankings.groupby("association"):
        results.append(
            {
                "confederation": str(conf),
                "teams_in_ranking": len(grp),
                "avg_rank": round(float(grp["rank"].mean()), 1),
                "avg_points": round(float(grp["points"].mean()), 1),
            }
        )

    results.sort(key=lambda x: x["avg_rank"])
    return {"data": results}
