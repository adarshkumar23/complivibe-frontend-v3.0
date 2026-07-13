# Production Secrets Management (Frontend)

Mechanism only — no real values in this file or any committed file.

## What the frontend actually needs at build/runtime

The frontend talks to the backend exclusively through its own same-origin
proxy route, `app/api/proxy/[...path]/route.ts` (confirmed by reading
`lib/api/client.ts` — there is no client-side bearer token; the session
lives in an httpOnly cookie set by the backend and forwarded automatically
on same-origin requests). That means the frontend's own secret surface is
small:

- The proxy route needs to know the backend's URL. As of this pass it's
  read in `app/api/proxy/[...path]/route.ts` as
  `process.env.NEXT_PUBLIC_API_BASE_URL`, defaulting to
  `https://api.adarshkumar.app` (the demo tunnel's convention) when unset.
  Two things for a human to decide before go-live:
  1. This must be overridden with the real production backend origin in
     the hosting platform's env config — do not ship the demo default.
  2. The `NEXT_PUBLIC_` prefix is a latent footgun: it's only safe today
     because this value is read exclusively inside a server-only route
     handler, never a client component. If it's ever imported into
     client code, Next.js will inline it into the browser bundle. Since
     it's just a base URL (not a secret) that's low severity, but worth
     renaming to a non-`NEXT_PUBLIC_` server-only var (e.g.
     `BACKEND_API_URL`) when this is next touched, so the naming itself
     enforces the boundary.
- No API keys, DB credentials, or Vault tokens belong in the frontend at
  all — those are backend-only. If a future feature needs a frontend
  secret (e.g. a public analytics key), only `NEXT_PUBLIC_*`-prefixed,
  genuinely-public values go in the client bundle; anything sensitive
  must stay server-side (API routes / proxy) or off the frontend entirely.

## Where production values live

Whatever hosting platform is chosen (see `docs/deploy.md`), its native
environment-variable / secrets UI is the source of truth for production
values — e.g. Vercel Project → Settings → Environment Variables, scoped to
the Production environment only (not Preview/Development, so PR previews
never get real backend credentials). Do not mirror those values into
GitHub Actions secrets unless the deploy workflow itself needs them (e.g.
a deploy token), and never into any file in this repo.

## Local dev hygiene

- Confirm a `.env.local` (gitignored, Next.js convention) is used for any
  local overrides — do not add real values to `.env.example`-style files
  if one is introduced later.
- Before any commit, diff staged files (`git diff --cached`) rather than
  trusting `.gitignore` alone.
