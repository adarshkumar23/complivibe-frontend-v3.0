import {
  getStringFromPaths,
  getNumberFromPaths,
  getDateFromPaths,
  normalizeList
} from "@/lib/api/normalizers";

export type EvidenceItem = {
  id: string;
  rawId: string | null;
  title: string;
  type: string | null;
  status: string | null;
  freshnessLabel: string | null;
  framework: string | null;
  control: string | null;
  aiSystem: string | null;
  owner: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  expiresAt: string | null;
  url: string | null;
};

const LIST_PATHS = ["", "data", "result", "items", "results", "data.items", "evidence", "files", "documents", "records"];

export function normalizeEvidenceItems(value: unknown): EvidenceItem[] {
  return normalizeList(value, LIST_PATHS).map((entry, index) => {
    const rawId = getStringFromPaths(entry, ["id", "uuid", "evidence_id", "file_id"]);
    return {
      id: rawId || `evidence-${index}`,
      rawId,
      title: getStringFromPaths(entry, ["title", "name", "filename", "file_name", "document", "description"]) || "Untitled evidence",
      type: getStringFromPaths(entry, ["type", "category", "evidence_type", "kind", "document_type"]),
      status: getStringFromPaths(entry, ["status", "state", "review_status", "approval_status"]),
      freshnessLabel: getStringFromPaths(entry, ["freshness", "freshness_status", "freshness_label"]),
      framework: getStringFromPaths(entry, ["framework", "framework_name", "regulation", "standard"]),
      control: getStringFromPaths(entry, ["control", "control_id", "control_name", "mapped_control"]),
      aiSystem: getStringFromPaths(entry, ["ai_system", "aiSystem", "system_name", "system_id", "linked_system"]),
      owner: getStringFromPaths(entry, ["owner", "uploaded_by", "owner_name", "created_by", "steward"]),
      createdAt: getDateFromPaths(entry, ["created_at", "createdAt", "uploaded_at", "collected_at"]),
      updatedAt: getDateFromPaths(entry, ["updated_at", "updatedAt", "modified_at", "last_reviewed"]),
      expiresAt: getDateFromPaths(entry, ["expires_at", "expiresAt", "expiry", "valid_until", "expiration_date"]),
      url: getStringFromPaths(entry, ["url", "download_url", "file_url", "link"])
    };
  });
}

export type FreshnessState = "fresh" | "expiring" | "expired" | "unknown";

const EXPIRING_WINDOW_DAYS = 30;

/** Derive freshness from a real label, else from real dates. Returns "unknown" when neither exists. */
export function evidenceFreshness(item: EvidenceItem): FreshnessState {
  const label = (item.freshnessLabel || item.status || "").toLowerCase();
  if (label.includes("expired")) return "expired";
  if (label.includes("stale") || label.includes("expiring")) return "expiring";
  if (label.includes("fresh") || label.includes("valid") || label.includes("current")) return "fresh";

  if (item.expiresAt) {
    const days = Math.ceil((new Date(item.expiresAt).getTime() - Date.now()) / 86_400_000);
    if (Number.isFinite(days)) {
      if (days < 0) return "expired";
      if (days <= EXPIRING_WINDOW_DAYS) return "expiring";
      return "fresh";
    }
  }
  return "unknown";
}

export type FreshnessSummary = { fresh: number; expiring: number; expired: number; unknown: number; hasSignal: boolean };

export function freshnessSummary(items: EvidenceItem[]): FreshnessSummary {
  const summary = { fresh: 0, expiring: 0, expired: 0, unknown: 0, hasSignal: false };
  for (const item of items) {
    const state = evidenceFreshness(item);
    summary[state] += 1;
    if (state !== "unknown") summary.hasSignal = true;
  }
  return summary;
}

/* ----------------------------- Category board ----------------------------- */
export type CategoryBucket = { label: string; value: number };

const CATEGORY_RULES: { label: string; match: string[] }[] = [
  { label: "Policies", match: ["polic", "standard", "procedure"] },
  { label: "Reports", match: ["report", "assessment", "audit"] },
  { label: "Screenshots", match: ["screenshot", "screen", "image", "capture"] },
  { label: "Logs", match: ["log", "trail"] },
  { label: "Access Reviews", match: ["access", "review", "iam", "permission"] },
  { label: "Vendor Documents", match: ["vendor", "third", "supplier", "contract", "dpa"] },
  { label: "AI Documentation", match: ["ai", "model", "datasheet", "factsheet", "card"] }
];

/** Buckets derived from REAL type/category strings only. hasCategories=false → no item carried a type. */
export function categoryBoard(items: EvidenceItem[]): { buckets: CategoryBucket[]; other: number; hasCategories: boolean } {
  const counts = new Map<string, number>();
  let other = 0;
  let hasCategories = false;

  for (const item of items) {
    if (!item.type) continue;
    hasCategories = true;
    const t = item.type.toLowerCase();
    const rule = CATEGORY_RULES.find((r) => r.match.some((m) => t.includes(m)));
    if (rule) counts.set(rule.label, (counts.get(rule.label) ?? 0) + 1);
    else other += 1;
  }

  const buckets = CATEGORY_RULES.map((r) => ({ label: r.label, value: counts.get(r.label) ?? 0 }));
  return { buckets, other, hasCategories };
}

/* ----------------------------- Audit readiness by framework ----------------------------- */
export function frameworkEvidenceCounts(items: EvidenceItem[]): CategoryBucket[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    if (!item.framework) continue;
    counts.set(item.framework, (counts.get(item.framework) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));
}

export function mappedControlsCount(items: EvidenceItem[]): number {
  const set = new Set<string>();
  for (const item of items) {
    const key = item.control || item.framework;
    if (key) set.add(key);
  }
  return set.size;
}

/* ----------------------------- Recent events (derived from real timestamps) ----------------------------- */
export type EvidenceEvent = { id: string; title: string; action: string; type: string | null; timestamp: string };

export function evidenceEvents(items: EvidenceItem[]): EvidenceEvent[] {
  const events: EvidenceEvent[] = [];
  for (const item of items) {
    const ts = item.updatedAt || item.createdAt;
    if (!ts) continue;
    const action = item.updatedAt && item.createdAt && item.updatedAt !== item.createdAt ? "Updated" : "Added";
    events.push({ id: item.id, title: item.title, action, type: item.type, timestamp: ts });
  }
  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
