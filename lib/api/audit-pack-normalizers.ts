import {
  getStringFromPaths,
  getNumberFromPaths,
  getDateFromPaths,
  normalizeList
} from "@/lib/api/normalizers";

export type NormalizedAuditPack = {
  id: string;
  rawId: string | null;
  title: string;
  framework: string | null;
  status: string | null;
  owner: string | null;
  url: string | null;
  evidenceCount: number | null;
  reportCount: number | null;
  riskCount: number | null;
  incidentCount: number | null;
  createdAt: string | null;
  updatedAt: string | null;
};

const LIST_PATHS = ["", "data", "result", "items", "results", "data.items", "audit_pack", "audit_packs", "packs", "records"];

export function normalizeAuditPacks(value: unknown): NormalizedAuditPack[] {
  return normalizeList(value, LIST_PATHS).map((entry, index) => {
    const rawId = getStringFromPaths(entry, ["id", "uuid", "audit_pack_id", "pack_id"]);
    return {
      id: rawId || `audit-pack-${index}`,
      rawId,
      title: getStringFromPaths(entry, ["title", "name", "pack_name", "audit_pack"]) || "Untitled audit pack",
      framework: getStringFromPaths(entry, ["framework", "framework_name", "standard", "regulation"]),
      status: getStringFromPaths(entry, ["status", "state", "generation_status"]),
      owner: getStringFromPaths(entry, ["owner", "requested_by", "created_by", "generated_by"]),
      url: getStringFromPaths(entry, ["download_url", "export_url", "url", "file_url", "link"]),
      evidenceCount: getNumberFromPaths(entry, ["evidence_count", "evidenceCount", "evidence_total", "evidence"]),
      reportCount: getNumberFromPaths(entry, ["report_count", "reportCount", "reports_total", "reports"]),
      riskCount: getNumberFromPaths(entry, ["risk_count", "riskCount", "risks_total", "risks"]),
      incidentCount: getNumberFromPaths(entry, ["incident_count", "incidentCount", "incidents_total", "incidents"]),
      createdAt: getDateFromPaths(entry, ["created_at", "generated_at", "createdAt", "requested_at"]),
      updatedAt: getDateFromPaths(entry, ["updated_at", "updatedAt", "completed_at", "generated_at"])
    };
  });
}

const READY = ["ready", "complete", "completed", "generated", "available", "done", "success"];
const FAILED = ["fail", "error", "rejected"];

export function isReady(status: string | null): boolean {
  if (!status) return false;
  const s = status.toLowerCase();
  return READY.some((x) => s.includes(x));
}

export function statusTone(status: string | null): "good" | "warn" | "bad" | "neutral" {
  if (!status) return "neutral";
  const s = status.toLowerCase();
  if (FAILED.some((x) => s.includes(x))) return "bad";
  if (READY.some((x) => s.includes(x))) return "good";
  return "warn";
}

/** Sum a count field across packs; null when no pack carries that field. */
export function sumCount(packs: NormalizedAuditPack[], key: "evidenceCount" | "reportCount" | "riskCount" | "incidentCount"): number | null {
  let any = false;
  let total = 0;
  for (const p of packs) {
    const v = p[key];
    if (v != null) {
      any = true;
      total += v;
    }
  }
  return any ? total : null;
}

export type AuditPackActivity = { id: string; title: string; action: string; status: string | null; timestamp: string };

export function auditPackActivity(packs: NormalizedAuditPack[]): AuditPackActivity[] {
  const events: AuditPackActivity[] = [];
  for (const p of packs) {
    const ts = p.updatedAt || p.createdAt;
    if (!ts) continue;
    const action = isReady(p.status) ? "Generated" : "Requested";
    events.push({ id: p.id, title: p.title, action, status: p.status, timestamp: ts });
  }
  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
