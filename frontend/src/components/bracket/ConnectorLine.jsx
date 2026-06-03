import { useEffect, useRef } from "react";

export default function ConnectorLine({ fromEl, toEl, containerEl }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!fromEl || !toEl || !containerEl || !svgRef.current) return;

    const containerRect = containerEl.getBoundingClientRect();
    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();

    const x1 = fromRect.right - containerRect.left;
    const y1 = fromRect.top + fromRect.height / 2 - containerRect.top;
    const x2 = toRect.left - containerRect.left;
    const y2 = toRect.top + toRect.height / 2 - containerRect.top;
    const mx = (x1 + x2) / 2;

    const path = `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
    svgRef.current.setAttribute("d", path);
  });

  return (
    <svg
      style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }}
      width="100%" height="100%"
    >
      <path ref={svgRef} fill="none" stroke="#334155" strokeWidth={1.5} />
    </svg>
  );
}
