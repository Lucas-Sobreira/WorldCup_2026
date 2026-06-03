import GoalsByDecade from "./GoalsByDecade";
import ConfederationChart from "./ConfederationChart";
import TeamHistoryLine from "./TeamHistoryLine";
import BracketHeatmap from "./BracketHeatmap";

export default function StatsPage() {
  return (
    <div className="stats-page">
      <div className="stats-grid">
        <GoalsByDecade />
        <TeamHistoryLine />
        <ConfederationChart />
        <BracketHeatmap />
      </div>
    </div>
  );
}
