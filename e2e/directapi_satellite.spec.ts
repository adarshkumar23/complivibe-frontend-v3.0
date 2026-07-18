import { test, expect } from "playwright/test";
import { BASE_API, ORG_ID } from "./routes";
import { apiLogin, emailForPersona, type Session } from "./apihelpers";

// Direct-API RBAC matrix for the SATELLITE domains (incidents, legal, privacy,
// privacy/dpdp, enterprise, security, cloud-connectors, webhooks, ai-testing,
// billing, insights) plus the already-gated audit-pack/autopilot/employee-comp
// endpoints. The "unauthorized 403" + "authorized 2xx" halves.
//
// require_permission is a route dependency that fires BEFORE body validation
// (a non-writer POSTing a minimal/invalid body gets 403, not 422), so the
// non-writer 403 assertion holds regardless of payload. Writers with a fully
// valid payload get a real 2xx; where an endpoint needs an FK we don't build or
// hits an unconfigured backend (R2/Vault), writer2xx=false and we assert only
// "writer is NOT 403". Role/persona sets are cross-referenced against the live
// catalog (parent-verified): the standard writer set is {admin, compliance_manager};
// billing spend-cap and SDF-confirm are org:update / spend-cap:write = {admin} ONLY.

const ALL = ["admin", "compliance_manager", "reviewer_unassigned", "reviewer_assigned", "auditor", "readonly"];
const W = ["admin", "compliance_manager"]; // triad perms (owner has no persona)
const ADMIN_ONLY = ["admin"]; // org:update, billing_usage_spend_cap:write

