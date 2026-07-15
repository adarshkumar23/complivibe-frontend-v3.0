"use client";

import { useState } from "react";
import { notFound } from "next/navigation";
import { Bug } from "lucide-react";
import * as Sentry from "@sentry/nextjs";

/**
 * Internal debug/test affordance only.
 *
 * This page exists so that, once a real NEXT_PUBLIC_SENTRY_DSN is configured,
 * an engineer can click "Throw test error" and confirm in the Sentry
 * dashboard that client-side errors are actually being captured. It is not
 * linked from any nav — reachable directly at /dashboard/debug-sentry.
 *
 * When no DSN is configured, Sentry.captureException / the thrown error are
 * inert as far as Sentry is concerned (see instrumentation-client.ts), but
 * the button still throws so React error boundaries can be exercised too.
 */
export default function DebugSentryPage() {
  const [messageSent, setMessageSent] = useState(false);

  // Never expose this deliberately-crashing test affordance in production builds.
  // NODE_ENV is inlined at build time, so this whole page 404s in prod and the
  // "Throw test error" button below is never reachable there. (Hook above is
  // declared first so hook order stays stable regardless of environment.)
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cv-brand text-white shadow-tile">
            <Bug size={15} />
          </span>
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cv-blue">Debug</span>
        </div>
        <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-cv-ink sm:text-[34px]">
          Sentry test affordance
        </h1>
        <p className="max-w-2xl text-[15px] text-cv-slate">
          Internal-only page for verifying Sentry error capture end to end. Not linked from navigation.
          Requires <code>NEXT_PUBLIC_SENTRY_DSN</code> to be configured for events to actually reach Sentry.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            throw new Error("[debug-sentry] deliberate client-side test error");
          }}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-tile hover:bg-red-700"
        >
          Throw test error
        </button>

        <button
          type="button"
          onClick={() => {
            Sentry.captureMessage("[debug-sentry] deliberate test message", "info");
            setMessageSent(true);
          }}
          className="rounded-lg border border-cv-line bg-white px-4 py-2 text-sm font-semibold text-cv-ink shadow-tile hover:bg-cv-mist"
        >
          Send test message
        </button>
      </div>

      {messageSent && (
        <p className="text-sm text-cv-slate">
          Sentry.captureMessage() called. If a real DSN is configured, check the Sentry dashboard for an
          &quot;info&quot; level event.
        </p>
      )}
    </div>
  );
}
