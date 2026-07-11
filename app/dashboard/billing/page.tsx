"use client";

import { motion, type Variants } from "framer-motion";
import { CreditCard } from "lucide-react";
import { BillingKpis } from "@/components/billing/BillingKpis";
import { PlanComparison } from "@/components/billing/PlanComparison";
import { CarbonPanel } from "@/components/billing/CarbonPanel";
import { useBilling } from "@/lib/hooks/useBilling";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

export default function BillingPage() {
  const data = useBilling();

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
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
