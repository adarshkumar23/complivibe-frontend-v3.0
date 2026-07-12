"use client";

import { motion, type Variants } from "framer-motion";
import { Atom } from "lucide-react";
import { GuardrailResolutionSimulator } from "@/components/simulation/GuardrailResolutionSimulator";
import { ReviewerCapacitySimulator } from "@/components/simulation/ReviewerCapacitySimulator";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

export default function SimulationPage() {
  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cv-brand text-white shadow-tile">
              <Atom size={15} />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cv-blue">Simulation</span>
          </div>
          <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-cv-ink sm:text-[34px]">Simulation</h1>
          <p className="max-w-2xl text-[15px] text-cv-slate">
            There is no general &ldquo;what-if&rdquo; scenario engine in this product. The backend exposes exactly two
            narrow, unrelated deterministic simulators &mdash; guardrail policy resolution and reviewer-capacity policy
            scoring &mdash; shown as separate tools below. Both are read-only previews against real organization data.
          </p>
        </div>
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show" className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <GuardrailResolutionSimulator />
        <ReviewerCapacitySimulator />
      </motion.div>
    </div>
  );
}
