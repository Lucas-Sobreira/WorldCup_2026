from __future__ import annotations

import json
from functools import lru_cache
from itertools import combinations
from pathlib import Path
from typing import Any

from fastapi import APIRouter

from data.loader import load_matches
from model.predictor import predict_match
from schemas.bracket import (
    BracketResponse,
    GroupData,
    KnockoutMatch,
    MatchPred,
    TeamStanding,
)

router = APIRouter(prefix="/bracket", tags=["bracket"])

_BRACKET_JSON = Path(__file__).parent.parent / "data" / "bracket_2026.json"

_SF_PAIRS = [
    ("QF_01", "QF_02"),
    ("QF_03", "QF_04"),
]


def _load_bracket_json() -> dict:
    with open(_BRACKET_JSON, encoding="utf-8") as f:
        return json.load(f)


def _make_pred(match_id: str, home: str, away: str) -> MatchPred:
    raw = predict_match(home, away)
    probs = [raw["home_prob"], raw["draw_prob"], raw["away_prob"]]
    winner_label = ["home", "draw", "away"][probs.index(max(probs))]
    return MatchPred(
        match_id=match_id,
        home_team=home,
        away_team=away,
        home_prob=raw["home_prob"],
        draw_prob=raw["draw_prob"],
        away_prob=raw["away_prob"],
        predicted_winner=winner_label,
        confidence=raw["confidence"],
    )


def _knockout_winner(pred: MatchPred) -> str:
    """In knockout stage draws go to extra-time/pens; pick the more likely side."""
    eff_home = pred.home_prob + pred.draw_prob / 2
    eff_away = pred.away_prob + pred.draw_prob / 2
    return pred.home_team if eff_home >= eff_away else pred.away_team


def _simulate_group(group_id: str, teams: list[str]) -> GroupData:
    df = load_matches()
    standings: dict[str, dict[str, int]] = {
        t: {"played": 0, "points": 0, "gf": 0, "ga": 0}
        for t in teams
    }
    match_preds: list[MatchPred] = []

    for i, (home, away) in enumerate(combinations(teams, 2)):
        match_id = f"{group_id}_{i+1:02d}"
        pred = _make_pred(match_id, home, away)
        match_preds.append(pred)

        # Simulate result from probabilities
        winner = pred.predicted_winner  # "home", "draw", "away"
        for t in (home, away):
            standings[t]["played"] += 1

        if winner == "home":
            standings[home]["points"] += 3
            standings[home]["gf"] += 2
            standings[home]["ga"] += 1
            standings[away]["gf"] += 1
            standings[away]["ga"] += 2
        elif winner == "draw":
            standings[home]["points"] += 1
            standings[away]["points"] += 1
            standings[home]["gf"] += 1
            standings[home]["ga"] += 1
            standings[away]["gf"] += 1
            standings[away]["ga"] += 1
        else:  # away win
            standings[away]["points"] += 3
            standings[away]["gf"] += 2
            standings[away]["ga"] += 1
            standings[home]["gf"] += 1
            standings[home]["ga"] += 2

    team_standings = sorted(
        [
            TeamStanding(
                team=t,
                played=s["played"],
                points=s["points"],
                goals_for=s["gf"],
                goals_against=s["ga"],
                goal_diff=s["gf"] - s["ga"],
                position=0,
            )
            for t, s in standings.items()
        ],
        key=lambda x: (-x.points, -x.goal_diff, -x.goals_for),
    )
    for i, ts in enumerate(team_standings):
        ts.position = i + 1

    qualifiers = [team_standings[0].team, team_standings[1].team]
    third_place = team_standings[2].team

    return GroupData(
        group=group_id,
        teams=teams,
        matches=match_preds,
        standings=team_standings,
        qualifiers=qualifiers,
        third_place=third_place,
    )


def _simulate_knockout(match_id: str, round_name: str, home: str, away: str) -> KnockoutMatch:
    pred = _make_pred(match_id, home, away)
    winner = _knockout_winner(pred)
    return KnockoutMatch(
        id=match_id,
        round=round_name,
        home_team=home,
        away_team=away,
        prediction=pred,
        predicted_winner=winner,
    )


