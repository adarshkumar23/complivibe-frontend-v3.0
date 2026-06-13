"use client";

import { BrainCircuit, Cpu, ShieldAlert, Siren, TriangleAlert, Gauge, type LucideIcon } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { IconTile } from "@/components/ui/IconTile";
import { pickScore } from "@/lib/hooks/useCommandCenter";
import { normalizeAiSystems } from "@/lib/api/ai-system-normalizers";
import { normalizeRisks, isMitigated } from "@/lib/api/risk-normalizers";
import { normalizeIncidents, isResolved } from "@/lib/api/incident-normalizers";
import type { Accent } from "@/components/ui/accent";
import type { TrustCenterData } from "@/lib/hooks/useTrustCenter";

function Tile({ icon, label, value, accent, suffix }: { icon: LucideIcon; label: string; value: number | null; accent: Accent; suffix?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/55 px-3 py-2.5 ring-1 ring-white/60">
      <IconTile icon={icon} accent={accent} size="sm" />
      <div className="min-w-0">
        <p className={`text-lg font-extrabold leading-none ${value != null ? "text-cv-ink" : "text-cv-mist"}`}>{value != null ? `${value}${suffix ?? ""}` : "—"}</p>
        <p className="mt-0.5 text-[11px] font-medium text-cv-slate">{label}</p>
      </div>
    </div>
  );
}

export function AiGovernanceSignals({ data }: { data: TrustCenterData }) {
  const { aiSystems, risks, incidents, scores, executive } = data;

  const systems = normalizeAiSystems(aiSystems.data);
  const totalSystems = aiSystems.isSuccess ? systems.length : null;
  const highRisk = aiSystems.isSuccess ? systems.filter((s) => s.riskLevel === "critical" || s.riskLevel === "high").length : null;

  const openRisks = risks.isSuccess ? normalizeRisks(risks.data).filter((r) => !isMitigated(r.status)).length : null;
  const openInc = incidents.isSuccess ? normalizeIncidents(incidents.data).filter((i) => !isResolved(i.status)).length : null;
  const audit = pickScore([scores.data, executive.data], ["audit_readiness", "audit_readiness_score", "audit_score", "audit"]);

  return (
    <SectionCard title="AI Governance Signals" subtitle="AI posture at a glance" icon={BrainCircuit} accent="purple" className="h-full">
      <div className="grid grid-cols-2 gap-2.5">
        <Tile icon={Cpu} label="AI systems" value={totalSystems} accent="blue" />
        <Tile icon={ShieldAlert} label="High-risk systems" value={highRisk} accent="red" />
        <Tile icon={Siren} label="Open incidents" value={openInc} accent="amber" />
        <Tile icon={TriangleAlert} label="Open risks" value={openRisks} accent="amber" />
        <Tile icon={Gauge} label="Audit readiness" value={audit} accent="teal" suffix="/100" />
      </div>
    </SectionCard>
  );
}