test("directapi satellite: create/mutate RBAC per role (403 non-writers, 2xx writers)", async ({ request }, testInfo) => {
  const S: Record<string, Session> = {};
  for (const p of ALL) S[p] = await apiLogin(request, emailForPersona(p));
  const admin = S["admin"];
  const R = `${testInfo.workerIndex}-${Date.now()}`;
  const jok = async (r: import("playwright/test").APIResponse) => { expect(r.ok(), `setup ${r.url()} -> ${r.status()} ${await r.text()}`).toBeTruthy(); return r.json(); };

  // FK: one AI system (for the ai-risk assessment endpoint).
  const aisys = await jok(await request.post(`${BASE_API}/api/v1/ai-systems`, { headers: admin.headers, data: { name: `PartD FK AISys ${R}`, system_type: "internal_model" } }));

  type Ep = { key: string; path: string; allowed: string[]; writer2xx?: boolean; body: (s: Session, u: string) => Record<string, unknown> };
  const EPS: Ep[] = [
    // incidents -----------------------------------------------------------
    { key: "data:write (incident create)", path: "/api/v1/data-observability/incidents", allowed: W, writer2xx: false, body: (_s, u) => ({ title: `PartD Inc ${u}`, incident_type: "data_breach", severity: "medium", description: "d", data_asset_id: "00000000-0000-0000-0000-000000000000" }) },
    { key: "issues:write (issue create)", path: "/api/v1/compliance/issues", allowed: W, body: (s, u) => ({ title: `PartD Issue ${u}`, issue_type: "compliance_violation", severity: "medium", description: "d", owner_id: s.uid }) },
    // privacy -------------------------------------------------------------
    { key: "privacy:write (consent)", path: "/api/v1/privacy/consent", allowed: W, writer2xx: false, body: (_s, u) => ({ data_subject_identifier: `partd-${u}@ex.com`, purpose: "marketing", consent_mechanism: "explicit_opt_in", consent_given: true }) },
    { key: "privacy:write (DSAR)", path: "/api/v1/privacy/dsr", allowed: W, body: (_s, u) => ({ subject_name: `PartD ${u}`, subject_email: `partd-${u}@ex.com`, request_type: "access", data_subject_identifier: `partd-${u}@ex.com` }) },
    { key: "privacy:write (nomination)", path: "/api/v1/privacy/nominations", allowed: W, writer2xx: false, body: (_s, u) => ({ subject_identifier: `partd-${u}@ex.com`, nominee_name: "Nom", nominee_relationship: "family" }) },
    // privacy/dpdp SDF: suggest = privacy:read (ALL roles), confirm = org:update (admin only)
    { key: "privacy:read (SDF suggest, all roles POST)", path: "/api/v1/privacy/sdf-designation/suggest", allowed: ALL, writer2xx: false, body: () => ({}) },
    { key: "org:update (SDF confirm, admin-only)", path: "/api/v1/privacy/sdf-designation/confirm", allowed: ADMIN_ONLY, writer2xx: false, body: () => ({ is_significant_data_fiduciary: true, confirmed_value: true, rationale: "partd" }) },
    // enterprise ----------------------------------------------------------
    // business-unit create = compliance:write AND _require_org_admin -> owner/admin only (CM 403)
    { key: "compliance:write + org-admin (business unit, ADMIN-ONLY)", path: "/api/v1/compliance/business-units", allowed: ADMIN_ONLY, body: (_s, u) => ({ name: `PartD BU ${u}`, code: `PARTD-${u}` }) },
    { key: "recertification:write (access-cert campaign)", path: "/api/v1/access-certifications/campaigns", allowed: W, writer2xx: false, body: (_s, u) => ({ name: `PartD Camp ${u}`, campaign_type: "access_review", due_date: "2027-01-01" }) },
    // security ------------------------------------------------------------
    { key: "identity_governance:manage (NHI)", path: "/api/v1/non-human-identities", allowed: W, body: (s, u) => ({ name: `PartD NHI ${u}`, identity_type: "service_account", owner_user_id: s.uid }) },
    // cloud-connectors ----------------------------------------------------
    { key: "connectors:write (connector create)", path: "/api/v1/cloud-connectors", allowed: W, writer2xx: false, body: (_s, u) => ({ connector_type: "aws", display_name: `PartD Conn ${u}` }) },
    { key: "connectors:write (mapping rule)", path: "/api/v1/cloud-connectors/mapping-rules", allowed: W, writer2xx: false, body: (_s, u) => ({ finding_category: `partd.${u}`, target_control_common_tag: "AC-1", confidence: "deterministic_exact" }) },
    // webhooks ------------------------------------------------------------
    { key: "webhooks:write (endpoint create)", path: "/api/v1/compliance/webhook-endpoints", allowed: W, body: (_s, u) => ({ name: `PartD Hook ${u}`, url: "https://example.com/hook", event_types: ["issue.created"], secret: "supersecretvalue123456" }) },
    // ai-testing ----------------------------------------------------------
    { key: "ai_systems:write (ai-risk assessment)", path: "/api/v1/ai-governance/ai-risk/assessments", allowed: W, writer2xx: false, body: () => ({ ai_system_id: aisys.id, title: `PartD AIRisk ${R}` }) },
    // billing -------------------------------------------------------------
    { key: "billing_usage_spend_cap:write (ADMIN-ONLY, CM excluded)", path: "/api/v1/billing/usage/spend-cap", allowed: ADMIN_ONLY, body: () => ({ usage_spend_cap_enabled: true, usage_spend_cap_inr: 100000 }) },
    { key: "carbon_accounting:write (ingest key)", path: "/api/v1/carbon-accounting/api-key", allowed: W, body: () => ({}) },
    // insights (UNGATED in UI before this pass) ---------------------------
    { key: "ai_governance:write (generate recommendations)", path: `/api/v1/ai-governance/systems/${"REPL"}/generate-recommendations`, allowed: W, writer2xx: false, body: () => ({}) },
    // already-gated PARTIAL domains — endpoint-level RBAC (data-independent) ---
    { key: "audit:write (audit finding create)", path: "/api/v1/compliance/audit-findings?engagement_id=00000000-0000-0000-0000-000000000000", allowed: W, writer2xx: false, body: (_s, u) => ({ title: `PartD Finding ${u}` }) },
    { key: "audit:write (pbc item create)", path: "/api/v1/compliance/pbc-items?engagement_id=00000000-0000-0000-0000-000000000000", allowed: W, writer2xx: false, body: (_s, u) => ({ title: `PartD PBC ${u}` }) },
    { key: "ai_systems:write (autopilot execution intent)", path: "/api/v1/ai-governance/autopilot/execution-intents", allowed: W, writer2xx: false, body: () => ({}) },
    { key: "training_analytics:write (training record)", path: "/api/v1/training-analytics/records", allowed: W, writer2xx: false, body: () => ({}) },
  ];

  const results: Record<string, Record<string, number>> = {};
  for (const ep of EPS) {
    results[ep.key] = {};
    const path = ep.path.replace("REPL", aisys.id);
    for (const p of ALL) {
      const res = await request.post(`${BASE_API}${path}`, { headers: S[p].headers, data: ep.body(S[p], `${R}-${p}`) });
      results[ep.key][p] = res.status();
      if (ep.allowed.includes(p)) {
        expect(res.status(), `${p} (allowed) must NOT be 403 on ${ep.key}, got ${res.status()}`).not.toBe(403);
        if (ep.writer2xx !== false) expect(res.status(), `${p} (allowed) should get 2xx on ${ep.key}, got ${res.status()}`).toBeLessThan(300);
      } else {
        expect(res.status(), `${p} (denied) must be 403 on ${ep.key}, got ${res.status()}`).toBe(403);
      }
    }
  }

  // legal: whistleblower submit is PUBLIC/unauthenticated by design -- a caller
  // with NO auth headers still succeeds (reporter identity is never captured).
  const wb = await request.post(`${BASE_API}/api/v1/whistleblower/submit`, { data: { organization_id: ORG_ID, category: "fraud", description: `anonymous partd whistleblower report ${R}` } });
  results["whistleblower:submit (PUBLIC, no-auth)"] = { anon: wb.status() };
  expect(wb.status(), `public whistleblower submit should succeed without auth, got ${wb.status()} ${await wb.text()}`).toBeLessThan(300);

  await testInfo.attach("directapi-satellite", { body: JSON.stringify(results, null, 2), contentType: "application/json" });
  console.log("DIRECTAPI SATELLITE:\n" + JSON.stringify(results, null, 2));
});
