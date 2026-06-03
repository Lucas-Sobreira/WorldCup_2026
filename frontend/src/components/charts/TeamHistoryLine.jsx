import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceArea,
} from "recharts";
import { useTeamHistory } from "../../hooks";
import TeamFlag from "../shared/TeamFlag";
import LoadingSpinner from "../shared/LoadingSpinner";

const POPULAR_TEAMS = [
  "Brazil", "Germany", "France", "Argentina", "Spain",
  "England", "Italy", "Netherlands", "Uruguay", "Portugal",
];

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

function decadeStats(yearlyData, decade) {
  const slice = yearlyData.filter((y) => y.year >= decade && y.year < decade + 10);
  if (!slice.length) return null;
  const wins = slice.reduce((s, y) => s + y.wins, 0);
  const played = slice.reduce((s, y) => s + y.played, 0);
  const gf = slice.reduce((s, y) => s + y.gf, 0);
  const ga = slice.reduce((s, y) => s + y.ga, 0);
  return { editions: slice.length, wins, played, gf, ga };
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

function TeamStats({ data, yearlyData, selectedDecade }) {
  // When a decade is active, show decade-scoped stats instead of career totals
  const ds = selectedDecade ? decadeStats(yearlyData, selectedDecade) : null;

  const stats = ds
    ? [
        { label: "Editions", value: ds.editions },
        { label: "Matches", value: ds.played },
        { label: "Win rate", value: `${ds.played ? Math.round((ds.wins / ds.played) * 100) : 0}%` },
        { label: "Goals for", value: ds.gf },
        { label: "Goals ag.", value: ds.ga },
        { label: "GD", value: ds.gf - ds.ga >= 0 ? `+${ds.gf - ds.ga}` : ds.gf - ds.ga },
      ]
    : [
        { label: "Appearances", value: data.appearances },
        { label: "Matches", value: data.total_matches },
        { label: "Win rate", value: `${Math.round(data.win_rate * 100)}%` },
        { label: "Goals/game", value: data.goals_per_game },
        { label: "WC Titles", value: data.wc_titles },
        { label: "Finals", value: data.finals_reached },
      ];

  return (
    <div className="team-stats-row">
      {stats.map(({ label, value }) => (
        <div key={label} className={`team-stat ${ds ? "team-stat--decade" : ""}`}>
          <span className="team-stat__val">{value}</span>
          <span className="team-stat__lbl">{label}</span>
        </div>
      ))}
    </div>
  );
}

export default function TeamHistoryLine({ selectedDecade }) {
  const [selected, setSelected] = useState("Brazil");
  const [input, setInput] = useState("");
  const { data, isLoading, error } = useTeamHistory(selected);

  const handleSearch = (e) => {
    e.preventDefault();
    if (input.trim()) { setSelected(input.trim()); setInput(""); }
  };

  const allYearlyData = data ? buildYearlyData(data.history) : [];

  // Filter line data to selected decade; keep full range for ReferenceArea context
  const visibleData = selectedDecade
    ? allYearlyData.filter((y) => y.year >= selectedDecade && y.year < selectedDecade + 10)
    : allYearlyData;

  const hasDecadeData = selectedDecade
    ? visibleData.length > 0
    : true;

  return (
    <div className="chart-card">
      <div className="chart-card__header">
        <div className="chart-card__title-row">
          <h3 className="chart-card__title">Team World Cup History</h3>
          {selectedDecade !== null && (
            <span className="filter-badge filter-badge--passive">
              Filtered: {selectedDecade}s
            </span>
          )}
        </div>
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
              <p className="team-header__sub">
                {data.appearances} World Cups · {data.wc_titles} title{data.wc_titles !== 1 ? "s" : ""}
                {selectedDecade && ` · showing ${selectedDecade}s`}
              </p>
            </div>
          </div>

          <TeamStats data={data} yearlyData={allYearlyData} selectedDecade={selectedDecade} />

          {!hasDecadeData ? (
            <p className="chart-legend-note" style={{ padding: "24px 0", textAlign: "center" }}>
              {data.team} did not participate in the {selectedDecade}s
            </p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart
                  data={selectedDecade ? allYearlyData : allYearlyData}
                  margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis
                    dataKey="year"
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    axisLine={false} tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    axisLine={false} tickLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#334155" }} />
                  <ReferenceLine y={50} stroke="#334155" strokeDasharray="4 4" />

                  {/* Highlight the selected decade with a background band */}
                  {selectedDecade && (
                    <ReferenceArea
                      x1={selectedDecade}
                      x2={selectedDecade + 9}
                      fill="#f59e0b"
                      fillOpacity={0.08}
                      stroke="#f59e0b"
                      strokeOpacity={0.3}
                    />
                  )}

                  {/* Full history dimmed when a decade is selected */}
                  <Line
                    type="monotone" dataKey="winRate"
                    stroke={selectedDecade ? "#334155" : "#3b82f6"}
                    strokeWidth={selectedDecade ? 1.5 : 2}
                    strokeOpacity={selectedDecade ? 0.4 : 1}
                    dot={selectedDecade ? false : { r: 4, fill: "#3b82f6" }}
                  />

                  {/* Overlay: bold line for the selected decade only */}
                  {selectedDecade && visibleData.length > 0 && (
                    <Line
                      data={visibleData}
                      type="monotone" dataKey="winRate"
                      stroke="#f59e0b" strokeWidth={2.5}
                      dot={{ r: 5, fill: "#f59e0b", stroke: "#0f172a", strokeWidth: 2 }}
                      activeDot={{ r: 7 }}
                      isAnimationActive={false}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
              <p className="chart-legend-note">
                Win rate (%) per World Cup edition
                {selectedDecade && ` — highlighted: ${selectedDecade}s`}
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}
