import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, Legend,
} from "recharts";
import { useConfederation } from "../../hooks";
import { ChartSkeleton } from "../shared/Skeleton";

const COLORS = {
  UEFA: "#3b82f6",
  CONMEBOL: "#22c55e",
  CONCACAF: "#f59e0b",
  CAF: "#ef4444",
  AFC: "#a855f7",
  OFC: "#06b6d4",
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__title">{d.confederation}</p>
      <p>Teams in ranking: <strong>{d.teams_in_ranking}</strong></p>
      <p>Avg rank: <strong>{d.avg_rank}</strong></p>
      <p>Avg points: <strong>{d.avg_points}</strong></p>
    </div>
  );
};

export default function ConfederationChart() {
  const { data, isLoading, error } = useConfederation();

  if (isLoading) return <ChartSkeleton height={320} />;
  if (error) return <div className="chart-error">Failed to load data</div>;

  // Normalize for radar: invert rank (lower rank = better), normalize 0-100
  const rows = data.data;
  const maxPoints = Math.max(...rows.map((r) => r.avg_points));
  const maxTeams = Math.max(...rows.map((r) => r.teams_in_ranking));
  const maxRank = Math.max(...rows.map((r) => r.avg_rank));

  const radarData = rows.map((r) => ({
    confederation: r.confederation,
    "Avg Points": Math.round((r.avg_points / maxPoints) * 100),
    "Teams": Math.round((r.teams_in_ranking / maxTeams) * 100),
    "Ranking Strength": Math.round(((maxRank - r.avg_rank) / maxRank) * 100),
    // raw values for tooltip
    teams_in_ranking: r.teams_in_ranking,
    avg_rank: r.avg_rank,
    avg_points: r.avg_points,
  }));

  return (
    <div className="chart-card">
      <div className="chart-card__header">
        <h3 className="chart-card__title">Confederation Strength</h3>
        <p className="chart-card__sub">Normalized metrics: Points, Teams in ranking, Ranking strength (all 0–100)</p>
      </div>
      <div className="conf-legend">
        {rows.map((r) => (
          <div key={r.confederation} className="conf-legend__item">
            <span className="conf-legend__dot" style={{ background: COLORS[r.confederation] ?? "#64748b" }} />
            <span className="conf-legend__name">{r.confederation}</span>
            <span className="conf-legend__pts">{r.avg_points} pts</span>
          </div>
        ))}
      </div>
      <div className="conf-radars">
        {radarData.map((row) => (
          <div key={row.confederation} className="conf-radar-item">
            <p className="conf-radar-item__label" style={{ color: COLORS[row.confederation] ?? "#64748b" }}>
              {row.confederation}
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={[
                { metric: "Points", value: row["Avg Points"] },
                { metric: "Teams", value: row["Teams"] },
                { metric: "Rank", value: row["Ranking Strength"] },
              ]}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  dataKey="value"
                  stroke={COLORS[row.confederation] ?? "#64748b"}
                  fill={COLORS[row.confederation] ?? "#64748b"}
                  fillOpacity={0.25}
                />
              </RadarChart>
            </ResponsiveContainer>
            <p className="conf-radar-item__stats">
              Rank avg: {row.avg_rank} · {row.teams_in_ranking} teams
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
