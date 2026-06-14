import { normalizeAlerts, normalizeList, getStringFromPaths, getDateFromPaths } from "@/lib/api/normalizers";
import { normalizeIncidents } from "@/lib/api/incident-normalizers";
import { normalizeRisks } from "@/lib/api/risk-normalizers";
import { normalizeRegulatoryDeadlines } from "@/lib/api/regulatory-normalizers";
import { normalizeApprovals } from "@/lib/api/approval-normalizers";
import { normalizeAssuranceCases } from "@/lib/api/assurance-normalizers";
import { normalizeQuestionnaires } from "@/lib/api/questionnaire-normalizers";
import { normalizeSyncLogs, syncFailed } from "@/lib/api/integration-normalizers";
import { normalizeAutomationRuns, runFailed } from "@/lib/api/automation-normalizers";
import { normalizeWorkflows, isBlocked as workflowBlocked } from "@/lib/api/workflow-normalizers";

export { normalizeNotifications } from "@/lib/api/settings-normalizers";
export type { NotificationSettings } from "@/lib/api/settings-normalizers";

export type SignalCategoryKey =
  | "alerts" | "incidents" | "risks" | "regulatory" | "approvals"
  | "assurance" | "questionnaires" | "integrations" | "jobs";

export type GovernanceSignal = {
  id: string;
  title: string;
  categoryKey: SignalCategoryKey;
  category: string;
  severity: string | null;
  status: string | null;
  date: string | null;
  dueDate: string | null;
  linkedResource: string | null;
  source: string;
  route: string | null;
  resolvedAt: string | null;
};

export const SIGNAL_META: Record<SignalCategoryKey, { label: string; route: string }> = {
  alerts: { label: "Alerts", route: "/dashboard/alerts" },
  incidents: { label: "Incidents", route: "/dashboard/incidents" },
  risks: { label: "Risks", route: "/dashboard/risks" },
  regulatory: { label: "Regulatory", route: "/dashboard/regulatory" },
  approvals: { label: "Approvals", route: "/dashboard/approvals" },
  assurance: { label: "Assurance", route: "/dashboard/assurance" },
  questionnaires: { label: "Questionnaires", route: "/dashboard/questionnaires" },
  integrations: { label: "Integrations", route: "/dashboard/integrations" },
  jobs: { label: "Jobs", route: "/dashboard/automation" }
};

export type SignalSources = Partial<Record<"alerts" | "incidents" | "risks" | "regulatory" | "approvals" | "assurance" | "questionnaires" | "syncLogs" | "automationRuns" | "workflows", unknown>>;

function sig(key: SignalCategoryKey, index: number, f: Partial<GovernanceSignal> & { title: string; id?: string }): GovernanceSignal {
  return {
    id: `${key}-${f.id ?? index}`,
    title: f.title,
    categoryKey: key,
    category: SIGNAL_META[key].label,
    severity: f.severity ?? null,
    status: f.status ?? null,
    date: f.date ?? null,
    dueDate: f.dueDate ?? null,
    linkedResource: f.linkedResource ?? null,
    source: SIGNAL_META[key].label,
    route: f.route !== undefined ? f.route : SIGNAL_META[key].route,
    resolvedAt: f.resolvedAt ?? null
  };
}

/** Aggregate REAL governance signals from confirmed source payloads. No fabrication. */
export function buildSignals(s: SignalSources): GovernanceSignal[] {
  const out: GovernanceSignal[] = [];

  if (s.alerts !== undefined) {
    normalizeAlerts(undefined, s.alerts).forEach((a, i) =>
      out.push(sig("alerts", i, { id: a.id, title: a.title, severity: a.hasSeverity ? a.severity : null, date: a.timestamp, linkedResource: null }))
    );
  }
  if (s.incidents !== undefined) {
    normalizeIncidents(s.incidents).forEach((n, i) =>
      out.push(sig("incidents", i, { id: n.id, title: n.title, severity: n.hasSeverity ? n.severity : null, status: n.status, date: n.detectedAt ?? n.createdAt, dueDate: n.dueDate, linkedResource: n.aiSystem, resolvedAt: n.resolvedAt }))
    );
  }
  if (s.risks !== undefined) {
    normalizeRisks(s.risks).forEach((r, i) =>
      out.push(sig("risks", i, { id: r.id, title: r.title, severity: r.hasSeverity ? r.severity : null, status: r.status, date: r.updatedAt ?? r.createdAt, dueDate: r.dueDate, linkedResource: r.aiSystem }))
    );
  }
  if (s.regulatory !== undefined) {
    normalizeRegulatoryDeadlines(s.regulatory).forEach((d, i) =>
      out.push(sig("regulatory", i, { id: d.id, title: d.title, severity: d.priority, date: d.dueDate, dueDate: d.dueDate, linkedResource: d.framework ?? d.jurisdiction }))
    );
  }
  if (s.approvals !== undefined) {
    normalizeApprovals(s.approvals).forEach((a, i) =>
      out.push(sig("approvals", i, { id: a.id, title: a.title, severity: a.priority, status: a.status, date: a.createdAt, dueDate: a.dueDate, linkedResource: a.linkedResource, resolvedAt: a.decisionDate }))
    );
  }
  if (s.assurance !== undefined) {
    normalizeAssuranceCases(s.assurance).forEach((c, i) =>
      out.push(sig("assurance", i, { id: c.id, title: c.title, severity: c.priority, status: c.status, dueDate: c.dueDate, linkedResource: c.linkedResource }))
    );
  }
  if (s.questionnaires !== undefined) {
    normalizeQuestionnaires(s.questionnaires).forEach((q, i) =>
      out.push(sig("questionnaires", i, { id: q.id, title: q.title, status: q.status, date: q.updatedAt, dueDate: q.dueDate, linkedResource: q.customer }))
    );
  }
  if (s.syncLogs !== undefined) {
    // Only failed syncs are attention signals.
    normalizeSyncLogs(s.syncLogs).filter((l) => syncFailed(l.status)).forEach((l, i) =>
      out.push(sig("integrations", i, { id: l.id, title: [l.provider, l.action].filter(Boolean).join(" · ") || "Sync failure", status: l.status, date: l.timestamp, linkedResource: l.provider }))
    );
  }
  if (s.automationRuns !== undefined) {
    normalizeAutomationRuns(s.automationRuns).filter((r) => runFailed(r)).forEach((r, i) =>
      out.push(sig("jobs", i, { id: r.id, title: r.name || "Automation run", status: r.result ?? r.status, date: r.startedAt, linkedResource: null }))
    );
  }
  if (s.workflows !== undefined) {
    normalizeWorkflows(s.workflows).filter((w) => workflowBlocked(w)).forEach((w, i) =>
      out.push(sig("jobs", i, { id: `wf-${w.id}`, title: w.name, status: w.status, date: w.createdAt, dueDate: w.dueDate, linkedResource: w.linkedResource, route: "/dashboard/workflows" }))
    );
  }

  return out;
}

