"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { scoreTone, type ScoreTone } from "@/lib/utils/format";

const toneColor: Record<ScoreTone, string> = {
  good: "#10B981",
  warn: "#F59E0B",
  bad: "#EF4444"
};

/**
 * Circular score gauge (0–100). Renders a muted dashed ring with "—" when value is null,
 * so missing data still looks intentional and premium.
 */
export function ScoreRing({
  value,
  size = 132,
  stroke = 12,
  label,
  className
}: {
  value: number | null | undefined;
  size?: number;
  stroke?: number;
  label?: string;
  className?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const hasValue = value != null && Number.isFinite(value);
  const clamped = hasValue ? Math.max(0, Math.min(100, value as number)) : 0;
  const color = hasValue ? toneColor[scoreTone(value)] : "#94A3B8";
  const offset = circumference - (clamped / 100) * circumference;
  const gid = `ring-${Math.round(clamped)}-${color.replace("#", "")}`;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.65} />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth={stroke} />
        {hasValue ? (
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gid})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        ) : (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(148,163,184,0.4)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray="2 10"
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className={cn("font-extrabold leading-none text-cv-ink", size > 110 ? "text-3xl" : "text-2xl")}>
          {hasValue ? Math.round(clamped) : "—"}
        </span>
        {label ? <span className="mt-1 text-[11px] font-medium text-cv-slate">{label}</span> : null}
      </div>
    </div>
  );
}
