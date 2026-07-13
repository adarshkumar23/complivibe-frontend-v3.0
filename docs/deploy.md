# Production Deploy Runbook (Frontend)

## Deploying the current demo/staging host today: use `scripts/deploy.sh`

The demo instance on this box has historically been started by hand with a
bare `nohup ... npm start &`. That pattern is how a stale build can end up
silently serving forever: someone merges to `main`, but the running process
is never restarted, and nothing notices — the old build still returns 200s
for every route, so there's no visible symptom at all. This is exactly what
happened in an earlier walkthrough.

**`scripts/deploy.sh [port] [systemd-unit-name]` is now the single supported
way to ship a build to this host.** It does not just build-and-restart and
hope; it verifies the restart actually worked:

1. Installs deps, runs `tsc --noEmit` and `next build` (the same two gates
   as CI) — a broken build never touches the running process.
2. Restarts the process (via `systemctl restart <unit>` if you pass a unit
   name, otherwise it finds and kills whatever's bound to `port` using `ss`
   and starts a fresh `npm start` in its place).
3. Polls `GET /api/version` (`app/api/version/route.ts`) on the restarted
   process and **fails the deploy** if the reported `gitSha` doesn't match
   the commit that was just built. This is the part that actually closes
   the staleness hole: it is no longer possible for a deploy to "succeed"
   while the old build keeps running underneath it.

Recommended for real hosting on this box: install
`deploy/complivibe-frontend.service` as a systemd unit
(`sudo cp deploy/complivibe-frontend.service /etc/systemd/system/ && sudo systemctl daemon-reload && sudo systemctl enable complivibe-frontend`),
then always deploy with `scripts/deploy.sh 3000 complivibe-frontend` — this
also gets you automatic restart-on-crash (`Restart=always`), which the old
manual `nohup` process never had.

If you don't want to install the systemd unit yet, `scripts/deploy.sh 3000`
(no second argument) still works standalone in manual mode.

Verify at any time which build is actually live with `curl
http://<host>/api/version` — compare its `gitSha` against `git rev-parse
HEAD` on the box. A mismatch means the last deploy didn't use
`scripts/deploy.sh`, or the deploy is stale.

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