def _assign_third_places(
    groups: dict[str, GroupData],
    r32_slots: list[dict],
) -> dict[str, str]:
    """
    Rank all 12 third-place teams and assign top 8 to the 8 R32 third-place slots.
    Each slot defines a pool of eligible groups; greedy assignment by rank.
    """
    all_thirds = []
    for gid, gdata in groups.items():
        ts = next(t for t in gdata.standings if t.position == 3)
        all_thirds.append({
            "group": gid,
            "team": ts.team,
            "points": ts.points,
            "goal_diff": ts.goal_diff,
            "goals_for": ts.goals_for,
        })
    all_thirds.sort(key=lambda x: (-x["points"], -x["goal_diff"], -x["goals_for"]))

    # Slots that need a 3rd-place team, with their eligible group pools
    third_slots = [
        (s["id"], set(s["pool"]))
        for s in r32_slots
        if s.get("pool")
    ]

    assigned: dict[str, str] = {}
    used: set[str] = set()

    for sid, pool in third_slots:
        for entry in all_thirds:
            if entry["team"] not in used and entry["group"] in pool:
                assigned[sid] = entry["team"]
                used.add(entry["team"])
                break
        else:
            # Fallback: best remaining (shouldn't happen with correct pools)
            for entry in all_thirds:
                if entry["team"] not in used:
                    assigned[sid] = entry["team"]
                    used.add(entry["team"])
                    break

    return assigned


@lru_cache(maxsize=1)
def _simulate_full_bracket() -> BracketResponse:
    data = _load_bracket_json()
    edition = data["edition"]
    group_cfg: dict[str, list[str]] = {g: v["teams"] for g, v in data["groups"].items()}
    r32_slots: list[dict] = data["round_of_32_slots"]
    r16_pairs: list[list[str]] = data["r16_pairs"]
    qf_pairs: list[list[str]] = data["qf_pairs"]

    # --- Group stage ---
    groups: dict[str, GroupData] = {}
    for gid, teams in group_cfg.items():
        groups[gid] = _simulate_group(gid, teams)

    # --- Assign 3rd-place teams to correct R32 slots ---
    third_slot_map = _assign_third_places(groups, r32_slots)

    # --- Build R32 team lookup ---
    def _resolve_slot(slot_str: str, r32_slot_id: str) -> str:
        if slot_str == "3rd":
            return third_slot_map.get(r32_slot_id, "TBD")
        pos = int(slot_str[0])   # 1 or 2
        gid = slot_str[1]        # A..L
        team = next((t.team for t in groups[gid].standings if t.position == pos), "TBD")
        return team

    # --- Round of 32 ---
    r32_matches: list[KnockoutMatch] = []
    r32_winners: dict[str, str] = {}
    for slot in r32_slots:
        sid = slot["id"]
        home = _resolve_slot(slot["team_a"], sid)
        away = _resolve_slot(slot["team_b"], sid)
        km = _simulate_knockout(sid, "Round of 32", home, away)
        r32_matches.append(km)
        r32_winners[sid] = km.predicted_winner

    # --- Round of 16 (official bracket tree from bracket_2026.json) ---
    r16_matches: list[KnockoutMatch] = []
    r16_winners: dict[str, str] = {}
    for i, (a_id, b_id) in enumerate(r16_pairs):
        match_id = f"R16_{i+1:02d}"
        home = r32_winners[a_id]
        away = r32_winners[b_id]
        km = _simulate_knockout(match_id, "Round of 16", home, away)
        r16_matches.append(km)
        r16_winners[match_id] = km.predicted_winner

    # --- Quarter-finals (cross-bracket pairs from bracket_2026.json) ---
    qf_matches: list[KnockoutMatch] = []
    qf_winners: dict[str, str] = {}
    for i, (a_id, b_id) in enumerate(qf_pairs):
        match_id = f"QF_{i+1:02d}"
        home = r16_winners[a_id]
        away = r16_winners[b_id]
        km = _simulate_knockout(match_id, "Quarter-final", home, away)
        qf_matches.append(km)
        qf_winners[match_id] = km.predicted_winner

    # --- Semi-finals ---
    sf_matches: list[KnockoutMatch] = []
    sf_winners: dict[str, str] = {}
    sf_losers: list[str] = []
    for i, (a_id, b_id) in enumerate(_SF_PAIRS):
        match_id = f"SF_{i+1:02d}"
        home = qf_winners[a_id]
        away = qf_winners[b_id]
        km = _simulate_knockout(match_id, "Semi-final", home, away)
        sf_matches.append(km)
        sf_winners[match_id] = km.predicted_winner
        loser = km.home_team if km.predicted_winner == km.away_team else km.away_team
        sf_losers.append(loser)

    # --- Third-place match ---
    third_place_match = _simulate_knockout("3P", "Third-place play-off", sf_losers[0], sf_losers[1])

    # --- Final ---
    final_match = _simulate_knockout("F", "Final", sf_winners["SF_01"], sf_winners["SF_02"])
    champion = final_match.predicted_winner

    return BracketResponse(
        edition=edition,
        groups=groups,
        round_of_32=r32_matches,
        round_of_16=r16_matches,
        quarter_finals=qf_matches,
        semi_finals=sf_matches,
        third_place_match=third_place_match,
        final=final_match,
        predicted_champion=champion,
    )


@router.get("", response_model=BracketResponse)
@router.get("/", response_model=BracketResponse)
def get_bracket():
    return _simulate_full_bracket()
