# Phase 16.2 — Frontend Micro-Polish After Authenticated QA

**Date:** 2026-06-15
**Frontend commit (baseline):** `665d341` (branch `main`) — polish in this report applied on top.
**Backend referenced (live):** `https://api.adarshkumar.app` (v3.0, commit `2fcd78b4`).
**Verdict:** ✅ **PASS_WITH_WARNINGS**

Scope was limited to the four requested polish items. The approved bottom floating mode switcher, floating sidebar, light theme, and blue/purple/cyan glass style were **not** changed. No fake data added; no SSO/OAuth/SCIM login options added.

---

## Preflight
| Check | Result |
|---|---|
| `git status` / `git log` | clean (only pre-existing untracked backend-phase reports) |
| typecheck (`tsc --noEmit`) | **PASS** (0 errors) |
| lint | no lint script in `package.json` (n/a) |
| `npm run build` | **PASS** (0 errors, all routes prerender) |

---

## Step 1 — Sidebar active item contrast ✅ PASS
**Issue:** active nav item (white text/icon on the vibrant cyan→blue→purple gradient pill) read low-contrast where the gradient is lightest (cyan end).

**Fix** (`components/layout/FloatingSidebar.tsx`, minimal, style-preserving):
- Active item now carries a subtle dark drop-shadow filter `drop-shadow(0 1px 2px rgba(15,23,42,0.45))` (replacing the weak `drop-shadow-sm`), giving the white label **and** icon a legibility halo on the light portion of the gradient.
- Active icon tile strengthened from `bg-white/25` to `bg-white/30` with `ring-1 ring-white/40` for a crisper frame.

**Result:** active item readable on all pages; inactive items unchanged (still soft `text-cv-slate`); sidebar stays light/glass — not darkened, not redesigned.

## Step 2 — Empty-state wording polish ✅ PASS
Replaced the genuinely generic "No data"-style labels with honest, context-aware wording (already-honest empty states like "No audit packs yet", "No policies returned", "Templates unavailable" were left untouched to avoid churn):

| File | Before | After |
|---|---|---|
| `components/compliance/FrameworkReadiness.tsx` | `No data` (badge) | `Awaiting evidence` |
| `components/dashboard/CoverageMap.tsx` | `No records returned` | `No signal yet` |
| `components/ai-system-detail/TelemetryPanel.tsx` | `No data returned` | `No telemetry yet` |
| `components/ai-system-detail/DetailKpis.tsx` (Monitoring Health) | `No data` | `No health signal` |
| `components/ai-system-detail/DetailKpis.tsx` (Reliability) | `No data` | `No reliability data` |

None imply success or readiness when data is missing; all stay short.

## Step 3 — Connector Health on Integrations page ✅ PASS
Added a **Connector Health** card to `/dashboard/integrations` (between Provider Status KPIs and the provider grid), wired to the confirmed backend endpoints:
- `GET /api/v1/compliance/connectors/health` (per-connector list)
- `GET /api/v1/compliance/connectors/health/summary` (aggregate counts)

New files:
- `lib/api/connector-health.ts` — endpoint client (real payloads only).
- `lib/api/connector-health-normalizers.ts` — defensive normalizer + state classifier.
- `lib/hooks/useConnectorHealth.ts` — react-query hook (`retry:false`, matches Integrations).
- `components/integrations/ConnectorHealthCard.tsx` — the card.

**Displays real data only:** total connectors, healthy count, needs-attention count, unavailable count, per-connector list with status + last check/sync (relative). Counts prefer explicit summary fields and otherwise derive from the connector list — never fabricated, never defaulting to a fake "all healthy".

**Health states supported** (classified from the real status string): `healthy, degraded, stale, failing, permission_error, token_expired, rate_limited, unavailable, unknown`, each mapped to a tone (good/warn/bad/neutral) and a readable label.

**Honest states:**
- Empty / no signal → "No connector health signal yet" (and "No connected sources found" when the list is empty).
- 404 (endpoint absent on a backend) → treated as no-signal empty state, not a scary error.
- Genuine error (non-404) → safe `ErrorState` with retry.
- Loading → skeleton.

**Security:** the card shows only connector name, normalized status label, and last-check time. It deliberately **does not** render raw tokens, webhook URLs, provider secrets, or raw error strings.

## Step 4 — Login page check ✅ PASS
Verified live via `scripts/alignment-smoke.mjs` (4/4) against the live backend:
- email + password fields present ✅
- no Google / Microsoft / SAML / SSO / SCIM buttons ✅ (none anywhere in the codebase)
- invalid login → clean "Invalid email or password." ✅ (stays on `/login`)
- friendly 429 message present (`"Too many attempts. Please try again later."`) and clean 401 — retained from Phase 16.1.
- No OAuth added.

## Step 5 — Tests / build ✅ PASS
- `tsc --noEmit`: **PASS** (0 errors).
- `npm run build`: **PASS** (0 errors); `/dashboard/integrations` prerenders (now 10.6 kB) — confirms the new card mounts without crashing.
- `scripts/alignment-smoke.mjs`: **4/4 passed** on a clean server.
- Authenticated screenshots: **not run** — no QA credentials in this environment.

---

## Warnings (non-blocking)
- **No QA credentials** in this environment, so the Connector Health card's populated/authenticated state and authenticated screenshots could not be visually captured. The card's render-safety is evidenced by a clean prerender + typecheck; its data shape is handled defensively against the live `ResponseEnvelope` contract (the endpoint requires auth: returns 401 "Missing bearer token" unauthenticated).
- Connector-health `data` shape is not strongly typed in the backend OpenAPI (generic `ResponseEnvelope`); the normalizer reads a broad set of field-name candidates and degrades to honest empty/unknown states for any unrecognized shape.
- A transient smoke failure was traced to a **stale `next start` process** serving mismatched JS chunks after a rebuild (not a code issue); re-running against a clean server passed 4/4.

## Final Verdict: ✅ PASS_WITH_WARNINGS
All four polish items implemented with minimal, correctness-focused changes. Visual style, light theme, floating sidebar, and the bottom mode switcher are untouched. The only warnings are environmental (missing QA creds for authenticated visual capture).
