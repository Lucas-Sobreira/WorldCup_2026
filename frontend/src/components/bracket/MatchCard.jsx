import TeamFlag from "../shared/TeamFlag";
import WinProbBar from "./WinProbBar";

export default function MatchCard({ match, onClick, isActive }) {
  if (!match) return <div className="match-card match-card--empty" />;

  const { home_team, away_team, home_prob, draw_prob, away_prob, predicted_winner, confidence } =
    match.prediction;

  const winnerHome = predicted_winner === "home";
  const winnerAway = predicted_winner === "away";

  return (
    <div
      className={`match-card ${isActive ? "match-card--active" : ""} ${
        confidence === "low" ? "match-card--low-conf" : ""
      }`}
      onClick={() => onClick?.(match)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.(match)}
    >
      <div className={`match-card__team ${winnerHome ? "match-card__team--winner" : ""}`}>
        <TeamFlag team={home_team} size={16} />
        <span className="match-card__name">{home_team}</span>
        <span className="match-card__prob">{Math.round(home_prob * 100)}%</span>
      </div>
      <WinProbBar homeProb={home_prob} drawProb={draw_prob} awayProb={away_prob} compact />
      <div className={`match-card__team ${winnerAway ? "match-card__team--winner" : ""}`}>
        <TeamFlag team={away_team} size={16} />
        <span className="match-card__name">{away_team}</span>
        <span className="match-card__prob">{Math.round(away_prob * 100)}%</span>
      </div>
      {confidence === "low" && <span className="match-card__badge">cold start</span>}
    </div>
  );
}
