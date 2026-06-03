import { useState } from "react";
import GoalsByDecade from "./GoalsByDecade";
import ConfederationChart from "./ConfederationChart";
import TeamHistoryLine from "./TeamHistoryLine";
import BracketHeatmap from "./BracketHeatmap";

export default function StatsPage() {
  // null = all decades; number = e.g. 1990 means 1990–1999
  const [selectedDecade, setSelectedDecade] = useState(null);

  const handleDecadeClick = (decade) =>
    setSelectedDecade((prev) => (prev === decade ? null : decade));

  return (
    <div className="stats-page">
      <div className="stats-grid">
        <GoalsByDecade selectedDecade={selectedDecade} onDecadeClick={handleDecadeClick} />
        <TeamHistoryLine selectedDecade={selectedDecade} />
        <ConfederationChart />
        <BracketHeatmap />
      </div>
    </div>
  );
}
