"use client";

import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import { CreditCard, Leaf, PiggyBank } from "lucide-react";
import { BillingKpis } from "@/components/billing/BillingKpis";
import { PlanComparison } from "@/components/billing/PlanComparison";
import { CarbonPanel } from "@/components/billing/CarbonPanel";
import { SpendCapModal } from "@/components/billing/SpendCapModal";
import { CarbonReadingModal } from "@/components/billing/CarbonReadingModal";
import { useBilling } from "@/lib/hooks/useBilling";
import { useHasPermission } from "@/lib/hooks/usePermissions";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

export default function BillingPage() {
  const data = useBilling();
  const canSetSpendCap = useHasPermission("billing_usage_spend_cap:write");
  const canRecordCarbon = useHasPermission("carbon_accounting:write");
  const [capOpen, setCapOpen] = useState(false);
  const [readingOpen, setReadingOpen] = useState(false);

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cv-brand text-white shadow-tile">
                <CreditCard size={15} />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cv-blue">Commercial & ESG</span>
            </div>
            <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-cv-ink sm:text-[34px]">
              Billing & ESG
            </h1>
            <p className="max-w-2xl text-[15px] text-cv-slate">
              Subscription status, metered usage with cost projection, and carbon accounting for ESG reporting.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2.5 self-start sm:self-auto">
            {canSetSpendCap ? (
              <button
                type="button"
                data-testid="open-spend-cap"
                onClick={() => setCapOpen(true)}
                className="cv-ring-focus inline-flex items-center gap-2 rounded-full bg-white/60 px-4 py-2.5 text-[13px] font-semibold text-cv-ink ring-1 ring-white/70 transition hover:bg-white"
              >
                <PiggyBank size={15} strokeWidth={2.4} />
                Spend cap
              </button>
            ) : null}
            {canRecordCarbon ? (
              <button
                type="button"
                data-testid="open-record-emissions"
                onClick={() => setReadingOpen(true)}
                className="cv-ring-focus inline-flex items-center gap-2 rounded-full bg-cv-brand px-5 py-2.5 text-[13px] font-semibold text-white shadow-tile transition hover:opacity-90"
              >
                <Leaf size={15} strokeWidth={2.4} />
                Record emissions
              </button>
            ) : null}
          </div>
        </div>

        <SpendCapModal open={capOpen} onClose={() => setCapOpen(false)} usage={data.usage.data} />
        <CarbonReadingModal open={readingOpen} onClose={() => setReadingOpen(false)} />
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <BillingKpis data={data} />
      </motion.div>

      <motion.div variants={fade} custom={2} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PlanComparison data={data} />
        </div>
        <div>
          <CarbonPanel data={data} />
        </div>
      </motion.div>
    </div>
  );
}
