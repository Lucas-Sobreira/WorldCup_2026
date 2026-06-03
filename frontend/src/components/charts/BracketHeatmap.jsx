import { useBracket } from "../../hooks";
import { ChartSkeleton } from "../shared/Skeleton";
import TeamFlag from "../shared/TeamFlag";

const ROUNDS = ["R32", "R16", "QF", "SF", "Final"];
const ROUND_KEYS = ["round_of_32", "round_of_16", "quarter_finals", "semi_finals", "final_arr"];

function probColor(p) {
  if (p === null) return "transparent";
  const alpha = 0.15 + p * 0.75;
  if (p >= 0.6) return `rgba(34,197,94,${alpha})`;
  if (p >= 0.4) return `rgba(59,130,246,${alpha})`;
  return `rgba(239,68,68,${alpha})`;
}

function buildHeatmap(bracket) {
  const teams = new Set();
  const allRounds = {
    round_of_32: bracket.round_of_32,
    round_of_16: bracket.round_of_16,
    quarter_finals: bracket.quarter_finals,
    semi_finals: bracket.semi_finals,
    final_arr: [bracket.final],
  };

  // Collect all teams that reached at least R32
  for (const m of bracket.round_of_32) {
    teams.add(m.home_team);
    teams.add(m.away_team);
  }

  // For each team and round, find their win probability in that match
  const map = {}; // team -> { roundKey -> prob | null }
  for (const t of teams) map[t] = {};

  for (const [roundKey, matches] of Object.entries(allRounds)) {
    for (const m of matches) {
      const { home_team, away_team, home_prob, away_prob, predicted_winner } = m.prediction;
      if (teams.has(home_team)) map[home_team][roundKey] = home_prob;
      if (teams.has(away_team)) map[away_team][roundKey] = away_prob;
    }
  }

  // Sort teams: predicted_winner first, then by sum of probs
  const sorted = [...teams].sort((a, b) => {
    const sumA = Object.values(map[a]).reduce((s, v) => s + (v ?? 0), 0);
    const sumB = Object.values(map[b]).reduce((s, v) => s + (v ?? 0), 0);
    return sumB - sumA;
  });

  return { sorted, map };
}

export default function BracketHeatmap() {
  const { data, isLoading, error } = useBracket();

  if (isLoading) return <ChartSkeleton height={400} />;
  if (error) return <div className="chart-error">Failed to load bracket</div>;

  const { sorted, map } = buildHeatmap(data);

  return (
    <div className="chart-card chart-card--wide">
      <div className="chart-card__header">
        <h3 className="chart-card__title">Win Probability Heatmap</h3>
        <p className="chart-card__sub">
          Each cell = team's predicted win probability in that round match.
          <span className="heatmap-legend">
            <span style={{ background: "rgba(34,197,94,0.7)" }} /> High
            <span style={{ background: "rgba(59,130,246,0.7)" }} /> Mid
            <span style={{ background: "rgba(239,68,68,0.7)" }} /> Low
          </span>
        </p>
      </div>
      <div className="heatmap-wrap">
        <table className="heatmap-table">
          <thead>
            <tr>
              <th className="heatmap-th heatmap-th--team">Team</th>
              {ROUNDS.map((r) => <th key={r} className="heatmap-th">{r}</th>)}
            </tr>
          </thead>
          <tbody>
            {sorted.map((team) => (
              <tr key={team}>
                <td className="heatmap-td heatmap-td--team">
                  <TeamFlag team={team} size={13} />
                  <span>{team}</span>
                </td>
                {ROUND_KEYS.map((rk) => {
                  const p = map[team][rk] ?? null;
                  return (
                    <td
                      key={rk}
                      className="heatmap-td"
                      style={{ background: probColor(p) }}
                      title={p !== null ? `${Math.round(p * 100)}%` : "Did not reach"}
                    >
                      {p !== null ? `${Math.round(p * 100)}%` : "–"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
