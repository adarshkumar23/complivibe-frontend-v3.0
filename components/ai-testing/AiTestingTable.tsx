"use client";

import { useState } from "react";
import { ClipboardCheck, FilePlus2, Plus } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { CreateAssessmentModal } from "@/components/ai-testing/CreateAssessmentModal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { formatRelativeTime } from "@/lib/utils/format";
import { useHasPermission } from "@/lib/hooks/usePermissions";
import type { Severity } from "@/lib/api/types";
import type { AiTestingData } from "@/lib/hooks/useAiTesting";

/** Manual AI risk assessments from GET /api/v1/ai-governance/ai-risk/assessments. */
export function AiTestingTable({ data }: { data: AiTestingData }) {
  const canWriteAiSystems = useHasPermission("ai_systems:write");
  const { assessments, summary } = data;
  const list = assessments.data ?? [];
  const caveat = summary.data?.caveat;
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <SectionCard
      title="AI Risk Assessments"
      subtitle="Manual governance assessments per AI system"
      icon={ClipboardCheck}
      accent="purple"
      className="h-full"
      action={
        <div className="flex items-center gap-2">
          {assessments.isSuccess ? (
            <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">
              {list.length} assessments
            </span>
          ) : null}
          {canWriteAiSystems ? (
            <button
              type="button"
              data-testid="new-ai-assessment"
              onClick={() => setCreateOpen(true)}
              className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-cv-brand px-3 py-1.5 text-[11px] font-bold text-white shadow-button transition hover:-translate-y-0.5"
            >
              <Plus size={13} strokeWidth={2.6} />
              New assessment
            </button>
          ) : null}
        </div>
      }
    >
      {assessments.isLoading ? (
        <SkeletonRows rows={6} />
      ) : assessments.isError ? (
        <ErrorState title="Unable to load assessments" onRetry={() => assessments.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={FilePlus2}
          title="No assessments yet"
          description="Create a risk assessment for each AI system to document dimensions, classifications, and residual risk."
        />
      ) : (
        <ul className="space-y-2.5">
          {list.slice(0, 12).map((a) => (
            <li key={a.id} className="rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold leading-snug text-cv-ink">
                    {(a.title as string) || (a.assessment_type ?? "assessment").replaceAll("_", " ")}
                  </p>
                  <p className="mt-0.5 text-[11px] text-cv-slate">
                    {[a.assessment_type?.replaceAll("_", " "), a.created_at ? formatRelativeTime(a.created_at) : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {a.risk_level ? <SeverityBadge severity={a.risk_level as Severity} /> : null}
                  {a.status ? <StatusBadge label={a.status.replaceAll("_", " ")} tone={a.status === "completed" ? "good" : "info"} /> : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {caveat ? <p className="mt-3 text-[10px] leading-relaxed text-cv-mist">{caveat}</p> : null}
      <CreateAssessmentModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </SectionCard>
  );
}
