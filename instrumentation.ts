// Server & edge runtime Sentry initialization.
// Next.js automatically calls `register()` on server startup (app router,
// Next.js >= 13.4 with instrumentationHook, or built-in in Next 15).
//
// This mirrors the backend's `if not settings.SENTRY_DSN: return` pattern:
// if SENTRY_DSN is not set, Sentry is simply never initialized. No crash,
// no-op.

export async function register() {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  if (process.env.NEXT_RUNTIME === "nodejs") {
    const Sentry = await import("@sentry/nextjs");
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
      tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE
        ? Number(process.env.SENTRY_TRACES_SAMPLE_RATE)
        : 0.1,
      // Avoid sending PII by default; matches backend's PII-scrubbing intent.
      sendDefaultPii: false,
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    const Sentry = await import("@sentry/nextjs");
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
      tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE
        ? Number(process.env.SENTRY_TRACES_SAMPLE_RATE)
        : 0.1,
      sendDefaultPii: false,
    });
  }
}

export async function onRequestError(
  ...args: Parameters<typeof import("@sentry/nextjs").captureRequestError>
) {
  if (!process.env.SENTRY_DSN) {
    return;
  }
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(...args);
}
