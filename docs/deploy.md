# Production Deploy Runbook (Frontend)

## Deploy architecture: release directories + `current` symlink

This box serves the frontend with a long-running `next start`. `next start`
reads `.next/` from its working directory and holds `BUILD_ID` in memory.
The old deploy ran `next build` **inside the live working directory**, which
rewrites `.next/` in place under the running server — mid-build the directory
is inconsistent (old chunks deleted, manifests half-written) so live requests
throw `ENOENT` / `Cannot find module './NNNN.js'`, and afterwards the on-disk
`BUILD_ID` no longer matches the one in memory. **That took prod down once.**

The service therefore no longer runs from the git repo. It runs from a
`current` symlink under a separate deploy root, and every build happens in a
fresh release directory that is only swapped in once it has fully built:

```
/home/ubuntu/complivibe-frontend/          ← deploy root (NOT the git repo)
├── releases/<sha>-<ts>/    ← a git worktree at that commit, built here (own .next + node_modules)
├── current -> releases/<sha>-<ts>          ← atomically swapped symlink the service runs from
├── shared/frontend.env                     ← prod env, OUTSIDE the git repo (see "Env" below)
└── previous-release                        ← path of the prior release, for one-command rollback
```

The systemd unit (`deploy/complivibe-frontend.service`, installed to
`/etc/systemd/system/`) has `WorkingDirectory=/home/ubuntu/complivibe-frontend/current`.
`systemctl restart` re-resolves that symlink, so a restart picks up whichever
release `current` names.

**Guarantees:** (a) a build never mutates what's being served — it builds in a
brand-new release dir; (b) a failed build never reaches the swap, so prod is
left byte-for-byte untouched; (c) rollback is an instant symlink swap back.

## Deploying: `scripts/deploy.sh`

**`scripts/deploy.sh [ref] [port] [systemd-unit]` is the single supported way
to ship a build.** Defaults: `ref=HEAD`, `port=3000`, `unit=complivibe-frontend`.

```bash
cd /home/ubuntu/complivibe-frontend-v3.0-phase-a
git fetch && git checkout main && git pull       # get the commit you want live
scripts/deploy.sh                                 # build HEAD → swap → restart → verify
```

What it does:

1. `git worktree add releases/<sha>` at the target commit, then `npm ci`,
   `tsc --noEmit`, `next build` **in that release dir** (same two gates as CI).
   A broken build aborts here, tears down the partial release, and leaves
   `current`/prod completely untouched (exit non-zero).
2. Atomically repoints `current` → the new release (`rename(2)` on the
   symlink) and `systemctl restart`s the unit.
3. Polls `GET /api/version` and **fails the deploy** unless the running
   process reports the exact `gitSha` just built — closing the staleness hole
   (`NEXT_PUBLIC_GIT_SHA` is baked in at build time by this script).
4. Prunes old releases, keeping the newest `KEEP_RELEASES` (default 3).

To validate the pipeline without touching :3000, deploy to a spare port with
no systemd unit: `scripts/deploy.sh HEAD 3001 ''` (builds + serves a throwaway
`next start` on 3001).

Verify which build is live at any time: `curl http://127.0.0.1:3000/api/version`
— compare `gitSha` to `git rev-parse HEAD`.

## Rollback: `scripts/rollback.sh`

Every deploy leaves the prior release on disk and records its path in
`previous-release`, so rollback is a symlink swap + restart — **seconds, no
rebuild**:

```bash
scripts/rollback.sh                       # → previous-release, unit complivibe-frontend
# or to a specific release:
ls -1dt /home/ubuntu/complivibe-frontend/releases/*/     # list what's available
scripts/rollback.sh complivibe-frontend /home/ubuntu/complivibe-frontend/releases/<sha>-<ts>
```

It repoints `current`, restarts, and verifies `/api/version` reports the
rolled-back commit.

## Env: prod config lives OUTSIDE the git repo

`NEXT_PUBLIC_*` is inlined at **build** time, and `next dev`/`next build`
auto-load `.env.local` from the working directory. Historically a `.env.local`
in the repo pointed at the prod backend (`127.0.0.1:8000`), so a stray dev
command in that dir hit the **prod DB** (it once created 4 stray orgs).

