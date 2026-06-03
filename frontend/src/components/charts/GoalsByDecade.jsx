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

export default function GoalsByDecade({ selectedDecades, onDecadeClick }) {
  const { data, isLoading, error } = useGoalsByDecade();

  if (isLoading) return <LoadingSpinner message="Loading goals data..." />;
  if (error) return <div className="chart-error">Failed to load data</div>;

  const rows = data.data.map((d) => ({ ...d, label: `${d.decade}s` }));
  const maxAvg = Math.max(...rows.map((r) => r.avg_per_match));
  const hasSelection = selectedDecades.length > 0;

  // Range fills: bars between two selected anchors get a lighter amber tint
  const [lo, hi] = selectedDecades.length === 2
    ? [selectedDecades[0], selectedDecades[1]]
    : [null, null];

  const barColor = (r) => {
    if (selectedDecades.includes(r.decade)) return "#f59e0b";       // anchor → amber
    if (lo !== null && r.decade > lo && r.decade < hi) return "#92400e"; // in range → dark amber
    if (hasSelection) return "#1e293b";                               // out of range → dimmed
    return r.avg_per_match === maxAvg ? "#3b82f6" : "#334155";        // default
  };

  const rangeLabel = selectedDecades.length === 2
    ? `${selectedDecades[0]}s – ${selectedDecades[1]}s`
    : selectedDecades.length === 1
    ? `${selectedDecades[0]}s`
    : null;

  return (
    <div className="chart-card">
      <div className="chart-card__header">
        <div className="chart-card__title-row">
          <h3 className="chart-card__title">Goals per Match by Decade</h3>
          {rangeLabel && (
            <button className="filter-badge" onClick={() => selectedDecades.forEach(onDecadeClick)}>
              {rangeLabel} ✕
            </button>
          )}
        </div>
        <p className="chart-card__sub">
          {hasSelection
            ? selectedDecades.length === 1
              ? "Click a second bar to set a range — or the same bar to clear"
              : "Click any bar to reset the range"
            : "Click a bar to anchor a range — click a second bar to zoom"}
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
            onClick={(d) => onDecadeClick(d.decade)}
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
