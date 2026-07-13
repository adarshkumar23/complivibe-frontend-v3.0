// Client-side Sentry initialization (Next.js 15 / @sentry/nextjs v10 pattern).
// This file is picked up automatically by the Sentry Next.js webpack/turbopack
// plugin (wired via withSentryConfig in next.config.mjs) and bundled into the
// client runtime.
//
// Mirrors the backend's `if not settings.SENTRY_DSN: return` behavior: if
// NEXT_PUBLIC_SENTRY_DSN is not set, Sentry never initializes client-side.

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    tracesSampleRate: process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE
      ? Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE)
      : 0.1,
    // Avoid sending PII by default; matches backend's PII-scrubbing intent.
    sendDefaultPii: false,
  });
}

export const onRouterTransitionStart = dsn
  ? Sentry.captureRouterTransitionStart
  : undefined;
