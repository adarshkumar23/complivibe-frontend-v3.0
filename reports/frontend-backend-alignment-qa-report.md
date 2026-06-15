# Phase 16 — Frontend ↔ Backend Alignment QA Report

**Date:** 2026-06-15
**Frontend commit tested (baseline):** `9bda9fd` (branch `main`) — fixes in this report applied on top.
**Backend referenced (live):** `https://api.adarshkumar.app` — version `3.0`, commit `2fcd78b4` (health `ok`: database, redis, celery, disk, groq, azure).
**Verdict:** ✅ **PASS_WITH_WARNINGS**

---

## Environment note (important)

- The local backend repo `/home/ubuntu/complivibe` is **not present** in this workspace and `http://127.0.0.1:8000` is **not reachable**. The requested backend preflight scripts (`live_authenticated_backend_e2e.py`, `production_readiness_gate.py`) **could not be executed here**.
- The frontend is configured (`NEXT_PUBLIC_API_BASE_URL`) to point at the **live hardened backend** `https://api.adarshkumar.app`, which **is reachable and healthy**. All verification below was performed against that live backend.
- No QA credentials (`ADMIN_EMAIL`/`ADMIN_PASSWORD`, `LIVE_QA_EMAIL`/`LIVE_QA_PASSWORD`) are provisioned in this environment, so the **valid-login** path and **authenticated** data/screenshot checks could not be exercised live. Unauthenticated flows, the invalid-login round-trip, and static/server smoke were fully exercised.

### Backend preflight (live equivalents)
| Check | Result |
|---|---|
| `GET /health` | **200** (`healthy`, v3.0, commit 2fcd78b4) |
| `GET /openapi.json` | **200** (1290 paths, "CompliVibe API 2.0.0") |
| `GET /api/v1/auth/providers` | **200** — only `password` method enabled |

### Frontend preflight
| Check | Result |
|---|---|
| `git status` | clean except pre-existing working-tree edits + report files |
| `npm install` | not required (node_modules present, build green) |
| typecheck (`tsc --noEmit`) | **PASS** (0 errors) |
| lint | no lint script defined in `package.json` (n/a) |
| `npm run build` | **PASS** (0 errors, all routes prerender) |

---

## Step 1 — Login UI result ✅ PASS

- Login page (`app/login/page.tsx`) exposes **email + password only**.
- **No** Google / Microsoft / SAML SSO / SCIM / "enterprise coming soon" buttons anywhere (`grep` across `app/`, `components/`, `lib/`, `store/` confirmed clean).
- Backend `GET /api/v1/auth/providers` returns exactly:
  `{"methods":[{"provider":"password","label":"Email and password","enabled":true}]}` — UI matches the contract.
- Login request body matches backend `LoginRequest` schema (`{email, password}`).
- The only SSO references in the codebase are **read-only status displays** in admin Settings/Enterprise (`SecuritySettings`, `enterprise-normalizers`) and **connector integrations** (Microsoft/Google Workspace as data connectors) — neither is a customer login option. Honest empty states are used.

## Step 2 — Auth flow result ✅ PASS (valid-login path not exercised — no creds)

