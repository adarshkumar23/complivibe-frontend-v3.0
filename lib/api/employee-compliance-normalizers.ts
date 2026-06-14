import { getStringFromPaths, getDateFromPaths, normalizeList } from "@/lib/api/normalizers";

// Reuse audited normalizers for policies and evidence.
export { normalizePolicies, statusTone } from "@/lib/api/policy-normalizers";
export type { Policy } from "@/lib/api/policy-normalizers";
export { normalizeEvidenceItems } from "@/lib/api/evidence-normalizers";

/* ----------------------------- Employee roster (backend-safe metadata only) ----------------------------- */
export type RosterMember = {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  status: string | null;
  complianceStatus: string | null;
  lastActivity: string | null;
};

export function normalizeRoster(value: unknown): RosterMember[] {
  return normalizeList(value, ["", "data", "result", "items", "results", "team", "members", "users", "employees"]).map((entry, i) => ({
    id: getStringFromPaths(entry, ["id", "uuid", "user_id", "member_id", "employee_id"]) || `employee-${i}`,
    name: getStringFromPaths(entry, ["name", "full_name", "display_name"]),
    email: getStringFromPaths(entry, ["email", "email_address"]),
    role: getStringFromPaths(entry, ["role", "role_name", "title", "department"]),
    status: getStringFromPaths(entry, ["status", "state", "membership_status"]),
    complianceStatus: getStringFromPaths(entry, ["compliance_status", "compliance", "training_status", "acknowledgement_status", "onboarding_status"]),
    lastActivity: getDateFromPaths(entry, ["last_active", "last_active_at", "last_seen", "last_login", "last_activity"])
  }));
}

/* ----------------------------- Policy acknowledgements ----------------------------- */
export type Acknowledgement = {
  id: string;
  policy: string | null;
  member: string | null;
  status: string | null;
  acknowledgedDate: string | null;
  dueDate: string | null;
  evidence: string | null;
};

export function normalizeAcknowledgements(value: unknown): Acknowledgement[] {
  return normalizeList(value, ["", "data", "result", "items", "results", "acknowledgements", "acknowledgments", "records"]).map((entry, i) => ({
    id: getStringFromPaths(entry, ["id", "uuid", "acknowledgement_id", "acknowledgment_id"]) || `ack-${i}`,
    policy: getStringFromPaths(entry, ["policy", "policy_name", "document", "title", "name"]),
    member: getStringFromPaths(entry, ["user", "member", "employee", "user_email", "user_name", "assignee"]),
    status: getStringFromPaths(entry, ["status", "state", "acknowledgement_status"]),
    acknowledgedDate: getDateFromPaths(entry, ["acknowledged_at", "acknowledged_date", "signed_at", "completed_at"]),
    dueDate: getDateFromPaths(entry, ["due_date", "deadline", "due_at"]),
    evidence: getStringFromPaths(entry, ["evidence", "evidence_url", "evidence_id", "reference"])
  }));
}

/* ----------------------------- Training / attestations ----------------------------- */
export type ComplianceTask = {
  id: string;
  name: string;
  type: string | null;
  assignee: string | null;
  status: string | null;
  dueDate: string | null;
  completedDate: string | null;
};

export function normalizeComplianceTasks(value: unknown, kind: "training" | "attestation"): ComplianceTask[] {
  const fallback = kind === "attestation" ? "Attestation" : "Training";
  return normalizeList(value, ["", "data", "result", "items", "results", "trainings", "training", "attestations", "courses", "assignments", "records"]).map((entry, i) => ({
    id: getStringFromPaths(entry, ["id", "uuid", "training_id", "attestation_id", "course_id"]) || `${kind}-${i}`,
    name: getStringFromPaths(entry, ["name", "title", "course", "training_name", "attestation_name", "subject"]) || fallback,
    type: getStringFromPaths(entry, ["type", "category", "kind"]),
    assignee: getStringFromPaths(entry, ["assignee", "user", "member", "employee", "assigned_to", "user_email", "team"]),
    status: getStringFromPaths(entry, ["status", "state", "progress_status", "completion_status"]),
    dueDate: getDateFromPaths(entry, ["due_date", "deadline", "due_at"]),
    completedDate: getDateFromPaths(entry, ["completed_at", "completed_date", "finished_at"])
  }));
}

/* ----------------------------- Status helpers (real fields only) ----------------------------- */
export function isComplete(status: string | null): boolean {
  return !!status && /(complete|completed|done|acknowledged|signed|passed|fulfilled|closed|approved)/i.test(status);
}

/** Overdue only when the backend flags it, or a real due date is in the past and the item is not complete. */
export function isOverdue(dueDate: string | null, status: string | null): boolean {
  if (status && /(overdue|breach|past due|expired)/i.test(status)) return true;
  if (!dueDate) return false;
  if (isComplete(status)) return false;
  return new Date(dueDate).getTime() < Date.now();
}

export function complianceStatusTone(status: string | null): "good" | "warn" | "bad" | "neutral" {
  if (!status) return "neutral";
  const s = status.toLowerCase();
  if (/(overdue|breach|failed|non[- ]?compliant|expired|past due)/.test(s)) return "bad";
  if (/(complete|completed|compliant|acknowledged|signed|passed|fulfilled|up to date|current)/.test(s)) return "good";
  if (/(pending|in progress|assigned|review|awaiting|due)/.test(s)) return "warn";
  return "neutral";
}

export type OverdueAction = {
  id: string;
  title: string;
  type: string;
  assignee: string | null;
  dueDate: string | null;
  status: string | null;
};

export function collectOverdue(acks: Acknowledgement[], training: ComplianceTask[], attestations: ComplianceTask[]): OverdueAction[] {
  const out: OverdueAction[] = [];
  for (const a of acks) if (isOverdue(a.dueDate, a.status)) out.push({ id: `ack-${a.id}`, title: a.policy || "Policy acknowledgement", type: "Acknowledgement", assignee: a.member, dueDate: a.dueDate, status: a.status });
  for (const t of training) if (isOverdue(t.dueDate, t.status)) out.push({ id: `trn-${t.id}`, title: t.name, type: "Training", assignee: t.assignee, dueDate: t.dueDate, status: t.status });
  for (const t of attestations) if (isOverdue(t.dueDate, t.status)) out.push({ id: `att-${t.id}`, title: t.name, type: "Attestation", assignee: t.assignee, dueDate: t.dueDate, status: t.status });
  return out;
}
