import { cn } from "@/lib/utils/cn";

/**
 * Lightweight SVG sparkline. Renders ONLY when given real numeric data.
 * When no data is available it draws a calm muted baseline (never fake values).
 */
export function Sparkline({
  data,
  color = "#3B82F6",
  width = 96,
  height = 34,
  className
}: {
  data?: number[] | null;
  color?: string;
  width?: number;
  height?: number;
  className?: string;
}) {
  const points = (data ?? []).filter((n) => typeof n === "number" && Number.isFinite(n));
  const id = `spark-${color.replace("#", "")}-${points.length}`;

  if (points.length < 2) {
    return (
      <svg width={width} height={height} className={cn("overflow-visible", className)} aria-hidden>
        <line
          x1={0}
          y1={height - 4}
          x2={width}
          y2={height - 4}
          stroke="rgba(148,163,184,0.4)"
          strokeWidth={2}
          strokeDasharray="3 4"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const stepX = width / (points.length - 1);
  const coords = points.map((v, i) => {
    const x = i * stepX;
    const y = height - 3 - ((v - min) / range) * (height - 6);
    return [x, y] as const;
  });

  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;

  return (
    <svg width={width} height={height} className={cn("overflow-visible", className)} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={coords[coords.length - 1][0]} cy={coords[coords.length - 1][1]} r={2.6} fill={color} />
    </svg>
  );
}
