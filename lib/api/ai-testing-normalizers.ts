import { getStringFromPaths, getNumberFromPaths, getDateFromPaths } from "@/lib/api/normalizers";

export { normalizeTesting, normalizeViolations } from "@/lib/api/ai-system-detail-normalizers";
export type { TestCategory, DetailViolation } from "@/lib/api/ai-system-detail-normalizers";

/** Test coverage % read only when the backend provides it. */
export function testCoverage(value: unknown): number | null {
  return getNumberFromPaths(value, ["coverage", "test_coverage", "coverage_percentage", "tests_passed_ratio", "pass_rate"]);
}

export function testNextReview(value: unknown): string | null {
  return getDateFromPaths(value, ["next_review", "next_test", "next_assessment", "next_review_date", "review_due"]);
}

export function testLastRun(value: unknown): string | null {
  return getDateFromPaths(value, ["last_tested", "last_run", "tested_at", "last_evaluated", "updated_at", "completed_at"]);
}

/** Overall test outcome derived from a REAL backend status string only. */
export function isTestPassed(status: string | null): boolean {
  if (!status) return false;
  return /(pass|passed|safe|cleared|success|ok|green)/i.test(status);
}

export function isTestFailed(status: string | null): boolean {
  if (!status) return false;
  return /(fail|failed|error|critical|blocked|red)/i.test(status);
}

export function needsReview(status: string | null): boolean {
  if (!status) return false;
  return /(review|pending|attention|warning|amber|in progress)/i.test(status);
}

export function testStatusTone(status: string | null): "good" | "warn" | "bad" | "neutral" {
  if (!status) return "neutral";
  if (isTestFailed(status)) return "bad";
  if (isTestPassed(status)) return "good";
  if (needsReview(status)) return "warn";
  return "neutral";
}

/**
 * Responsible-AI checks, read from a per-system testing summary payload.
 * Each check appears ONLY when the backend provides a real status or score for it.
 */
export type ResponsibleAiCheck = { label: string; status: string | null; score: number | null };

const RAI_FIELDS: { label: string; statusPaths: string[]; scorePaths: string[] }[] = [
  { label: "Fairness", statusPaths: ["fairness_status", "fairness.status"], scorePaths: ["fairness", "fairness_score"] },
  { label: "Bias", statusPaths: ["bias_status", "bias.status"], scorePaths: ["bias", "bias_score"] },
  { label: "Robustness", statusPaths: ["robustness_status", "robustness.status"], scorePaths: ["robustness", "robustness_score"] },
  { label: "Explainability", statusPaths: ["explainability_status", "explainability.status"], scorePaths: ["explainability", "explainability_score", "interpretability"] },
  { label: "Privacy", statusPaths: ["privacy_status", "privacy.status"], scorePaths: ["privacy", "privacy_score"] },
  { label: "Security", statusPaths: ["security_status", "security.status"], scorePaths: ["security", "security_score"] },
  { label: "Human oversight", statusPaths: ["human_oversight_status", "oversight_status", "human_oversight.status"], scorePaths: ["human_oversight", "human_oversight_score", "oversight_score"] },
  { label: "Data quality", statusPaths: ["data_quality_status", "data_quality.status"], scorePaths: ["data_quality", "data_quality_score"] }
];

export function normalizeResponsibleAiChecks(value: unknown): ResponsibleAiCheck[] {
  const checks: ResponsibleAiCheck[] = [];
  for (const { label, statusPaths, scorePaths } of RAI_FIELDS) {
    const status = getStringFromPaths(value, statusPaths);
    const score = getNumberFromPaths(value, scorePaths);
    if (status != null || score != null) checks.push({ label, status, score });
  }
  return checks;
}

export function checkTone(check: ResponsibleAiCheck): "good" | "warn" | "bad" | "neutral" {
  if (check.status) return testStatusTone(check.status);
  if (check.score != null) return check.score >= 70 ? "good" : check.score >= 40 ? "warn" : "bad";
  return "neutral";
}
