import { apiFetch } from "@/lib/api/client";

export function getReports() {
  return apiFetch<unknown>("/api/v1/reports?limit=100");
}

export function getReportTemplates() {
  return apiFetch<unknown>("/api/v1/reports/templates");
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
