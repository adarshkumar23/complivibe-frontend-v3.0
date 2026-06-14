# Executive Summary & Proactive Insights — Hardcoded-Data Audit

**Date:** 2026-06-14
**Pages:** `/dashboard/executive`, `/dashboard/insights`

## Files inspected
- **Pages:** `app/dashboard/executive/page.tsx`, `app/dashboard/insights/page.tsx`
- **Components:** `components/executive/*` (Header, Kpis, Actions, Brief, ReadinessByArea, TopExecutiveRisks, UpcomingDeadlines, BoardSummaryCards), `components/insights/*` (Header, Kpis, InsightFeed, InsightSourceMap, RecommendedActions, PriorityMatrix)
- **Hooks:** `lib/hooks/useExecutiveSummary.ts`, `lib/hooks/useProactiveInsights.ts`
- **API helpers:** `lib/api/executive.ts`, `lib/api/insights.ts`
- **Normalizers:** `lib/api/executive-normalizers.ts`, `lib/api/insight-normalizers.ts`
- **Reused (already audited):** `score-explainer-normalizers.ts` (score components/overall/risk impact), every module normalizer, shared `normalizers.ts`.

## Endpoint reality check
`/api/v1/executive/summary` and `/api/v1/intelligence/proactive/insights` are **confirmed** (matrix + existing helpers), as are the score endpoints (`scores/summary`, `unified-health-score`, `compliance/score`, `governance/score`, `compliance/overview`, `ai-governance/summary`). All other module sources are confirmed/canonical. No write/action endpoints exist → all mutate actions disabled.

## Executive summary strategy
- **Brief:** uses the backend `/executive/summary` narrative/highlights when present (labeled "Backend executive summary"). When absent, shows **factual record counts** derived from real data (labeled "Derived from available records — factual counts only, not an interpreted assessment"). No investor/legal/certification claims, no score interpretation.
- **KPIs & Readiness by area:** read backend score components only (governance/evidence/etc.); "Unavailable" when a component is absent — never defaulted to 0, never fabricated.
- **Top risks / deadlines:** real open risks + incidents (by real severity) and real regulatory/questionnaire/approval due dates only.
- **Board cards:** each fact is a real count condition (e.g. "0 unresolved incidents", "N overdue deadlines"); "What changed recently" counts only records with real `updatedAt` within 7 days; cards show "Unavailable from backend." when their source did not load.

## Insight derivation strategy
- Prefers the backend `/intelligence/proactive/insights` feed (`normalizeBackendInsights`, labeled backend). When empty/unavailable, **derives** factual insights from real records (`buildDerivedInsights`, labeled "Derived from available records"): open high-risk-without-evidence, unresolved incidents, deadlines within a real date window, incomplete/overdue questionnaires, AI systems with linked open risks, pending approvals, open assurance.
- Severity is the real backend field or null (never invented). Recommendations are fixed factual next steps ("Attach evidence", "Open incident", "Check deadline", "Review AI system", "Open questionnaire", "Review approval/case") — no generated legal/compliance guarantees.
- KPIs, source map, recommended actions, and priority matrix are all computed from the real insight list.

## Allowed static labels
Titles/subtitles/eyebrows, KPI/section labels, recommendation verbs, severity/score tone maps, icons, layout math, filter labels, "Derived from available records" notices, action button labels (disabled where noted). None assert a business value.

## Forbidden business values found
**None.** The numeric/literal grep returned no matches (no `|| 0`, no `|| "high"`, no mock/dummy/fake). No fabricated summaries, insights, scores, risks, deadlines, owners, statuses, dates, priorities, recommendations, or executive claims.

## Endpoints used
**Executive (confirmed):** executive/summary, scores/summary, intelligence/unified-health-score, compliance/overview, compliance/score, governance/score, ai-governance/summary + sources (ai-systems, evidence, risks, incidents, reports, audit-packs, questionnaires, trust-center, regulatory deadlines, certifications, approvals, assurance).
**Insights (confirmed):** intelligence/proactive/insights (+ canonical fallbacks `/proactive-insights`, `/insights`) + sources (risks, incidents, regulatory deadlines, questionnaires, ai-systems, approvals, assurance, evidence).

## Unavailable endpoints
Canonical insight fallbacks (`/api/v1/proactive-insights`, `/api/v1/insights`) and any module endpoint not present in the matrix degrade to derived data / unavailable states. No fabrication; sources that fail simply don't contribute.

## Action endpoints — available vs unavailable
- **Available (read navigation only):** Executive "View reports/audit packs/risks/evidence" and brief-stat / risk / deadline / insight "Open" — all route to real existing pages.
- **Unavailable (disabled):** Export executive summary; insight Assign / Resolve / Create task — no backend endpoint → disabled with `title="Action endpoint unavailable"`. No fake success, no local-state mutation.

## Confirmation
No fake business data remains in either page. Executive scores/brief are backend-provided or "Unavailable"/clearly-labeled-derived; insights are backend-provided or derived-and-labeled from real records; severities/recommendations are never invented. `tsc --noEmit` is clean and `next build` succeeds with both new routes and all existing routes compiling.
