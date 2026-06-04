import TeamFlag from "../shared/TeamFlag";

const MATCH_DATES = {
  R32_01: "29 jun", R32_02: "29 jun", R32_03: "29 jun", R32_04: "29 jun",
  R32_05: "30 jun", R32_06: "30 jun", R32_07: "30 jun", R32_08: "30 jun",
  R32_09: "01 jul", R32_10: "01 jul", R32_11: "01 jul", R32_12: "01 jul",
  R32_13: "02 jul", R32_14: "02 jul", R32_15: "03 jul", R32_16: "03 jul",
  R16_01: "05 jul", R16_02: "05 jul",
  R16_03: "06 jul", R16_04: "06 jul",
  R16_05: "07 jul", R16_06: "07 jul",
  R16_07: "08 jul", R16_08: "08 jul",
  QF_01: "11 jul", QF_02: "12 jul",
  QF_03: "13 jul", QF_04: "14 jul",
  SF_01: "17 jul", SF_02: "18 jul",
  "3P": "21 jul",
  F:    "22 jul",
};

export default function MatchCard({ match, onClick, isActive }) {
  if (!match) return <div className="mc mc--empty" />;

  const { home_team, away_team, home_prob, draw_prob, away_prob, predicted_winner, confidence } =
    match.prediction;

  const homeWins = predicted_winner === "home";
  const awayWins = predicted_winner === "away";
  const date = MATCH_DATES[match.id];

  return (
    <div
      className={`mc ${isActive ? "mc--active" : ""} ${confidence === "low" ? "mc--cold" : ""}`}
      onClick={() => onClick?.(match)}
      role="button"
      tabIndex={0}
      data-testid="match"
      data-match-id={match.id}
      onKeyDown={(e) => e.key === "Enter" && onClick?.(match)}
    >
      {date && <div className="mc__date">{date}</div>}

      <div className={`mc__team ${homeWins ? "mc__team--winner" : ""}`}>
        {homeWins && <span className="mc__accent" />}
        <TeamFlag team={home_team} size={18} />
        <span className="mc__name">{home_team}</span>
        <span className="mc__pct">{Math.round(home_prob * 100)}%</span>
      </div>

      <div className="mc__divider">
        <div className="mc__prob-bar">
          <div className="mc__prob-home" style={{ width: `${Math.round(home_prob * 100)}%` }} />
          <div className="mc__prob-draw" style={{ width: `${Math.round(draw_prob * 100)}%` }} />
          <div className="mc__prob-away" style={{ width: `${Math.round(away_prob * 100)}%` }} />
        </div>
      </div>

      <div className={`mc__team ${awayWins ? "mc__team--winner" : ""}`}>
        {awayWins && <span className="mc__accent" />}
        <TeamFlag team={away_team} size={18} />
        <span className="mc__name">{away_team}</span>
        <span className="mc__pct">{Math.round(away_prob * 100)}%</span>
      </div>

      {confidence === "low" && <span className="mc__cold-badge">cold start</span>}
    </div>
  );
}
