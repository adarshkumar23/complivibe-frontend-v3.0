import {
  getStringFromPaths,
  getNumberFromPaths,
  getDateFromPaths,
  normalizeList
} from "@/lib/api/normalizers";

/**
 * Vendor, normalized from /api/v1/vendors (or /api/v1/vendor-risk).
 * Every business field is null/absent unless the backend returns it — never fabricated.
 */
export type Vendor = {
  id: string;
  rawId: string | null;
  name: string;
  category: string | null;
  riskLevel: string | null;
  status: string | null;
  owner: string | null;
  lastReviewed: string | null;
  nextReview: string | null;
  questionnaireCount: number | null;
  evidenceCount: number | null;
  riskCount: number | null;
};

const LIST_PATHS = ["", "data", "result", "items", "results", "data.items", "vendors", "vendor_risk", "records"];

export function normalizeVendors(value: unknown): Vendor[] {
  return normalizeList(value, LIST_PATHS).map((entry, index) => {
    const rawId = getStringFromPaths(entry, ["id", "uuid", "vendor_id"]);
    return {
      id: rawId || `vendor-${index}`,
      rawId,
      name: getStringFromPaths(entry, ["name", "vendor_name", "company", "title", "supplier"]) || "Unnamed vendor",
      category: getStringFromPaths(entry, ["category", "type", "vendor_type", "tier", "classification"]),
      riskLevel: getStringFromPaths(entry, ["risk_level", "riskLevel", "risk", "severity", "risk_rating", "criticality"]),
      status: getStringFromPaths(entry, ["status", "state", "review_status", "stage", "approval_status"]),
      owner: getStringFromPaths(entry, ["owner", "owner_name", "responsible", "assignee", "relationship_owner"]),
      lastReviewed: getDateFromPaths(entry, ["last_reviewed", "last_review", "reviewed_at", "last_assessed", "updated_at"]),
      nextReview: getDateFromPaths(entry, ["next_review", "next_review_date", "review_due", "due_date", "next_assessment"]),
      questionnaireCount: getNumberFromPaths(entry, ["questionnaire_count", "questionnaires", "assessments_count"]),
      evidenceCount: getNumberFromPaths(entry, ["evidence_count", "evidence", "linked_evidence", "documents_count"]),
      riskCount: getNumberFromPaths(entry, ["risk_count", "risks", "open_risks", "findings_count"])
    };
  });
}

const HIGH_RISK = ["high", "critical", "severe", "elevated"];

/** True only when the backend gives a genuinely high/critical risk level. */
export function isHighRisk(riskLevel: string | null): boolean {
  if (!riskLevel) return false;
  const r = riskLevel.toLowerCase();
  return HIGH_RISK.some((x) => r.includes(x));
}

export function riskTone(riskLevel: string | null): "good" | "warn" | "bad" | "neutral" {
  if (!riskLevel) return "neutral";
  const r = riskLevel.toLowerCase();
  if (isHighRisk(riskLevel)) return "bad";
  if (/(medium|moderate)/.test(r)) return "warn";
  if (/(low|minimal|minor)/.test(r)) return "good";
  return "neutral";
}

export function statusTone(status: string | null): "good" | "warn" | "bad" | "neutral" {
  if (!status) return "neutral";
  const s = status.toLowerCase();
  if (/(blocked|rejected|failed|overdue)/.test(s)) return "bad";
  if (/(approved|active|cleared|complete|completed)/.test(s)) return "good";
  if (/(review|pending|progress|awaiting|needs)/.test(s)) return "warn";
  return "neutral";
}

/** Review due = a real future-or-past next-review date that has passed, or a status that says so. */
export function isReviewDue(vendor: Vendor): boolean {
  if (vendor.status && /(due|overdue|pending review|needs review|awaiting)/i.test(vendor.status)) return true;
  if (vendor.nextReview) {
    const days = Math.ceil((new Date(vendor.nextReview).getTime() - Date.now()) / 86_400_000);
    return Number.isFinite(days) && days <= 0;
  }
  return false;
}

/** Pipeline stages, counted only from real status strings. Returns null when no vendor carries a status. */
export type VendorPipeline = {
  pendingReview: number;
  inReview: number;
  approved: number;
  blocked: number;
  needsEvidence: number;
} | null;

export function vendorPipeline(vendors: Vendor[]): VendorPipeline {
  if (!vendors.some((v) => v.status)) return null;
  const stage = { pendingReview: 0, inReview: 0, approved: 0, blocked: 0, needsEvidence: 0 };
  for (const v of vendors) {
    if (!v.status) continue;
    const s = v.status.toLowerCase();
    if (/needs evidence|evidence required|missing evidence/.test(s)) stage.needsEvidence += 1;
    else if (/blocked|rejected|denied/.test(s)) stage.blocked += 1;
    else if (/approved|cleared|active|complete/.test(s)) stage.approved += 1;
    else if (/in review|in progress|reviewing|assessing/.test(s)) stage.inReview += 1;
    else if (/pending|awaiting|queued|new/.test(s)) stage.pendingReview += 1;
  }
  return stage;
}
