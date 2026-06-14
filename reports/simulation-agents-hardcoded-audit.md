# Scenario Simulation & Agents — Hardcoded-Data Audit

**Date:** 2026-06-14
**Pages:** `/dashboard/simulation`, `/dashboard/agents`

## Files inspected
- **Pages:** `app/dashboard/simulation/page.tsx`, `app/dashboard/agents/page.tsx`
- **Simulation components:** `SimulationHeader`, `SimulationKpis`, `SimulationActions`, `ScenarioBuilderPanel`, `SimulationResultsPanel`, `ImpactMapPanel`, `HistoricalSimulationsPanel`
- **Agents components:** `AgentsHeader`, `AgentsKpis`, `AgentsActions`, `AgentRegistryPanel`, `AgentRunsPanel`, `FindingsPanel`, `HumanReviewPanel`, `AgentCoveragePanel`
- **Hooks:** `lib/hooks/useSimulation.ts`, `lib/hooks/useAgents.ts`
- **API helpers:** `lib/api/simulation.ts`, `lib/api/agents.ts`
- **Normalizers:** `lib/api/simulation-normalizers.ts`, `lib/api/agent-normalizers.ts`
- **Reused (already audited):** `normalizeSystems`, `normalizeRisks`, `normalizeIncidents`, `normalizeRegulatoryDeadlines`, `normalizeEvidenceItems`, `normalizeAuditPacks`, `normalizeQuestionnaires`, `normalizeApprovals`/`isPending`, `normalizeAssuranceCases`/`isComplete`, risk `isMitigated`, questionnaire `isComplete`.

## Endpoint reality check
**Confirmed / already safely used (source records):** `/api/v1/ai-systems`, `/api/v1/risks?limit=100`, `/api/v1/incidents?limit=100`, `/api/v1/regulatory-intelligence/deadlines`, `/api/v1/evidence?limit=100`, `/api/v1/audit-packs?limit=100`, `/api/v1/questionnaires?limit=100`, `/api/v1/intelligence/proactive/insights`, `/api/v1/intelligence/predict/alerts`, `/api/v1/approvals`→`/api/v1/approval-queue`, `/api/v1/assurance-ext/cases`→`/api/v1/assurance/reviews`. **Canonical-only** (fetched with `retry:false`, graceful 404 → unavailable state): `/api/v1/simulations`→`simulation`→`scenario-simulation`→`scenarios`→`intelligence/scenarios`, `/api/v1/intelligence/impact-analysis`, `/api/v1/agents`, `/api/v1/agents/runs`→`/api/v1/jobs`→`/api/v1/automation/runs`, `/api/v1/agents/tasks`, `/api/v1/agents/findings`. No endpoint paths were invented or changed; no backend code was touched.

## Allowed static labels
Titles/subtitles/eyebrows, KPI/section labels, the **scenario-type catalogue** (Evidence gap, Risk escalation, Deadline missed, Incident unresolved, AI system high-risk, Vendor issue, Audit pack incomplete — labels only, never rendered as backend results), the **agent archetype examples** (Evidence/Risk/Regulatory/Questionnaire/Audit Pack/Trust Center/Monitoring Agent — shown only inside the registry empty state, visually muted, clearly not data rows), tone/severity color maps, input-row icons/labels, and the "Derived from available intelligence records" / "Derived from available records" provenance labels. None assert a business value.

## Forbidden business values found
**None.** Greps for mock/fake arrays, secret/token literals, `|| 0` / `?? 0` display defaults, and hardcoded `"passed/success/completed/healthy/secure"` claims returned no fabricated data.
- The one array literal (`HumanReviewPanel` `[...approvalItems, ...assuranceItems]`) merges two **real** normalized backend lists.
- The `sk_` grep hits are substrings of the field-path strings `risk_*`/`task_*` inside normalizers — not credentials.
- The single `?? 0` (`AgentsKpis` awaiting-review) is a **guarded sum**: it returns `null` when both approval and assurance sources are unavailable, and only adds real counts when at least one source succeeded — never a display default for missing data.

## Fixes made
No forbidden values were introduced, so no remediation was required. Every count is gated behind `isSuccess`, so an unavailable endpoint yields "Unavailable" (never 0); a successful empty list yields a real `0`/empty-state.

## Simulation data strategy
- **KPIs** — Available scenarios and Simulated impacts come only from backend simulation results (`normalizeSimulations`, `simulatedImpactCount`); Affected systems is the distinct system count across those results; High-risk inputs is **derived from real risk records** (high/critical severity), captioned "from risk records". Each is "Unavailable" until its source succeeds — no simulation count or impact score is invented.
- **Scenario builder** lists real backend record counts per input category (AI systems, risks, incidents, deadlines, evidence, audit packs, questionnaires) or "Unavailable"; scenario-type chips are static labels; **Run Simulation is disabled** with tooltip "Simulation endpoint unavailable".
- **Results / Impact map / History** render only backend simulation output (name, type, impact score, affected systems/evidence/risks/deadlines, recommendations, dates). With no backend results they show "Simulation results/history unavailable from backend." and the impact map aggregates only backend-reported affected areas — no cause-effect chains are invented.

## Agent data strategy
- **KPIs** — Active agents from the real registry (active count only when a real status exists); Tasks processed from the real tasks endpoint, else real runs/jobs; Findings from the real findings endpoint, else real intelligence insights; Awaiting human review from pending approvals + open assurance cases. Each is "Unavailable" until its source succeeds.
- **Registry / Runs / Findings** show only real records; when the agents endpoint is absent the registry shows an unavailable state with muted archetype examples (not data). Findings fall back to intelligence insights **explicitly labelled** "Derived from available intelligence records".
- **Human review** lists real pending approvals and open assurance cases. **Coverage** is derived from real source records (AI systems, evidence, open risks, active alerts, pending questionnaires) and labelled "Derived from available records".

## Action endpoints — available vs unavailable
- **Available (read navigation only):** Agents → Automation (`/dashboard/automation`), Assurance (`/dashboard/assurance`), Approvals (`/dashboard/approvals`). All target real existing routes.
- **Unavailable (disabled):** Simulation → Run simulation, Save scenario, Export result, Create task (tooltip "Simulation endpoint unavailable"); Agents → Run agent, Pause agent, Export agent report (tooltip "Action endpoint unavailable"). No fake success, no local-state mutation, no fabricated simulation output or agent activity.

## Confirmation
No fake business data remains in either page. No simulations, scenarios, impact scores, agent rows, runs, tasks, findings, recommendations, statuses, or dates are fabricated. All values come from real backend records or are shown as "Unavailable"/empty; derived and fallback data is clearly labelled; disabled actions never fake success. `tsc --noEmit` is clean and `next build` succeeds with both new routes (simulation 10.4 kB, agents 11 kB) and all existing routes compiling.
