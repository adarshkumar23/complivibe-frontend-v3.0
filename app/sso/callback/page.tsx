"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/api/policies";

/**
 * SSO / OIDC landing page.
 *
 * The backend callback (/api/v1/auth/sso|oidc/{slug}/callback) has already established
 * the session by setting the httpOnly cv_session + readable cv_csrf cookies and
 * 303-redirecting the browser here. The access token is NEVER delivered in a body or
 * exposed to JavaScript -- exactly like password login. This page just confirms the
 * cookie-based session and forwards into the app; on failure it sends the user to /login.
 */
export default function SsoCallbackPage() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await getCurrentUser();
        if (active) router.replace("/dashboard");
      } catch {
        if (active) setFailed(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-cv-canvas px-6 text-center">
      {failed ? (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm font-semibold text-cv-ink">We couldn&apos;t complete single sign-on.</p>
          <button
            type="button"
            onClick={() => router.replace("/login")}
            className="cv-ring-focus rounded-full bg-cv-brand px-5 py-2 text-[13px] font-semibold text-white shadow-tile transition hover:opacity-90"
          >
            Back to sign in
          </button>
        </div>
      ) : (
        <p className="text-sm font-medium text-cv-slate">Signing you in…</p>
      )}
    </main>
  );
}
