import MatchCard from "./MatchCard";

const ROUND_LABELS = {
  "Round of 32": "R32",
  "Round of 16": "R16",
  "Quarter-final": "QF",
  "Semi-final": "SF",
  "Final": "Final",
  "Third-place play-off": "3rd",
};

export default function BracketColumn({ roundName, matches, activeMatchId, onMatchClick }) {
  return (
    <div className="bracket-col">
      <h3 className="bracket-col__title">{ROUND_LABELS[roundName] ?? roundName}</h3>
      <div className="bracket-col__matches">
        {matches.map((m) => (
          <MatchCard
            key={m.id}
            match={m}
            isActive={activeMatchId === m.id}
            onClick={onMatchClick}
          />
        ))}
      </div>
    </div>
  );
}
