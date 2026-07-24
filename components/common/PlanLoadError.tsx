"use client";

import { AlertTriangle, RotateCw } from "lucide-react";

/** Full-page "couldn't load your plan" state for a plan-gated route when
 * /billing/status fails after its retries. Deliberately DISTINCT from
 * UpgradeRequired: this is a transient INFRASTRUCTURE hiccup, not a tier lock,
 * so it offers a Retry action (re-runs the billing-status query) rather than an
 * upgrade CTA — and it never hangs on an infinite spinner. */
export function PlanLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-shell cv-glass-strong p-8 text-center shadow-glass">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-500/15 ring-1 ring-slate-400/30">
          <AlertTriangle size={24} className="text-slate-600" />
        </div>
        <h1 className="mt-5 text-xl font-extrabold tracking-tight text-cv-ink">Couldn&apos;t load your plan</h1>
        <p className="mt-2 text-sm text-cv-slate">
          We couldn&apos;t reach the billing service to check what your plan includes. This is usually temporary — retry
          in a moment. Your data and access are unaffected.
        </p>
        <div className="mt-6 flex flex-col items-center gap-2.5">
          <button
            type="button"
            onClick={onRetry}
            className="cv-ring-focus inline-flex items-center gap-2 rounded-2xl bg-cv-brand px-6 py-3 text-sm font-bold text-white shadow-button transition hover:-translate-y-0.5"
          >
            <RotateCw size={16} /> Retry
          </button>
        </div>
      </div>
    </div>
  );
}
