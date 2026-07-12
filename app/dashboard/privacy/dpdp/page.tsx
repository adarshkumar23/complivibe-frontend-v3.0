"use client";

import { motion, type Variants } from "framer-motion";
import { Landmark } from "lucide-react";
import { PrivacyKpis } from "@/components/privacy/PrivacyKpis";
import { PrivacyRequestsPanel } from "@/components/privacy/PrivacyRequestsPanel";
import { ConsentRecorder } from "@/components/privacy/ConsentRecorder";
import { DsarSubmitForm } from "@/components/privacy/DsarSubmitForm";
import { NominationManager } from "@/components/privacy/NominationManager";
import { SdfDesignationPanel } from "@/components/privacy/SdfDesignationPanel";
import { FrameworkReconPanel } from "@/components/privacy/FrameworkReconPanel";
import { usePrivacy } from "@/lib/hooks/usePrivacy";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

export default function DpdpPage() {
  const data = usePrivacy();

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cv-brand text-white shadow-tile">
              <Landmark size={15} />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cv-blue">India DPDP Act 2023</span>
          </div>
          <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-cv-ink sm:text-[34px]">
            DPDP Operations
          </h1>
          <p className="max-w-2xl text-[15px] text-cv-slate">
            Consent posture, data principal requests and grievances, §14 nominations, and the SDF designation workflow.
          </p>
        </div>
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <PrivacyKpis data={data} />
      </motion.div>

      <motion.div variants={fade} custom={2} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ConsentRecorder />
        <DsarSubmitForm />
      </motion.div>

      <motion.div variants={fade} custom={3} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <NominationManager />
        <SdfDesignationPanel />
      </motion.div>

      <motion.div variants={fade} custom={4} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PrivacyRequestsPanel data={data} />
        </div>
        <div>
          <FrameworkReconPanel data={data} />
        </div>
      </motion.div>
    </div>
  );
}
