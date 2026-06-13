import {
  getStringFromPaths,
  getNumberFromPaths,
  getDateFromPaths,
  normalizeList
} from "@/lib/api/normalizers";
import { severityFrom } from "@/lib/api/compliance-normalizers";
import type { Severity } from "@/lib/api/types";

export type NormalizedIncident = {
  id: string;
  rawId: string | null;
  title: string;
  severity: Severity;
  hasSeverity: boolean;
  status: string | null;
  owner: string | null;
  category: string | null;
  aiSystem: string | null;
  riskRef: string | null;
  evidenceRef: string | null;
  description: string | null;
  action: string | null;
  detectedAt: string | null;
  resolvedAt: string | null;
  dueDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

const LIST_PATHS = ["", "data", "result", "items", "results", "data.items", "incidents", "incident_register", "records"];

export function normalizeIncidents(value: unknown): NormalizedIncident[] {
  return normalizeList(value, LIST_PATHS).map((entry, index) => {
    const sevRaw = getStringFromPaths(entry, ["severity", "priority", "risk_level", "level"]);
    const rawId = getStringFromPaths(entry, ["id", "uuid", "incident_id"]);
    return {
      id: rawId || `incident-${index}`,
      rawId,
      title: getStringFromPaths(entry, ["title", "name", "summary", "incident", "description"]) || "Untitled incident",
      severity: severityFrom(sevRaw),
      hasSeverity: sevRaw != null,
      status: getStringFromPaths(entry, ["status", "state", "incident_status", "stage", "phase"]),
      owner: getStringFromPaths(entry, ["owner", "assignee", "owner_name", "responder", "responsible"]),
      category: getStringFromPaths(entry, ["category", "type", "domain", "incident_type"]),
      aiSystem: getStringFromPaths(entry, ["affected_ai_system", "ai_system", "system_name", "system_id", "affected_system"]),
      riskRef: getStringFromPaths(entry, ["linked_risk", "risk_id", "risk", "related_risk"]),
      evidenceRef: getStringFromPaths(entry, ["linked_evidence", "evidence_id", "evidence", "related_evidence"]),
      description: getStringFromPaths(entry, ["description", "details", "summary"]),
      action: getStringFromPaths(entry, ["remediation", "action", "next_step", "response_plan", "resolution", "mitigation"]),
      detectedAt: getDateFromPaths(entry, ["detected_at", "detectedAt", "created_at", "opened_at", "reported_at"]),
      resolvedAt: getDateFromPaths(entry, ["resolved_at", "resolvedAt", "closed_at", "closedAt", "recovered_at"]),
      dueDate: getDateFromPaths(entry, ["due_date", "sla_due_at", "slaDueAt", "target_date", "deadline"]),
      createdAt: getDateFromPaths(entry, ["created_at", "createdAt", "detected_at", "opened_at"]),
      updatedAt: getDateFromPaths(entry, ["updated_at", "updatedAt", "modified_at", "last_updated"])
    };
  });
}

const RESOLVED = ["resolv", "closed", "done", "recovered", "complete", "remediated"];

export function isResolved(status: string | null): boolean {
  if (!status) return false;
  const s = status.toLowerCase();
  return RESOLVED.some((x) => s.includes(x));
}

export type StatusKey = "Open" | "Investigating" | "Mitigating" | "Resolved" | "Closed" | "Other";

export function statusBucket(status: string | null): StatusKey {
  const s = (status || "").toLowerCase();
  if (s.includes("investigat")) return "Investigating";
  if (s.includes("mitigat") || s.includes("contain") || s.includes("respond")) return "Mitigating";
  if (s.includes("closed")) return "Closed";
  if (RESOLVED.some((x) => s.includes(x))) return "Resolved";
  if (s.includes("open") || s.includes("new") || s.includes("active") || s.includes("triage")) return "Open";
  return "Other";
}

export type StatusBucketCount = { label: StatusKey; value: number };

export function statusOverview(items: NormalizedIncident[]): { buckets: StatusBucketCount[]; hasStatus: boolean } {
  const order: StatusKey[] = ["Open", "Investigating", "Mitigating", "Resolved", "Closed", "Other"];
  const counts = new Map<StatusKey, number>();
  let hasStatus = false;
  for (const i of items) {
    if (!i.status) continue;
    hasStatus = true;
    const k = statusBucket(i.status);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const buckets = order.filter((k) => (k === "Other" ? (counts.get(k) ?? 0) > 0 : true)).map((label) => ({ label, value: counts.get(label) ?? 0 }));
  return { buckets, hasStatus };
}

/** Resolution time in hours, only when real detected & resolved timestamps exist and are ordered. */
export function resolutionHours(incident: NormalizedIncident): number | null {
  const start = incident.detectedAt || incident.createdAt;
  const end = incident.resolvedAt;
  if (!start || !end) return null;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  return ms / 3_600_000;
}

export function averageResolutionHours(items: NormalizedIncident[]): number | null {
  const hrs = items.map(resolutionHours).filter((h): h is number => h != null);
  if (hrs.length === 0) return null;
  return hrs.reduce((a, b) => a + b, 0) / hrs.length;
}

export function formatDurationHours(hours: number | null): string {
  if (hours == null) return "—";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 48) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

/** SLA breach only when a due date exists and the incident is not resolved/closed and is past due. */
export function isSlaBreached(incident: NormalizedIncident): boolean {
  if (!incident.dueDate || isResolved(incident.status)) return false;
  const t = new Date(incident.dueDate).getTime();
  return Number.isFinite(t) && t < Date.now();
}

export type CategoryBucket = { label: string; value: number };

export function categoryCounts(items: NormalizedIncident[], field: "category" | "aiSystem"): CategoryBucket[] {
  const counts = new Map<string, number>();
  for (const i of items) {
    const key = i[field];
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));
}

export type IncidentActivity = { id: string; title: string; action: string; status: string | null; timestamp: string };

export function incidentActivity(items: NormalizedIncident[]): IncidentActivity[] {
  const events: IncidentActivity[] = [];
  for (const i of items) {
    const ts = i.resolvedAt || i.updatedAt || i.detectedAt || i.createdAt;
    if (!ts) continue;
    const action = i.resolvedAt ? "Resolved" : i.updatedAt && i.createdAt && i.updatedAt !== i.createdAt ? "Updated" : "Detected";
    events.push({ id: i.id, title: i.title, action, status: i.status, timestamp: ts });
  }
  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
