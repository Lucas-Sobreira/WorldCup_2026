from __future__ import annotations

from fastapi import APIRouter

from data.loader import load_matches
from data.team_aliases import normalize
from model.predictor import predict_match
from schemas.bracket import MatchPred
from schemas.match import H2HMatch, MatchDetailResponse

router = APIRouter(prefix="/match", tags=["match"])


def _make_match_pred(match_id: str, home: str, away: str) -> MatchPred:
    raw = predict_match(home, away)
    probs = [raw["home_prob"], raw["draw_prob"], raw["away_prob"]]
    winner = ["home", "draw", "away"][probs.index(max(probs))]
    return MatchPred(
        match_id=match_id,
        home_team=home,
        away_team=away,
        home_prob=raw["home_prob"],
        draw_prob=raw["draw_prob"],
        away_prob=raw["away_prob"],
        predicted_winner=winner,
        confidence=raw["confidence"],
    )


@router.get("/{team_a}/{team_b}", response_model=MatchDetailResponse)
def match_detail(team_a: str, team_b: str):
    home = normalize(team_a)
    away = normalize(team_b)

    prediction = _make_match_pred(f"{home}_vs_{away}", home, away)

    df = load_matches()
    h2h_mask = (
        ((df["home_team"] == home) & (df["away_team"] == away))
        | ((df["home_team"] == away) & (df["away_team"] == home))
    )
    h2h_df = df[h2h_mask].sort_values("Year")

    h2h_matches = [
        H2HMatch(
            year=int(row["Year"]),
            round=str(row["Round"]),
            home_team=str(row["home_team"]),
            away_team=str(row["away_team"]),
            home_score=int(row["home_score"]),
            away_score=int(row["away_score"]),
        )
        for _, row in h2h_df.iterrows()
    ]

    home_wins = sum(
        1 for m in h2h_matches
        if (m.home_team == home and m.home_score > m.away_score)
        or (m.away_team == home and m.away_score > m.home_score)
    )
    away_wins = sum(
        1 for m in h2h_matches
        if (m.home_team == away and m.home_score > m.away_score)
        or (m.away_team == away and m.away_score > m.home_score)
    )
    draws = len(h2h_matches) - home_wins - away_wins

    # xG from most recent match where data is available
    home_xg: float | None = None
    away_xg: float | None = None
    if not h2h_df.empty and "home_xg" in h2h_df.columns:
        last = h2h_df.iloc[-1]
        raw_hxg = last.get("home_xg")
        raw_axg = last.get("away_xg")
        try:
            home_xg = float(raw_hxg) if raw_hxg and str(raw_hxg) != "nan" else None
            away_xg = float(raw_axg) if raw_axg and str(raw_axg) != "nan" else None
        except (ValueError, TypeError):
            pass

    return MatchDetailResponse(
        home_team=home,
        away_team=away,
        prediction=prediction,
        h2h_matches=h2h_matches,
        h2h_summary={"home_wins": home_wins, "draws": draws, "away_wins": away_wins},
        home_xg=home_xg,
        away_xg=away_xg,
    )
