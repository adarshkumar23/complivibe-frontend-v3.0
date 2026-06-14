"use client";

import { useRouter } from "next/navigation";
import { FileText, Info } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeExecutiveBrief, buildBriefStats, type ExecSources } from "@/lib/api/executive-normalizers";
import type { ExecutiveSummaryData } from "@/lib/hooks/useExecutiveSummary";

export function ExecutiveBrief({ data }: { data: ExecutiveSummaryData }) {
  const { executive, aiSystems, risks, incidents, evidence, regulatory, auditPacks, reports, questionnaires, approvals } = data;
  const router = useRouter();

  const brief = normalizeExecutiveBrief(executive.data);
  const hasBackendBrief = Boolean(brief.summary) || brief.highlights.length > 0;

  const s: ExecSources = {};
  if (aiSystems.isSuccess) s.aiSystems = aiSystems.data;
  if (risks.isSuccess) s.risks = risks.data;
  if (incidents.isSuccess) s.incidents = incidents.data;
  if (evidence.isSuccess) s.evidence = evidence.data;
  if (regulatory.isSuccess) s.regulatory = regulatory.data;
  if (auditPacks.isSuccess) s.auditPacks = auditPacks.data;
  if (reports.isSuccess) s.reports = reports.data;
  if (questionnaires.isSuccess) s.questionnaires = questionnaires.data;
  if (approvals.isSuccess) s.approvals = approvals.data;
  const stats = buildBriefStats(s);

  const loading = executive.isLoading && aiSystems.isLoading;

  return (
    <SectionCard
      title="Executive Brief"
      subtitle={hasBackendBrief ? "Backend executive summary" : "Derived from available records"}
      icon={FileText}
      accent="blue"
    >
      {loading ? (
        <SkeletonRows rows={4} />
      ) : hasBackendBrief ? (
        <div className="space-y-3">
          {brief.summary ? <p className="text-[14px] leading-relaxed text-cv-ink">{brief.summary}</p> : null}
          {brief.highlights.length > 0 ? (
            <ul className="space-y-1.5">
              {brief.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] text-cv-slate">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cv-brand" /> {h}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : stats.length === 0 ? (
        <EmptyState icon={FileText} title="Executive brief unavailable from backend." description="A factual brief will appear here once the backend returns a summary or records to derive from." />
      ) : (
        <div className="space-y-3">
          <p className="flex items-center gap-1.5 rounded-xl bg-blue-500/8 px-3 py-2 text-[11px] font-medium text-cv-blue ring-1 ring-blue-500/15">
            <Info size={13} /> Derived from available records — factual counts only, not an interpreted assessment.
          </p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {stats.map((st) => (
              <button key={st.key} type="button" onClick={() => router.push(st.route)} className="cv-ring-focus rounded-xl bg-white/55 px-3 py-2.5 text-left ring-1 ring-white/60 transition hover:bg-white/85">
                <p className="text-[22px] font-extrabold leading-none text-cv-ink">{st.value}</p>
                <p className="mt-1 text-[11px] font-medium text-cv-slate">{st.label}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
}
