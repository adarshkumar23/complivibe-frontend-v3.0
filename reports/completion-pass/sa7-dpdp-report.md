# SA-7 (DPDP / Privacy) — Completion Report

Agent: `sa7-dpdp` · Date: 2026-07-11 · Verified live against backend at `127.0.0.1:8123`, UI at `127.0.0.1:3777`.

## What was built

1. **Consent CREATE form** — `components/privacy/ConsentRecorder.tsx`
   - POST `/api/v1/privacy/consent` (`ConsentRecordCreate`). Fields: processing activity (populated live from GET `/api/v1/privacy/ropa/activities` — consent must reference a RoPA activity), subject identifier, mechanism (the backend's 7 `ALLOWED_CONSENT_MECHANISMS`), notice version, expiry date, granted/denied, plus DPDP §9 guardian-managed consent block (relationship, identity reference, verification method — the backend's allowed sets).
   - Honest empty state when the org has no RoPA activities ("create one in the RoPA register first") and a distinct error state when the activities call fails.
2. **DSAR + grievance submission form** — `components/privacy/DsarSubmitForm.tsx`
   - Both ride POST `/api/v1/privacy/dsr` (`DataSubjectRequestCreate`); a segmented Rights request / Grievance toggle sets `request_subtype` (`rights_request` | `grievance`), per the real backend design. Request types and frameworks mirror backend `ALLOWED_REQUEST_TYPES` / `ALLOWED_FRAMEWORKS`.
   - Confirmation box shows the backend-computed `request_ref`, status, response deadline and SLA days.
3. **Wiring** — both forms added to `/dashboard/privacy` and `/dashboard/privacy/dpdp`. Mutations use react-query `useMutation` + `invalidateQueries` (`consent-summary`, `dsr-requests`, `dsr-summary`) so KPIs and the DSAR & Grievance Tracker update without reload.
4. **Discoverability** — `components/layout/FloatingSidebar.tsx`: added `DPDP (India)` entry (Landmark icon, `/dashboard/privacy/dpdp`, prefix match) directly under Privacy. Privacy's match was changed `prefix → exact` as the minimal correctness companion — otherwise both items would be active simultaneously on the DPDP route (duplicate framer-motion `layoutId` highlight). This mirrors the file's existing Data Observability → Data Lineage parent/child pattern. Nothing else in the file touched.
5. Nomination/SDF flows untouched, as instructed.

## Files touched
- `lib/api/privacy.ts` (added: `getRopaActivities`, `createConsent`, `createDsr` + types)
- `lib/hooks/usePrivacy.ts` (added: `useRopaActivities`, `useCreateConsent`, `useCreateDsr`)
- `components/privacy/ConsentRecorder.tsx` (new)
- `components/privacy/DsarSubmitForm.tsx` (new)
- `app/dashboard/privacy/page.tsx`, `app/dashboard/privacy/dpdp/page.tsx` (wired forms)
- `components/layout/FloatingSidebar.tsx` (authorized nav addition only)
- `scripts/verify-dpdp.mjs` (new Playwright verification)

`npx tsc --noEmit`: clean over my changes (verified clean at 17:25). A later re-run at 20:40 shows errors, but **all** are in files owned by other agents that landed in the shared tree afterwards (`components/policies/PolicyKpis.tsx`, `PolicyLibrary.tsx`, `components/controls/LinkPolicyModal.tsx`, `lib/hooks/usePolicies.ts`, `lib/hooks/useControls.ts`) — none reference any sa7-dpdp file.

## Live verification evidence (`node scripts/verify-dpdp.mjs`)

Console errors during all flows: **zero**. Screenshots + raw API proof in `reports/completion-pass/sa7-dpdp/`.

| Check | Result | Evidence |
|---|---|---|
| Sidebar `DPDP (India)` entry visible + navigates to `/dashboard/privacy/dpdp` | PASS | `01-dpdp-page-via-nav.png` |
| Consent recorded via UI (mechanism `written_form`, version v1.0) | PASS — id `39fad3f9-c9df-43f5-aa82-75a98bc440a9` | `02-consent-created.png` |
| Consent KPI updates without reload | PASS — "Active Consents" 1 → 2 in-place | script output |
| API GET proof of consent | PASS — GET `/privacy/consent?processing_activity_id=…` returns the record (hashed subject, `granted: true`); `/consent/summary` total 2 | `api-get-proof.txt` |
| DSAR submitted via UI (access, dpdp) | PASS — `DSR-2026-003`, 29d SLA, appears in tracker without reload | `03-dsar-created.png` |
| Grievance submitted via UI (`request_subtype=grievance`) | PASS — `DSR-2026-004`, backend-computed 90-day Rule 14(3) deadline (2026-10-09, 89d remaining), Grievance badge in tracker without reload | `04-grievance-created.png`, `api-get-proof.txt` |
| Forms also present on main `/dashboard/privacy` page | PASS | `05-main-privacy-page.png` |

## Notes / gaps (honest)
- **The demo org had zero RoPA processing activities**, and the backend (correctly) rejects consent without one. I created one real activity via the backend's own API (POST `/api/v1/privacy/ropa/activities` → `5941066f-4dfb-455f-b665-ddebaa96d6a3`, "Customer newsletter marketing", legal_basis consent) to exercise the flow. The form itself handles the empty case honestly. There is currently **no RoPA management UI** — a real gap for another pass.
- Backend summary flags `active_consents_missing_notice_reference` because no privacy notices exist in the org; the form supports the flow but there is no notice-management UI either (`notice_id` not exposed in the form since there are no notices to pick).
- Consent POST returns the subject identifier hashed (privacy-by-design in the backend); the UI shows the record id + mechanism, not the raw identifier.
