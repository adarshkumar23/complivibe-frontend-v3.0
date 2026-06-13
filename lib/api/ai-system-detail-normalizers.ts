import {
  getStringFromPaths,
  getNumberFromPaths,
  getDateFromPaths,
  normalizeList
} from "@/lib/api/normalizers";
import { severityFrom } from "@/lib/api/compliance-normalizers";
import type { Severity } from "@/lib/api/types";

const LIST = (extra: string[]) => ["", "data", "result", "items", "results", "data.items", ...extra];

/* ----------------------------- Profile ----------------------------- */
export type SystemProfile = {
  name: string | null;
  owner: string | null;
  useCase: string | null;
  model: string | null;
  vendor: string | null;
  lifecycleStage: string | null;
  riskLevel: Severity;
  hasRisk: boolean;
  region: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  score: number | null;
};

export function normalizeSystemProfile(...sources: unknown[]): SystemProfile {
  const str = (paths: string[]) => {
    for (const s of sources) {
      const v = getStringFromPaths(s, paths);
      if (v) return v;
    }
    return null;
  };
  const num = (paths: string[]) => {
    for (const s of sources) {
      const v = getNumberFromPaths(s, paths);
      if (v !== null) return v;
    }
    return null;
  };
  const date = (paths: string[]) => {
    for (const s of sources) {
      const v = getDateFromPaths(s, paths);
      if (v) return v;
    }
    return null;
  };
  const riskRaw = str(["risk_level", "riskLevel", "severity", "priority", "risk", "risk_rating"]);
  return {
    name: str(["name", "system_name", "title", "model_name"]),
    owner: str(["owner", "owner_name", "team", "business_owner", "responsible", "owned_by"]),
    useCase: str(["use_case", "useCase", "purpose", "description", "category", "function"]),
    model: str(["model", "model_name", "model_type", "base_model", "architecture"]),
    vendor: str(["vendor", "provider", "supplier", "manufacturer"]),
    lifecycleStage: str(["lifecycle_stage", "lifecycleStage", "stage", "status", "phase", "lifecycle"]),
    riskLevel: severityFrom(riskRaw),
    hasRisk: riskRaw != null,
    region: str(["region", "jurisdiction", "location", "deployment_region", "geography"]),
    createdAt: date(["created_at", "createdAt", "created", "registered_at"]),
    updatedAt: date(["updated_at", "updatedAt", "last_assessed", "last_updated", "modified_at"]),
    score: num(["governance_score", "compliance_score", "score", "health_score", "trust_score"])
  };
}

/* ----------------------------- Model card ----------------------------- */
export type ModelCardField = { label: string; value: string };

const MODEL_CARD_FIELDS: { label: string; paths: string[] }[] = [
  { label: "Intended use", paths: ["intended_use", "intendedUse", "purpose", "use_case"] },
  { label: "Model details", paths: ["model_details", "model", "architecture", "model_type"] },
  { label: "Training data", paths: ["training_data", "trainingData", "dataset", "data_sources"] },
  { label: "Performance", paths: ["performance", "metrics_summary", "evaluation"] },
  { label: "Limitations", paths: ["limitations", "known_limitations", "constraints"] },
  { label: "Ethical considerations", paths: ["ethical_considerations", "ethics", "fairness", "bias_considerations"] },
  { label: "Owner", paths: ["owner", "maintainer", "contact"] },
  { label: "Version", paths: ["version", "model_version", "revision"] }
];

export function normalizeModelCard(value: unknown): { fields: ModelCardField[]; hasAny: boolean } {
  const candidates = [value, ...normalizeList(value, ["model_card", "modelCard", "card"]).slice(0, 1)];
  const fields: ModelCardField[] = [];
  for (const { label, paths } of MODEL_CARD_FIELDS) {
    let found: string | null = null;
    for (const c of candidates) {
      found = getStringFromPaths(c, paths);
      if (found) break;
    }
    if (found) fields.push({ label, value: found });
  }
  return { fields, hasAny: fields.length > 0 };
}

/* ----------------------------- Evidence ----------------------------- */
export type DetailEvidence = { id: string; title: string; type: string | null; status: string | null; date: string | null };

export function normalizeDetailEvidence(value: unknown): DetailEvidence[] {
  return normalizeList(value, LIST(["evidence", "documents", "artifacts"])).map((entry, index) => ({
    id: getStringFromPaths(entry, ["id", "uuid", "evidence_id"]) || `evidence-${index}`,
    title: getStringFromPaths(entry, ["title", "name", "filename", "document", "description"]) || "Evidence item",
    type: getStringFromPaths(entry, ["type", "evidence_type", "category", "kind"]),
    status: getStringFromPaths(entry, ["status", "state", "freshness", "review_status"]),
    date: getDateFromPaths(entry, ["date", "created_at", "uploaded_at", "updated_at", "collected_at"])
  }));
}

/* ----------------------------- Testing ----------------------------- */
export type TestCategory = { label: string; value: number | null; status: string | null };

const TEST_FIELDS: { label: string; numPaths: string[]; statusPaths: string[] }[] = [
  { label: "Bias", numPaths: ["bias", "bias_score", "fairness_score"], statusPaths: ["bias_status", "bias.status"] },
  { label: "Safety", numPaths: ["safety", "safety_score"], statusPaths: ["safety_status", "safety.status"] },
  { label: "Hallucination", numPaths: ["hallucination", "hallucination_score", "factuality_score"], statusPaths: ["hallucination_status"] },
  { label: "Explainability", numPaths: ["explainability", "explainability_score", "interpretability"], statusPaths: ["explainability_status"] },
  { label: "Red team", numPaths: ["red_team", "red_team_score", "redteam_score", "adversarial_score"], statusPaths: ["red_team_status", "redteam_status"] }
];

