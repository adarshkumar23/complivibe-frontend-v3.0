"use client";

// Dashboard-scoped error boundary. Rendered INSIDE app/dashboard/layout.tsx, so a
// crashing dashboard page shows this fallback while the DashboardShell (sidebar /
// topbar / brand chrome) stays intact — instead of blowing the whole app up to
// Next's default error page. Reports to Sentry (inert until a DSN is configured).

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({
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
    <div className="flex min-h-[60vh] items-center justify-center px-6" data-testid="dashboard-error-boundary">
      <div className="w-full max-w-md rounded-2xl border border-cv-line bg-white p-8 text-center shadow-tile">
        <span className="mx-auto mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
          <AlertTriangle size={20} />
        </span>
        <h2 className="text-[20px] font-extrabold tracking-tight text-cv-ink">
          This section hit an error
        </h2>
        <p className="mt-2 text-[14px] text-cv-slate">
          Something went wrong loading this page. The rest of your workspace is still available —
          the issue has been logged.
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
