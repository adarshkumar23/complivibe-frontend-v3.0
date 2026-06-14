import { getStringFromPaths, getNumberFromPaths, getDateFromPaths, normalizeList } from "@/lib/api/normalizers";
import { scoreFrom } from "@/lib/api/score-explainer-normalizers";

export { sensitiveSignals } from "@/lib/api/data-observability-normalizers";
export type { SensitiveSignals } from "@/lib/api/data-observability-normalizers";

/** Privacy readiness score — backend only. */
export function privacyScore(...sources: unknown[]): number | null {
  return scoreFrom(sources, ["privacy_score", "privacy_readiness", "dpdp_score", "dpdp_readiness", "readiness", "score"]);
}

/* ----------------------------- Privacy readiness components ----------------------------- */
export type PrivacyReadiness = {
  status: string | null;
  evidenceCount: number | null;
  obligationCoverage: number | null;
  nextDeadline: string | null;
  hasAny: boolean;
};

export function normalizePrivacyReadiness(...sources: unknown[]): PrivacyReadiness {
  const str = (paths: string[]) => {
    for (const s of sources) { const v = getStringFromPaths(s, paths); if (v) return v; }
    return null;
  };
  const num = (paths: string[]) => {
    for (const s of sources) { const v = getNumberFromPaths(s, paths); if (v != null) return v; }
    return null;
  };
  const date = (paths: string[]) => {
    for (const s of sources) { const v = getDateFromPaths(s, paths); if (v) return v; }
    return null;
  };
  const status = str(["status", "readiness_status", "state", "compliance_status"]);
  const evidenceCount = num(["evidence_count", "evidence", "linked_evidence"]);
  const obligationCoverage = num(["obligation_coverage", "coverage", "coverage_percentage", "obligations_met_pct"]);
  const nextDeadline = date(["next_deadline", "next_due", "upcoming_deadline", "due_date"]);
  const hasAny = [status, evidenceCount, obligationCoverage, nextDeadline].some((v) => v != null);
  return { status, evidenceCount, obligationCoverage, nextDeadline, hasAny };
}

/* ----------------------------- Data categories (metadata only — never raw PII) ----------------------------- */
export type DataCategory = { id: string; category: string; sensitivity: string | null; source: string | null; count: number | null; status: string | null };

export function normalizeDataCategories(value: unknown): DataCategory[] {
  return normalizeList(value, ["", "data", "result", "items", "results", "categories", "data_map", "classifications", "datasets", "records"]).map((entry, i) => ({
    id: getStringFromPaths(entry, ["id", "uuid", "category_id"]) || `category-${i}`,
    category: getStringFromPaths(entry, ["category", "name", "data_category", "type", "classification", "label"]) || "Data category",
    sensitivity: getStringFromPaths(entry, ["sensitivity", "sensitivity_level", "level", "classification_level", "tier"]),
    source: getStringFromPaths(entry, ["source", "source_system", "dataset", "system", "origin"]),
    count: getNumberFromPaths(entry, ["count", "records", "record_count", "volume", "total"]),
    status: getStringFromPaths(entry, ["status", "state", "review_status"])
  }));
}

export function sensitivityTone(level: string | null): "good" | "warn" | "bad" | "neutral" {
  if (!level) return "neutral";
  const s = level.toLowerCase();
  if (/(high|critical|restricted|secret|pii|sensitive)/.test(s)) return "bad";
  if (/(medium|moderate|confidential|internal)/.test(s)) return "warn";
  if (/(low|public|none)/.test(s)) return "good";
  return "neutral";
}

/* ----------------------------- Privacy requests / retention ----------------------------- */
export type PrivacyRequest = {
  id: string;
  type: string | null;
  title: string;
  status: string | null;
  dueDate: string | null;
  owner: string | null;
  linked: string | null;
};

export function normalizePrivacyRequests(value: unknown): PrivacyRequest[] {
  return normalizeList(value, ["", "data", "result", "items", "results", "requests", "dsr", "data_requests", "retention", "records"]).map((entry, i) => ({
    id: getStringFromPaths(entry, ["id", "uuid", "request_id"]) || `privacy-request-${i}`,
    type: getStringFromPaths(entry, ["type", "request_type", "category", "kind"]),
    title: getStringFromPaths(entry, ["title", "subject", "name", "summary", "description"]) || "Privacy request",
    status: getStringFromPaths(entry, ["status", "state", "stage"]),
    dueDate: getDateFromPaths(entry, ["due_date", "deadline", "respond_by", "sla_due"]),
    owner: getStringFromPaths(entry, ["owner", "assignee", "handler", "responsible"]),
    linked: getStringFromPaths(entry, ["resource", "linked_resource", "evidence", "policy", "reference"])
  }));
}

export function requestStatusTone(status: string | null): "good" | "warn" | "bad" | "neutral" {
  if (!status) return "neutral";
  const s = status.toLowerCase();
  if (/(overdue|rejected|failed|breach)/.test(s)) return "bad";
  if (/(complete|completed|fulfilled|closed|resolved|approved)/.test(s)) return "good";
  if (/(open|pending|in progress|review|awaiting)/.test(s)) return "warn";
  return "neutral";
}
