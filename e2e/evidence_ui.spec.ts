import { test, expect } from "playwright/test";
import { execSync } from "child_process";
import { BASE_API, ORG_ID } from "./routes";
import { apiLogin } from "./apihelpers";

// Evidence Vault UI E2E (admin): real create + file upload + signed-URL download,
// control-linking from both surfaces, and the AI-assessment display (present +
// gracefully-absent). Backend :8600 is backed by a moto S3 acting as R2, so file
// upload + presigned download are real.
const PSQL = `PGPASSWORD=complivibe_test_local_only psql -h localhost -U complivibe_test_user -d complivibe_loadtest -tAc`;

function seedAiAssessment(evidenceId: string, status: string) {
  // Insert a real evidence_ai_assessments row (the async drain would normally do
  // this) so the detail view's "present" state can be exercised deterministically.
  const sql = `INSERT INTO evidence_ai_assessments
    (id, organization_id, evidence_item_id, ai_assessment_status, appears_to_be, appears_to_cover, missing_or_mismatched_json, explanation, content_source, extracted_text_chars, assessment_version, created_at, updated_at)
    VALUES (gen_random_uuid(), '${ORG_ID}', '${evidenceId}', '${status}', 'a SOC 2 report', 'access control CC6.1', '[]'::jsonb, 'The document appears to support the linked control; suggestion only.', 'r2_file', 100, 1, now(), now());`;
  execSync(`${PSQL} "${sql}"`, { shell: "/bin/bash" });
}

test("evidence: create with real file upload, persists, downloadable via signed URL", async ({ page }, testInfo) => {
  const title = `PartD E2E Evidence ${Date.now()}`;
  await page.goto("/dashboard/evidence");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.getByTestId("new-evidence").click();
  await page.locator("#evidence-title").waitFor({ state: "visible", timeout: 10_000 });
  await page.fill("#evidence-title", title);
  // File mode (default): attach a real allowed (.txt) file.
  await page.getByTestId("mode-file").click().catch(() => {});
  await page.setInputFiles("#evidence-file", {
    name: "partd-evidence.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("SOC2 Type II evidence body — access control CC6.1"),
  });
  await page.getByTestId("evidence-submit").click();

  // Re-fetch: the new evidence appears in the vault.
  await page.waitForTimeout(2500);
  await page.goto("/dashboard/evidence");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1000);
  await expect(page.getByText(title, { exact: false }).first(), "created evidence should appear in the vault").toBeVisible({ timeout: 10_000 });

  // Open detail, then download → capture the signed URL and confirm it serves the bytes.
  await page.getByText(title, { exact: false }).first().click();
  const dl = page.getByTestId("evidence-download");
  await expect(dl, "download button should show for a file-backed evidence item").toBeVisible({ timeout: 10_000 });
  const [urlResp] = await Promise.all([
    page.waitForResponse((r) => r.url().includes("/file-url"), { timeout: 10_000 }),
    dl.click(),
  ]);
  const { url } = await urlResp.json();
  const signed = await page.request.get(url);
  await testInfo.attach("download", { body: JSON.stringify({ status: signed.status(), host: new URL(url).host }, null, 2), contentType: "application/json" });
  expect(signed.status(), "signed URL should serve the stored file").toBe(200);
  expect(await signed.text()).toContain("access control CC6.1");
});

test("evidence: AI assessment shows a graceful 'not yet assessed' state when absent", async ({ page }) => {
  // A brand-new evidence item has no assessment row yet (drain is async) -> the
  // endpoint 404s -> the UI must show a pending state, NOT an error.
  const admin = await apiLogin(page.request, "partd-admin@example.com");
  const created = await (await page.request.post(`${BASE_API}/api/v1/evidence`, { headers: { ...admin.headers, "Content-Type": "application/json" }, data: { title: `PartD AI-absent ${Date.now()}`, evidence_type: "document" } })).json();
  await page.goto("/dashboard/evidence");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(800);
  await page.getByText(created.title, { exact: false }).first().click();
  await expect(page.getByTestId("evidence-ai-pending"), "absent assessment must render a graceful pending state").toBeVisible({ timeout: 10_000 });
});

