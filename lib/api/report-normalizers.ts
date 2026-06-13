import {
  getStringFromPaths,
  getNumberFromPaths,
  getDateFromPaths,
  normalizeList
} from "@/lib/api/normalizers";

export type NormalizedReport = {
  id: string;
  rawId: string | null;
  title: string;
  type: string | null;
  status: string | null;
  framework: string | null;
  owner: string | null;
  format: string | null;
  url: string | null;
  size: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

const REPORT_LIST = ["", "data", "result", "items", "results", "data.items", "reports", "records"];

function humanSize(value: unknown): string | null {
  const n = getNumberFromPaths(value, ["size", "file_size", "bytes", "size_bytes"]);
  if (n == null) {
    return getStringFromPaths(value, ["size", "file_size", "size_label"]);
  }
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function normalizeReports(value: unknown): NormalizedReport[] {
  return normalizeList(value, REPORT_LIST).map((entry, index) => {
    const rawId = getStringFromPaths(entry, ["id", "uuid", "report_id"]);
    return {
      id: rawId || `report-${index}`,
      rawId,
      title: getStringFromPaths(entry, ["title", "name", "report_name", "report"]) || "Untitled report",
      type: getStringFromPaths(entry, ["type", "category", "report_type", "kind"]),
      status: getStringFromPaths(entry, ["status", "state", "generation_status"]),
      framework: getStringFromPaths(entry, ["framework", "framework_name", "standard", "regulation"]),
      owner: getStringFromPaths(entry, ["owner", "requested_by", "created_by", "generated_by", "author"]),
      format: getStringFromPaths(entry, ["format", "file_type", "file_format", "extension", "mime_type"]),
      url: getStringFromPaths(entry, ["download_url", "url", "file_url", "link", "export_url"]),
      size: humanSize(entry),
      createdAt: getDateFromPaths(entry, ["created_at", "generated_at", "createdAt", "requested_at"]),
      updatedAt: getDateFromPaths(entry, ["updated_at", "updatedAt", "completed_at", "generated_at"])
    };
  });
}

export type NormalizedTemplate = {
  id: string;
  name: string;
  type: string | null;
  framework: string | null;
  description: string | null;
  requiredInputs: string[];
};

export function normalizeReportTemplates(value: unknown): NormalizedTemplate[] {
  return normalizeList(value, ["", "data", "result", "items", "results", "templates", "report_templates"]).map((entry, index) => {
    const inputs = normalizeList(entry, ["required_inputs", "inputs", "parameters", "required_fields"]);
    const inputNames = inputs
      .map((i) => getStringFromPaths(i, ["name", "label", "field", "key"]))
      .filter((v): v is string => Boolean(v));
    // also accept a plain string array
    const rawArr = (entry as Record<string, unknown>).required_inputs;
    const stringInputs = Array.isArray(rawArr) ? rawArr.filter((x): x is string => typeof x === "string") : [];
    return {
      id: getStringFromPaths(entry, ["id", "uuid", "template_id", "key"]) || `template-${index}`,
      name: getStringFromPaths(entry, ["name", "title", "template_name"]) || "Untitled template",
      type: getStringFromPaths(entry, ["type", "category", "report_type"]),
      framework: getStringFromPaths(entry, ["framework", "standard", "regulation"]),
      description: getStringFromPaths(entry, ["description", "summary", "details"]),
      requiredInputs: inputNames.length ? inputNames : stringInputs
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

export function isFailed(status: string | null): boolean {
  if (!status) return false;
  const s = status.toLowerCase();
  return FAILED.some((x) => s.includes(x));
}

export function statusTone(status: string | null): "good" | "warn" | "bad" | "neutral" {
  if (!status) return "neutral";
  if (isFailed(status)) return "bad";
  if (isReady(status)) return "good";
  return "warn"; // pending / generating / queued
}

/** Count reports created/generated in the current calendar month. anyDates=false → no real dates. */
export function generatedThisMonth(reports: NormalizedReport[]): { count: number; anyDates: boolean } {
  const now = new Date();
  let count = 0;
  let anyDates = false;
  for (const r of reports) {
    const d = r.createdAt;
    if (!d) continue;
    anyDates = true;
    const dt = new Date(d);
    if (dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth()) count += 1;
  }
  return { count, anyDates };
}

export type ReportActivity = { id: string; title: string; action: string; status: string | null; timestamp: string };

export function reportActivity(reports: NormalizedReport[]): ReportActivity[] {
  const events: ReportActivity[] = [];
  for (const r of reports) {
    const ts = r.updatedAt || r.createdAt;
    if (!ts) continue;
    const action = isReady(r.status) ? "Generated" : isFailed(r.status) ? "Failed" : "Requested";
    events.push({ id: r.id, title: r.title, action, status: r.status, timestamp: ts });
  }
  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
