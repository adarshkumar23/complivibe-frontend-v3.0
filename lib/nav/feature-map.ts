// Central route -> required plan feature map. The SINGLE source of truth used by
// both the sidebar (to lock nav items) and the dashboard layout (to guard direct
// URLs). Only Category-C (premium, fully-locked-for-Free) domains appear here.
//
// Deliberately ABSENT (navigable for Free): the Category-B "view-only" domains
// (policies, controls, evidence, risks, vendor-risk, privacy, privacy/dpdp,
// employee-compliance, regulatory, reports, approvals) and every Category-D
// route (dashboard, search, compliance, billing, settings, notifications,
// security). Free can read those; only their WRITES are gated (Stage 1 banner).
export const LOCKED_ROUTE_FEATURES: { prefix: string; feature: string }[] = [
  // AI Governance suite
  { prefix: "/dashboard/ai-systems", feature: "ai_governance_module" },
  { prefix: "/dashboard/ai-testing", feature: "ai_governance_module" },
  { prefix: "/dashboard/ai-monitoring", feature: "ai_governance_module" },
  { prefix: "/dashboard/drift", feature: "ai_governance_module" },
  { prefix: "/dashboard/agents", feature: "ai_governance_module" },
  // Intelligence / analytics
  { prefix: "/dashboard/trust-graph", feature: "advanced_analytics" },
  { prefix: "/dashboard/insights", feature: "advanced_analytics" },
  { prefix: "/dashboard/score-explainer", feature: "advanced_analytics" },
  { prefix: "/dashboard/simulation", feature: "advanced_analytics" },
  // Data governance (covers /data-observability and /data-observability/lineage)
  { prefix: "/dashboard/data-observability", feature: "data_governance" },
  // Integrations
  { prefix: "/dashboard/integrations", feature: "integrations_module" },
  { prefix: "/dashboard/cloud-connectors", feature: "integrations_module" },
  { prefix: "/dashboard/webhooks", feature: "integrations_module" },
  // Governance autopilot
  { prefix: "/dashboard/automation", feature: "governance_autopilot" },
  { prefix: "/dashboard/autopilot", feature: "governance_autopilot" },
  { prefix: "/dashboard/workflows", feature: "governance_autopilot" },
  // Audit & assurance
  { prefix: "/dashboard/audit-pack", feature: "audit_assurance" },
  { prefix: "/dashboard/assurance", feature: "audit_assurance" },
  // Identity governance / enterprise
  { prefix: "/dashboard/certifications", feature: "identity_governance" },
  { prefix: "/dashboard/enterprise", feature: "identity_governance" },
  // Questionnaires / trust center
  { prefix: "/dashboard/trust-center", feature: "questionnaire_management" },
  { prefix: "/dashboard/questionnaires", feature: "questionnaire_management" },
  // Advanced privacy (whistleblower/legal)
  { prefix: "/dashboard/legal", feature: "privacy_advanced" },
];

/** The feature a given path requires, or null if the route is free/navigable.
 * Longest-prefix wins so nested routes resolve to their most specific mapping. */
export function featureForPath(pathname: string): string | null {
  let best: { prefix: string; feature: string } | null = null;
  for (const entry of LOCKED_ROUTE_FEATURES) {
    if (pathname === entry.prefix || pathname.startsWith(entry.prefix + "/")) {
      if (!best || entry.prefix.length > best.prefix.length) best = entry;
    }
  }
  return best?.feature ?? null;
}
