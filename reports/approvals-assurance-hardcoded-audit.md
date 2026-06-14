# Approvals & Assurance Review — Hardcoded-Data Audit

**Date:** 2026-06-14
**Pages:** `/dashboard/approvals`, `/dashboard/assurance`

## Files inspected
- **Pages:** `app/dashboard/approvals/page.tsx`, `app/dashboard/assurance/page.tsx`
- **Components:** `components/approvals/*` (Header, Kpis, ApprovalQueueTable, ApprovalDecisionPanel, WorkflowDistribution), `components/assurance/*` (Header, Kpis, AssuranceCasesTable, AssuranceSummaryPanel, ReviewerChecklist, LinkedWorkPanel)
- **Hooks:** `lib/hooks/useApprovals.ts`, `lib/hooks/useAssurance.ts`
- **API helpers:** `lib/api/approvals.ts`, `lib/api/assurance.ts`
- **Normalizers:** `lib/api/approval-normalizers.ts`, `lib/api/assurance-normalizers.ts`
- **Reused (already audited):** `compliance.ts`, `reports.ts`, `audit-pack.ts`, `questionnaires.ts`, `incidents.ts`, `ai-systems.ts`, `trust-center.ts`, shared `normalizers.ts`.

## Endpoint reality check
The backend endpoint matrix (`reports/backend-endpoint-matrix.csv`) lists **no** `/api/v1/approvals`, `/api/v1/approval-queue`, `/api/v1/assurance*` routes, and **no write/action endpoints** for approve/reject/sign-off. The backend repo is absent, so nothing here is independently confirmable. Following the established codebase pattern, the helpers call the **canonical paths named in the brief** and degrade gracefully (404 → query error → premium unavailable state). The Assurance "Linked Work" panel draws on **confirmed** governance-resource endpoints so it can show real records for review.

## Allowed static labels (kept)
- Page titles/subtitles, eyebrow labels ("Human Sign-Off", "Expert Review").
- KPI labels, section titles/subtitles, search/filter labels, empty/error/unavailable copy.
- Action button labels (Approve / Reject / Request changes / Assign reviewer / View item / Sign off / Escalate) — all rendered **disabled**.
- Reviewer-checklist item **labels** (Evidence verified, Risk reviewed, Policy mapped, Report reviewed, Questionnaire answer reviewed, Human sign-off completed) — names of fields read from the backend; a row appears only when the backend returns a real status/boolean for it.
- Status/priority tone & color maps, icons, and status-keyword classification arrays (`APPROVED`, `REJECTED`, `COMPLETE`, …) used to interpret **real** backend strings — they never supply a value.

## Forbidden business values found
**None.** The grep for fabricated literals (`|| "Approved/Pending/Rejected/Complete/Signed"`, mock/dummy/fake, Acme/Vanta/OneTrust, SOC 2 / ISO 27001) returned only two doc comments. No approvals, reviewers, cases, statuses, scores, due dates, owners, counts, or decisions are hardcoded.

## Honest-data design decisions
- **All KPIs gate on real fields + query success.** Pending/Overdue/Changes/Approved and Open/Awaiting/Evidence/Completed counts compute only when the backend returns the relevant status/date/count fields; otherwise the card shows "Unavailable / No … data" — never `0`.
- **Statuses never fabricated.** Queue and case rows show the backend status verbatim, or an **"Unclassified"** badge when absent (never Approved/Pending/Rejected by default).
- **Overdue** requires a real past due date with no recorded decision.
- **Decision history** lists only items the backend marks decided (decision string or decision date); otherwise "Decision history unavailable from backend."
- **Workflow distribution** counts only real statuses; empty → unavailable.
- **Assurance summary** uses the real summary endpoint; KPIs prefer it and fall back to deriving from real case fields; if neither exists → "Assurance summary unavailable from backend."
- **Reviewer checklist** reads check fields from real case/summary payloads only; no hardcoded completed items.
- **Linked Work** shows real record counts from confirmed resource endpoints; if none return records → "Linked assurance work unavailable from backend."

## Endpoints used
**Approvals:** `/api/v1/approvals` → `/api/v1/approval-queue` (canonical, graceful 404).
**Assurance:** `/api/v1/assurance-ext/cases` → `/api/v1/assurance/reviews` → `/api/v1/assurance` (canonical); `/api/v1/assurance-ext/summary` → `/api/v1/assurance/summary` (canonical). Linked Work (confirmed): `/api/v1/evidence?limit=100`, `/api/v1/reports?limit=100`, `/api/v1/audit-packs?limit=100`, `/api/v1/questionnaires?limit=100`, `/api/v1/risks?limit=100`, `/api/v1/incidents?limit=100`, `/api/v1/ai-systems`, `/api/v1/trust-center`.

No new backend routes invented; no backend code changed; no endpoint paths altered.

## Action endpoints — available vs unavailable
- **Unavailable (all write actions):** Approve, Reject, Request changes, Assign reviewer (Approvals); Sign off, Request changes, Escalate, Assign reviewer (Assurance). No backend mutation endpoint is confirmed → every action button is **disabled** with a `title="Action endpoint unavailable"` tooltip. No success messages, no local state mutation pretending the backend accepted a decision.
- **View/Open item:** also disabled, because no resolvable per-item route/resource is confirmed (avoids fake navigation).

## Backend gaps (handled gracefully, never faked)
- Approvals & assurance primary endpoints absent → premium unavailable/error states.
- All decision/sign-off mutation endpoints absent → disabled actions only.
- Decision history / reviewer checklist / assurance summary render only when their fields are present.

## Confirmation
No fake business data remains in either page. All approvals, cases, statuses, decisions, counts, and linked records originate from backend APIs; disabled actions never fake success or mutate local state. `tsc --noEmit` is clean and `next build` succeeds with both new routes and all existing routes compiling.
