# Automation & Workflows — Hardcoded-Data Audit

**Date:** 2026-06-14
**Pages:** `/dashboard/automation`, `/dashboard/workflows`

## Files inspected
- **Pages:** `app/dashboard/automation/page.tsx`, `app/dashboard/workflows/page.tsx`
- **Components:** `components/automation/*` (Header, Kpis, AutomationRulesTable, AutomationRunHistory, TriggerSourcesPanel), `components/workflows/*` (Header, Kpis, WorkflowsTable, WorkflowStageTimeline, WorkflowBlockers, LinkedGovernanceWork)
- **Hooks:** `lib/hooks/useAutomation.ts`, `lib/hooks/useWorkflows.ts`
- **API helpers:** `lib/api/automation.ts`, `lib/api/workflows.ts`
- **Normalizers:** `lib/api/automation-normalizers.ts`, `lib/api/workflow-normalizers.ts`
- **Reused (already audited):** `command.ts`, `compliance.ts`, `reports.ts`, `audit-pack.ts`, `questionnaires.ts`, `incidents.ts`, `ai-systems.ts`, `trust-center.ts`, `approvals.ts`, `assurance.ts`, `integrations.ts`, shared `normalizers.ts`.

## Endpoint reality check
The backend endpoint matrix lists **no** `/api/v1/automation*`, `/api/v1/workflows*`, or `/api/v1/jobs*` routes, and **no write/action endpoints**. The helpers call the **canonical paths named in the brief** with `retry:false` and graceful 404 handling → each primary surface degrades to a clean unavailable state. The trigger-source and linked-work panels use **confirmed** signal/governance endpoints so they render real data today.

## Allowed static labels (kept)
- Page titles/subtitles, eyebrow labels.
- KPI labels, section titles/subtitles, search/filter labels, empty/error/unavailable copy, icons, tone/color maps.
- Action button labels (Create automation / Enable / Disable / Run now / View logs; Start / Assign reviewer / Request changes / Approve / Escalate) — all rendered **disabled**.
- Trigger-source category labels (Integration sync, Scheduled/deadlines, Risk & incident, Questionnaire, Evidence sync, Predictive signals) — availability/counts come from real backend signal endpoints.
- Status-keyword classification arrays (`ACTIVE`, `FAILED`, `COMPLETE`, `BLOCKED`, `REVIEW`, …) used to interpret **real** backend strings.
- `WorkflowBlockers` labels `"Blocked"`/`"Overdue"` — descriptive labels rendered **only** for items the backend explicitly flagged (real `blocked` boolean or a real past `dueDate`); not fabricated states.

## Forbidden business values found
**None.** The grep for fabricated literals (`|| "Active/Running/Successful/Failed/Complete/Blocked/Pending/Scheduled/Approved"`, mock/dummy/fake) returned only two doc comments and the descriptive blocker label above. No automation rules, workflow runs, statuses, steps, triggers, owners, dates, counts, or success/failure states are hardcoded.

## Honest-data design decisions
- **All KPIs gate on real fields + query success.** Automation (Active/Recent runs/Failed runs/Connected triggers) and Workflows (Active/Awaiting review/Completed/Blocked) compute only from real status/result/date fields; otherwise "Unavailable / No status field" — never `0`.
- **Statuses never fabricated.** Rule/run/workflow rows show backend status verbatim, or "Unclassified" when absent.
- **Run durations** are shown only when the backend supplies a duration or both real start+complete timestamps.
- **Trigger sources** show "Unavailable"/"No signals" per source; all unavailable → "Automation trigger data unavailable from backend."
- **Run history** → "Automation run history unavailable from backend." on 404.
- **Stage timeline** aggregates only real `stages` arrays; never synthesizes a pipeline → "Workflow stage timeline unavailable from backend." when absent.
- **Blockers** use only explicit `blocked` flags / real `status` / real past `dueDate` — never inferred from missing data → "Workflow blocker data unavailable from backend." when no such signal exists.
- **Linked work** shows real record counts from confirmed endpoints → "Linked governance work unavailable from backend." when none return records.

## Endpoints used
**Automation:** `/api/v1/automation/rules`→`/api/v1/automation`; `/api/v1/automation/runs`→`/api/v1/jobs`; `/api/v1/automation/status`→`/api/v1/data-obs/automation/status` (canonical, graceful 404). Trigger sources (confirmed): `/api/v1/integrations/sync-logs`, `/api/v1/intelligence/predict/alerts`, `/api/v1/intelligence/proactive/insights`, `/api/v1/regulatory-intelligence/deadlines`, `/api/v1/risks?limit=100`, `/api/v1/incidents?limit=100`, `/api/v1/questionnaires?limit=100`, `/api/v1/evidence?limit=100`.
**Workflows:** `/api/v1/workflows`, `/api/v1/workflows/runs` (canonical, graceful 404). Linked work (confirmed + canonical): approvals, assurance, reports, audit-packs, questionnaires, evidence, risks, incidents, ai-systems, trust-center.

## Unavailable endpoints
All `/api/v1/automation*`, `/api/v1/workflows*`, and `/api/v1/jobs` routes are unconfirmed in the matrix and will render unavailable states until the backend exposes them. Trigger-source and linked-work confirmed endpoints render real data.

## Action endpoints — available vs unavailable
**All write actions unavailable** (no confirmed endpoints): Create automation, Enable, Disable, Run now, View logs (Automation); Start, Assign reviewer, Request changes, Approve, Escalate (Workflows). Every action button is **disabled** with `title="Action endpoint unavailable"`; no success messages, no local-state mutation.

## Confirmation
No fake business data remains in either page. All automation/workflow business values originate from backend APIs; disabled actions never fake success or mutate local state. `tsc --noEmit` is clean and `next build` succeeds with both new routes and all existing routes compiling.