Prod build/runtime config therefore lives only in
`/home/ubuntu/complivibe-frontend/shared/frontend.env` — sourced by
`scripts/deploy.sh` at build time and loaded by systemd at runtime, never in
the source tree. The repo ships `.env.local.example` only; **do not** create a
`.env.local` pointing at `127.0.0.1:8000` in the repo. For real local dev, run
a local backend and point at it explicitly.

## Status: real (Vercel) production pipeline built, NOT activated

`ci.yml` runs `tsc --noEmit` and `next build` on every push/PR to `main`
and is real today. `deploy.yml` exists but its `deploy` job deliberately
fails — there is no hosting project configured. This pass did not create
a Vercel account, project, or any other hosting target, and did not touch
DNS.

## What already exists and is real

- httpOnly-cookie based auth already implemented (commit `28d59be`,
  "Security fix: move session token out of localStorage into an httpOnly
  cookie"), consistent with the backend's `_set_auth_cookies`.
- Same-origin proxy pattern: the browser only ever talks to this Next.js
  app's own `/api/proxy/*` route (`app/api/proxy/[...path]/route.ts`),
  which server-side-forwards to the backend, including the session cookie
  and the `x-csrf-token` header. This means the browser never needs to
  know the backend's origin, and cookie `SameSite=strict` on the backend
  works cleanly because the cookie is only ever sent same-origin (to the
  frontend host, not cross-site to the backend host) — worth preserving
  this architecture in production rather than switching to direct
  browser→backend calls, which would force cookie `SameSite=None` and a
  shared-domain (`domain=.complivibe.in`) cookie instead.
- `NEXT_PUBLIC_API_BASE_URL` currently defaults to
  `https://api.adarshkumar.app` (demo convention) inside the proxy route
  — flagged in `docs/secrets_management.md` as something that must be
  overridden per-environment and, ideally, renamed off `NEXT_PUBLIC_`.

## Step-by-step: what a human needs to do to actually go live

1. **Confirm the domain** for the frontend (e.g. `app.complivibe.in`),
   matching whatever is decided for the backend in the backend repo's
   runbook (`docs/runbooks/deploy.md`) — they need to agree, since the
   proxy pattern assumes the frontend is what the browser talks to.
2. **Create the Vercel project** (or chosen alternative) and link it to
   `complivibe-frontend-v3.0` on GitHub. This is an account-level action
   this pass did not take — no Vercel CLI auth or project files were
   found in this environment (verified: no `~/.vercel`, no `vercel.json`
   in the repo).
3. **Set production environment variables** in the hosting project
   (Production scope only, not Preview): the real backend origin for
   `NEXT_PUBLIC_API_BASE_URL` (or its renamed replacement), and any other
   `NEXT_PUBLIC_*` values the app needs — audit `next.config.mjs` and any
   `process.env.NEXT_PUBLIC_*` references before the first deploy so
   nothing defaults to the demo tunnel silently.
4. **Create the GitHub `production` Environment** with required reviewers
   and add whatever secrets the real deploy step needs (e.g.
   `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` if Vercel is
   chosen).
5. **Replace the placeholder `deploy` job body** in
   `.github/workflows/deploy.yml` with the real deploy command (a
   commented Vercel example is already in the file).
6. **Point DNS** for the chosen frontend domain at the hosting platform
   (Vercel's own DNS instructions, or a CNAME/A record via whatever
   controls `complivibe.in`/`adarshkumar.app` today — this pass did not
   check DNS registrar/zone access and did not change any DNS record).
7. **Cut over the Cloudflare tunnel**: the demo's `demo.adarshkumar.app`
   ingress rule in `/etc/cloudflared/config.yml` continues to serve
   `127.0.0.1:3000` (the demo's `next start`) independently — real
   production traffic should NOT be routed through that tunnel rule.
   Decide explicitly whether production frontend is Vercel-hosted
   (recommended — no tunnel involved at all) or another tunnel-fronted
   process; if the latter, it needs its own distinct hostname and ingress
   rule, never reusing `demo.adarshkumar.app`.
8. **First real deploy**: trigger `deploy.yml` via `workflow_dispatch`,
   type `deploy` to confirm, and watch the `production` Environment
   approval gate.

## What this pass explicitly did NOT do

- Did not create a Vercel account or project.
- Did not run `vercel deploy` or any deploy command.
- Did not point any DNS record at anything.
- Did not create any production secret value.
- Did not merge this branch to `main`, and did not push it anywhere.