const getStr = (v: unknown, paths: string[]) => getStringFromPaths(v, paths);
const getDate = (v: unknown, paths: string[]) => getDateFromPaths(v, paths);
const getList = (v: unknown) => normalizeList(v, ["", "data", "result", "items", "results", "data.items", "notifications", "records"]);

/** Map a dedicated /api/v1/notifications payload into signals (used only when that endpoint exists). */
export function normalizeNotificationFeed(value: unknown): GovernanceSignal[] {
  const list = getList(value);
  return list.map((entry, i) => {
    const categoryRaw = getStr(entry, ["category", "type", "source", "module"]);
    const key = resolveKey(categoryRaw);
    return {
      id: `notif-${getStr(entry, ["id", "uuid", "notification_id"]) ?? i}`,
      title: getStr(entry, ["title", "message", "subject", "summary", "text"]) || "Notification",
      categoryKey: key,
      category: categoryRaw || SIGNAL_META[key].label,
      severity: getStr(entry, ["severity", "priority", "level"]),
      status: getStr(entry, ["status", "state", "read"]),
      date: getDate(entry, ["created_at", "timestamp", "date", "sent_at"]),
      dueDate: getDate(entry, ["due_date", "deadline"]),
      linkedResource: getStr(entry, ["resource", "linked_resource", "target", "reference"]),
      source: categoryRaw || "Notification",
      route: SIGNAL_META[key].route,
      resolvedAt: getDate(entry, ["resolved_at", "read_at"])
    };
  });
}

function resolveKey(category: string | null): SignalCategoryKey {
  const c = (category || "").toLowerCase();
  if (/incident/.test(c)) return "incidents";
  if (/risk/.test(c)) return "risks";
  if (/regulat|deadline/.test(c)) return "regulatory";
  if (/approval/.test(c)) return "approvals";
  if (/assurance|review/.test(c)) return "assurance";
  if (/question/.test(c)) return "questionnaires";
  if (/integration|sync/.test(c)) return "integrations";
  if (/job|automation|workflow/.test(c)) return "jobs";
  return "alerts";
}

const RESOLVED = ["resolved", "closed", "complete", "completed", "approved", "delivered", "done", "success", "succeeded", "mitigated"];
const HIGH = ["critical", "high", "urgent", "severe"];

export function isResolved(sgnl: GovernanceSignal): boolean {
  if (sgnl.resolvedAt) return true;
  const s = (sgnl.status || "").toLowerCase();
  return RESOLVED.some((x) => s.includes(x));
}
export function isOpen(sgnl: GovernanceSignal): boolean {
  return !isResolved(sgnl);
}
export function isHighPriority(sgnl: GovernanceSignal): boolean {
  const v = (sgnl.severity || "").toLowerCase();
  return HIGH.some((x) => v.includes(x));
}
/** Overdue only with a real due date in the past and not resolved. */
export function isOverdue(sgnl: GovernanceSignal): boolean {
  if (isResolved(sgnl)) return false;
  if (!sgnl.dueDate) return false;
  return new Date(sgnl.dueDate).getTime() < Date.now();
}

export function severityTone(severity: string | null): "good" | "warn" | "bad" | "neutral" {
  if (!severity) return "neutral";
  const v = severity.toLowerCase();
  if (HIGH.some((x) => v.includes(x))) return "bad";
  if (/(medium|moderate)/.test(v)) return "warn";
  if (/(low|minor|info)/.test(v)) return "good";
  return "neutral";
}
