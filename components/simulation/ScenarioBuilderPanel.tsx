"use client";

import { Boxes, TriangleAlert, Siren, CalendarClock, FileCheck2, PackageCheck, ClipboardList, Play, type LucideIcon } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import {
  SCENARIO_TYPES, normalizeSystems, normalizeRisks, normalizeIncidents,
  normalizeRegulatoryDeadlines, normalizeEvidenceItems, normalizeAuditPacks, normalizeQuestionnaires
} from "@/lib/api/simulation-normalizers";
import type { SimulationData } from "@/lib/hooks/useSimulation";
import type { UseQueryResult } from "@tanstack/react-query";

type InputRow = { id: string; label: string; icon: LucideIcon; count: number | null; loading: boolean };

function inputCount(q: UseQueryResult<unknown>, normalize: (v: unknown) => unknown[]): number | null {
  return q.isSuccess ? normalize(q.data).length : null;
}

export function ScenarioBuilderPanel({ data }: { data: SimulationData }) {
  const { aiSystems, risks, incidents, deadlines, evidence, auditPacks, questionnaires } = data;

  const rows: InputRow[] = [
    { id: "ai-systems", label: "AI systems", icon: Boxes, count: inputCount(aiSystems, normalizeSystems), loading: aiSystems.isLoading },
    { id: "risks", label: "Risks", icon: TriangleAlert, count: inputCount(risks, normalizeRisks), loading: risks.isLoading },
    { id: "incidents", label: "Incidents", icon: Siren, count: inputCount(incidents, normalizeIncidents), loading: incidents.isLoading },
    { id: "deadlines", label: "Regulatory deadlines", icon: CalendarClock, count: inputCount(deadlines, normalizeRegulatoryDeadlines), loading: deadlines.isLoading },
    { id: "evidence", label: "Evidence", icon: FileCheck2, count: inputCount(evidence, normalizeEvidenceItems), loading: evidence.isLoading },
    { id: "audit-packs", label: "Audit packs", icon: PackageCheck, count: inputCount(auditPacks, normalizeAuditPacks), loading: auditPacks.isLoading },
    { id: "questionnaires", label: "Questionnaires", icon: ClipboardList, count: inputCount(questionnaires, normalizeQuestionnaires), loading: questionnaires.isLoading }
  ];

  return (
    <SectionCard
      title="Scenario Builder"
      subtitle="Real backend records as simulation inputs"
      icon={Boxes}
      accent="blue"
      className="h-full"
      action={
        <button type="button" disabled title="Simulation endpoint unavailable" className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full bg-white/55 px-2.5 py-1.5 text-[11px] font-semibold text-cv-mist ring-1 ring-white/60">
          <Play size={12} /> Run Simulation
        </button>
      }
    >
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/55 px-3 py-2.5 ring-1 ring-white/60">
            <span className="flex items-center gap-2 text-[12px] font-semibold text-cv-slate"><r.icon size={14} /> {r.label}</span>
            {r.loading ? <SkeletonRows rows={1} className="w-10" /> : r.count != null ? <span className="text-[13px] font-bold text-cv-ink">{r.count}</span> : <span className="text-[11px] font-semibold text-cv-mist">Unavailable</span>}
          </div>
        ))}
      </div>

      <div className="mt-4">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-cv-mist">Scenario types</p>
        <div className="flex flex-wrap gap-2">
          {SCENARIO_TYPES.map((t) => (
            <span key={t.id} className="inline-flex items-center rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">{t.label}</span>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}
