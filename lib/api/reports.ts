import { apiFetch, ApiError } from "@/lib/api/client";

export function getReports() {
  return apiFetch<unknown>("/api/v1/reports?limit=100");
}

/**
 * Report templates are optional. This backend has no `/reports/templates` route — the path resolves
 * against `/reports/{report_id}` and is rejected as an invalid UUID (422). Treat that (and 404/405/501)
 * as "no templates" so the UI shows a graceful empty state instead of a scary error.
 */
export async function getReportTemplates() {
  try {
    return await apiFetch<unknown>("/api/v1/reports/templates");
  } catch (err) {
    if (err instanceof ApiError && [404, 405, 422, 501].includes(err.status)) return { items: [] };
    throw err;
  }
}

export type GenerateReportInput = {
  type?: string | null;
  framework?: string | null;
  ai_system?: string | null;
  date_from?: string | null;
  date_to?: string | null;
  include_evidence?: boolean;
  include_risks?: boolean;
  include_incidents?: boolean;
};

export function generateReport(input: GenerateReportInput) {
  return apiFetch<unknown>("/api/v1/reports/generate", {
    method: "POST",
    body: JSON.stringify(input)
  });
}
