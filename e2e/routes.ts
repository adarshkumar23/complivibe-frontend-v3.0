// Shared persona + route definitions for the Part-D exhaustive FE pass.
export const BASE_UI = process.env.PARTD_UI ?? "http://127.0.0.1:3100";
export const BASE_API = process.env.PARTD_API ?? "http://127.0.0.1:8600";
export const ORG_ID = "abdf6304-d5c5-4cd7-a3a5-57a3d562831f"; // Nexaform
export const PW = "PartDPass123!";

export type Persona = { key: string; email: string; role: string };
export const PERSONAS: Persona[] = [
  { key: "admin", email: "partd-admin@example.com", role: "admin" },
  { key: "compliance_manager", email: "partd-cm@example.com", role: "compliance_manager" },
  { key: "reviewer_unassigned", email: "partd-rev-unassigned@example.com", role: "reviewer" },
  { key: "reviewer_assigned", email: "partd-rev-assigned@example.com", role: "reviewer" },
  { key: "auditor", email: "partd-auditor@example.com", role: "auditor" },
  { key: "readonly", email: "partd-readonly@example.com", role: "readonly" },
];

// All dashboard routes (filesystem page.tsx, excluding dynamic [id]/[...catchAll]).
export const ROUTES: string[] = [
  "/dashboard",
  "/dashboard/agents", "/dashboard/ai-monitoring", "/dashboard/ai-systems", "/dashboard/ai-testing",
  "/dashboard/alerts", "/dashboard/approvals", "/dashboard/assurance", "/dashboard/audit-pack",
  "/dashboard/automation", "/dashboard/autopilot", "/dashboard/billing", "/dashboard/certifications",
  "/dashboard/cloud-connectors", "/dashboard/compliance", "/dashboard/controls",
  "/dashboard/data-observability", "/dashboard/data-observability/lineage", "/dashboard/debug-sentry",
  "/dashboard/drift", "/dashboard/employee-compliance", "/dashboard/enterprise", "/dashboard/evidence",
  "/dashboard/executive", "/dashboard/incidents", "/dashboard/insights", "/dashboard/integrations",
  "/dashboard/legal", "/dashboard/notifications", "/dashboard/policies", "/dashboard/privacy",
  "/dashboard/privacy/dpdp", "/dashboard/questionnaires", "/dashboard/regulatory", "/dashboard/reports",
  "/dashboard/risks", "/dashboard/score-explainer", "/dashboard/search", "/dashboard/security",
  "/dashboard/settings", "/dashboard/simulation", "/dashboard/trust-center", "/dashboard/trust-graph",
  "/dashboard/vendor-risk", "/dashboard/webhooks", "/dashboard/workflows",
];

// The 5 stub/deferred pages that should show an honest "queued for Phase B" state.
export const STUB_ROUTES = [
  "/dashboard/agents", "/dashboard/alerts", "/dashboard/certifications",
  "/dashboard/questionnaires", "/dashboard/workflows",
];

// Console messages that are benign framework/browser noise, not app errors.
export const BENIGN_CONSOLE = [
  /Download the React DevTools/i,
  /\[Fast Refresh\]/i,
  /favicon/i,
  /Failed to load resource: the server responded with a status of 401/i, // pre-auth probes
];
