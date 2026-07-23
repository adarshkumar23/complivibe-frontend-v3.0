"use client";

import Link from "next/link";
import { ArrowUpRight, Lock } from "lucide-react";

const FEATURE_LABELS: Record<string, string> = {
  ai_governance_module: "AI Governance",
  advanced_analytics: "Intelligence & Analytics",
  data_governance: "Data Observability",
  integrations_module: "Integrations & Connectors",
  governance_autopilot: "Governance Autopilot",
  audit_assurance: "Audit & Assurance",
  identity_governance: "Identity Governance",
  questionnaire_management: "Questionnaires & Trust Center",
  privacy_advanced: "Legal & Whistleblower",
};

/** Clean full-page "requires an upgrade" state for a plan-locked route --
 * shown instead of letting a Free user hit a raw 403. */
export function UpgradeRequired({ feature }: { feature?: string | null }) {
  const label = feature ? FEATURE_LABELS[feature] ?? "this feature" : "this feature";
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-shell cv-glass-strong p-8 text-center shadow-glass">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 ring-1 ring-amber-400/30">
          <Lock size={24} className="text-amber-600" />
        </div>
        <h1 className="mt-5 text-xl font-extrabold tracking-tight text-cv-ink">{label} is a premium feature</h1>
        <p className="mt-2 text-sm text-cv-slate">
          Your current plan doesn&apos;t include {label}. Upgrade or redeem a trial code to unlock full access — your
          existing data stays exactly where it is.
        </p>
        <div className="mt-6 flex flex-col items-center gap-2.5">
          <Link
            href="/dashboard/billing"
            className="cv-ring-focus inline-flex items-center gap-2 rounded-2xl bg-cv-brand px-6 py-3 text-sm font-bold text-white shadow-button transition hover:-translate-y-0.5"
          >
            View plans &amp; upgrade <ArrowUpRight size={16} />
          </Link>
          <Link href="/dashboard" className="text-[13px] font-semibold text-cv-slate hover:text-cv-ink">
            Back to Command Center
          </Link>
        </div>
      </div>
    </div>
  );
}
