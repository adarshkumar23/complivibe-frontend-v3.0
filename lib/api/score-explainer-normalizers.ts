import { getNumberFromPaths } from "@/lib/api/normalizers";
import { normalizeRisks, isMitigated } from "@/lib/api/risk-normalizers";
import { normalizeIncidents, isResolved } from "@/lib/api/incident-normalizers";
import { normalizeRegulatoryDeadlines } from "@/lib/api/regulatory-normalizers";
import { normalizeApprovals, isPending } from "@/lib/api/approval-normalizers";
import { normalizeAssuranceCases, isComplete as assuranceComplete } from "@/lib/api/assurance-normalizers";
import { normalizeQuestionnaires, isComplete as questionnaireComplete } from "@/lib/api/questionnaire-normalizers";
import { normalizeTrustAssets, isPublished } from "@/lib/api/trust-center-normalizers";
import { normalizeVendors, isHighRisk as vendorHighRisk } from "@/lib/api/vendor-risk-normalizers";
import { normalizeEvidenceItems, frameworkEvidenceCounts } from "@/lib/api/evidence-normalizers";

/** First real number across candidate payloads/paths; null when none. */
export function scoreFrom(sources: unknown[], paths: string[]): number | null {
  for (const s of sources) {
    if (s == null) continue;
    const v = getNumberFromPaths(s, paths);
    if (v != null) return v;
  }
  return null;
}

export type ScoreComponents = {
  governance: number | null;
  compliance: number | null;
  evidence: number | null;
  risk: number | null;
  incident: number | null;
  auditReadiness: number | null;
  trustCenterReadiness: number | null;
  certificationReadiness: number | null;
  aiSystemReadiness: number | null;
  hasAny: boolean;
};

export function normalizeScoreComponents(...sources: unknown[]): ScoreComponents {
  const g = scoreFrom(sources, ["governance_score", "governance", "ai_governance"]);
  const c = scoreFrom(sources, ["compliance_score", "compliance", "compliance_readiness"]);
  const e = scoreFrom(sources, ["evidence_score", "evidence_coverage", "evidence"]);
  const r = scoreFrom(sources, ["risk_score", "risk", "risk_posture"]);
  const inc = scoreFrom(sources, ["incident_score", "incident", "incident_posture"]);
  const audit = scoreFrom(sources, ["audit_readiness", "audit_readiness_score", "audit_score", "audit"]);
  const trust = scoreFrom(sources, ["trust_center_readiness", "trust_center_score", "trust_readiness"]);
  const cert = scoreFrom(sources, ["certification_readiness", "certification_score", "certifications"]);
  const ai = scoreFrom(sources, ["ai_system_readiness", "ai_readiness", "ai_system_score"]);
  const hasAny = [g, c, e, r, inc, audit, trust, cert, ai].some((v) => v != null);
  return { governance: g, compliance: c, evidence: e, risk: r, incident: inc, auditReadiness: audit, trustCenterReadiness: trust, certificationReadiness: cert, aiSystemReadiness: ai, hasAny };
}

export function overallScore(sources: unknown[]): number | null {
  return scoreFrom(sources, ["trust_score", "overall_score", "overall", "score", "trust", "health_score", "unified_score"]);
}

/* ----------------------------- Derived drivers ----------------------------- */
export type Driver = { key: string; label: string; count: number; route: string; tone: "bad" | "warn" | "good" };

export type DriverSources = Partial<Record<"risks" | "incidents" | "regulatory" | "approvals" | "assurance" | "questionnaires" | "trustAssets" | "vendors", unknown>>;

/** Build attention drivers from REAL records only — each entry is "derived from available records". */
export function buildDrivers(s: DriverSources): Driver[] {
  const out: Driver[] = [];
  const bad = (count: number): "bad" | "good" => (count > 0 ? "bad" : "good");
  const warn = (count: number): "warn" | "good" => (count > 0 ? "warn" : "good");

  if (s.risks !== undefined) {
    const n = normalizeRisks(s.risks).filter((r) => !isMitigated(r.status) && r.hasSeverity && /(critical|high)/i.test(r.severity)).length;
    out.push({ key: "high-risks", label: "Open high/critical risks", count: n, route: "/dashboard/risks", tone: bad(n) });
  }
  if (s.incidents !== undefined) {
    const n = normalizeIncidents(s.incidents).filter((i) => !isResolved(i.status)).length;
    out.push({ key: "incidents", label: "Unresolved incidents", count: n, route: "/dashboard/incidents", tone: bad(n) });
  }
  if (s.regulatory !== undefined) {
    const n = normalizeRegulatoryDeadlines(s.regulatory).filter((d) => d.daysRemaining != null && d.daysRemaining < 0).length;
    out.push({ key: "regulatory", label: "Overdue regulatory deadlines", count: n, route: "/dashboard/regulatory", tone: bad(n) });
  }
  if (s.approvals !== undefined) {
    const n = normalizeApprovals(s.approvals).filter(isPending).length;
    out.push({ key: "approvals", label: "Pending approvals", count: n, route: "/dashboard/approvals", tone: warn(n) });
  }
  if (s.assurance !== undefined) {
    const n = normalizeAssuranceCases(s.assurance).filter((c) => !assuranceComplete(c)).length;
    out.push({ key: "assurance", label: "Open assurance reviews", count: n, route: "/dashboard/assurance", tone: warn(n) });
  }
  if (s.questionnaires !== undefined) {
    const n = normalizeQuestionnaires(s.questionnaires).filter((q) => !questionnaireComplete(q)).length;
    out.push({ key: "questionnaires", label: "Incomplete questionnaires", count: n, route: "/dashboard/questionnaires", tone: warn(n) });
  }
  if (s.trustAssets !== undefined) {
    const assets = normalizeTrustAssets(s.trustAssets);
    const n = assets.filter((a) => !isPublished(a)).length;
    if (assets.length > 0) out.push({ key: "trust-assets", label: "Unpublished trust assets", count: n, route: "/dashboard/trust-center", tone: warn(n) });
  }
  if (s.vendors !== undefined) {
    const n = normalizeVendors(s.vendors).filter((v) => vendorHighRisk(v.riskLevel)).length;
    out.push({ key: "vendors", label: "High-risk vendors", count: n, route: "/dashboard/vendor-risk", tone: bad(n) });
  }
  return out;
}

/* ----------------------------- Evidence coverage ----------------------------- */
export type CoverageBucket = { label: string; value: number };
export function evidenceCoverage(value: unknown): { byFramework: CoverageBucket[]; total: number } {
  const items = normalizeEvidenceItems(value);
  return { byFramework: frameworkEvidenceCounts(items), total: items.length };
}

/* ----------------------------- Risk impact ----------------------------- */
export type RiskImpact = { total: number; highCritical: number | null; open: number | null; linkedSystems: number };
export function riskImpact(value: unknown): RiskImpact {
  const risks = normalizeRisks(value);
  const anySeverity = risks.some((r) => r.hasSeverity);
  const anyStatus = risks.some((r) => r.status);
  const systems = new Set<string>();
  for (const r of risks) if (r.aiSystem) systems.add(r.aiSystem.toLowerCase());
  return {
    total: risks.length,
    highCritical: anySeverity ? risks.filter((r) => r.hasSeverity && /(critical|high)/i.test(r.severity)).length : null,
    open: anyStatus ? risks.filter((r) => !isMitigated(r.status)).length : null,
    linkedSystems: systems.size
  };
}