| Behavior | Result |
|---|---|
| Invalid login shows clean error | ✅ live: "Invalid email or password.", stays on `/login` |
| Token stored via existing pattern | ✅ `cv_token` in `localStorage` via `auth-store` |
| Authenticated routes don't bounce to login (with token) | ✅ guarded by `hydrated` flag (no loop) |
| Missing token redirects to login | ✅ dashboard layout redirect |
| **Expired/invalid token redirects to login** | ✅ **fixed** (see Issues Fixed #1) |
| No token printed in console/logs | ✅ grep confirmed no token/secret logging |
| Logout clears auth state | ✅ `FloatingSidebar` → `clearToken()` + redirect |
| Valid login end-to-end | ⚠️ not run — QA credentials unavailable in env |

## Step 3 — Route smoke result ✅ PASS

All **35** required routes return **HTTP 200** from the production server (`next start`) — no 404, no 500. Verified live against the running build:

`/login, /dashboard, /dashboard/{executive, compliance, regulatory, policies, ai-systems, evidence, risks, incidents, reports, audit-pack, trust-center, questionnaires, alerts, approvals, assurance, certifications, vendor-risk, integrations, automation, workflows, ai-testing, ai-monitoring, drift, trust-graph, score-explainer, insights, security, privacy, enterprise, employee-compliance, simulation, agents, settings}` → **0 failures**.

- No 404, no hydration crash, no infinite auth loop (unauthenticated `/dashboard` cleanly redirects to `/login`, verified via Playwright).
- No fake hardcoded compliance claims found (grep for "100% ready / fully compliant / audit ready" literals → none).

## Step 4 — API proxy result ✅ PASS

- Proxy (`app/api/proxy/[...path]/route.ts`) forwards to `NEXT_PUBLIC_API_BASE_URL` (live backend), preserves `authorization` + `content-type`, returns `502` on upstream failure.
- Client (`lib/api/client.ts`) attaches `Bearer` token, throws typed `ApiError` with status + payload.
- **401** → clears token + redirects to `/login` (fixed). **422** → validation message now rendered correctly (fixed). **429** → "Too many attempts…" on login (fixed). **500** → safe error state via `ErrorState` component / friendly login message; no crash.
- Empty states via shared `EmptyState`/`ErrorState`; `getCountFromPayload` returns `null` (never fabricates `0`).

## Step 5 — Data integrity result ✅ PASS

- Counts/scores are derived only from real backend payloads through `lib/api/normalizers.ts`; no defaulting to fake "healthy/100%/ready".
- All audited feature endpoints **exist on the live backend**: trust-center (`/api/v1/trust-center*`), audit packs (`/api/v1/audit-packs`, `/api/v1/audit-pack`), certifications, integrations + storage status, connector health (`/api/v1/compliance/connectors/health`).
- When an endpoint is unavailable, pages render honest empty/unavailable states rather than fabricated values.

## Step 6 — New-feature alignment result ✅ PASS

- Audit packs, trust center, integrations, certifications sections exist and call real (verified) endpoints.
- **No SCIM** token screens and **no SAML setup** forms exist anywhere in the frontend — backend SSO/SAML endpoints (`/api/v1/auth/sso/*`) are intentionally not surfaced to customers (providers endpoint exposes password only).
- SSO/MFA appear only as **read-only status** inside admin Settings/Enterprise, with honest empty states.

## Step 7 — Responsive result ✅ PASS (login) / ⚠️ authenticated not screenshotted

- Login page: **no horizontal overflow** at mobile (390), tablet (768), desktop (1440).
- Authenticated dashboard responsive screenshots not captured (no QA token; the screenshot harness seeds a fake token which now — correctly — redirects to login). Layout uses the established responsive `DashboardShell` + floating sidebar; no layout changes were made.

## Step 8 — Tests / build result ✅ PASS

- Added `scripts/alignment-smoke.mjs` (Playwright, matches existing script style). **4/4 passed** against the live backend:
  1. login email+password fields present ✅
  2. login no SSO/OAuth buttons ✅
  3. unauthenticated `/dashboard` → `/login` ✅
  4. invalid login → clean error, stays on `/login` ✅
- `tsc --noEmit`: PASS. `npm run build`: PASS (0 errors).

---

## Issues Fixed (minimal, correctness-only)

1. **Expired/invalid token now redirects to login** — `lib/api/client.ts`: on a `401` for an authenticated request (token attached), clear `cv_token` and redirect to `/login`, guarded against concurrent redirects. Previously an expired token left the user on a broken dashboard of error tiles. Invalid-credential `401`s on the login form are unaffected (no token attached) so they still show their message.
2. **422 validation messages render correctly** — `lib/api/client.ts` `errorMessage()` now flattens FastAPI's array-style `detail: [{msg,…}]` into readable text (previously stringified to `[object Object]`).
3. **Friendly login error messaging** — `app/login/page.tsx`: `429` → "Too many attempts. Please try again later.", `5xx` → safe server message, `401` → "Invalid email or password."

No UI redesign, no style/theme changes, floating sidebar + light theme + glass style untouched, no fake data added.

## Remaining Warnings (non-blocking)

- **No QA credentials in this environment** → valid-login E2E, authenticated data rendering, and authenticated responsive screenshots were not exercised live. Re-run `scripts/alignment-smoke.mjs` + `npm run capture` with a real `cv_token`/creds to close these.
- **Local backend repo/port unavailable** → backend preflight scripts (`live_authenticated_backend_e2e.py`, `production_readiness_gate.py`) not run here; live backend at `api.adarshkumar.app` used as reference (health/openapi/providers all 200).
- **Connector-health endpoint not yet surfaced** — backend exposes `/api/v1/compliance/connectors/health*`; the Integrations page shows per-provider sync status but not the dedicated connector-health summary. Enhancement, not a correctness bug.
- **Screenshot harness uses a fake token** — now correctly redirects to login; needs a real QA token to capture authenticated screens.

## Final Verdict: ✅ PASS_WITH_WARNINGS
The frontend correctly targets the hardened live backend, exposes email/password login only (no SSO/SCIM/SAML for customers, matching `/auth/providers`), shows real data or honest empty states with no fabricated values, and all routes build and serve without 404/500. Three minimal correctness fixes were applied for token-expiry and error handling. Warnings are environmental (missing QA creds / local backend) and one optional enhancement.
