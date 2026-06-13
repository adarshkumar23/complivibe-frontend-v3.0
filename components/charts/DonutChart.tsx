"use client";

import { cn } from "@/lib/utils/cn";

export type DonutSegment = {
  label: string;
  value: number;
  color: string;
};

/**
 * SVG donut for real categorical breakdowns only (e.g. severity counts).
 * Parent is responsible for showing an EmptyState when there are no segments.
 */
export function DonutChart({
  segments,
  size = 150,
  stroke = 18,
  centerLabel,
  centerSub,
  className
}: {
  segments: DonutSegment[];
  size?: number;
  stroke?: number;
  centerLabel?: string;
  centerSub?: string;
  className?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, s) => sum + Math.max(0, s.value), 0);

  let offsetAcc = 0;

  return (
    <div className={cn("flex items-center gap-5", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(148,163,184,0.16)" strokeWidth={stroke} />
          {total > 0 &&
            segments.map((s, i) => {
              const fraction = Math.max(0, s.value) / total;
              const dash = fraction * circumference;
              const seg = (
                <circle
                  key={i}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offsetAcc}
                />
              );
              offsetAcc += dash;
              return seg;
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-extrabold leading-none text-cv-ink">{centerLabel ?? total}</span>
          {centerSub ? <span className="mt-0.5 text-[11px] font-medium text-cv-slate">{centerSub}</span> : null}
        </div>
      </div>
      <ul className="flex-1 space-y-2">
        {segments.map((s, i) => (
          <li key={i} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-cv-slate">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
              {s.label}
            </span>
            <span className="font-bold text-cv-ink">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
