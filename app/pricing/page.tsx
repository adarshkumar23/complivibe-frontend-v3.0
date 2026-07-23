"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, Check, Loader2, Sparkles } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { getBillingPlans, type BillingPlan } from "@/lib/api/billing";

// Free and Trial are NOT purchasable (flagged in backend 1c-1) -- exclude them.
const PURCHASABLE_ORDER = ["starter", "growth", "enterprise", "usage_flex"];

function priceLabel(p: BillingPlan): string {
  if (p.plan_type === "usage_based") return "Usage-based";
  if (!p.price_inr_monthly) return "Custom";
  return `₹${Math.round(p.price_inr_monthly / 100).toLocaleString("en-IN")}`;
}

function highlights(p: BillingPlan): string[] {
  const f = p.features as Record<string, unknown>;
  const cap = (n: number | null, label: string) => (n === null ? `Unlimited ${label}` : `${n} ${label}`);
  const rows: string[] = [cap(p.max_users, "users"), cap(p.max_frameworks, "frameworks")];
  if (f.ai_governance_module) rows.push("AI Governance suite");
  if (f.data_governance) rows.push("Data observability");
  if (f.advanced_analytics) rows.push("Intelligence & analytics");
  if (f.sso_enabled) rows.push("SSO");
  if (f.scim_enabled) rows.push("SCIM provisioning");
  if (f.governance_autopilot) rows.push("Governance autopilot");
  return rows;
}

export default function PricingPage() {
  const plans = useQuery({ queryKey: ["public-billing-plans"], queryFn: getBillingPlans });
  const purchasable = (plans.data ?? [])
    .filter((p) => PURCHASABLE_ORDER.includes(p.plan_code))
    .sort((a, b) => PURCHASABLE_ORDER.indexOf(a.plan_code) - PURCHASABLE_ORDER.indexOf(b.plan_code));

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-cyan-300/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-violet-300/25 blur-3xl" />

      <div className="relative mx-auto max-w-6xl">
        <header className="flex flex-col items-center text-center">
          <Logo size="lg" className="animate-float-slow" />
          <span className="mt-4 inline-flex items-center gap-2 rounded-full cv-glass px-4 py-2 text-xs font-semibold text-cv-slate">
            <Sparkles size={14} className="text-cv-purple" /> Plans &amp; pricing
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-cv-ink sm:text-4xl">Choose your plan</h1>
          <p className="mt-2 max-w-xl text-[15px] text-cv-slate">
            Start free, or pick a paid plan for the full compliance &amp; AI-governance suite. Prices in INR, per month.
          </p>
        </header>

        {plans.isLoading ? (
          <div className="mt-16 flex justify-center"><Loader2 className="animate-spin text-cv-blue" /></div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4" data-testid="pricing-grid">
            {purchasable.map((p, i) => (
              <motion.div
                key={p.plan_code}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                data-testid={`plan-${p.plan_code}`}
                className={`flex flex-col rounded-shell p-6 shadow-glass ${
                  p.plan_code === "growth" ? "cv-glass-strong ring-2 ring-cv-blue/40" : "cv-glass"
                }`}
              >
                {p.plan_code === "growth" ? (
                  <span className="mb-2 inline-flex w-fit rounded-full bg-cv-brand px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    Most popular
                  </span>
                ) : null}
                <h3 className="text-lg font-extrabold text-cv-ink">{p.display_name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold text-cv-ink">{priceLabel(p)}</span>
                  {p.plan_type !== "usage_based" && p.price_inr_monthly ? (
                    <span className="text-[13px] font-semibold text-cv-mist">/mo</span>
                  ) : null}
                </div>
                <ul className="mt-4 flex-1 space-y-2">
                  {highlights(p).map((h) => (
                    <li key={h} className="flex items-start gap-2 text-[13px] text-cv-slate">
                      <Check size={15} className="mt-0.5 shrink-0 text-emerald-500" /> {h}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className="cv-ring-focus mt-5 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-cv-brand px-4 py-2.5 text-[13px] font-bold text-white shadow-button transition hover:-translate-y-0.5"
                >
                  Get started <ArrowRight size={15} />
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        <p className="mt-10 text-center text-[13px] text-cv-slate">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-cv-blue hover:text-cv-purple">Sign in</Link>
          {" · "}
          <Link href="/register" className="font-semibold text-cv-blue hover:text-cv-purple">Start free</Link>
        </p>
      </div>
    </div>
  );
}
