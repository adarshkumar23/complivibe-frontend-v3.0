"use client";

import type { BillingStatus } from "@/lib/api/billing";

const RESOURCES: { key: "policies" | "controls" | "evidence" | "risks"; label: string }[] = [
  { key: "policies", label: "Policies" },
  { key: "controls", label: "Controls" },
  { key: "evidence", label: "Evidence" },
  { key: "risks", label: "Risks" },
];

/**
 * "X of 5 used" for the capped core resources on the Free plan. Reads
 * record_usage (current counts) + features.record_caps (the limit) from
 * /billing/status -- the same numbers the backend enforces.
 */
export function FreePlanUsage({ status }: { status: BillingStatus | undefined }) {
  if (!status || status.plan !== "free") return null;
  const caps = (status.features?.record_caps ?? {}) as Record<string, number | undefined>;
  const usage = status.record_usage ?? {};

  return (
    <div className="rounded-shell cv-glass p-5" data-testid="free-plan-usage">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-cv-ink">Free plan usage</h3>
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-cv-mist">Upgrade to lift limits</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {RESOURCES.map(({ key, label }) => {
          const cap = caps[key];
          const used = usage[key] ?? 0;
          const atCap = typeof cap === "number" && used >= cap;
          const pct = typeof cap === "number" && cap > 0 ? Math.min(100, Math.round((used / cap) * 100)) : 0;
          return (
            <div key={key} className="rounded-xl bg-white/50 px-3.5 py-3 ring-1 ring-white/60" data-testid={`usage-${key}`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-cv-slate">{label}</p>
              <p className={`mt-1 text-lg font-extrabold ${atCap ? "text-amber-600" : "text-cv-ink"}`}>
                {used} <span className="text-xs font-semibold text-cv-mist">of {cap ?? "∞"}</span>
              </p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/70">
                <div className={`h-full rounded-full ${atCap ? "bg-amber-500" : "bg-cv-blue"}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
