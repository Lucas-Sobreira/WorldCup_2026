import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { useGoalsByDecade } from "../../hooks";
import LoadingSpinner from "../shared/LoadingSpinner";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__title">{label}s</p>
      <p>Total goals: <strong>{d.total_goals}</strong></p>
      <p>Matches: <strong>{d.matches}</strong></p>
      <p>Avg/match: <strong>{d.avg_per_match}</strong></p>
    </div>
  );
};

export default function GoalsByDecade() {
  const { data, isLoading, error } = useGoalsByDecade();

  if (isLoading) return <LoadingSpinner message="Loading goals data..." />;
  if (error) return <div className="chart-error">Failed to load data</div>;

  const rows = data.data.map((d) => ({ ...d, label: `${d.decade}s` }));
  const maxAvg = Math.max(...rows.map((r) => r.avg_per_match));

  return (
    <div className="chart-card">
      <div className="chart-card__header">
        <h3 className="chart-card__title">Goals per Match by Decade</h3>
        <p className="chart-card__sub">Average goals scored in 90 minutes across all World Cup editions</p>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            axisLine={false} tickLine={false}
            domain={[0, "auto"]}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#1e293b" }} />
          <Bar dataKey="avg_per_match" radius={[4, 4, 0, 0]}>
            {rows.map((r) => (
              <Cell
                key={r.decade}
                fill={r.avg_per_match === maxAvg ? "#3b82f6" : "#334155"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
