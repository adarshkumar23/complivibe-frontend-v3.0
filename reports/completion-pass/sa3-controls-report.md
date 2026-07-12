# SA-3 Controls — Completion Report

Agent: `sa3-controls`. Domain: Controls (`app/dashboard/controls`, `components/controls/`, `/api/v1/controls*`, obligation/policy mapping).

## What was built

1. **Control CREATE** — "New control" button on the Control Register opens `ControlCreateModal`
   (POST `/api/v1/controls`): title, control code, control type, criticality, description, testing
   procedure. Real 422/403 backend errors surfaced in the form.
2. **Coverage-gap "map this" flow** — the "Obligations Without Controls" KPI (the 314/341 number)
   now carries a **Map this** action right on the card, and a new **Obligation Coverage Gaps** panel
   (`CoverageGapPanel`) lists per-framework obligations from
   GET `/api/v1/reports/framework-coverage-matrix?framework_id=` with coverage status
   (uncovered/partial/covered) and a **Map control** button per row. Both open
   `MapObligationModal`, which maps an existing control — or creates a new one inline — to the
   obligation via POST `/api/v1/controls/{control_id}/obligations`
   (mapping_type satisfies/partially_satisfies/supports/related + rationale).
3. **Link-to-policy** — per-row **Link policy** action on every control opens `LinkPolicyModal`
   (POST `/api/v1/compliance/policies/{policy_id}/links/controls` with link_reason).
4. **Link-to-obligation from a control row** — per-row **Link obligation** opens the same mapping
   modal with the control preset (framework → obligation pickers).
5. All mutations use react-query `useMutation` + `invalidateQueries` on `["controls"]`,
   `["control-gaps"]`, `["framework-coverage"]` — the KPI and gap panel update **without reload**.

## Endpoint reality check (from `reports/live-openapi.json` + live calls)

- There is **no backend endpoint that lists uncovered obligations org-wide**;
  `GET /api/v1/controls/gaps/summary` returns counts only. The real per-obligation coverage source
  is `GET /api/v1/reports/framework-coverage-matrix?framework_id=` (per framework, returns
  `coverage_status` per obligation) — the gap panel is built on it, scoped by a framework selector
  fed from `GET /api/v1/frameworks/active`. Documented as a gap, not worked around with fake data.
- Mapping endpoints used are the real ones: `POST /api/v1/controls/{id}/obligations`,
  `DELETE /api/v1/controls/{id}/obligations/{obligation_id}`,
  `GET /api/v1/obligations/{id}/controls`,
  `POST /api/v1/compliance/policies/{policy_id}/links/controls`.
- Note: `GET /api/v1/controls` (no status filter) also returns **archived** controls — the register
  shows them with an "archived" badge (pre-existing backend behavior).
- The coverage matrix marks an obligation with 1 control but 0 evidence as **partial**, not
  covered — the gap-summary "obligations_without_controls" still decrements (both shown honestly).

## Live verification (scripts/verify-sa3-controls.mjs — Playwright through the real UI)

Run output (2026-07-11, zero console errors):

```
API gaps BEFORE: {"total_active_obligations":341,"obligations_with_controls":27,"obligations_without_controls":314,"controls_not_started":8,...}
target obligation: GDPR-OBL-02 3de6e4ca-d58f-454c-a6b2-e027cdab8861
UI KPI (uncovered) BEFORE: 314
UI register shows new control (no reload): true
API GET confirms control exists: b3dfa497-227e-4987-a790-e1a6c83a9591
modal shows preset obligation: true
API GET obligation->controls contains new control: true
API gaps AFTER: {"total_active_obligations":341,"obligations_with_controls":28,"obligations_without_controls":313,"controls_not_started":9,...}
uncovered count moved: 314 -> 313
UI KPI (uncovered) AFTER (no reload): 313
gap row after mapping: "GDPR-OBL-02Document lawful basis per processing purpose1 control · 0 evidencepartialMap control"
API GET policy->control links contains new link: true (policy: Information Security Policy)
console errors: []
```

Per-mutation evidence:

| Mutation | UI action | Backend proof |
| --- | --- | --- |
| Create control | New control form → "SA3 TLS 1.2+ enforcement for data in transit (1783802535689)", code SA3-35689, technical/high | `GET /api/v1/controls?search=SA3 TLS` returns id `b3dfa497-227e-4987-a790-e1a6c83a9591`; appears in register with no reload |
| Map control→obligation (coverage-gap flow) | Gap panel → GDPR → row GDPR-OBL-02 → "Map control" → picked the new control, mapping_type=satisfies, rationale | `GET /api/v1/obligations/3de6e4ca-.../controls` contains the control; `GET /api/v1/controls/gaps/summary` uncovered 314→313; KPI card shows 313 without reload; gap row flips uncovered→partial |
| Link control→policy | Register row → "Link policy" → Information Security Policy + reason | `GET /api/v1/compliance/policies/{policy_id}/links/controls` contains `{control_id: b3dfa497-..., status: "active"}` |

Screenshots (in `reports/completion-pass/sa3-controls/`):
`01-controls-page-before.png`, `02-create-control-form.png`, `03-control-created-in-register.png`,
`04-coverage-gaps-gdpr.png`, `05-map-modal-filled.png`, `06-after-mapping-no-reload.png`,
`07-link-policy-modal.png`, `08-after-policy-link.png`.

Earlier API-only dry run (to confirm endpoint shapes before building) left one rolled-back
artifact: control "SA3 dry-run probe control" (status archived, mapping deleted, policy link
unlinked with reason) — gap summary was verified restored to 314 before UI verification began.

## Files touched

- `lib/api/controls.ts` — added createControl, mapControlToObligation, getControlsForObligation,
  getFrameworkCoverageMatrix, linkControlToPolicy + types/consts (each commented with endpoint path)
- `lib/hooks/useControls.ts` — added useActiveFrameworks, useFrameworkCoverage, usePoliciesList,
  useCreateControl, useMapControlToObligation, useLinkControlToPolicy
- `components/controls/ControlCreateModal.tsx` (new)
- `components/controls/MapObligationModal.tsx` (new)
- `components/controls/LinkPolicyModal.tsx` (new)
- `components/controls/CoverageGapPanel.tsx` (new)
- `components/controls/ControlKpis.tsx` — "Map this" action on the gap KPI
- `components/controls/ControlsTable.tsx` — New control button + per-row Link obligation / Link policy
- `components/ui/RegistryKpi.tsx` — backwards-compatible optional `action` slot (top-right corner)
- `app/dashboard/controls/page.tsx` — wired panel + modals
- `scripts/verify-sa3-controls.mjs` (new)
- Reused the shared `components/ui/Modal.tsx` added by another agent (did not modify it).

## tsc

`npx tsc --noEmit`: zero errors in any file I touched. One pre-existing error remains in another
agent's file `components/employee-compliance/AttestationCampaignModal.tsx` (passes `getPolicies`
directly as queryFn; `getPolicies` now takes `includeArchived?: boolean`, so the query context leaks
into it — fix is `queryFn: () => getPolicies()`). Not mine to edit; flagged for the owner.
