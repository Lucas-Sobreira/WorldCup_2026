import { useState } from "react";
import GoalsByDecade from "./GoalsByDecade";
import ConfederationChart from "./ConfederationChart";
import TeamHistoryLine from "./TeamHistoryLine";
import BracketHeatmap from "./BracketHeatmap";

export default function StatsPage() {
  // Up to 2 selected decades; the range between them drives the zoom
  const [selectedDecades, setSelectedDecades] = useState([]);

  const handleDecadeClick = (decade) => {
    setSelectedDecades((prev) => {
      if (prev.includes(decade)) {
        // deselect
        return prev.filter((d) => d !== decade);
      }
      if (prev.length < 2) {
        // add second anchor
        return [...prev, decade].sort((a, b) => a - b);
      }
      // already 2 selected — reset to just the new one
      return [decade];
    });
  };

  return (
    <div className="stats-page">
      <div className="stats-grid">
        <GoalsByDecade selectedDecades={selectedDecades} onDecadeClick={handleDecadeClick} />
        <TeamHistoryLine selectedDecades={selectedDecades} />
        <ConfederationChart />
        <BracketHeatmap />
      </div>
    </div>
  );
}
