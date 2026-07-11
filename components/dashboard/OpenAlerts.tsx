"use client";

import { Bell, CheckCircle2 } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { CommandCenterData } from "@/lib/hooks/useCommandCenter";

/** Issue-severity breakdown from GET /api/v1/compliance/issues/dashboard. */
export function OpenAlerts({ data }: { data: CommandCenterData }) {
  const { issues } = data;
  const iss = issues.data;
  const entries = iss ? Object.entries(iss.by_severity).sort((a, b) => b[1] - a[1]) : [];

  return (
    <SectionCard title="Issue Posture" subtitle="Open issues by severity" icon={Bell} accent="red" className="h-full">
      {issues.isLoading ? (
        <SkeletonRows rows={4} />
      ) : issues.isError ? (
        <ErrorState compact title="Unable to load issues" onRetry={() => issues.refetch()} />
      ) : !iss || iss.total === 0 ? (
        <EmptyState compact icon={CheckCircle2} title="No issues raised" description="Compliance issues will summarize here." />
      ) : (
        <div className="space-y-2.5">
          {entries.map(([sev, count]) => (
            <div key={sev} className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
              <span className="text-[13px] font-semibold capitalize text-cv-ink">{sev}</span>
              <StatusBadge
                label={String(count)}
                tone={sev === "critical" && count > 0 ? "bad" : sev === "high" && count > 0 ? "warn" : "neutral"}
              />
            </div>
          ))}
          {iss.overdue_count > 0 ? (
            <p className="pt-1 text-[11px] font-semibold text-rose-600">{iss.overdue_count} issues past their SLA.</p>
          ) : null}
        </div>
      )}
    </SectionCard>
  );
}
