"use client";

// Root-segment error boundary: catches render errors in top-level routes (e.g.
// "/", "/login") while keeping the root <html>/<body> shell intact. Dashboard
// routes are handled by the nearer app/dashboard/error.tsx so their sidebar/
// topbar shell is preserved. Reports to Sentry (inert until a DSN is set).

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-cv-mist px-6">
      <div className="w-full max-w-md rounded-2xl border border-cv-line bg-white p-8 text-center shadow-tile">
        <h1 className="text-[22px] font-extrabold tracking-tight text-cv-ink">
          Something went wrong
        </h1>
        <p className="mt-2 text-[14px] text-cv-slate">
          An unexpected error interrupted this page. The issue has been logged.
        </p>
        {error?.digest ? (
          <p className="mt-3 font-mono text-[11px] text-cv-slate/70">ref: {error.digest}</p>
        ) : null}
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 rounded-lg bg-cv-brand px-4 py-2 text-sm font-semibold text-white shadow-tile hover:opacity-90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
