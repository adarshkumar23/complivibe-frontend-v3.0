# Completion-Pass Shared Brief (read this first)

You are one of several parallel subagents building real mutation UI for CompliVibe.
The orchestrator will personally re-verify everything you claim, with real HTTP calls
and real UI clicks. Self-reports without evidence will be treated as failures.

## Environment
- Frontend repo: `/home/ubuntu/complivibe-frontend-v3.0-phase-a` (Next.js 15 app router), branch `full-completion-pass` — already checked out. Dev server ALREADY RUNNING at `http://127.0.0.1:3777` with hot reload. Do NOT start another dev server, do NOT restart it, do NOT run `next build`.
- Backend: FastAPI at `http://127.0.0.1:8123` (rate limiting off). Live spec snapshot: `reports/live-openapi.json` (1,566 paths). ALWAYS confirm real endpoint shape from this file or a live call before building against it — never from assumption.
- Login: `admin@complivibe.io` / `PhaseA-Rebuild-2026!`, org `3f663d8b-0d8a-439c-b5b5-be0f94198fe2` ("CompliVibe Demo Corp"). API needs `Authorization: Bearer <token>` + `X-Organization-ID` header. Token from `POST /api/v1/auth/login {"email":...,"password":...}` (TTL 30 min).
- Curl helper you may copy: login, then `curl -H "Authorization: Bearer $TOK" -H "X-Organization-ID: 3f663d8b-0d8a-439c-b5b5-be0f94198fe2"`.

## Code conventions (match exactly)
- API layer: `lib/api/<domain>.ts` — typed functions using `apiFetch` from `lib/api/client.ts`. Types mirror the LIVE backend schema; comment each section with the endpoint path.
- Hooks: `lib/hooks/use<Domain>.ts` using @tanstack/react-query. For mutations use `useMutation` + `queryClient.invalidateQueries` on the affected query keys so the UI updates WITHOUT a page reload. Optimistic updates welcome where safe.
- UI primitives in `components/ui/`: `SectionCard`, `StatCard`, `RegistryKpi`, `StatusBadge`, `SeverityBadge`, `EmptyState`, `ErrorState`, `LoadingSkeleton` (`SkeletonRows`), `GlassCard`, `IconTile`, accent system in `accent.ts`. Study 2–3 existing pages (e.g. `app/dashboard/evidence`, `components/vendor-risk/`) before writing anything. Glassmorphism style, tailwind classes like `text-cv-ink`, `text-cv-slate`, `ring-white/60`, rounded-2xl. Icons: lucide-react.
- Modals/forms: there is no shared modal primitive yet — if you build one, put it in `components/ui/` and keep it consistent with the glass style; check first whether another agent already added one (`ls components/ui`) and reuse it.
- HONEST DATA DISCIPLINE (zero tolerance): never fabricate a value, never hardcode a business literal, never invent placeholder metrics. If the backend has no data or no endpoint, show an honest empty/error state and record the gap in your report. Forms must surface real backend validation errors (422 details, 403 feature-gates, 503 secrets-backend) in the UI, readable, not swallowed.

## Mandatory live verification (per mutation you build)
1. Perform the action through the REAL UI with Playwright (`node scripts/<your-verify>.mjs` from repo root; copy the login pattern from `scripts/verify-vendor-risk.mjs`).
2. Confirm backend state actually changed with a follow-up API GET.
3. Confirm the UI reflects the change WITHOUT manual refresh.
4. Capture: the exact request/response evidence + a screenshot into `reports/completion-pass/<your-id>/`.
Console errors during your flows must be zero.

## Deliverables
- Write your report to `reports/completion-pass/<your-id>-report.md`: what you built, evidence per mutation (request/response + screenshot path), real backend gaps found (explicitly, never worked around by faking), files touched.
- Do NOT run `git commit` / `git checkout` / anything git-mutating. Leave changes in the working tree. The orchestrator commits.
- Do NOT edit files clearly owned by another domain. Shared files (`components/layout/Topbar.tsx`, `FloatingSidebar.tsx`, `BottomModeSwitcher.tsx`, `lib/api/client.ts`) may be touched ONLY if your assignment explicitly says so.
- `npx tsc --noEmit` must be clean over your changes before you finish.
- Do not end your turn until your flows are verified live end-to-end. If blocked by a real backend limitation, document it precisely (endpoint, request, response) and build the honest-state UI anyway.
