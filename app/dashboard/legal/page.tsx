"use client";

import { motion, type Variants } from "framer-motion";
import { Scale } from "lucide-react";
import { LegalMattersTable } from "@/components/legal/LegalMattersTable";
import { WhistleblowerPanel } from "@/components/legal/WhistleblowerPanel";
import { useLegal } from "@/lib/hooks/useLegal";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

export default function LegalPage() {
  const data = useLegal();

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cv-brand text-white shadow-tile">
              <Scale size={15} />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cv-blue">Legal Operations</span>
          </div>
          <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-cv-ink sm:text-[34px]">
            Legal & Whistleblower
          </h1>
          <p className="max-w-2xl text-[15px] text-cv-slate">
            Legal matters with linked risk context, and the anonymous reporting channel with investigation status.
          </p>
        </div>
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LegalMattersTable data={data} />
        <WhistleblowerPanel data={data} />
      </motion.div>
    </div>
  );
}
