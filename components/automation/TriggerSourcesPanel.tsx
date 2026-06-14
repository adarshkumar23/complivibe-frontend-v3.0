"use client";

import { Plug, CalendarClock, TriangleAlert, ClipboardList, FileCheck2, Radar, GitBranch, type LucideIcon } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { IconTile } from "@/components/ui/IconTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { recordCount } from "@/lib/api/automation-normalizers";
import type { Accent } from "@/components/ui/accent";
import type { AutomationData } from "@/lib/hooks/useAutomation";
import type { UseQueryResult } from "@tanstack/react-query";

export function TriggerSourcesPanel({ data }: { data: AutomationData }) {
  const { syncLogs, deadlines, risks, incidents, questionnaires, evidence, alerts, insights } = data;

  const sources: { label: string; icon: LucideIcon; accent: Accent; qs: UseQueryResult<unknown>[] }[] = [
    { label: "Integration sync", icon: Plug, accent: "blue", qs: [syncLogs] },
    { label: "Scheduled / deadlines", icon: CalendarClock, accent: "amber", qs: [deadlines] },
    { label: "Risk & incident", icon: TriangleAlert, accent: "red", qs: [risks, incidents] },
    { label: "Questionnaire", icon: ClipboardList, accent: "purple", qs: [questionnaires] },
    { label: "Evidence sync", icon: FileCheck2, accent: "green", qs: [evidence] },
    { label: "Predictive signals", icon: Radar, accent: "cyan", qs: [alerts, insights] }
  ];

  const anyLoaded = sources.some((s) => s.qs.some((q) => q.isSuccess));
  const anyLoading = sources.some((s) => s.qs.some((q) => q.isLoading));

  return (
    <SectionCard title="Trigger Sources" subtitle="Live signals that can drive automation" icon={GitBranch} accent="purple" className="h-full">
      {anyLoading && !anyLoaded ? (
        <SkeletonRows rows={5} />
      ) : !anyLoaded ? (
        <EmptyState icon={GitBranch} title="Automation trigger data unavailable from backend." description="Integration, schedule, risk, questionnaire, and evidence triggers will appear here once their sources return data." />
      ) : (
        <ul className="space-y-2.5">
          {sources.map((s) => {
            const loaded = s.qs.some((q) => q.isSuccess);
            const count = s.qs.reduce((sum, q) => sum + (q.isSuccess ? recordCount(q.data) : 0), 0);
            return (
              <li key={s.label} className="flex items-center justify-between gap-3 rounded-xl bg-white/55 px-3 py-2.5 ring-1 ring-white/60">
                <div className="flex items-center gap-3">
                  <IconTile icon={s.icon} accent={s.accent} size="sm" />
                  <span className="text-[13px] font-semibold text-cv-ink">{s.label}</span>
                </div>
                {!loaded ? (
                  <StatusBadge label="Unavailable" tone="neutral" />
                ) : count > 0 ? (
                  <StatusBadge label={`${count} signals`} tone="good" />
                ) : (
                  <StatusBadge label="No signals" tone="neutral" />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
