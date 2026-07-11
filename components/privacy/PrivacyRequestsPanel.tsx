"use client";

import { Inbox, CheckCircle2 } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import type { PrivacyData } from "@/lib/hooks/usePrivacy";

/**
 * DSAR + grievance tracker from GET /api/v1/privacy/dsr.
 * DPDP grievances (request_subtype = "grievance") carry their own 90-day SLA.
 */
export function PrivacyRequestsPanel({ data }: { data: PrivacyData }) {
  const { dsr } = data;
  const list = dsr.data ?? [];

  return (
    <SectionCard
      title="DSAR & Grievance Tracker"
      subtitle="Data principal requests with SLA countdown"
      icon={Inbox}
      accent="blue"
      className="h-full"
      action={
        dsr.isSuccess ? (
          <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">
            {list.length} requests
          </span>
        ) : null
      }
    >
      {dsr.isLoading ? (
        <SkeletonRows rows={5} />
      ) : dsr.isError ? (
        <ErrorState title="Unable to load requests" onRetry={() => dsr.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No requests received"
          description="DSARs and DPDP grievances will appear here with deadlines and verification status."
        />
      ) : (
        <ul className="space-y-2.5">
          {list.map((r) => (
            <li key={r.id} className="rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold leading-snug text-cv-ink">
                    {r.request_ref ? <span className="mr-1.5 text-cv-blue">{r.request_ref}</span> : null}
                    {r.request_type.replaceAll("_", " ")}
                    {r.subject_email ? ` — ${r.subject_email}` : ""}
                  </p>
                  <p className="mt-0.5 text-[11px] text-cv-slate">
                    {[
                      r.regulatory_framework,
                      r.identity_verified ? "identity verified" : "identity unverified",
                      r.submitted_by_nominee_id ? "submitted by nominee" : null,
                      r.days_to_deadline != null ? `${r.days_to_deadline}d to deadline` : null
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  {r.request_subtype === "grievance" ? <StatusBadge label="Grievance" tone="warn" /> : null}
                  {r.is_overdue ? <StatusBadge label="Overdue" tone="bad" /> : null}
                  <StatusBadge
                    label={r.status.replaceAll("_", " ")}
                    tone={r.status === "fulfilled" || r.status === "closed" ? "good" : "info"}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
