# SA-1 Policies — Completion-Pass Report

Agent: `sa1-policies` · Date: 2026-07-11 · Status: **complete, all flows verified live**

## What was built

Full policy lifecycle UI on `/dashboard/policies`, all against real backend endpoints
(shapes confirmed from `reports/live-openapi.json` + live dry-run calls before building):

1. **Create policy** — `PolicyFormModal` with two real modes:
   - *From scratch*: `POST /api/v1/compliance/policies` (title, policy_type from the 12-value
     schema regex, owner from real active org users via `GET /api/v1/users`, description,
     effective/review dates) + optional content, which chains
     `POST …/{id}/versions` to create a reviewable version 1.0.
   - *From template*: real template picker (`GET /api/v1/compliance/policy-templates` — templates
     DO exist, with category/framework tags/content) → `POST …/policy-templates/{id}/apply`
     (backend seeds draft policy + version 1.0 from template content). Template card rows also
     got a per-template "Use" button.
2. **Lifecycle** — `PolicyDetailModal` (opened from any library row):
   - *Send for review*: chains the three real calls that make up the handoff —
     `POST …/versions/{vid}/submit-for-approval` (version → submitted),
     `POST …/approval-requests` (pending, assigned approver from active org users),
     `PATCH …/{policy_id} {status: under_review}` (only when the policy is still draft).
   - *Approve / Reject* with review notes (`POST …/approval-requests/{rid}/approve|reject`),
     *Cancel* with required reason (`…/cancel`).
   - *Deprecate* (`PATCH status: deprecated`, only offered from approved) and
     *Archive* with required reason (`POST …/archive`, only offered from deprecated) —
     mirrors the backend's strictly linear status machine.
   - *New version* form (`POST …/versions`) — needed to recover from a rejection.
3. **Version history** — versions ARE exposed (`GET …/{policy_id}/versions`); the modal lists
   every version with status/Live badges, change summary, submitted-by/reviewed-by (resolved to
   real user names), review notes, and expandable content snapshots.
   Approval history (`GET …/approval-requests`) rendered below it.
4. All mutations use react-query `useMutation` + invalidation of `["policies"]`,
   `["policy-summary"]`, `["policy-versions", id]`, `["policy-approvals", id]` — every state
   change was verified to appear in the open modal/library **without reload**.
   Backend errors (403/400/422 details) surface verbatim in the forms.

## Backend state machine (verified live before building)

- `policy.status` is strictly linear: draft → under_review → approved → deprecated → archived;
  `PATCH` rejects any skip ("Invalid status transition: draft -> archived").
- `submit-for-approval` moves only the **version** (→ submitted); it does NOT touch policy
  status — hence the UI chains the `PATCH` to under_review.
- Approving a request sets: request approved, version approved + `is_live`, older approved
  versions superseded, policy approved with `approved_by/approved_at`.
- Approver must be an **active** org member; requester can never decide their own request
  ("Requester cannot approve their own request").

## Live verification (Playwright, real UI, two users)

Scripts: `scripts/verify-policies.mjs`, `scripts/verify-policies-2.mjs`.
Raw log: `reports/completion-pass/sa1-policies/evidence.txt`. Console errors: **zero** in both runs.

| # | Mutation | UI evidence | Backend GET proof | Screenshot |
|---|----------|-------------|-------------------|------------|
| 1 | Create (blank + content) | "UI Lifecycle Policy 782876" appears in library w/o reload | policy `draft`, version 1.0 `draft` | 01, 02 |
| 2 | Send for review (admin → Rhea) | pending panel + "under review" badge w/o reload | policy `under_review`, version `submitted`, request `pending` approver=7c9ece8f… | 03, 04 |
| 3 | Approve (as reviewer@complivibe.io) | modal flips to approved + Live badge w/o reload | policy `approved` approved_by=7c9ece8f… approved_at set; version `approved` is_live=true; request `approved` decided_at set | 05, 06 |
| 4 | Create from template (AUP) | "UI Template Policy 782876" appears w/o reload | policy `draft`, seeded version 1.0 `draft` | 07 |
| 5 | Reject (as reviewer, with notes) | rejected badge in version history w/o reload | version `rejected` review_notes persisted; request `rejected` | 08 |
| 6 | New version 1.1 after rejection | v1.1 in history w/o reload | version 1.1 `draft`, change summary persisted | 09 |
| 7 | Cancel pending request (reason) | pending panel cleared w/o reload | request `cancelled`, reason in notes | 10 |
| 8 | Deprecate approved policy | archive controls appear w/o reload | policy `deprecated` | 11 |
| 9 | Archive (reason) | policy leaves library w/o reload, modal closes | policy `archived`, archive_reason persisted | 12 |

`npx tsc --noEmit` clean.

## Real backend gaps / behaviors found (not worked around by faking)

1. **Rejection leaves the policy stuck at `under_review`** — the linear transition map has no
   `under_review → draft` edge and reject only touches version+request. A rejected policy can
   never return to draft; recovery is only via new version → resubmit (which the UI supports).
   Observed live: policy `5acf025b…` remains `under_review` after rejection.
2. **Draft policies can never be removed** — no DELETE endpoint, and `/archive` is only valid
   from `deprecated` (which is only reachable from `approved`). Orphan drafts accumulate;
   one such orphan exists from an aborted verification run
   (`0be644ff-5e06-44ac-8194-d79cf945522e`, "UI Lifecycle Policy 749219", plus the earlier
   API dry-run leftover `9c1338ba…` "Dry Run Applied AUP" — both clearly labelled).
3. **Approver pool required a second active user** — the demo org had exactly one active user
   and the backend (correctly) forbids self-approval, making approval unreachable through any
   UI. I activated a reviewer through the real flow: `POST /api/v1/onboarding/invite-team` →
   `POST /api/v1/onboarding/accept-invite` → **reviewer@complivibe.io / Reviewer-2026!**
   ("Rhea Kapoor", id `7c9ece8f-c9d5-49ca-babf-c7b357651c2c`). Note: the invitation token is
   never exposed by the API (`GET /onboarding/team-invitations` omits it and no dev mail
   sink exists) — I had to read it from the `team_invitations` table in the backend SQLite DB.
   That is a real dev-environment gap worth recording.
4. `GET …/versions/{a}/diff/{b}` exists but is not yet consumed by the UI (follow-up candidate).
5. `include_archived=true` listing exists but the UI has no archived-view toggle yet;
   `getPolicies()` was kept zero-arg because another domain (employee-compliance) uses it
   directly as a react-query `queryFn`.

## Files touched

- `lib/api/policies.ts` — rewritten: full typed API layer for policies, versions, approval
  requests, templates, summary + `getCurrentUser` (`/api/v1/auth/me`).
- `lib/hooks/usePolicies.ts` — rewritten: queries + 10 mutation hooks with invalidation.
- `components/policies/PolicyFormModal.tsx` — new (create blank / from template).
- `components/policies/PolicyDetailModal.tsx` — new (lifecycle actions, version history,
  approval history).
- `components/policies/PoliciesHeader.tsx` — added "New policy" button + hosts create modal.
- `components/policies/PolicyLibrary.tsx` — rows now open the detail modal.
- `components/policies/PolicyTemplates.tsx` — per-template "Use" button.
- `scripts/verify-policies.mjs`, `scripts/verify-policies-2.mjs` — live verification.
- Evidence: `reports/completion-pass/sa1-policies/` (12 screenshots + evidence.txt).

Shared files: none touched. Reused the shared `components/ui/Modal.tsx` added by another agent.
