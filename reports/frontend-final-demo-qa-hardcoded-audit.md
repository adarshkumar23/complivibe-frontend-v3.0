# Frontend Final Demo QA — Hardcoded-Data Audit

**Date:** 2026-06-14
**Scope:** Full-codebase audit with focus on recent additions — Command Center coverage map, sidebar active-state fix, Data Lineage, Copilot Drawer, Simulation, Agents, Enterprise, Security/Privacy, Executive/Insights.
**Method:** Static code analysis (grep sweeps) + production build + runtime proxy probes. No backend changes.

---

## Sweeps performed

| Check | Command intent | Result |
|-------|----------------|--------|
| Leftover debug logging | `console.(log|error|warn|debug)` in `app/components/lib/store` | **None** |
| Random/fabricated values | `Math.random` | **None** |
| Hardcoded numeric business values | `(value|score|count|percentage|total|trend): <number>` | **None** (only a CSS `animation-iteration-count`) |
| Fake chart/series data | inline `[n, n, n, …]` literals | **None** (only `[404,405,501]` HTTP-status guards) |
| Hardcoded business strings | `(name|title|status|owner|score): "Capitalised…"` in recent modules | **None** (only static section titles / UI labels) |
| Token/secret/PII rendering | `cv_token`, `getItem(`, token in JSX | **None rendered** — only `app/page.tsx` reads the token inside `useEffect` to choose a redirect target |
| Secret-ish fields in lineage/copilot | `token|api_key|secret|password|webhook_url|credential` | **None referenced** |

---

## Module-by-module confirmation

- **Command Center coverage map** — all counts come from live endpoints via `getCountFromPayload`; unavailable endpoints render "Unavailable" (never 0). No seeded counts hardcoded.
- **Sidebar active-state fix** — pure styling/route-matching; "Data Observability" set to exact match so the new "Data Lineage" child is the only active item on the sub-route. No data.
- **Data Lineage** — nodes/edges come only from a real lineage endpoint or are derived strictly from real cross-module reference fields; relationship strings are static descriptors of those real fields. No fabricated nodes, edges, datasets, pipelines, or sensitive findings. Sensitive data shown as metadata only (no raw PII/values).
- **Copilot Drawer** — relays only genuine backend answers; suggested prompts are static UI helper text that only populate the input; disabled actions (Create task / Export) never fake success. Runtime probe confirms `/api/v1/copilot/chat` exists (HTTP 405 on GET), so the drawer is genuinely backed.
- **Simulation / Agents / Enterprise / Security / Privacy / Executive / Insights** — grep for hardcoded business strings/numbers found none; section titles and "What is healthy / needs attention / blocked / changed recently" headings are static labels, while the underlying facts are computed from fetched data.

---

## Confirmations

- ✅ No fake business values.
- ✅ No hardcoded seed counts.
- ✅ No fake AI / Copilot responses.
- ✅ No fake lineage edges (edges only from real reference fields).
- ✅ No fake scores (missing scores show honest coverage captions / "Awaiting score endpoint", never 0).
- ✅ No raw tokens/secrets exposed (token only used as a Bearer header; read once in `useEffect` for redirect).
- ✅ No raw PII (sensitive data is metadata-only).

**Result: no fabricated frontend business data remains.**