test("evidence: AI assessment displays (as a labeled suggestion) when present, distinct from human review", async ({ page }) => {
  const admin = await apiLogin(page.request, "partd-admin@example.com");
  const created = await (await page.request.post(`${BASE_API}/api/v1/evidence`, { headers: { ...admin.headers, "Content-Type": "application/json" }, data: { title: `PartD AI-present ${Date.now()}`, evidence_type: "document" } })).json();
  seedAiAssessment(created.id, "suggested_valid");
  await page.goto("/dashboard/evidence");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(800);
  await page.getByText(created.title, { exact: false }).first().click();
  const aiStatus = page.getByTestId("evidence-ai-status");
  await expect(aiStatus, "present assessment status should render").toBeVisible({ timeout: 10_000 });
  // review_status (human verdict) and the AI suggestion must be visually separate.
  await expect(page.getByText(/AI suggestion — not a verdict/i).first()).toBeVisible();
  await expect(page.getByText(/Human review/i).first()).toBeVisible();
});

test("evidence: linking to a control produces the same link from vault and from inline-control", async ({ page }) => {
  const admin = await apiLogin(page.request, "partd-admin@example.com");
  // pick a real control
  const controls = await (await page.request.get(`${BASE_API}/api/v1/controls?limit=5`, { headers: admin.headers })).json();
  const control = controls[0];

  // --- Surface A: inline attach-from-control (controls page) ---
  const evA = await (await page.request.post(`${BASE_API}/api/v1/evidence`, { headers: { ...admin.headers, "Content-Type": "application/json" }, data: { title: `PartD LinkA ${Date.now()}`, evidence_type: "document" } })).json();
  await page.goto("/dashboard/controls");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(800);
  await page.getByTestId(`attach-evidence-${control.id}`).click();
  await page.getByTestId("attach-mode-existing").click().catch(() => {});
  await page.selectOption("#attach-evidence-select", { label: evA.title }).catch(async () => {
    await page.selectOption("#attach-evidence-select", evA.id);
  });
  await page.getByTestId("attach-existing-submit").click();
  await page.waitForTimeout(1500);
  const detailA = await (await page.request.get(`${BASE_API}/api/v1/evidence/${evA.id}`, { headers: admin.headers })).json();
  const linkedA = (detailA.linked_controls || []).some((c: { control_id: string }) => c.control_id === control.id);

  expect(linkedA, "inline attach-from-control should create the control link").toBe(true);
  const linkShapeA = (detailA.linked_controls || []).find((c: { control_id: string }) => c.control_id === control.id);
  expect(linkShapeA, "linked control carries control_id + title + status").toHaveProperty("title");
  expect(linkShapeA).toHaveProperty("status");

  // --- Surface B: vault create modal, check the SAME control in the link picker ---
  const titleB = `PartD LinkB ${Date.now()}`;
  await page.goto("/dashboard/evidence");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.getByTestId("new-evidence").click();
  await page.locator("#evidence-title").waitFor({ state: "visible", timeout: 10_000 });
  await page.fill("#evidence-title", titleB);
  await page.getByTestId("mode-url").click().catch(() => {});
  await page.fill("#evidence-url", "https://example.com/partd-evidence-b").catch(() => {});
  await page.locator("label", { hasText: control.title }).locator('input[type="checkbox"]').first().check();
  await page.getByTestId("evidence-submit").click();
  await page.waitForTimeout(2000);

  // Find the created evidence B and confirm it links the same control with the same shape.
  const all = await (await page.request.get(`${BASE_API}/api/v1/evidence?limit=100&search=${encodeURIComponent(titleB)}`, { headers: admin.headers })).json();
  const evB = all.find((e: { title: string }) => e.title === titleB);
  expect(evB, "vault-created evidence B should exist").toBeTruthy();
  const detailB = await (await page.request.get(`${BASE_API}/api/v1/evidence/${evB.id}`, { headers: admin.headers })).json();
  const linkShapeB = (detailB.linked_controls || []).find((c: { control_id: string }) => c.control_id === control.id);
  expect(linkShapeB, "vault-surface link should create the SAME control link").toBeTruthy();
  // Both surfaces produce the identical link shape (control_id + title + status).
  expect(Object.keys(linkShapeB).sort()).toEqual(Object.keys(linkShapeA).sort());
});
