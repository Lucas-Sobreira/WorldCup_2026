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
      <p className="chart-tooltip__title">{label}</p>
      <p>Total goals: <strong>{d.total_goals}</strong></p>
      <p>Matches: <strong>{d.matches}</strong></p>
      <p>Avg/match: <strong>{d.avg_per_match}</strong></p>
    </div>
  );
};

export default function GoalsByDecade({ selectedDecade, onDecadeClick }) {
  const { data, isLoading, error } = useGoalsByDecade();

  if (isLoading) return <LoadingSpinner message="Loading goals data..." />;
  if (error) return <div className="chart-error">Failed to load data</div>;

  const rows = data.data.map((d) => ({ ...d, label: `${d.decade}s` }));
  const maxAvg = Math.max(...rows.map((r) => r.avg_per_match));

  const barColor = (r) => {
    if (selectedDecade === r.decade) return "#f59e0b";        // active filter → amber
    if (selectedDecade !== null) return "#1e293b";            // dimmed when another is selected
    return r.avg_per_match === maxAvg ? "#3b82f6" : "#334155"; // default: peak=blue, rest=slate
  };

  return (
    <div className="chart-card">
      <div className="chart-card__header">
        <div className="chart-card__title-row">
          <h3 className="chart-card__title">Goals per Match by Decade</h3>
          {selectedDecade !== null && (
            <button className="filter-badge" onClick={() => onDecadeClick(selectedDecade)}>
              {selectedDecade}s ✕
            </button>
          )}
        </div>
        <p className="chart-card__sub">
          Click a bar to filter the history chart by that decade — click again to clear
        </p>
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
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Bar
            dataKey="avg_per_match"
            radius={[4, 4, 0, 0]}
            onClick={(data) => onDecadeClick(data.decade)}
            style={{ cursor: "pointer" }}
          >
            {rows.map((r) => (
              <Cell key={r.decade} fill={barColor(r)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
