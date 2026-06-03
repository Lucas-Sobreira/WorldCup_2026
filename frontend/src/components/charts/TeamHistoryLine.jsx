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

function rangeStats(yearlyData, fromYear, toYear) {
  const slice = yearlyData.filter((y) => y.year >= fromYear && y.year <= toYear);
  if (!slice.length) return null;
  const wins   = slice.reduce((s, y) => s + y.wins, 0);
  const played = slice.reduce((s, y) => s + y.played, 0);
  const gf     = slice.reduce((s, y) => s + y.gf, 0);
  const ga     = slice.reduce((s, y) => s + y.ga, 0);
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

function TeamStats({ data, yearlyData, fromYear, toYear }) {
  const rs = (fromYear !== null) ? rangeStats(yearlyData, fromYear, toYear) : null;

  const stats = rs
    ? [
        { label: "Editions",  value: rs.editions },
        { label: "Matches",   value: rs.played },
        { label: "Win rate",  value: `${rs.played ? Math.round((rs.wins / rs.played) * 100) : 0}%` },
        { label: "Goals for", value: rs.gf },
        { label: "Goals ag.", value: rs.ga },
        { label: "GD",        value: rs.gf - rs.ga >= 0 ? `+${rs.gf - rs.ga}` : rs.gf - rs.ga },
      ]
    : [
        { label: "Appearances", value: data.appearances },
        { label: "Matches",     value: data.total_matches },
        { label: "Win rate",    value: `${Math.round(data.win_rate * 100)}%` },
        { label: "Goals/game",  value: data.goals_per_game },
        { label: "WC Titles",   value: data.wc_titles },
        { label: "Finals",      value: data.finals_reached },
      ];

  return (
    <div className="team-stats-row">
      {stats.map(({ label, value }) => (
        <div key={label} className={`team-stat ${rs ? "team-stat--decade" : ""}`}>
          <span className="team-stat__val">{value}</span>
          <span className="team-stat__lbl">{label}</span>
        </div>
      ))}
    </div>
  );
}

export default function TeamHistoryLine({ selectedDecades }) {
  const [selected, setSelected] = useState("Brazil");
  const [input, setInput]       = useState("");
  const { data, isLoading, error } = useTeamHistory(selected);

  const handleSearch = (e) => {
    e.preventDefault();
    if (input.trim()) { setSelected(input.trim()); setInput(""); }
  };

  const allYearlyData = data ? buildYearlyData(data.history) : [];

  // Derive the zoom range from selected decades
  const hasRange   = selectedDecades.length > 0;
  const fromDecade = hasRange ? selectedDecades[0] : null;
  const toDecade   = hasRange ? selectedDecades[selectedDecades.length - 1] : null;
  const fromYear   = fromDecade;
  const toYear     = toDecade !== null ? toDecade + 9 : null;

  // Zoomed dataset — filtered to the range
  const zoomedData = hasRange
    ? allYearlyData.filter((y) => y.year >= fromYear && y.year <= toYear)
    : allYearlyData;

  // XAxis domain — pad slightly for readability
  const xDomain = hasRange
    ? [fromYear - 1, toYear + 1]
    : ["auto", "auto"];

  const noDataInRange = hasRange && zoomedData.length === 0;

  const rangeLabel = selectedDecades.length === 2
    ? `${fromDecade}s – ${toDecade}s`
    : selectedDecades.length === 1
    ? `${fromDecade}s`
    : null;

  return (
    <div className="chart-card">
      <div className="chart-card__header">
        <div className="chart-card__title-row">
          <h3 className="chart-card__title">Team World Cup History</h3>
          {rangeLabel && (
            <span className="filter-badge filter-badge--passive">{rangeLabel}</span>
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
      {error   && <div className="chart-error">Team not found: "{selected}"</div>}

      {data && (
        <>
          <div className="team-header">
            <TeamFlag team={selected} size={28} />
            <div>
              <h4 className="team-header__name">{data.team}</h4>
              <p className="team-header__sub">
                {data.appearances} World Cups · {data.wc_titles} title{data.wc_titles !== 1 ? "s" : ""}
                {rangeLabel && ` · ${rangeLabel}`}
              </p>
            </div>
          </div>

          <TeamStats
            data={data}
            yearlyData={allYearlyData}
            fromYear={fromYear}
            toYear={toYear}
          />

          {noDataInRange ? (
            <p className="chart-legend-note" style={{ padding: "24px 0", textAlign: "center" }}>
              {data.team} did not participate in this range
            </p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart
                  data={zoomedData}
                  margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis
                    dataKey="year"
                    type="number"
                    domain={xDomain}
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    axisLine={false} tickLine={false}
                    tickCount={zoomedData.length || 5}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    axisLine={false} tickLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#334155" }} />
                  <ReferenceLine y={50} stroke="#334155" strokeDasharray="4 4" />

                  {/* Highlight band covering the selected range */}
                  {hasRange && (
                    <ReferenceArea
                      x1={fromYear}
                      x2={toYear}
                      fill="#f59e0b"
                      fillOpacity={0.07}
                      stroke="#f59e0b"
                      strokeOpacity={0.25}
                    />
                  )}

                  <Line
                    type="monotone"
                    dataKey="winRate"
                    stroke={hasRange ? "#f59e0b" : "#3b82f6"}
                    strokeWidth={2}
                    dot={{ r: 4, fill: hasRange ? "#f59e0b" : "#3b82f6", stroke: "#0f172a", strokeWidth: 1.5 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <p className="chart-legend-note">
                Win rate (%) per World Cup edition
                {rangeLabel && ` — zoomed: ${rangeLabel}`}
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}
