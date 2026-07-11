"use client";

import { motion, type Variants } from "framer-motion";
import { ReportsHeader } from "@/components/reports/ReportsHeader";
import { ReportKpis } from "@/components/reports/ReportKpis";
import { ReportLibrary } from "@/components/reports/ReportLibrary";
import { ReportTemplates } from "@/components/reports/ReportTemplates";
import { GenerateReport } from "@/components/reports/GenerateReport";
import { useReports } from "@/lib/hooks/useReports";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

export default function ReportsPage() {
  const data = useReports();

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <ReportsHeader />
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <ReportKpis data={data} />
      </motion.div>

      <motion.div variants={fade} custom={2} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ReportLibrary data={data} />
        </div>
        <div className="flex flex-col gap-4">
          <GenerateReport data={data} />
          <ReportTemplates data={data} />
        </div>
      </motion.div>
    </div>
  );
}
