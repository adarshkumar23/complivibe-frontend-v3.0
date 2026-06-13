"use client";

import { ClipboardCheck, CheckCircle2, AlertCircle, MinusCircle } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { pickScore } from "@/lib/hooks/useCommandCenter";
import { normalizeEvidenceItems } from "@/lib/api/evidence-normalizers";
import { normalizeReports } from "@/lib/api/report-normalizers";
import { normalizeRisks, isMitigated } from "@/lib/api/risk-normalizers";
import { normalizeIncidents, isResolved } from "@/lib/api/incident-normalizers";
import { normalizeFrameworks } from "@/lib/api/compliance-normalizers";
import type { AuditPackData } from "@/lib/hooks/useAuditPack";

type Tone = "good" | "warn" | "unavailable";

function Row({ label, detail, tone }: { label: string; detail: string; tone: Tone }) {
  const Icon = tone === "good" ? CheckCircle2 : tone === "warn" ? AlertCircle : MinusCircle;
  const color = tone === "good" ? "text-emerald-500" : tone === "warn" ? "text-amber-500" : "text-cv-mist";
  return (
    <li className="flex items-center justify-between gap-3 border-b border-white/50 py-2.5 last:border-0">
      <span className="flex items-center gap-2 text-[13px] font-semibold text-cv-ink">
        <Icon size={16} className={color} /> {label}
      </span>
      <span className={`text-[12px] font-semibold ${tone === "unavailable" ? "text-cv-mist" : "text-cv-slate"}`}>{detail}</span>
    </li>
  );
}

export function ReadinessChecklist({ data }: { data: AuditPackData }) {
  const { evidence, reports, risks, incidents, frameworks, scores, executive } = data;

  const evidenceCount = evidence.isSuccess ? normalizeEvidenceItems(evidence.data).length : null;
  const reportCount = reports.isSuccess ? normalizeReports(reports.data).length : null;
  const openRisks = risks.isSuccess ? normalizeRisks(risks.data).filter((r) => !isMitigated(r.status)).length : null;
  const openInc = incidents.isSuccess ? normalizeIncidents(incidents.data).filter((i) => !isResolved(i.status)).length : null;
  const frameworkCount = frameworks.isSuccess ? normalizeFrameworks(frameworks.data).length : null;
  const audit = pickScore([scores.data, executive.data], ["audit_readiness", "audit_readiness_score", "audit_score", "audit", "readiness.audit"]);

  const countTone = (v: number | null): Tone => (v == null ? "unavailable" : v > 0 ? "good" : "warn");
  const issueTone = (v: number | null): Tone => (v == null ? "unavailable" : v === 0 ? "good" : "warn");

  const rows: { label: string; detail: string; tone: Tone }[] = [
    { label: "Evidence available", detail: evidenceCount == null ? "Unavailable" : `${evidenceCount} items`, tone: countTone(evidenceCount) },
    { label: "Reports available", detail: reportCount == null ? "Unavailable" : `${reportCount} reports`, tone: countTone(reportCount) },
    { label: "Open risks", detail: openRisks == null ? "Unavailable" : `${openRisks} open`, tone: issueTone(openRisks) },
    { label: "Open incidents", detail: openInc == null ? "Unavailable" : `${openInc} open`, tone: issueTone(openInc) },
    { label: "Framework mapping", detail: frameworkCount == null ? "Unavailable" : `${frameworkCount} frameworks`, tone: countTone(frameworkCount) },
    { label: "Audit score", detail: audit == null ? "Unavailable" : `${Math.round(audit)}/100`, tone: audit == null ? "unavailable" : "good" }
  ];

  return (
    <SectionCard title="Readiness Checklist" subtitle="Sources available to bundle" icon={ClipboardCheck} accent="teal">
      <ul>
        {rows.map((r) => (
          <Row key={r.label} {...r} />
        ))}
      </ul>
    </SectionCard>
  );
}
