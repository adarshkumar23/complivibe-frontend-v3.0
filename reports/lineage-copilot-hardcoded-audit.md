# Data Lineage Explorer & Copilot Drawer — Hardcoded-Data Audit

**Date:** 2026-06-14
**Features:** (1) Data Lineage Explorer at `/dashboard/data-observability/lineage`; (2) Global Copilot Drawer across the dashboard shell.
**Constraint:** No backend changes, no fake business data, no mock rows, no fabricated lineage nodes/edges, no fabricated Copilot answers, no exposed secrets/PII.

---

## Files inspected / added

**Added — API helpers & normalizers**
- `lib/api/lineage.ts` — lineage graph + schemas/contracts/quality-issues endpoints (with canonical fallbacks).
- `lib/api/copilot.ts` — Copilot availability probe + send (POST). Unconfirmed surface; relays only real responses.
- `lib/api/lineage-normalizers.ts` — graph parse + record-derived graph + table rows + sensitive/quality (metadata only).
- `lib/api/copilot-normalizers.ts` — Copilot response/messages normalizers.

**Added — hooks**
- `lib/hooks/useDataLineage.ts`
- `lib/hooks/useCopilot.ts`

**Added — components**
- `components/lineage/{node-style.ts,LineageHeader,LineageKpis,LineageGraph,LineageDetailPanel,LineageTable,LineageSensitivePanel,LineageSourceStrip}.tsx`
- `components/copilot/{CopilotDrawer,CopilotContextCards}.tsx`
- `app/dashboard/data-observability/lineage/page.tsx`

**Changed — wiring (no business data)**
- `store/ui-store.ts` — added `copilotOpen` drawer state.
- `components/layout/DashboardShell.tsx` — mounts `<CopilotDrawer/>` once.
- `components/layout/Topbar.tsx` — wired existing "Ask Copilot" button to open the drawer.
- `components/layout/FloatingSidebar.tsx` — added "Data Lineage" nav item; set "Data Observability" to exact match so it isn't co-active on the sub-route.

---

## Allowed static labels / prompts (intentional, no business data)

- Section titles, helper/empty/error copy, KPI labels ("Lineage nodes", "Relationships", …).
- Node-type **labels, colors, icons** in `node-style.ts` (visual mapping only).
- Lineage **relationship descriptors** ("evidences", "risk-of", "impacts", "linked-risk", "reports-on", "feeds", "writes", "contains-sensitive") — these are static names for **real backend reference fields**; the connections themselves are real.
- Copilot **suggested prompt** labels ("What needs attention?", "Summarize this page", "Show missing evidence", "Which risks are highest?", "What should I review next?") — UI helper text only; they merely populate the input, they are never shown as answers.
- Layout constants (column width, node size, zoom bounds, pagination page size).

## Forbidden business values found

**None.** Grep for hardcoded owners/dates/statuses/sample names and for secret-ish fields (token/api_key/secret/password/webhook_url/credential) in all new files returned nothing. No fabricated nodes, edges, datasets, pipelines, sources, AI answers, recommendations, owners, dates, or sensitive findings.

## Fixes made

- Set "Data Observability" sidebar item to exact match so the new "Data Lineage" child route is the only highlighted item on the sub-route (prevents a misleading double-active state).
- Severity badges (sensitive/quality, Copilot) render only when the backend supplies a real severity (no defaulted "info").

---

## Endpoints used

**Lineage (real, via `/api/proxy` authenticated client)**
- `/api/v1/data-obs/lineage/graph` → `/api/v1/data-obs/lineage` → `/api/v1/data-lineage` → `/api/v1/lineage` (first that responds)
- `/api/v1/ai-systems`, `/api/v1/evidence?limit=100`, `/api/v1/risks?limit=100`, `/api/v1/incidents?limit=100`, `/api/v1/reports?limit=100`, `/api/v1/integrations`
- `/api/v1/data-obs/sources`, `/api/v1/data-obs/pipelines`, `/api/v1/data-obs/sensitive-data`, `/api/v1/data-obs/quality/issues`

