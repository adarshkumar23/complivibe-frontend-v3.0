import {
  getStringFromPaths,
  getNumberFromPaths,
  getDateFromPaths,
  normalizeList
} from "@/lib/api/normalizers";

/**
 * Policy, normalized from /api/v1/policies.
 * Status/version/dates/counts are null unless the backend returns them — never defaulted to
 * "Approved", "Published", "Active", "In Review", etc.
 */
export type Policy = {
  id: string;
  rawId: string | null;
  name: string;
  framework: string | null;
  category: string | null;
  owner: string | null;
  status: string | null;
  version: string | null;
  lastUpdated: string | null;
  nextReview: string | null;
  evidenceCount: number | null;
  controlCount: number | null;
  url: string | null;
};

const LIST_PATHS = ["", "data", "result", "items", "results", "data.items", "policies", "records"];

export function normalizePolicies(value: unknown): Policy[] {
  return normalizeList(value, LIST_PATHS).map((entry, index) => {
    const rawId = getStringFromPaths(entry, ["id", "uuid", "policy_id"]);
    return {
      id: rawId || `policy-${index}`,
      rawId,
      name: getStringFromPaths(entry, ["name", "title", "policy_name", "document"]) || "Untitled policy",
      framework: getStringFromPaths(entry, ["framework", "framework_name", "regulation", "standard"]),
      category: getStringFromPaths(entry, ["category", "type", "policy_type", "domain"]),
      owner: getStringFromPaths(entry, ["owner", "owner_name", "responsible", "assignee", "author"]),
      status: getStringFromPaths(entry, ["status", "state", "approval_status", "stage", "lifecycle"]),
      version: getStringFromPaths(entry, ["version", "version_number", "revision", "rev"]),
      lastUpdated: getDateFromPaths(entry, ["last_updated", "updated_at", "modified_at", "last_reviewed", "approved_at"]),
      nextReview: getDateFromPaths(entry, ["next_review", "next_review_date", "review_due", "review_date", "due_date"]),
      evidenceCount: getNumberFromPaths(entry, ["evidence_count", "evidence", "linked_evidence", "documents_count"]),
      controlCount: getNumberFromPaths(entry, ["control_count", "controls", "mapped_controls", "linked_controls"]),
      url: getStringFromPaths(entry, ["url", "download_url", "file_url", "link", "document_url"])
    };
  });
}

export type PolicyTemplate = {
  id: string;
  name: string;
  category: string | null;
  framework: string | null;
  description: string | null;
  sectionCount: number | null;
};

export function normalizePolicyTemplates(value: unknown): PolicyTemplate[] {
  return normalizeList(value, ["", "data", "result", "items", "results", "templates", "policy_templates"]).map((entry, index) => ({
    id: getStringFromPaths(entry, ["id", "uuid", "template_id", "key"]) || `policy-template-${index}`,
    name: getStringFromPaths(entry, ["name", "title", "template_name"]) || "Untitled template",
    category: getStringFromPaths(entry, ["category", "type", "policy_type"]),
    framework: getStringFromPaths(entry, ["framework", "standard", "regulation"]),
    description: getStringFromPaths(entry, ["description", "summary", "details"]),
    sectionCount: getNumberFromPaths(entry, ["section_count", "sections", "clauses", "total_sections"])
  }));
}

export function statusTone(status: string | null): "good" | "warn" | "bad" | "neutral" {
  if (!status) return "neutral";
  const s = status.toLowerCase();
  if (/(archived|deprecated|rejected|expired|retired)/.test(s)) return "bad";
  if (/(approved|published|active|effective|current)/.test(s)) return "good";
  if (/(review|draft|pending|progress|awaiting)/.test(s)) return "warn";
  return "neutral";
}

/** True only when the backend status genuinely indicates the policy is under review. */
export function isUnderReview(policy: Policy): boolean {
  const s = (policy.status || "").toLowerCase();
  return /(review|reviewing|in progress|pending)/.test(s);
}

/** Review due = a real next-review date that has passed, or a status that says so. */
export function isReviewDue(policy: Policy): boolean {
  if (policy.status && /(due|overdue|review required|needs review)/i.test(policy.status)) return true;
  if (policy.nextReview) {
    const days = Math.ceil((new Date(policy.nextReview).getTime() - Date.now()) / 86_400_000);
    return Number.isFinite(days) && days <= 0;
  }
  return false;
}
