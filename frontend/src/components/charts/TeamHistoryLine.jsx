import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { useTeamHistory } from "../../hooks";
import TeamFlag from "../shared/TeamFlag";
import LoadingSpinner from "../shared/LoadingSpinner";

const POPULAR_TEAMS = [
  "Brazil", "Germany", "France", "Argentina", "Spain",
  "England", "Italy", "Netherlands", "Uruguay", "Portugal",
];

const RESULT_VALUE = { W: 3, D: 1, L: 0 };

function buildYearlyData(history) {
  const byYear = {};
  for (const m of history) {
    if (!byYear[m.year]) byYear[m.year] = { year: m.year, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, played: 0 };
    const y = byYear[m.year];
    y.played++;
    y.gf += m.goals_for;
    y.ga += m.goals_against;
    if (m.result === "W") y.wins++;
    else if (m.result === "D") y.draws++;
    else y.losses++;
  }
  return Object.values(byYear)
    .sort((a, b) => a.year - b.year)
    .map((y) => ({
      ...y,
      winRate: Math.round((y.wins / y.played) * 100),
      gd: y.gf - y.ga,
    }));
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__title">{label}</p>
      <p>Win rate: <strong>{d.winRate}%</strong></p>
      <p>Record: <strong>{d.wins}W–{d.draws}D–{d.losses}L</strong></p>
      <p>Goals: <strong>{d.gf} scored / {d.ga} conceded</strong></p>
    </div>
  );
};

function TeamStats({ data }) {
  return (
    <div className="team-stats-row">
      {[
        { label: "Appearances", value: data.appearances },
        { label: "Matches", value: data.total_matches },
        { label: "Win rate", value: `${Math.round(data.win_rate * 100)}%` },
        { label: "Goals/game", value: data.goals_per_game },
        { label: "WC Titles", value: data.wc_titles },
        { label: "Finals", value: data.finals_reached },
      ].map(({ label, value }) => (
        <div key={label} className="team-stat">
          <span className="team-stat__val">{value}</span>
          <span className="team-stat__lbl">{label}</span>
        </div>
      ))}
    </div>
  );
}

export default function TeamHistoryLine() {
  const [selected, setSelected] = useState("Brazil");
  const [input, setInput] = useState("");
  const { data, isLoading, error } = useTeamHistory(selected);

  const handleSearch = (e) => {
    e.preventDefault();
    if (input.trim()) { setSelected(input.trim()); setInput(""); }
  };

  const yearlyData = data ? buildYearlyData(data.history) : [];

  return (
    <div className="chart-card">
      <div className="chart-card__header">
        <h3 className="chart-card__title">Team World Cup History</h3>
        <form className="team-search" onSubmit={handleSearch}>
          <input
            className="team-search__input"
            placeholder="Search team..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button className="team-search__btn" type="submit">Go</button>
        </form>
      </div>

      <div className="team-quick-select">
        {POPULAR_TEAMS.map((t) => (
          <button
            key={t}
            className={`quick-btn ${selected === t ? "quick-btn--active" : ""}`}
            onClick={() => setSelected(t)}
          >
            <TeamFlag team={t} size={13} />
            {t}
          </button>
        ))}
      </div>

      {isLoading && <LoadingSpinner message={`Loading ${selected} history...`} />}
      {error && <div className="chart-error">Team not found: "{selected}"</div>}

      {data && (
        <>
          <div className="team-header">
            <TeamFlag team={selected} size={28} />
            <div>
              <h4 className="team-header__name">{data.team}</h4>
              <p className="team-header__sub">{data.appearances} World Cups · {data.wc_titles} title{data.wc_titles !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <TeamStats data={data} />
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={yearlyData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false} tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#334155" }} />
              <ReferenceLine y={50} stroke="#334155" strokeDasharray="4 4" />
              <Line
                type="monotone" dataKey="winRate"
                stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: "#3b82f6" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="chart-legend-note">Win rate (%) per World Cup edition</p>
        </>
      )}
    </div>
  );
}