export function normalizeTesting(value: unknown): { categories: TestCategory[]; overallStatus: string | null; hasAny: boolean } {
  const categories = TEST_FIELDS.map(({ label, numPaths, statusPaths }) => ({
    label,
    value: getNumberFromPaths(value, numPaths),
    status: getStringFromPaths(value, statusPaths)
  }));
  const overallStatus = getStringFromPaths(value, ["status", "overall_status", "testing_status", "result"]);
  const hasAny = categories.some((c) => c.value != null || c.status != null) || overallStatus != null;
  return { categories, overallStatus, hasAny };
}

/* ----------------------------- Violations ----------------------------- */
export type DetailViolation = { id: string; title: string; severity: Severity; hasSeverity: boolean; status: string | null; recommendation: string | null };

export function normalizeViolations(value: unknown): DetailViolation[] {
  return normalizeList(value, LIST(["violations", "risks", "findings", "issues"])).map((entry, index) => {
    const sevRaw = getStringFromPaths(entry, ["severity", "priority", "risk_level", "level"]);
    return {
      id: getStringFromPaths(entry, ["id", "uuid", "violation_id"]) || `violation-${index}`,
      title: getStringFromPaths(entry, ["title", "name", "rule", "summary", "description", "message"]) || "Violation",
      severity: severityFrom(sevRaw),
      hasSeverity: sevRaw != null,
      status: getStringFromPaths(entry, ["status", "state", "resolution"]),
      recommendation: getStringFromPaths(entry, ["recommendation", "remediation", "action", "fix"])
    };
  });
}

/* ----------------------------- Telemetry ----------------------------- */
export type TelemetrySeries = { value: number | null; unit: string | null; series: number[]; status: string | null };

function numberSeries(value: unknown, listPaths: string[], valuePaths: string[]): number[] {
  const arr = normalizeListLoose(value, listPaths);
  const out: number[] = [];
  for (const item of arr) {
    if (typeof item === "number" && Number.isFinite(item)) {
      out.push(item);
    } else {
      const n = getNumberFromPaths(item, valuePaths);
      if (n !== null) out.push(n);
    }
  }
  return out;
}

// like normalizeList but keeps raw items (numbers or records)
function normalizeListLoose(value: unknown, paths: string[]): unknown[] {
  const direct = normalizeList(value, paths);
  if (direct.length > 0) return direct;
  // try raw arrays under the same paths
  if (value && typeof value === "object") {
    for (const key of paths) {
      const v = (value as Record<string, unknown>)[key];
      if (Array.isArray(v)) return v;
    }
    const data = (value as Record<string, unknown>).data;
    if (Array.isArray(data)) return data;
  }
  return Array.isArray(value) ? (value as unknown[]) : [];
}

export function normalizeTelemetry(value: unknown, kind: "cost" | "drift" | "reliability"): TelemetrySeries {
  const valuePaths =
    kind === "cost"
      ? ["cost", "total_cost", "amount", "value", "spend"]
      : kind === "drift"
        ? ["drift", "drift_score", "score", "value", "psi"]
        : ["reliability", "uptime", "availability", "score", "value"];
  const series = numberSeries(value, ["series", "points", "history", "data", "timeline", "values"], valuePaths);
  return {
    value: getNumberFromPaths(value, [...valuePaths, "current", "latest"]),
    unit: getStringFromPaths(value, ["unit", "currency", "units"]),
    series,
    status: getStringFromPaths(value, ["status", "state", "trend", "drift_status"])
  };
}

/* ----------------------------- Oversight ----------------------------- */
export type OversightItem = { id: string; title: string; status: string | null; description: string | null };

export function normalizeOversight(value: unknown): OversightItem[] {
  return normalizeList(value, LIST(["oversight", "requirements", "controls", "approvals"])).map((entry, index) => ({
    id: getStringFromPaths(entry, ["id", "uuid", "control_id"]) || `oversight-${index}`,
    title: getStringFromPaths(entry, ["title", "name", "requirement", "control", "description"]) || "Oversight control",
    status: getStringFromPaths(entry, ["status", "state", "compliance"]),
    description: getStringFromPaths(entry, ["description", "details", "notes"])
  }));
}

/* ----------------------------- Lifecycle history ----------------------------- */
export type LifecycleEvent = { id: string; title: string; stage: string | null; timestamp: string | null };

export function normalizeLifecycleHistory(value: unknown): LifecycleEvent[] {
  return normalizeList(value, LIST(["lifecycle_history", "history", "events", "timeline", "stages"]))
    .map((entry, index) => ({
      id: getStringFromPaths(entry, ["id", "uuid", "event_id"]) || `lifecycle-${index}`,
      title: getStringFromPaths(entry, ["title", "name", "event", "action", "description", "stage"]) || "Lifecycle event",
      stage: getStringFromPaths(entry, ["stage", "status", "phase", "type"]),
      timestamp: getDateFromPaths(entry, ["timestamp", "created_at", "date", "occurred_at", "updated_at"])
    }))
    .sort((a, b) => {
      const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return tb - ta;
    });
}
