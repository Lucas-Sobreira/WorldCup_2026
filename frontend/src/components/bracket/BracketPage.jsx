import { useState } from "react";
import { useBracket } from "../../hooks";
import { BracketSkeleton } from "../shared/Skeleton";
import BracketColumn from "./BracketColumn";
import MatchPanel from "../panel/MatchPanel";
import TeamFlag from "../shared/TeamFlag";

const ROUND_ORDER = [
  "round_of_32",
  "round_of_16",
  "quarter_finals",
  "semi_finals",
  "final",
];

function GroupsView({ groups }) {
  return (
    <div className="groups-grid">
      {Object.entries(groups).map(([gid, gdata]) => (
        <div key={gid} className="group-card">
          <h3 className="group-card__title">Group {gid}</h3>
          <table className="group-table">
            <thead>
              <tr>
                <th>#</th><th>Team</th><th>P</th><th>Pts</th><th>GD</th>
              </tr>
            </thead>
            <tbody>
              {gdata.standings.map((s) => (
                <tr
                  key={s.team}
                  className={s.position <= 2 ? "group-table__row--qualify" : ""}
                >
                  <td>{s.position}</td>
                  <td className="group-table__team">
                    <TeamFlag team={s.team} size={14} />
                    <span>{s.team}</span>
                  </td>
                  <td>{s.played}</td>
                  <td><strong>{s.points}</strong></td>
                  <td>{s.goal_diff > 0 ? `+${s.goal_diff}` : s.goal_diff}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

export default function BracketPage() {
  const { data, isLoading, error } = useBracket();
  const [activeMatch, setActiveMatch] = useState(null);
  const [view, setView] = useState("bracket"); // "bracket" | "groups"

  if (isLoading) {
    return (
      <div className="bracket-page">
        <div className="bracket-layout">
          <BracketSkeleton />
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="error-box">
        <span className="error-icon">⚠</span>
        <p>Failed to load bracket: {error.message}</p>
      </div>
    );
  }

  const rounds = [
    { name: "Round of 32", matches: data.round_of_32 },
    { name: "Round of 16", matches: data.round_of_16 },
    { name: "Quarter-final", matches: data.quarter_finals },
    { name: "Semi-final", matches: data.semi_finals },
    { name: "Final", matches: [data.final] },
  ];

  return (
    <div className="bracket-page">
      <header className="bracket-header">
        <div className="bracket-header__left">
          <h1 className="bracket-header__title">
            FIFA World Cup 2026 — Bracket Predictor
          </h1>
          <div className="bracket-header__champion">
            <span>Predicted Champion:</span>
            <TeamFlag team={data.predicted_champion} size={22} />
            <strong>{data.predicted_champion}</strong>
          </div>
        </div>
        <div className="bracket-header__tabs">
          <button
            className={`tab-btn ${view === "bracket" ? "tab-btn--active" : ""}`}
            onClick={() => setView("bracket")}
          >
            Bracket
          </button>
          <button
            className={`tab-btn ${view === "groups" ? "tab-btn--active" : ""}`}
            onClick={() => setView("groups")}
          >
            Groups
          </button>
        </div>
      </header>

      {view === "groups" ? (
        <GroupsView groups={data.groups} />
      ) : (
        <div className="bracket-layout">
          <div className="bracket-tree">
            {rounds.map((round) => (
              <BracketColumn
                key={round.name}
                roundName={round.name}
                matches={round.matches}
                activeMatchId={activeMatch?.id}
                onMatchClick={setActiveMatch}
              />
            ))}
            <BracketColumn
              roundName="Third-place play-off"
              matches={[data.third_place_match]}
              activeMatchId={activeMatch?.id}
              onMatchClick={setActiveMatch}
            />
          </div>

          {activeMatch && (
            <MatchPanel
              match={activeMatch}
              onClose={() => setActiveMatch(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}
