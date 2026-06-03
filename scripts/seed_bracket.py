"""
Validates bracket_2026.json structure and checks which teams lack historical data.
Run from the worldCup/ root: python scripts/seed_bracket.py
"""

import json
import sys
from pathlib import Path

# Allow imports from backend/
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from data.loader import load_matches, load_rankings
from data.team_aliases import normalize

BRACKET_PATH = Path(__file__).parent.parent / "backend" / "data" / "bracket_2026.json"


def main() -> None:
    bracket = json.loads(BRACKET_PATH.read_text(encoding="utf-8"))
    groups = bracket["groups"]

    all_teams: list[str] = []
    for group_id, group in groups.items():
        for team in group["teams"]:
            all_teams.append(team)

    print(f"Total teams: {len(all_teams)}")
    assert len(all_teams) == 48, f"Expected 48 teams, got {len(all_teams)}"

    matches = load_matches()
    rankings = load_rankings()

    historical = set(matches["home_team"]) | set(matches["away_team"])
    ranked = set(rankings["team"])

    print("\n--- Teams without World Cup history (cold-start) ---")
    no_history = [t for t in all_teams if t not in historical]
    for t in no_history:
        print(f"  {t}")

    print("\n--- Teams without FIFA ranking ---")
    no_rank = [t for t in all_teams if t not in ranked]
    for t in no_rank:
        print(f"  {t}")

    print("\n--- Group summary ---")
    for gid, group in groups.items():
        teams_str = " | ".join(group["teams"])
        print(f"  Group {gid}: {teams_str}")

    print(f"\n Round of 32 slots: {len(bracket['round_of_32_slots'])}")
    assert len(bracket["round_of_32_slots"]) == 16

    print("\nValidation passed.")


if __name__ == "__main__":
    main()
