"use client";

import { motion, type Variants } from "framer-motion";
import { Bot } from "lucide-react";
import { AutopilotKpis } from "@/components/autopilot/AutopilotKpis";
import { AutopilotGuardrails } from "@/components/autopilot/AutopilotGuardrails";
import { AutopilotPipeline } from "@/components/autopilot/AutopilotPipeline";
import { AutopilotPolicies } from "@/components/autopilot/AutopilotPolicies";
import { IntentsTable } from "@/components/autopilot/IntentsTable";
import { ApprovalsTable } from "@/components/autopilot/ApprovalsTable";
import { ExecutionsTable } from "@/components/autopilot/ExecutionsTable";
import { useAutopilot } from "@/lib/hooks/useAutopilot";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

export default function AutopilotPage() {
  const data = useAutopilot();

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cv-brand text-white shadow-tile">
              <Bot size={15} />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cv-blue">Governed Automation</span>
          </div>
          <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-cv-ink sm:text-[34px]">
            Governance Autopilot
          </h1>
          <p className="max-w-2xl text-[15px] text-cv-slate">
            Policy-bounded automation: candidate actions, execution intents, human approvals, and the guardrails that
            keep autopilot from acting without authorization.
          </p>
        </div>
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <AutopilotKpis data={data} />
      </motion.div>

      <motion.div variants={fade} custom={2} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AutopilotPipeline data={data} />
        </div>
        <div>
          <AutopilotGuardrails data={data} />
        </div>
      </motion.div>

      <motion.div variants={fade} custom={3} initial="hidden" animate="show">
        <AutopilotPolicies />
      </motion.div>

      <motion.div variants={fade} custom={4} initial="hidden" animate="show">
        <IntentsTable />
      </motion.div>

      <motion.div variants={fade} custom={5} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ApprovalsTable />
        <ExecutionsTable />
      </motion.div>
    </div>
  );
}
