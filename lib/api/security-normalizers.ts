import { getStringFromPaths, getDateFromPaths, normalizeList } from "@/lib/api/normalizers";
import { scoreFrom } from "@/lib/api/score-explainer-normalizers";

// Reuse the audited, safe Settings normalizers (masked keys only — never raw values).
export { normalizeApiKeys, normalizeTeam, normalizeSecurity, boolFrom } from "@/lib/api/settings-normalizers";
export type { ApiKeyMeta, TeamMember, SecuritySettings } from "@/lib/api/settings-normalizers";

/** Security posture score — backend only. */
export function securityScore(...sources: unknown[]): number | null {
  return scoreFrom(sources, ["security_score", "security_posture", "posture_score", "score", "overall_score"]);
}

/* ----------------------------- Audit events ----------------------------- */
export type AuditEvent = {
  id: string;
  actor: string | null;
  action: string | null;
  resource: string | null;
  status: string | null;
  timestamp: string | null;
};

export function normalizeAuditLogs(value: unknown): AuditEvent[] {
  return normalizeList(value, ["", "data", "result", "items", "results", "data.items", "logs", "audit_logs", "events", "records"]).map((entry, i) => ({
    id: getStringFromPaths(entry, ["id", "uuid", "log_id", "event_id"]) || `audit-${i}`,
    actor: getStringFromPaths(entry, ["actor", "user", "user_email", "performed_by", "username", "actor_name"]),
    action: getStringFromPaths(entry, ["action", "event", "activity", "operation", "type"]),
    resource: getStringFromPaths(entry, ["resource", "target", "object", "entity", "resource_type"]),
    status: getStringFromPaths(entry, ["status", "outcome", "result", "state"]),
    timestamp: getDateFromPaths(entry, ["timestamp", "created_at", "occurred_at", "event_time", "date", "logged_at"])
  }));
}

export function auditOutcomeTone(status: string | null): "good" | "warn" | "bad" | "neutral" {
  if (!status) return "neutral";
  const s = status.toLowerCase();
  if (/(fail|denied|error|blocked|reject)/.test(s)) return "bad";
  if (/(success|allowed|ok|completed|granted)/.test(s)) return "good";
  return "neutral";
}

/* ----------------------------- Health / readiness ----------------------------- */
export type SecurityHealth = {
  health: string | null;
  readiness: string | null;
  backup: string | null;
  monitoring: string | null;
  scan: string | null;
  hasAny: boolean;
};

export function normalizeHealth(...sources: unknown[]): SecurityHealth {
  const str = (paths: string[]) => {
    for (const s of sources) {
      const v = getStringFromPaths(s, paths);
      if (v) return v;
    }
    return null;
  };
  const health = str(["status", "health", "health_status", "state"]);
  const readiness = str(["readiness", "ready", "readiness_status", "production_ready"]);
  const backup = str(["backup_status", "backup", "backups"]);
  const monitoring = str(["monitoring_status", "monitoring", "observability"]);
  const scan = str(["scan_status", "security_scan", "scan_result", "vulnerability_status"]);
  const hasAny = [health, readiness, backup, monitoring, scan].some((v) => v != null);
  return { health, readiness, backup, monitoring, scan, hasAny };
}

export function healthTone(status: string | null): "good" | "warn" | "bad" | "neutral" {
  if (!status) return "neutral";
  const s = status.toLowerCase();
  if (/(down|unhealthy|fail|critical|degraded|not ready|disabled|off)/.test(s)) return "bad";
  if (/(healthy|ok|ready|up|pass|enabled|operational|live|green)/.test(s)) return "good";
  if (/(warn|partial|pending)/.test(s)) return "warn";
  return "neutral";
}

/* ----------------------------- Security findings (scan) ----------------------------- */
export type SecurityFinding = { id: string; title: string; severity: string | null; status: string | null };

export function normalizeSecurityFindings(value: unknown): SecurityFinding[] {
  return normalizeList(value, ["", "data", "result", "items", "results", "findings", "issues", "vulnerabilities", "gaps"]).map((entry, i) => ({
    id: getStringFromPaths(entry, ["id", "uuid", "finding_id"]) || `finding-${i}`,
    title: getStringFromPaths(entry, ["title", "name", "issue", "summary", "description", "check"]) || "Finding",
    severity: getStringFromPaths(entry, ["severity", "priority", "risk_level", "level"]),
    status: getStringFromPaths(entry, ["status", "state", "result"])
  }));
}

/** Count of audit events in a real list (helper for KPIs). */
export function auditCount(value: unknown): number {
  return normalizeList(value, ["", "data", "result", "items", "results", "data.items", "logs", "audit_logs", "events", "records"]).length;
}
