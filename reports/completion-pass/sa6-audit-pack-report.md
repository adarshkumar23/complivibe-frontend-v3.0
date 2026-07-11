# SA-6 Audit Pack — Completion Report

Agent: `sa6-audit-pack` · Date: 2026-07-11 · Verified live: **PASS** (`node scripts/verify-audit-pack.mjs`)

## What was built

The Audit Pack page (`/dashboard/audit-pack`) was read-only. It now supports the full
engagement → finding → PBC lifecycle through real UI mutations, all validated against
live backend shapes (confirmed via `reports/live-openapi.json` + live curl probes, and
the backend state machines in `app/compliance/services/*` were mirrored so the UI only
offers transitions the backend will accept).

1. **Engagement creation** — "New engagement" button on the Audit Engagements card opens
   a glass modal (`POST /api/v1/compliance/audit-engagements`): title, audit type
   (4 backend-validated values), start/end dates, optional lead auditor / firm / notes.
   Client-side date-order check; backend 422/403 surfaced in the modal.
2. **Engagement workspace** — engagement rows are now selectable; selecting one opens a
   workspace strip with the engagement's status and one-click status transitions
   (mirrors `AuditEngagementService.ALLOWED_TRANSITIONS`: planning→fieldwork/cancelled, etc.).
3. **Finding creation** — "New finding" modal per engagement
   (`POST /api/v1/compliance/audit-findings?engagement_id=`): severity, title, description,
   remediation owner (real org members from `GET /api/v1/users`), remediation action,
   target date, optional framework ref. Findings list from
   `GET /audit-findings/engagement/{id}` with SeverityBadge/StatusBadge and per-row
   transition buttons limited to `AuditFindingService.ALLOWED_TRANSITIONS`.
4. **PBC item management** — "New request" modal
   (`POST /api/v1/compliance/pbc-items?engagement_id=`): title, details, optional assignee,
   due date. Items list from `GET /pbc-items/engagement/{id}`. Status actions per backend
   state machine (pending→submit/reject, submitted→accept/reject, overdue→submit) via a
   contextual action modal:
   - **submit** — optional evidence attach (real items from `GET /api/v1/evidence`)
   - **accept** — override-reason field; the backend's "no evidence ⇒ override required"
     rule is explained inline and its 422 is surfaced verbatim if violated
   - **reject** — mandatory rejection reason
5. All mutations go through react-query `useMutation` + `invalidateQueries`, so the
   engagement list, KPI tiles, PBC pipeline card, findings and PBC lists update
   **without any page reload**.

## Files touched

- `lib/api/audit-pack.ts` — extended: typed create/transition/list functions for
  engagements, findings, PBC items; backend transition maps (`ENGAGEMENT_NEXT_STATUSES`,
  `FINDING_NEXT_STATUSES`).
- `lib/hooks/useAuditPack.ts` — added `useEngagementFindings`, `useEngagementPbcItems`,
  `useCreateEngagement`, `useTransitionEngagement`, `useCreateFinding`,
  `useTransitionFinding`, `useCreatePbcItem`, `usePbcAction` (all invalidate the right keys).
- `components/audit-pack/EngagementCreateModal.tsx` — new.
- `components/audit-pack/FindingCreateModal.tsx` — new.
- `components/audit-pack/PbcItemCreateModal.tsx` — new.
- `components/audit-pack/PbcActionModal.tsx` — new (submit/accept/reject).
- `components/audit-pack/EngagementWorkspace.tsx` — new (findings + PBC sections).
- `components/audit-pack/AuditPackLibrary.tsx` — selectable rows, create button, status tones.
- `app/dashboard/audit-pack/page.tsx` — selection state + workspace section.
- `scripts/verify-audit-pack.mjs` — new Playwright E2E verification.
- Reused `components/ui/Modal.tsx` added by a sibling agent (not modified).

`npx tsc --noEmit` — clean over all files above (the only repo errors are in
`components/employee-compliance/AttestationCampaignModal.tsx`, another agent's domain).

## Live verification evidence (screenshots in `reports/completion-pass/sa6-audit-pack/`, raw API responses in `evidence.json`)

Flow executed entirely through the real UI by Playwright; every step re-checked with an
independent authenticated API GET:

| Step | UI action | Backend proof (API GET after the click) | Screenshot |
|---|---|---|---|
| Create engagement | modal form, "Create engagement" | engagement `a0dae794-…` present, `status=planning` | 02, 03 |
| Create finding | modal form, "Record finding" | finding `38388ad1-…`, `finding_ref=F-2026-004`, `status=open`, `severity=high` | 04, 05 |
| Transition finding | "in remediation" button | `status=in_remediation` | 06 |
| Create PBC item | modal form, "Create request" | item `f7afb07f-…`\*, `status=pending` | 07, 08 |
| PBC submit | action modal, "Submit item" | `status=submitted` | 09, 10 |
| PBC accept guard | accept with **no** override reason | backend 422 "Cannot accept a PBC item with no evidence…" rendered in the modal | 11 |
| PBC accept | override reason supplied | `status=accepted`, `acceptance_override_reason` persisted | 12 |
| Transition engagement | "fieldwork" button | `status=fieldwork` | 13 |

\* ids shown are from run 20:45/20:46; the final PASS run (20:48) has its own ids in `evidence.json`.

- **No-reload proof**: a JS-context stamp set after initial page load survived every
  mutation (`jsContextStampSurvived: true`). `framenavigated` events were same-document
  history updates from the Next router, not reloads.
- **Console errors**: exactly one expected `422` resource log from the deliberate
  accept-guard probe; zero unexpected errors.

## Real backend gaps found (not worked around)

1. **Engagement delete guard counts soft-deleted children** —
   `app/compliance/services/audit_engagement_service.py` (~lines 283–300): the
   open-PBC/open-findings counts in `delete_engagement` have no
   `deleted_at IS NULL` / soft-delete filter, while finding delete is a soft delete
   (`soft_delete_finding` sets `deleted_at`) and PBC delete likewise leaves rows counted.
   Reproduced live: after `DELETE /audit-findings/{id}` → 200 and PBC reject+delete → 200,
   `DELETE /audit-engagements/{id}` still 422s with
   `"Cannot delete engagement with open PBC requests or findings: 1 open PBC item(s), 1 open finding(s)"`
   — the engagement becomes permanently undeletable. Backend fix needed; no UI workaround applied
   (the UI does not expose delete).
2. Not a bug, but noted: `accepted_risk`, `risk_accepted`, `closed`, `cancelled` are
   terminal in the backend state machines (no transitions out). The UI reflects this by
   showing no transition buttons for terminal states.

## Data left in the demo org

- 1 live engagement `ISO 27001 surveillance audit — UI verify 2026-07-11 20:48`
  (fieldwork) with 1 finding (in_remediation) and 1 accepted PBC item — the verified flow.
- 2 earlier script-run duplicates and 1 API smoke probe: transitioned to `cancelled`
  with explanatory notes (hard delete impossible due to gap #1 above).
