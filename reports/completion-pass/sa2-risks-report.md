# SA-2 (Risks) — Completion-Pass Report

Agent: `sa2-risks` · Domain: `app/dashboard/risks`, `components/risks/`, backend `/api/v1/risks*`
Verification: `node scripts/verify-risks.mjs` — PASS, zero console errors. Evidence in `reports/completion-pass/sa2-risks/`.

## What was built

1. **Risk CREATE** — "New Risk" button in `RisksHeader` opens a glass form modal (`RiskFormModal`) that POSTs `/api/v1/risks`.
   - Field options are taken from the live schema (`reports/live-openapi.json`), documented in `lib/api/risks.ts`:
     - likelihood / impact: integers 1–5 (RiskCreate min/max) — segmented 1–5 pickers.
     - treatment_strategy: schema pattern `mitigate|accept|transfer|avoid|undecided`.
     - category: **free string in the schema** (default `"other"`, no enum). The offered set is the backend's formally recognised categories from `app/api/v1/risk_appetite.py` `ALL_RISK_CATEGORIES` (operational, financial, compliance, reputational, technology, vendor, ai_governance) plus `other`. Backend-generated categories (`ai`, `privacy`, `security`, `third_party` exist in live data) are preserved verbatim when editing such a risk.
   - Owner selection from real users: `GET /api/v1/users`, filtered to `is_active && status === "active"` because the backend 400s otherwise (`ensure_owner_is_active_member`). In the demo org only Phase A Admin is active; Priya/Dev are inactive and honestly excluded.

2. **Risk EDIT** — same modal in edit mode, PATCH `/api/v1/risks/{id}` sending **only changed fields** (backend uses `model_fields_set`). Editable: title, description, category, status (RiskUpdate pattern: identified/assessing/treatment_planned/in_treatment/accepted/mitigated/monitored/archived), likelihood, impact, treatment strategy, owner. Edit entry points: pencil button on every Risk Register row + via the matrix (below).

3. **Interactive risk matrix** — matrix cells (from `GET /api/v1/risks/heatmap`) are now buttons; clicking a non-empty cell opens a panel listing that cell's risks; clicking a risk opens the real edit modal. All mutations invalidate `["risks"]`, `["risk-summary"]`, `["risk-heatmap"]`, so register, KPIs, and matrix update live without reload; a risk moves cells when likelihood/impact change.

4. **Shared Modal** — reused `components/ui/Modal.tsx` added by a parallel agent (checked before writing; did not duplicate).

5. **Error surfacing** — backend errors (`422` detail arrays, `400`, `403`, `503`) render verbatim in the form via `ApiError` from `lib/api/client.ts`, never swallowed.

## Live verification evidence (all via real UI clicks, Playwright)

Run log (`sa2-risks/evidence.json`):

- Baseline: cell L2×I2 = "0 risks", cell L5×I5 = "0 risks" (screenshot `01-risks-page-before.png`).
- **CREATE via UI**: filled form (title "UI-Verify 799915: unpatched CVE backlog in build agents", category technology, owner Phase A Admin, L2×I2, treatment mitigate) — `02-create-form-filled.png`. After submit, register showed the risk and matrix cell 2-2 flipped to "1 risk" **without reload** — `03-after-create-matrix-2x2.png`.
- **API confirmation of create**: `GET /api/v1/risks` → `id dfaed130-222d-4004-a9d3-c7305dc0e2bd`, likelihood 2, impact 2, inherent_score 4, status identified, treatment mitigate, owner 3f3e1996-7e0c-4268-ac2e-5f34248b1852.
- **EDIT via matrix interaction**: clicked cell 2-2 (`04-matrix-cell-selected.png`), clicked the risk in the cell panel, set likelihood 5, impact 5, status in_treatment (`05-edit-form-from-matrix.png`), saved.
- **Matrix moved live, no reload**: cell 2-2 → "0 risks", cell 5-5 → "1 risk" (`06-after-edit-matrix-5x5.png`; the emptied selected-cell panel honestly shows "No risks remain in this cell").
- **API confirmation of edit**: `GET /api/v1/risks/{id}` → likelihood 5, impact 5, inherent_score 25, status in_treatment, severity critical. `GET /api/v1/risks/heatmap` cell 5-5 count 1 containing the risk.
- Console errors during the whole flow: **zero**. `npx tsc --noEmit`: clean.

## Real backend observations / gaps (not worked around)

- `Risk.category` is an unconstrained `String(32)` with no enum anywhere in the API schema; there is no endpoint listing valid categories. The form offers the risk-appetite-recognised set + `other` (provenance commented in `lib/api/risks.ts`). Anything else in live data is backend-generated and displayed/preserved as-is.
- Editing likelihood/impact does **not** recompute `residual_score` (backend seeds residual = inherent at create and only changes it when residual fields are PATCHed): the verified risk now shows inherent 25 → residual 4. The register already displayed `inherent → residual` before my change; this is honest backend state, noted for a future residual-scoring pass.
- Only 1 of 3 demo-org users is an active member, so the owner picker legitimately offers a single owner (plus "Unassigned").
- The heatmap payload carries only `{id, title, inherent_score, residual_score}` per risk; the edit affordance resolves the full record from the register query (limit 100) and shows an explicit message if a heatmap risk falls outside the loaded page instead of guessing.

## Files touched

- `lib/api/risks.ts` — added schema-sourced constants, `createRisk` (POST), `updateRisk` (PATCH), payload types.
- `lib/api/users.ts` — new: `getOrgUsers` (GET /api/v1/users, UserRead).
- `lib/hooks/useRisks.ts` — added `useCreateRisk`, `useUpdateRisk` (react-query mutations with invalidation of risks/risk-summary/risk-heatmap), `useOrgUsers`.
- `components/risks/RiskFormModal.tsx` — new create/edit form modal.
- `components/risks/RisksHeader.tsx` — "New Risk" action + create modal.
- `components/risks/RiskMatrix.tsx` — interactive cells, cell risk panel, edit modal wiring.
- `components/risks/RiskRegister.tsx` — per-row edit button + edit modal.
- `scripts/verify-risks.mjs` — new live verification script.

Note: the live verification run intentionally left one real risk in the backend ("UI-Verify 799915: unpatched CVE backlog in build agents", now L5×I5, in_treatment) as re-checkable evidence.
