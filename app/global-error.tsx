"use client";

// Last-resort error boundary: only triggers when the ROOT layout itself fails,
// so it must render its own <html>/<body> (it replaces the whole document).
// Everything else is caught by the nearer segment boundaries (app/error.tsx,
// app/dashboard/error.tsx). Reports to Sentry so a root-level crash is still
// visible once a DSN is configured (inert no-op until then).

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import "./globals.css";

export default function GlobalError({
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
    <html lang="en">
      <body className="antialiased">
        <div className="flex min-h-screen items-center justify-center bg-cv-mist px-6">
          <div className="w-full max-w-md rounded-2xl border border-cv-line bg-white p-8 text-center shadow-tile">
            <h1 className="text-[22px] font-extrabold tracking-tight text-cv-ink">
              Something went wrong
            </h1>
            <p className="mt-2 text-[14px] text-cv-slate">
              An unexpected error interrupted the app. The issue has been logged. You can try
              reloading — if it keeps happening, please contact support.
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
      </body>
    </html>
  );
}
