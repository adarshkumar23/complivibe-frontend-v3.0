import { test, expect } from "playwright/test";
import { BASE_API } from "./routes";
import { apiLogin, emailForPersona, CAN_WRITE, type Session } from "./apihelpers";

// Direct-API authorization (the "403" half of the both-sides pattern): independent
// of whether the UI hides the button, the BACKEND must reject a create from a
// persona without the write permission. Runs once per persona project. A writer
// ({admin, compliance_manager}) must get 2xx; every non-writer must get 403 --
// never 401 (that would mean auth failed, not authz) and never 422 (we send fully
// valid payloads so the ONLY possible failure is the permission gate).
type Domain = { key: string; path: string; body: (s: Session) => Record<string, unknown> };

const DOMAINS: Domain[] = [
  {
    key: "controls",
    path: "/api/v1/controls",
    body: () => ({ title: `PartD directapi control ${Date.now()}`, control_type: "technical", criticality: "medium" }),
  },
  {
    key: "policies",
    path: "/api/v1/compliance/policies",
    body: (s) => ({ title: `PartD directapi policy ${Date.now()}`, policy_type: "acceptable_use", owner_user_id: s.uid }),
  },
  {
    key: "vendors",
    path: "/api/v1/compliance/vendors",
    body: (s) => ({ name: `PartD directapi vendor ${Date.now()}`, vendor_type: "software", owner_user_id: s.uid }),
  },
];

test(`directapi: create-endpoint RBAC per role`, async ({ request }, testInfo) => {
  const persona = testInfo.project.name;
  const session = await apiLogin(request, emailForPersona(persona));
  const isWriter = CAN_WRITE.has(persona);
  const results: Record<string, number> = {};

  for (const d of DOMAINS) {
    const res = await request.post(`${BASE_API}${d.path}`, { headers: session.headers, data: d.body(session) });
    results[d.key] = res.status();
    if (isWriter) {
      expect(res.status(), `${persona} (writer) should be allowed to create ${d.key}`).toBeLessThan(300);
    } else {
      expect(res.status(), `${persona} (non-writer) must be 403 on create ${d.key}, got ${res.status()}`).toBe(403);
    }
  }

  await testInfo.attach("directapi", {
    body: JSON.stringify({ persona, isWriter, statuses: results }, null, 2),
    contentType: "application/json",
  });
  console.log(`DIRECTAPI ${persona} (writer=${isWriter}): ${JSON.stringify(results)}`);
});
