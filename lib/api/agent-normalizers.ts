import { getStringFromPaths, getNumberFromPaths, getDateFromPaths, normalizeList } from "@/lib/api/normalizers";

// Reuse audited normalizers for human-review sources.
export { normalizeApprovals, isPending } from "@/lib/api/approval-normalizers";
export type { ApprovalItem } from "@/lib/api/approval-normalizers";
export { normalizeAssuranceCases, isComplete as assuranceComplete } from "@/lib/api/assurance-normalizers";
export type { AssuranceCase } from "@/lib/api/assurance-normalizers";

/* ----------------------------- Agents (backend only) ----------------------------- */
export type Agent = {
  id: string;
  name: string;
  type: string | null;
  status: string | null;
  owner: string | null;
  lastRun: string | null;
  tasksCount: number | null;
  findingsCount: number | null;
};

export function normalizeAgents(value: unknown): Agent[] {
  return normalizeList(value, ["", "data", "result", "items", "results", "data.items", "agents", "records"]).map((entry, i) => ({
    id: getStringFromPaths(entry, ["id", "uuid", "agent_id"]) || `agent-${i}`,
    name: getStringFromPaths(entry, ["name", "title", "agent_name", "label"]) || "Agent",
    type: getStringFromPaths(entry, ["type", "agent_type", "category", "kind"]),
    status: getStringFromPaths(entry, ["status", "state", "health"]),
    owner: getStringFromPaths(entry, ["owner", "owner_name", "system", "linked_system", "scope"]),
    lastRun: getDateFromPaths(entry, ["last_run", "last_run_at", "last_executed", "updated_at", "last_active"]),
    tasksCount: getNumberFromPaths(entry, ["tasks_count", "task_count", "tasks", "processed"]),
    findingsCount: getNumberFromPaths(entry, ["findings_count", "finding_count", "findings", "issues_count"])
  }));
}

export function agentStatusTone(status: string | null): "good" | "warn" | "bad" | "neutral" {
  if (!status) return "neutral";
  const s = status.toLowerCase();
  if (/(error|failed|stopped|disabled|offline|unhealthy)/.test(s)) return "bad";
  if (/(active|running|enabled|healthy|online|idle|ready)/.test(s)) return "good";
  if (/(paused|pending|warning|degraded)/.test(s)) return "warn";
  return "neutral";
}

/* ----------------------------- Agent runs / jobs ----------------------------- */
export type AgentRun = {
  id: string;
  name: string;
  status: string | null;
  startedAt: string | null;
  completedAt: string | null;
  duration: string | null;
  result: string | null;
  linkedResource: string | null;
  error: string | null;
};

export function normalizeAgentRuns(value: unknown): AgentRun[] {
  return normalizeList(value, ["", "data", "result", "items", "results", "data.items", "runs", "jobs", "executions", "records"]).map((entry, i) => ({
    id: getStringFromPaths(entry, ["id", "uuid", "run_id", "job_id"]) || `run-${i}`,
    name: getStringFromPaths(entry, ["name", "title", "job_name", "agent", "agent_name", "task"]) || "Run",
    status: getStringFromPaths(entry, ["status", "state", "result_status"]),
    startedAt: getDateFromPaths(entry, ["started_at", "start_time", "created_at", "queued_at"]),
    completedAt: getDateFromPaths(entry, ["completed_at", "finished_at", "end_time", "ended_at"]),
    duration: getStringFromPaths(entry, ["duration", "elapsed", "runtime", "duration_ms"]),
    result: getStringFromPaths(entry, ["result", "outcome", "summary", "output"]),
    linkedResource: getStringFromPaths(entry, ["resource", "linked_resource", "target", "entity", "resource_type"]),
    error: getStringFromPaths(entry, ["error", "error_message", "last_error", "failure_reason"])
  }));
}

export function runStatusTone(status: string | null): "good" | "warn" | "bad" | "neutral" {
  if (!status) return "neutral";
  const s = status.toLowerCase();
  if (/(fail|error|cancel|timeout|abort)/.test(s)) return "bad";
  if (/(success|complete|completed|done|passed|ok)/.test(s)) return "good";
  if (/(running|queued|pending|in progress|started)/.test(s)) return "warn";
  return "neutral";
}

/* ----------------------------- Findings (real or derived from intelligence) ----------------------------- */
export type Finding = {
  id: string;
  title: string;
  source: string | null;
  severity: string | null;
  linkedResource: string | null;
  createdAt: string | null;
  reviewStatus: string | null;
};

export function normalizeFindings(value: unknown): Finding[] {
  return normalizeList(value, ["", "data", "result", "items", "results", "data.items", "findings", "insights", "alerts", "records"]).map((entry, i) => ({
    id: getStringFromPaths(entry, ["id", "uuid", "finding_id", "insight_id", "alert_id"]) || `finding-${i}`,
    title: getStringFromPaths(entry, ["title", "name", "summary", "message", "description"]) || "Finding",
    source: getStringFromPaths(entry, ["source", "agent", "category", "origin", "detector"]),
    severity: getStringFromPaths(entry, ["severity", "priority", "risk_level", "level"]),
    linkedResource: getStringFromPaths(entry, ["resource", "linked_resource", "target", "entity", "related"]),
    createdAt: getDateFromPaths(entry, ["created_at", "createdAt", "detected_at", "timestamp", "date"]),
    reviewStatus: getStringFromPaths(entry, ["review_status", "human_review", "review", "status", "state"])
  }));
}

export function severityTone(severity: string | null): "good" | "warn" | "bad" | "neutral" {
  if (!severity) return "neutral";
  const s = severity.toLowerCase();
  if (/(critical|high|severe)/.test(s)) return "bad";
  if (/(medium|moderate|warning)/.test(s)) return "warn";
  if (/(low|info|minor)/.test(s)) return "good";
  return "neutral";
}

/* ----------------------------- Coverage (derived from available records) ----------------------------- */
export type CoverageRow = { id: string; label: string; value: number | null };
