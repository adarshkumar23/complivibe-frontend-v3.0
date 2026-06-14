"use client";

import { Radar, Boxes, FileCheck2, TriangleAlert, Bell, ClipboardList } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeFindings } from "@/lib/api/agent-normalizers";
import { normalizeSystems } from "@/lib/api/normalizers";
import { normalizeRisks, isMitigated } from "@/lib/api/risk-normalizers";
import { normalizeEvidenceItems } from "@/lib/api/evidence-normalizers";
import { normalizeQuestionnaires, isComplete } from "@/lib/api/questionnaire-normalizers";
import type { LucideIcon } from "lucide-react";
import type { AgentsData } from "@/lib/hooks/useAgents";

export function AgentCoveragePanel({ data }: { data: AgentsData }) {
  const { aiSystems, evidence, risks, alerts, questionnaires } = data;

  const systems = aiSystems.isSuccess ? normalizeSystems(aiSystems.data).length : null;
  const evidenceCount = evidence.isSuccess ? normalizeEvidenceItems(evidence.data).length : null;
  const openRisks = risks.isSuccess ? normalizeRisks(risks.data).filter((r) => !isMitigated(r.status)).length : null;
  const activeAlerts = alerts.isSuccess ? normalizeFindings(alerts.data).length : null;
  const pendingQ = questionnaires.isSuccess ? normalizeQuestionnaires(questionnaires.data).filter((q) => !isComplete(q)).length : null;

  const cells: { id: string; label: string; icon: LucideIcon; value: number | null }[] = [
    { id: "systems", label: "AI systems monitored", icon: Boxes, value: systems },
    { id: "evidence", label: "Evidence records", icon: FileCheck2, value: evidenceCount },
    { id: "risks", label: "Open risks", icon: TriangleAlert, value: openRisks },
    { id: "alerts", label: "Active alerts", icon: Bell, value: activeAlerts },
    { id: "questionnaires", label: "Pending questionnaires", icon: ClipboardList, value: pendingQ }
  ];

  const anyValue = cells.some((c) => c.value != null);
  const loading = aiSystems.isLoading && evidence.isLoading && risks.isLoading;

  return (
    <SectionCard title="Agent Coverage" subtitle="Derived from available records" icon={Radar} accent="purple">
      {loading ? (
        <SkeletonRows rows={3} />
      ) : !anyValue ? (
        <EmptyState icon={Radar} title="Coverage data unavailable from backend." description="Monitored systems, evidence, risks, alerts, and questionnaire workload appear here once those source endpoints respond." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {cells.map((c) => (
            <div key={c.id} className="rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70">
              <c.icon size={15} className="text-cv-blue" />
              <p className="mt-2 text-[24px] font-extrabold leading-none text-cv-ink">{c.value != null ? c.value : "—"}</p>
              <p className="mt-1 text-[11px] font-semibold text-cv-slate">{c.label}</p>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
