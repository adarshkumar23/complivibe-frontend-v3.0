"use client";

import { motion, type Variants } from "framer-motion";
import { Building2 } from "lucide-react";
import {
  EnterpriseKpis,
  RecertificationPanel,
  AccessCertPanel,
  BusinessUnitsPanel
} from "@/components/enterprise/EnterprisePanels";
import { useEnterpriseControl } from "@/lib/hooks/useEnterpriseControl";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

export default function EnterprisePage() {
  const data = useEnterpriseControl();

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cv-brand text-white shadow-tile">
              <Building2 size={15} />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cv-blue">Org Governance</span>
          </div>
          <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-cv-ink sm:text-[34px]">
            Enterprise Control
          </h1>
          <p className="max-w-2xl text-[15px] text-cv-slate">
            Business units, access certification campaigns, recertification workload, and separation-of-duties findings.
          </p>
        </div>
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <EnterpriseKpis data={data} />
      </motion.div>

      <motion.div variants={fade} custom={2} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <BusinessUnitsPanel data={data} />
        <RecertificationPanel data={data} />
        <AccessCertPanel data={data} />
      </motion.div>
    </div>
  );
}
