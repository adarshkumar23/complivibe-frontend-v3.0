"use client";

import { ClipboardCheck, FileCheck2, TriangleAlert, Siren, Gauge, Info } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { IconTile } from "@/components/ui/IconTile";
import { pickScore } from "@/lib/hooks/useCommandCenter";
import { normalizeEvidenceItems } from "@/lib/api/evidence-normalizers";
import { normalizeRisks, isMitigated } from "@/lib/api/risk-normalizers";
import { normalizeIncidents, isResolved } from "@/lib/api/incident-normalizers";
import type { Accent } from "@/components/ui/accent";
import type { LucideIcon } from "lucide-react";
import type { ReportsData } from "@/lib/hooks/useReports";

function Tile({ icon, label, value, suffix, accent }: { icon: LucideIcon; label: string; value: number | null; suffix?: string; accent: Accent }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/55 px-3 py-2.5 ring-1 ring-white/60">
      <IconTile icon={icon} accent={accent} size="sm" />
      <div className="min-w-0">
        <p className={`text-lg font-extrabold leading-none ${value != null ? "text-cv-ink" : "text-cv-mist"}`}>
          {value != null ? `${value}${suffix ?? ""}` : "—"}
        </p>
        <p className="mt-0.5 text-[11px] font-medium text-cv-slate">{label}</p>
      </div>
    </div>
  );
}

export function ReportReadiness({ data }: { data: ReportsData }) {
  const { evidence, risks, incidents, scores, executive } = data;

  const evidenceCount = evidence.isSuccess ? normalizeEvidenceItems(evidence.data).length : null;

  const riskList = normalizeRisks(risks.data);
  const anyRiskStatus = riskList.some((r) => r.status);
  const openRisks = risks.isSuccess ? (anyRiskStatus ? riskList.filter((r) => r.status && !isMitigated(r.status)).length : riskList.length) : null;

  const incidentList = normalizeIncidents(incidents.data);
  const anyIncStatus = incidentList.some((i) => i.status);
  const openIncidents = incidents.isSuccess ? (anyIncStatus ? incidentList.filter((i) => i.status && !isResolved(i.status)).length : incidentList.length) : null;

  const audit = pickScore([scores.data, executive.data], ["audit_readiness", "audit_readiness_score", "audit_score", "audit", "readiness.audit"]);

  const missing: string[] = [];
  if (evidenceCount == null) missing.push("evidence");
  if (openRisks == null) missing.push("risks");
  if (openIncidents == null) missing.push("incidents");
  if (audit == null) missing.push("audit readiness");

  const loading = evidence.isLoading && risks.isLoading && incidents.isLoading;

  return (
    <SectionCard title="Report Readiness" subtitle="Source data available to include" icon={ClipboardCheck} accent="teal">
      {loading ? (
        <div className="grid grid-cols-2 gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-white/40" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            <Tile icon={FileCheck2} label="Evidence available" value={evidenceCount} accent="green" />
            <Tile icon={TriangleAlert} label="Open risks" value={openRisks} accent="amber" />
            <Tile icon={Siren} label="Open incidents" value={openIncidents} accent="red" />
            <Tile icon={Gauge} label="Audit readiness" value={audit} suffix="/100" accent="purple" />
          </div>
          {missing.length > 0 ? (
            <p className="flex items-start gap-1.5 rounded-xl bg-amber-400/12 px-3 py-2 text-[11px] font-medium text-amber-700 ring-1 ring-amber-400/25">
              <Info size={13} className="mt-0.5 shrink-0" />
              Some inputs are unavailable: {missing.join(", ")}. Reports may be incomplete.
            </p>
          ) : null}
        </div>
      )}
    </SectionCard>
  );
}
