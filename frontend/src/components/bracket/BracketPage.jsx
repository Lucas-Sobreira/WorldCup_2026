import { useState, useRef, useLayoutEffect, useCallback } from "react";
import { useBracket } from "../../hooks";
import { BracketSkeleton } from "../shared/Skeleton";
import MatchCard from "./MatchCard";
import MatchPanel from "../panel/MatchPanel";
import TeamFlag from "../shared/TeamFlag";

// Which round pairs feed into the next
const FEED_PAIRS = [
  // [feederRoundKey, receiverRoundKey]
  ["round_of_32",   "round_of_16"],
  ["round_of_16",   "quarter_finals"],
  ["quarter_finals","semi_finals"],
  ["semi_finals",   "final_arr"],
];

const ROUND_LABELS = {
  "Round of 32":        "Oitavas de final",
  "Round of 16":        "Décimo-sexto",
  "Quarter-final":      "Quartas de final",
  "Semi-final":         "Semifinal",
  "Final":              "Final",
  "Third-place play-off": "3º Lugar",
};

function GroupsView({ groups }) {
  return (
    <div className="groups-grid">
      {Object.entries(groups).map(([gid, gdata]) => (
        <div key={gid} className="group-card">
          <h3 className="group-card__title">Grupo {gid}</h3>
          <table className="group-table">
            <thead>
              <tr><th>#</th><th>Seleção</th><th>J</th><th>Pts</th><th>SG</th></tr>
            </thead>
            <tbody>
              {gdata.standings.map((s) => (
                <tr key={s.team} className={s.position <= 2 ? "group-table__row--qualify" : ""}>
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

function BracketConnectors({ data, treeRef }) {
  const [paths, setPaths] = useState([]);

  const computePaths = useCallback(() => {
    if (!data || !treeRef.current) return;
    const container = treeRef.current;
    const cr = container.getBoundingClientRect();
    const newPaths = [];

    const rounds = {
      round_of_32:    data.round_of_32,
      round_of_16:    data.round_of_16,
      quarter_finals: data.quarter_finals,
      semi_finals:    data.semi_finals,
      final_arr:      [data.final],
    };

    for (const [feederKey, receiverKey] of FEED_PAIRS) {
      const feeders   = rounds[feederKey];
      const receivers = rounds[receiverKey];
      if (!feeders || !receivers) continue;

      receivers.forEach((receiver, i) => {
        const fa = feeders[i * 2];
        const fb = feeders[i * 2 + 1];
        if (!fa || !fb) return;

        const elA = container.querySelector(`[data-match-id="${fa.id}"]`);
        const elB = container.querySelector(`[data-match-id="${fb.id}"]`);
        const elR = container.querySelector(`[data-match-id="${receiver.id}"]`);
        if (!elA || !elB || !elR) return;

        const rA = elA.getBoundingClientRect();
        const rB = elB.getBoundingClientRect();
        const rR = elR.getBoundingClientRect();

        const x1 = rA.right  - cr.left;
        const ya = rA.top + rA.height / 2 - cr.top;
        const yb = rB.top + rB.height / 2 - cr.top;
        const x2 = rR.left   - cr.left;
        const yr = rR.top + rR.height / 2 - cr.top;
        const mx = (x1 + x2) / 2;

        // Two curves from feeders converging at receiver midpoint
        newPaths.push(
          `M ${x1} ${ya} C ${mx} ${ya} ${mx} ${yr} ${x2} ${yr}`,
          `M ${x1} ${yb} C ${mx} ${yb} ${mx} ${yr} ${x2} ${yr}`,
        );
      });
    }
    setPaths(newPaths);
  }, [data, treeRef]);

  useLayoutEffect(() => {
    computePaths();
    window.addEventListener("resize", computePaths);
    return () => window.removeEventListener("resize", computePaths);
  }, [computePaths]);

  if (!paths.length) return null;

  return (
    <svg
      style={{
        position: "absolute", inset: 0,
        width: "100%", height: "100%",
        pointerEvents: "none", overflow: "visible",
      }}
    >
      {paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="#1d3a5f" strokeWidth={1.5} />
      ))}
    </svg>
  );
}

function BracketColumn({ label, matches, activeMatchId, onMatchClick }) {
  return (
    <div className="bk-col">
      <div className="bk-col__label">{label}</div>
      <div className="bk-col__matches">
        {matches.map((m) => (
          <MatchCard
            key={m.id}
            match={m}
            isActive={activeMatchId === m.id}
            onClick={onMatchClick}
          />
        ))}
      </div>
    </div>
  );
}

export default function BracketPage() {
  const { data, isLoading, error } = useBracket();
  const [activeMatch, setActiveMatch] = useState(null);
  const [view, setView] = useState("bracket");
  const treeRef = useRef(null);

  if (isLoading) {
    return (
      <div className="bracket-page">
        <div className="bracket-layout"><BracketSkeleton /></div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="error-box">
        <span className="error-icon">⚠</span>
        <p>Erro ao carregar o bracket: {error.message}</p>
      </div>
    );
  }

  const columns = [
    { label: ROUND_LABELS["Round of 32"],        matches: data.round_of_32 },
    { label: ROUND_LABELS["Round of 16"],         matches: data.round_of_16 },
    { label: ROUND_LABELS["Quarter-final"],       matches: data.quarter_finals },
    { label: ROUND_LABELS["Semi-final"],          matches: data.semi_finals },
    { label: ROUND_LABELS["Final"],               matches: [data.final] },
    { label: ROUND_LABELS["Third-place play-off"],matches: [data.third_place_match] },
  ];

  return (
    <div className="bracket-page">
      <header className="bracket-header">
        <div className="bracket-header__left">
          <h1 className="bracket-header__title">FIFA World Cup 2026 — Bracket Predictor</h1>
          <div className="bracket-header__champion">
            <span>Campeão previsto:</span>
            <TeamFlag team={data.predicted_champion} size={22} />
            <strong>{data.predicted_champion}</strong>
          </div>
        </div>
        <div className="bracket-header__tabs">
          <button className={`tab-btn ${view === "bracket" ? "tab-btn--active" : ""}`} onClick={() => setView("bracket")}>
            Chave
          </button>
          <button className={`tab-btn ${view === "groups" ? "tab-btn--active" : ""}`} onClick={() => setView("groups")}>
            Grupos
          </button>
        </div>
      </header>

      {view === "groups" ? (
        <GroupsView groups={data.groups} />
      ) : (
        <div className="bracket-layout">
          <div className="bk-tree-wrap">
            <div className="bk-tree" ref={treeRef}>
              <BracketConnectors data={data} treeRef={treeRef} />
              {columns.map((col) => (
                <BracketColumn
                  key={col.label}
                  label={col.label}
                  matches={col.matches}
                  activeMatchId={activeMatch?.id}
                  onMatchClick={setActiveMatch}
                />
              ))}
            </div>
          </div>

          {activeMatch && (
            <MatchPanel match={activeMatch} onClose={() => setActiveMatch(null)} />
          )}
        </div>
      )}
    </div>
  );
}
