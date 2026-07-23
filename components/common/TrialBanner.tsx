"use client";

import Link from "next/link";
import { ArrowUpRight, Clock, ShieldCheck, TriangleAlert } from "lucide-react";
import { usePlan } from "@/lib/hooks/usePlan";

/**
 * Persistent, slim trial-lifecycle banner. Three states off /billing/status:
 *  - Active trial: "N days left" with tone escalating toward expiry, mirroring
 *    the backend T-3 / T-1 email warnings so UI + email tell one story.
 *  - Lapsed (Free, previously trialed): "trial ended -- your data is safe,
 *    upgrade" -- the conversion moment; reassures the data is still there.
 *  - Otherwise (never-trialed Free, or paid): nothing.
 */
export function TrialBanner() {
  const { isTrial, trialDaysRemaining, lapsedFromTrial } = usePlan();

  if (isTrial) {
    const days = trialDaysRemaining ?? 0;
    const urgency = days <= 1 ? "urgent" : days <= 3 ? "soon" : "calm";
    const styles = {
      calm: { wrap: "bg-cv-blue/10 ring-cv-blue/20 text-cv-ink", icon: "text-cv-blue", Icon: Clock },
      soon: { wrap: "bg-amber-500/12 ring-amber-400/30 text-amber-900", icon: "text-amber-600", Icon: TriangleAlert },
      urgent: { wrap: "bg-rose-500/12 ring-rose-400/30 text-rose-900", icon: "text-rose-600", Icon: TriangleAlert },
    }[urgency];
    const Icon = styles.Icon;
    const label =
      days <= 0
        ? "Your trial ends today"
        : `${days} day${days === 1 ? "" : "s"} left in your trial`;
    return (
      <div
        data-testid="trial-banner"
        data-urgency={urgency}
        className={`mb-4 flex items-center justify-between gap-3 rounded-2xl px-4 py-2.5 text-[13px] font-semibold ring-1 ${styles.wrap}`}
      >
        <span className="flex items-center gap-2">
          <Icon size={16} className={styles.icon} />
          {label}
          {urgency !== "calm" ? <span className="font-normal opacity-80">— upgrade now to keep full access.</span> : null}
        </span>
        <Link href="/dashboard/billing" className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/70 px-3 py-1 font-bold ring-1 ring-white/70 hover:bg-white">
          Upgrade <ArrowUpRight size={13} />
        </Link>
      </div>
    );
  }

  if (lapsedFromTrial) {
    return (
      <div
        data-testid="trial-lapsed-banner"
        className="mb-4 flex flex-col gap-2 rounded-2xl bg-amber-500/12 px-4 py-3 ring-1 ring-amber-400/30 sm:flex-row sm:items-center sm:justify-between"
      >
        <span className="flex items-start gap-2 text-[13px] text-amber-900">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-amber-600" />
          <span>
            <span className="font-bold">Your trial has ended.</span> Your data is safe and still here — you&apos;re on
            the Free plan. Upgrade any time to unlock premium features again.
          </span>
        </span>
        <Link
          href="/dashboard/billing"
          className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full bg-cv-brand px-4 py-1.5 text-[13px] font-bold text-white shadow-tile hover:opacity-90 sm:self-auto"
        >
          View plans &amp; upgrade <ArrowUpRight size={14} />
        </Link>
      </div>
    );
  }

  return null;
}
