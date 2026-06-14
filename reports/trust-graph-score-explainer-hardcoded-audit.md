# Trust Graph Explorer & Score Explainer — Hardcoded-Data Audit

**Date:** 2026-06-14
**Pages:** `/dashboard/trust-graph`, `/dashboard/score-explainer`

## Files inspected
- **Pages:** `app/dashboard/trust-graph/page.tsx`, `app/dashboard/score-explainer/page.tsx`
- **Components:** `components/trust-graph/*` (TrustGraphHeader, TrustGraphKpis, GraphExplorer, RelationshipTable), `components/score-explainer/*` (ScoreExplainerHeader, ScoreExplainerKpis, ScoreActions, ScoreBreakdown, DriverList, EvidenceCoverageSection, RiskImpactSection, AiSystemCoverage)
- **Hooks:** `lib/hooks/useTrustGraph.ts`, `lib/hooks/useScoreExplainer.ts`
- **API helpers:** `lib/api/trust-graph.ts`, `lib/api/score-explainer.ts`
- **Normalizers:** `lib/api/trust-graph-normalizers.ts`, `lib/api/score-explainer-normalizers.ts`
- **Reused (already audited):** every module normalizer + shared `normalizers.ts`.

## Endpoint reality check
No dedicated trust-graph endpoint and no dedicated score-explain endpoint are confirmed in the backend matrix. Per the brief, the **graph is derived client-side from real records and their real reference fields**, and the **score breakdown/drivers are read from confirmed score endpoints + derived from real records**. Score endpoints `/api/v1/scores/summary`, `/intelligence/unified-health-score`, `/compliance/score`, `/governance/score` are confirmed; `/api/v1/scores/explain` is canonical (graceful 404).

## Graph derivation strategy
- **Nodes:** one node per real record returned by a module endpoint (AI systems, evidence, risks, incidents, reports, audit packs, questionnaires, trust assets, policies, vendors, regulatory, certifications, approvals, assurance, integrations). A node exists only if the backend returned the record. No demo nodes.
- **Edges:** created **only** when a real reference field on one record matches a real node — `aiSystem` → AI system node, incident `riskRef` → risk node, `evidenceRef` → evidence node, approval/assurance `linkedResource` → target node. Matching is by backend id or exact (case-insensitive) label, both sides real. No invented links, risk paths, or "critical dependency" claims.
- **KPIs:** Graph nodes / Relationships / High-risk connections / Unlinked records all computed from the real node+edge sets; unavailable sources are not counted.

## Score derivation strategy
- **Score components** read named fields (governance, compliance, evidence, risk, incident, audit/trust/certification/AI-system readiness) from confirmed score payloads; each is null when absent. If none present → "Score breakdown unavailable from backend." **No formula is invented.**
- **Overall score** read from real trust/overall/score fields; "Unavailable" when absent (never defaulted to 0).
- **Drivers** are derived from real records (open high risks, unresolved incidents, overdue deadlines, pending approvals, open assurance, incomplete questionnaires, unpublished trust assets, high-risk vendors), explicitly labelled "Derived from available records — not an official backend formula."
- **Evidence coverage** uses real evidence framework counts only; **risk impact** uses real risk severity/status/links; **AI system coverage** counts real evidence/risk links per real AI system.

## Allowed static labels
Titles/subtitles/eyebrows, KPI/section labels, node-type color map & labels (`NODE_META`), severity/score tone maps, icons, graph **layout math** (circle positions, zoom), filter labels, action button labels (disabled where noted). None assert a business value.

## Forbidden business values found
**None.** The numeric/literal grep returned only layout math (`sorted.length || 1`). No fabricated graph nodes/edges, score values, formulas, drivers, weights, penalties, coverage, owners, statuses, dates, or explanations.

## Endpoints used
**Graph (confirmed sources):** ai-systems, evidence, risks, incidents, reports, audit-packs, questionnaires, trust-center, certifications, regulatory deadlines + canonical (graceful 404): policies, vendors, approvals, assurance, integrations.
**Score (confirmed):** scores/summary, intelligence/unified-health-score, executive/summary, compliance/overview, compliance/score, governance/score, ai-governance/summary + source records (evidence, risks, incidents, regulatory, approvals, assurance, questionnaires, trust-center, vendors, ai-systems). **Canonical (graceful 404):** scores/explain.

## Unavailable endpoints
`/api/v1/trust-graph*`, `/api/v1/scores/explain`, `/api/v1/score-explainer`, `/api/v1/intelligence/ai-system-coverage/{id}` are unconfirmed → graph derives client-side; score-explain falls back to derived drivers; AI system coverage derives from real records. Canonical-only module endpoints render as "unavailable sources" with source-status messaging; nothing is fabricated.

## Action endpoints — available vs unavailable
- **Available (read navigation only):** Trust Graph node "Open in module" and Score Explainer "View evidence/risks/reports" + driver "View" — all route to real existing pages (AI systems → `/dashboard/ai-systems/{id}`).
- **Unavailable (disabled):** Export explanation, Recalculate score — no backend endpoint → disabled with `title="Action endpoint unavailable"`. No fake success, no local-state mutation.

## Confirmation
No fake business data remains in either page. Graph nodes/edges are real records and real references only; scores are backend-provided or "Unavailable"; drivers are clearly labelled as derived from real records. `tsc --noEmit` is clean and `next build` succeeds with both new routes and all existing routes compiling.
