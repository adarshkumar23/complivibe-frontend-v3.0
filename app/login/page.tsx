"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, Loader2, TriangleAlert, Eye, EyeOff, Sparkles } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { login, getMyOrganizations } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth-store";
import { cn } from "@/lib/utils/cn";

export default function LoginPage() {
  const router = useRouter();
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);
  const authenticated = useAuthStore((s) => s.authenticated);
  const hydrate = useAuthStore((s) => s.hydrate);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (authenticated) router.replace("/dashboard");
  }, [authenticated, router]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ email: email.trim(), password });
      // The backend set the session as an httpOnly cookie on this response; there's no
      // token in JS to store. The CSRF cookie's presence (checked by setAuthenticated via
      // the store) is what we track client-side.
      setAuthenticated();
      // Resolve the user's org so org-scoped endpoints get the X-Organization-ID header.
      try {
        const orgs = await getMyOrganizations();
        if (orgs?.[0]?.id) {
          window.localStorage.setItem("cv_org", orgs[0].id);
        }
      } catch {
        // Non-fatal: session-scoped endpoints still work without the header.
      }
      router.replace("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 429) {
          setError("Too many attempts. Please try again later.");
        } else if (err.status === 401) {
          setError("Invalid email or password.");
        } else if (err.status >= 500) {
          setError("The server is having trouble right now. Please try again shortly.");
        } else {
          setError(err.message || "Invalid email or password.");
        }
      } else {
        setError("Unable to reach the server. Please check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  const inputBase =
    "w-full rounded-2xl bg-white/65 py-3 pl-11 pr-4 text-sm text-cv-ink placeholder:text-cv-mist ring-1 ring-white/70 transition focus:outline-none focus:ring-2 focus:ring-cv-blue/45";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      {/* floating decorative glass orbs */}
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-cyan-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-violet-300/30 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-md"
      >
        {/* brand pill above card */}
        <div className="mb-5 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full cv-glass px-4 py-2 text-xs font-semibold text-cv-slate">
            <Sparkles size={14} className="text-cv-purple" />
            AI Governance Command Center
          </span>
        </div>

        <div className="rounded-shell cv-glass-strong p-7 shadow-glass sm:p-9">
          <div className="flex flex-col items-center text-center">
            <Logo size="lg" className="animate-float-slow" />
            <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.22em] text-cv-blue">CompliVibe</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-cv-ink">Welcome back</h1>
            <p className="mt-1.5 text-sm text-cv-slate">Sign in to your governance workspace.</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-[13px] font-semibold text-cv-ink">
                Email
              </label>
              <div className="relative">
                <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-cv-mist" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className={inputBase}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-[13px] font-semibold text-cv-ink">
                Password
              </label>
              <div className="relative">
                <Lock size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-cv-mist" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={cn(inputBase, "pr-11")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-cv-mist transition hover:text-cv-slate"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex items-start gap-2.5 rounded-2xl bg-rose-500/10 px-4 py-3 text-[13px] font-medium text-rose-600 ring-1 ring-rose-500/20"
              >
                <TriangleAlert size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </motion.div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="cv-ring-focus group flex w-full items-center justify-center gap-2 rounded-2xl bg-cv-brand py-3.5 text-sm font-bold text-white shadow-button transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {loading ? (
                <>
                  <Loader2 size={17} className="animate-spin" /> Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight size={17} className="transition group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-[11px] text-cv-mist">
            Secured by CompliVibe · Your session is protected by a secure, HTTP-only cookie.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
