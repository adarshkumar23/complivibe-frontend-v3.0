# SA-9 Vendor Risk — Completion Report

Agent: `sa9-vendor-risk` · Verified live 2026-07-11 via `node scripts/verify-sa9-vendor-risk.mjs`
Evidence dir: `reports/completion-pass/sa9-vendor-risk/` (6 screenshots + `evidence.json` with full request/response proof).
Console errors across all flows: **zero**. `npx tsc --noEmit`: **zero errors in my files** (remaining errors are in `components/controls/LinkPolicyModal.tsx`, `components/policies/*`, `lib/hooks/useControls.ts`, `lib/hooks/usePolicies.ts` — other agents' domains, untouched by me).

## What I built

### 1. Vendor CREATE + EDIT (`VendorFormModal.tsx`)
- `POST /api/v1/compliance/vendors`, `PATCH /api/v1/compliance/vendors/{id}` — payloads typed from live schema: `vendor_type` limited to the real pattern set (`software|infrastructure|professional_services|data_processor|other`), `risk_tier`, `status` pattern sets as consts in `lib/api/vendor-risk.ts`.
- `owner_user_id` (REQUIRED on create) is picked from **real org users** via `GET /api/v1/users` (reused peer's `lib/api/users.ts`; inactive users labeled). Client-side guard + backend 422s surfaced in the form.
- Fields: name, type, owner, tier, status, website, annual spend, contact name/email, description, data-access / personal-data / sub-processor checkboxes. Edit mode prefills from the row (verified: prefill matched API values).
- "Add vendor" button on the Vendor Register card; per-row pencil (edit) and clipboard (assess) buttons.

### 2. Assessment creation (`VendorAssessmentModal.tsx`)
- `POST /api/v1/compliance/vendors/{id}/assessments` — `assessment_type` limited to real pattern (`initial|periodic|triggered|offboarding`), optional due date, assignee (real users), notes.
- Mutation invalidates `vendors`/`vendor-summary`/`vendor-concentration` so a past due date would flip the "Assessment overdue" badge without reload. I deliberately used a FUTURE due date (2026-08-15) in verification so as not to pollute the overdue demo signal — verified `is_overdue: false` and vendor `has_overdue_assessment: false` after creation.
- The existing overdue pipeline is intact: `P0-Verify Vendor (overdue check)` still present, still overdue, badge still renders (evidence.json `p0-vendor-intact`).

### 3. HHI / concentration risk — REAL computation wired (not a backend gap)
Investigated backend (`app/services/vendor_concentration_risk_service.py`, `app/api/v1/vendor_concentration_risk.py`):
- `POST /api/v1/vendor-concentration-risk/recompute` is a real, user-triggerable path: computes HHI over **active critical/high-tier vendors + active supply-chain links**, weighted by `annual_spend_amount` when captured; threshold default 1800 (DOJ/FTC); persists detection; creates a risk-register entry on breach.
- Wired: "Compute now" button on the empty state (honest description of the real inputs) and a "Recompute" action once computed; `useRecomputeConcentration` seeds the fresh detection into the react-query cache. Card now shows HHI vs threshold, top vendor share, exposures, linked risk, last-computed timestamp, methodology link. KPI tile updates too.

### Verified flows (all through the real UI, API-GET proof, no reload)
| Step | Proof |
|---|---|
| Create vendor `SA9 Verify Vendor 1783802314874` (data_processor, high, owner=admin, spend 250000, personal data) | API GET returned it: id `b5461b91-0889-420f-83d0-518a1173abea`; row appeared without reload (`03-created-in-list.png`) |
| Edit → name "(edited)", tier critical, spend 500000 | API GET: `risk_tier: critical`, `annual_spend_amount: "500000.00"` (`04-edited-in-list.png`) |
| Assessment "SA9 triggered review…" (triggered, due 2026-08-15) | API GET: status `draft`, `is_overdue: false` (`05-assessment-form.png`) |
| HHI compute via UI button | status `not_computed`→`breach`, hhi 0→**10000**, risk created `b2f1f566-cc1a-4eb9-88eb-940daa78d67b`; card + KPI tile updated without reload (`06-hhi-computed.png`) |

## Findings / notes for orchestrator
1. **HHI = 10000 (single-vendor 100% share) is real but skewed by partial spend coverage.** The backend weights by `annual_spend_amount` as soon as ANY in-scope vendor has spend captured; vendors without spend then weight 0. My test vendor is the only one with spend, so it shows as 100% of exposure. Not a bug per the service's own comments (deliberate fallback design), but worth knowing: capturing spend for the other 5 critical/high vendors (Razorpay, AWS India, Mailgun, Zendesk, P0-Verify) via the new edit form and hitting Recompute would produce a meaningful HHI. I did NOT invent spend figures for demo vendors (honest-data rule).
2. The breach recompute **created a real risk-register entry** (`b2f1f566-…`) naming my test vendor — expected backend behavior, left in place.
3. Minor backend quirk (no UI impact): `risk_tier_source` stays `"computed"` even when the tier is set explicitly through create/edit.
4. Reused shared `components/ui/Modal.tsx` and `lib/api/users.ts` created by a peer agent (no duplication).

## Files touched
- `lib/api/vendor-risk.ts` — create/update/assessment/recompute functions + pattern consts + types
- `lib/hooks/useVendorRisk.ts` — `useCreateVendor`, `useUpdateVendor`, `useCreateVendorAssessment`, `useRecomputeConcentration`, `useVendorOwners` (all invalidate vendor query keys → no-reload updates)
- `components/vendor-risk/VendorFormModal.tsx` (new), `components/vendor-risk/VendorAssessmentModal.tsx` (new)
- `components/vendor-risk/VendorRiskTable.tsx` — Add-vendor button, per-row edit/assess actions, modal wiring
- `components/vendor-risk/VendorEvidenceLinkage.tsx` — Compute-now / Recompute buttons, honest empty state, last-computed line, error surfacing
- `scripts/verify-sa9-vendor-risk.mjs` (new)
