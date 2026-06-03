export function Skeleton({ width = "100%", height = 16, borderRadius = 4, className = "" }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius }}
    />
  );
}

export function MatchCardSkeleton() {
  return (
    <div className="match-card match-card--skeleton">
      <div className="match-card__team">
        <Skeleton width={16} height={12} borderRadius={2} />
        <Skeleton width="60%" height={12} />
        <Skeleton width={28} height={12} />
      </div>
      <Skeleton height={3} borderRadius={2} style={{ margin: "6px 0" }} />
      <div className="match-card__team">
        <Skeleton width={16} height={12} borderRadius={2} />
        <Skeleton width="50%" height={12} />
        <Skeleton width={28} height={12} />
      </div>
    </div>
  );
}

export function BracketSkeleton() {
  const colCounts = [16, 8, 4, 2, 1, 1];
  return (
    <div className="bracket-tree">
      {colCounts.map((count, i) => (
        <div key={i} className="bracket-col">
          <Skeleton width={40} height={11} borderRadius={3} className="bracket-col__title-skel" />
          <div className="bracket-col__matches">
            {Array.from({ length: count }).map((_, j) => (
              <MatchCardSkeleton key={j} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function PanelSkeleton() {
  return (
    <div className="panel-skeleton">
      <Skeleton height={14} width="70%" />
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        {[1, 2, 3].map((i) => <Skeleton key={i} height={52} borderRadius={6} />)}
      </div>
      <Skeleton height={6} borderRadius={3} style={{ marginTop: 12 }} />
      <div style={{ marginTop: 20 }}>
        <Skeleton height={11} width="40%" />
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} height={28} borderRadius={0} style={{ marginTop: 4 }} />
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton({ height = 280 }) {
  return (
    <div className="chart-card">
      <Skeleton height={14} width="50%" style={{ marginBottom: 6 }} />
      <Skeleton height={10} width="80%" style={{ marginBottom: 20 }} />
      <Skeleton height={height} borderRadius={6} />
    </div>
  );
}