**Copilot**
- Probe (GET): `/api/v1/copilot/chat`, `/api/v1/copilot/messages`, `/api/v1/copilot`, `/api/v1/assistant`, `/api/v1/ai-assistant`
- Send (POST): the first confirmed endpoint from the probe.
- Context cards: `/api/v1/intelligence/proactive/insights`, `/api/v1/intelligence/predict/alerts`, `/api/v1/risks?limit=100`, `/api/v1/regulatory-intelligence/deadlines`, `/api/v1/approvals`(→`/approval-queue`), `/api/v1/assurance-ext/cases`(→ fallbacks)

All keys reuse existing module query keys for React Query dedup; coverage queries use `staleTime: 300_000` to avoid refetch loops.

## Unavailable endpoints

Determined **at runtime per endpoint**, not assumed. A failed/404 endpoint renders an honest *Unavailable* state and is shown in the lineage **source-status strip**; it never contributes fabricated data. Likely-unavailable in the current demo backend: the dedicated lineage-graph endpoint (→ falls back to derivation), `data-obs/quality/issues`, and the Copilot endpoints (→ drawer shows the disabled "Copilot backend unavailable" state). The UI reflects actual success/failure.

## Lineage derivation strategy

1. If a real lineage-graph endpoint responds **with nodes**, that graph is used verbatim (`fromBackendGraph = true`).
2. Otherwise the graph is **derived only from real cross-module records**: nodes for each real AI system, data source, pipeline, integration, evidence, risk, incident, report, and sensitive-data finding. **Edges are created only where a real reference field links two real records** — e.g. `evidence.ai_system_id`, `risk.ai_system_id`, `incident.ai_system_id`/`risk_id`, `report.ai_system_id`, `pipeline.source`/`target` → data source, `sensitive.source` → data source. References are resolved against real node ids/names; unresolved references produce **no** edge. Nothing is assumed or invented.

## Copilot strategy

Copilot is an **unconfirmed backend surface**. The hook probes candidate endpoints; the drawer is fully usable only when a real endpoint is confirmed. It relays **only** backend answers (via `normalizeCopilotResponse`); when no `answer` field is returned it shows a neutral state note rather than a fabricated answer. When no endpoint exists, input is disabled and the drawer shows: "Copilot backend unavailable." / "AI responses are disabled until a backend Copilot endpoint is available." Suggested prompts only populate the input. A standard "Copilot can be imprecise — verify decisions" disclaimer is shown; no legal/compliance certainty is claimed.

## Action endpoints — available / unavailable

| Action | State | Why |
|--------|-------|-----|
| Lineage **Refresh** | Enabled | Real refetch of real queries (no mutation) |
| Lineage **Export** | Disabled, tooltip "Action endpoint unavailable." | No export endpoint |
| **Open** AI system / evidence / risk / source (graph node) | Enabled only when node has a real route | Navigation only |
| Copilot **Ask** | Enabled only when probe confirms a backend endpoint | No fake answers |
| Copilot **Copy response** | Enabled | Client clipboard of a real backend answer (UI utility, no mutation) |
| Copilot **Open linked resource** | Enabled only for backend-provided source `href` | Navigation only |
| Copilot **Create task** / **Export answer** | Disabled, tooltip "Action endpoint unavailable." | No confirmed endpoints |

No disabled action performs a fake local mutation or shows fake success.

## Secrets / PII

No secret/token/credential/webhook fields are read or rendered. Sensitive-data is shown as **metadata only** (category, system, severity, count, status) — value/sample/example fields are never read, so no raw PII is surfaced.

---

## Confirmation

**No fake business data remains.** All lineage nodes/edges come from a real lineage endpoint or real cross-module references; all Copilot output comes from a real backend; all counts/statuses come from live endpoints; unavailable sources are shown honestly.

## Validation

| Check | Result |
|-------|--------|
| `tsc --noEmit` | ✅ Pass (exit 0) |
| `npm run build` | ✅ Pass (exit 0) |
| `/dashboard/data-observability/lineage` builds | ✅ 13 kB |
| `/dashboard/data-observability` still builds | ✅ 8.68 kB |
| All existing routes build | ✅ |
| Backend code changed | ❌ None |
