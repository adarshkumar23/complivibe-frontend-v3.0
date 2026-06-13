# Evidence Vault — Data Provenance Audit

**Date:** 2026-06-13
**Scope:** Determine whether records shown on `/dashboard/evidence` are frontend-hardcoded, backend seed/demo, real customer-created, or unknown.
**Method:** Static inspection of the frontend repo + environment reconnaissance for backend code / database access. No data was modified or deleted; no servers started.

---

## 1. Frontend hardcoding check — NEGATIVE (verified)

Searched the frontend source (`app/`, `components/`, `lib/`, `store/`) and the entire repo (excluding `node_modules`/`.next`/`.git`) for the reported evidence titles and UUIDs:

| Searched term | Found in frontend? |
|---|---|
| "Vendor AI Risk Board Report" | **No** |
| "Vendor Contract Clause" | **No** |
| "Process Documentation" | **No** |
| "Training Certificate" | **No** |
| "Risk Assessment Document" | **No** |
| "System Configuration Export" | **No** |
| "API Compliance Check" | **No** |
| `4380d24a-dd6b-4506-bfb9-952362a3c3f3` | **No** |
| `11111111-1111-1111-1111-111111111111` | **No** |

**Conclusion:** None of the titles, ids, counts, dates, or statuses are hardcoded anywhere in the frontend. Every record rendered on `/dashboard/evidence` is fetched at runtime from `GET /api/v1/evidence?limit=100` and passed through `lib/api/evidence-normalizers.ts`. The frontend is a pure presentation layer for whatever the backend returns.

---

## 2. Backend seed/demo check — UNVERIFIED in this environment (strong indicators of seed data)

**Environment reconnaissance results:**
- No backend repository is present. `/workspaces` contains only `complivibe-frontend-v3.0` (plus codespace internals). No FastAPI/Django/Express/Alembic/Prisma markers, no `seed`/`fixture`/`factory` files reachable.
- No database clients installed (`psql`, `mysql`, `mongosh` absent; only `sqlite3`, which is irrelevant here).
- No `DATABASE_URL` / DB / tenant environment variables exposed.

Therefore the backend source and database **could not be inspected directly** from this environment. The following is **inference** from the reported data shape, not a direct confirmation.

**Indicators that the 100 records are backend seed/demo data (from the reported observations):**
1. **Placeholder UUID `11111111-1111-1111-1111-111111111111`** — this is a canonical seed/demo sentinel id. Real application inserts almost never produce all-ones UUIDs; they appear when a seed script hardcodes a default user, organization, or tenant id.
2. **Repeated UUIDs across many records** — a real per-record `id` is unique. A UUID that repeats across rows is almost always a shared foreign key (`created_by` / `uploaded_by` / `organization_id` / `tenant_id`) pointing at a single seed/system user or demo tenant — typical of factory-generated demo data.
3. **Generic, templated titles** ("Vendor AI Risk Board Report", "Training Certificate", "Risk Assessment Document", "System Configuration Export") — these read like enum/template values from a seed generator, not user-authored filenames.
4. **Clustered / uniform `created_at` & status values** — bulk seed inserts run in one transaction, producing near-identical timestamps and a small set of repeated statuses. Organic user uploads spread over time with varied metadata.

Any **one** of these is suggestive; **all four together** are a strong signature of seed/demo/factory data.

**Status: Likely backend seed/demo — but UNCONFIRMED** (no backend code or DB access available to verify the seed script, `source` column, or `created_by` = system user).

---

## 3. Real customer-created check — UNLIKELY / UNKNOWN

No evidence that these are real customer/user-created records. The patterns above point away from organic creation. Cannot be confirmed either way without backend/DB access.

---

## 4. What would confirm this definitively

To move backend status from "likely" to "confirmed", inspect **metadata only** (no row contents) via one of:

- **Backend repo:** grep for `seed`, `seeds`, `fixture`, `factory`, `demo`, `sample`, the title strings, and the UUIDs above in the migrations/seed scripts.
- **Read-only API/DB check (authenticated):** with a valid `cv_token`, `GET /api/v1/evidence?limit=100` and aggregate (do not print private rows):
  - total `count`
  - distinct count of `id` (are ids actually unique, or repeated?)
  - distribution of `created_at` (clustered vs. spread)
  - distinct values of `created_by` / `uploaded_by` / `organization_id` / `tenant_id` (one system/seed user → seed data)
  - presence of a `source` / `is_demo` / `seed` flag column

I can run the authenticated read-only API aggregation if you provide a token or permit the call — it reads metadata only and changes nothing.

---

## 5. Final report

| Question | Answer |
|---|---|
| **Frontend hardcoded?** | **No** (verified — no titles/ids/counts in the repo) |
| **Backend seeded/demo?** | **Likely Yes, Unverified** (placeholder + repeated UUIDs, templated titles, uniform dates — but no backend/DB access here to confirm) |
| **Real customer-created?** | **Unknown / Unlikely** |
| **Evidence count** | 100 (matches `?limit=100`; could be capped — true total unknown without an unpaged/count query) |
| **Repeated IDs** | Reported yes (incl. `11111111-1111-1111-1111-111111111111`) — consistent with a shared seed/system/tenant id, not unique per-record ids |
| **Created date pattern** | Reported clustered/similar — consistent with a single bulk seed insert |
| **Source/user/tenant pattern** | Not inspectable in this environment (no backend/DB) |

### Recommendation

- **Safe for internal demo?** **Yes.** Useful for exercising the UI end-to-end.
- **Safe for investor demo?** **Yes, with a verbal caveat.** Present it as "sample/seed data illustrating the workflow." Do **not** imply these are real customer records. Ideally replace the all-ones UUID and uniform timestamps before a high-scrutiny demo, as observant viewers recognize seed artifacts.
- **Safe to claim as customer evidence?** **No.** Until backend/DB inspection confirms real, multi-tenant, user-attributed, time-distributed records, these must not be represented as genuine customer-created evidence.

### Non-negotiable note
The frontend is exonerated: it invents nothing. Any "demo-ness" originates in the backend dataset, which is outside this repo and was not modifiable or inspectable here.
