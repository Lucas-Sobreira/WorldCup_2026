import { useMatch } from "../../hooks";
import { PanelSkeleton } from "../shared/Skeleton";
import TeamFlag from "../shared/TeamFlag";
import WinProbBar from "../bracket/WinProbBar";

function H2HTable({ matches, homeTeam, awayTeam }) {
  if (!matches.length) {
    return <p className="panel-empty">No previous meetings between these teams.</p>;
  }
  return (
    <table className="h2h-table">
      <thead>
        <tr>
          <th>Year</th><th>Round</th><th>Home</th><th>Score</th><th>Away</th>
        </tr>
      </thead>
      <tbody>
        {matches.map((m, i) => {
          const homeWin = m.home_score > m.away_score;
          const awayWin = m.away_score > m.home_score;
          return (
            <tr key={i} className={homeWin ? "h2h--home-win" : awayWin ? "h2h--away-win" : "h2h--draw"}>
              <td>{m.year}</td>
              <td>{m.round}</td>
              <td className="h2h__team">
                <TeamFlag team={m.home_team} size={13} />
                <span>{m.home_team}</span>
              </td>
              <td className="h2h__score">
                {m.home_score} – {m.away_score}
              </td>
              <td className="h2h__team">
                <TeamFlag team={m.away_team} size={13} />
                <span>{m.away_team}</span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function ModelConfidence({ confidence, homeProb, drawProb, awayProb, homeTeam, awayTeam }) {
  return (
    <div className="confidence-block">
      <div className="confidence-block__badge" data-level={confidence}>
        {confidence === "high" ? "High confidence" : "Low confidence (cold start)"}
      </div>
      <div className="confidence-block__probs">
        <div className="conf-prob">
          <TeamFlag team={homeTeam} size={16} />
          <span>{homeTeam}</span>
          <strong>{Math.round(homeProb * 100)}%</strong>
        </div>
        <div className="conf-prob conf-prob--draw">
          <span>Draw</span>
          <strong>{Math.round(drawProb * 100)}%</strong>
        </div>
        <div className="conf-prob">
          <TeamFlag team={awayTeam} size={16} />
          <span>{awayTeam}</span>
          <strong>{Math.round(awayProb * 100)}%</strong>
        </div>
      </div>
      <WinProbBar homeProb={homeProb} drawProb={drawProb} awayProb={awayProb} />
    </div>
  );
}

export default function MatchPanel({ match, onClose }) {
  const home = match?.home_team ?? match?.prediction?.home_team;
  const away = match?.away_team ?? match?.prediction?.away_team;

  const { data, isLoading } = useMatch(home, away);

  return (
    <aside className="match-panel" data-testid="prediction-modal">
      <div className="match-panel__header">
        <div className="match-panel__teams">
          <TeamFlag team={home} size={24} />
          <span className="match-panel__vs">{home} vs {away}</span>
          <TeamFlag team={away} size={24} />
        </div>
        <button className="match-panel__close" onClick={onClose} aria-label="Close panel">
          ✕
        </button>
      </div>

      <div className="match-panel__round">{match.round}</div>

      {isLoading ? (
        <PanelSkeleton />
      ) : data ? (
        <>
          <section className="panel-section">
            <h4 className="panel-section__title">Prediction</h4>
            <ModelConfidence
              confidence={data.prediction.confidence}
              homeProb={data.prediction.home_prob}
              drawProb={data.prediction.draw_prob}
              awayProb={data.prediction.away_prob}
              homeTeam={home}
              awayTeam={away}
            />
            {(data.home_xg != null || data.away_xg != null) && (
              <div className="xg-row">
                <span>xG (last match):</span>
                <strong>{data.home_xg?.toFixed(2) ?? "–"}</strong>
                <span>vs</span>
                <strong>{data.away_xg?.toFixed(2) ?? "–"}</strong>
              </div>
            )}
          </section>

          <section className="panel-section">
            <h4 className="panel-section__title">
              Head to Head
              <span className="panel-section__subtitle">
                {data.h2h_summary.home_wins}W–{data.h2h_summary.draws}D–{data.h2h_summary.away_wins}L
                <span className="panel-section__teams-hint"> ({home} / {away})</span>
              </span>
            </h4>
            <H2HTable matches={data.h2h_matches} homeTeam={home} awayTeam={away} />
          </section>
        </>
      ) : (
        <p className="panel-empty">No data available.</p>
      )}
    </aside>
  );
}
