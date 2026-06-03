export default function WinProbBar({ homeProb, drawProb, awayProb, compact = false }) {
  const hp = Math.round(homeProb * 100);
  const dp = Math.round(drawProb * 100);
  const ap = Math.round(awayProb * 100);

  return (
    <div className={`prob-bar ${compact ? "prob-bar--compact" : ""}`}>
      <div className="prob-bar__track">
        <div className="prob-bar__home" style={{ width: `${hp}%` }} title={`Home ${hp}%`} />
        <div className="prob-bar__draw" style={{ width: `${dp}%` }} title={`Draw ${dp}%`} />
        <div className="prob-bar__away" style={{ width: `${ap}%` }} title={`Away ${ap}%`} />
      </div>
      {!compact && (
        <div className="prob-bar__labels">
          <span className="prob-label--home">{hp}%</span>
          <span className="prob-label--draw">{dp}%</span>
          <span className="prob-label--away">{ap}%</span>
        </div>
      )}
    </div>
  );
}
