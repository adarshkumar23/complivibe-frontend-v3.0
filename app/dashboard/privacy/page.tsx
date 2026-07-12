"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { ConsentRecorder } from "@/components/privacy/ConsentRecorder";
import { DsarSubmitForm } from "@/components/privacy/DsarSubmitForm";
import { PrivacyHeader } from "@/components/privacy/PrivacyHeader";
import { PrivacyKpis } from "@/components/privacy/PrivacyKpis";
import { PrivacyRequestsPanel } from "@/components/privacy/PrivacyRequestsPanel";
import { PrivacyProgramPanels } from "@/components/privacy/PrivacyProgramPanels";
import { usePrivacy } from "@/lib/hooks/usePrivacy";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

export default function PrivacyPage() {
  const data = usePrivacy();

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show" className="flex items-start justify-between gap-4">
        <PrivacyHeader />
        <Link
          href="/dashboard/privacy/dpdp"
          className="cv-ring-focus inline-flex shrink-0 items-center gap-1.5 rounded-full bg-cv-brand px-4 py-2 text-[12px] font-bold text-white shadow-tile transition hover:opacity-90"
        >
          DPDP Operations <ArrowUpRight size={13} />
        </Link>
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <PrivacyKpis data={data} />
      </motion.div>

      <motion.div variants={fade} custom={2} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PrivacyRequestsPanel data={data} />
        </div>
        <div>
          <PrivacyProgramPanels data={data} />
        </div>
      </motion.div>

      <motion.div variants={fade} custom={3} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ConsentRecorder />
        <DsarSubmitForm />
      </motion.div>
    </div>
  );
}
