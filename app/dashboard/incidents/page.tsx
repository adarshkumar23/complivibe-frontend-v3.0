"use client";

import { motion, type Variants } from "framer-motion";
import { IncidentsHeader } from "@/components/incidents/IncidentsHeader";
import { IncidentKpis } from "@/components/incidents/IncidentKpis";
import { IncidentRegister } from "@/components/incidents/IncidentRegister";
import { IncidentStatusOverview } from "@/components/incidents/IncidentStatusOverview";
import { CriticalIncidents } from "@/components/incidents/CriticalIncidents";
import { AffectedSystems } from "@/components/incidents/AffectedSystems";
import { SlaResolution } from "@/components/incidents/SlaResolution";
import { ResponseActions } from "@/components/incidents/ResponseActions";
import { LinkedEvidenceRisks } from "@/components/incidents/LinkedEvidenceRisks";
import { RecentIncidentActivity } from "@/components/incidents/RecentIncidentActivity";
import { useIncidents } from "@/lib/hooks/useIncidents";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 }
  })
};

export default function IncidentsPage() {
  const data = useIncidents();

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <IncidentsHeader />
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <IncidentKpis data={data} />
      </motion.div>

      <motion.div
        variants={fade}
        custom={2}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 lg:grid-cols-3"
      >
        <div className="lg:col-span-2">
          <IncidentRegister data={data} />
        </div>
        <div>
          <IncidentStatusOverview data={data} />
        </div>
      </motion.div>

      <motion.div
        variants={fade}
        custom={3}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 md:grid-cols-3"
      >
        <CriticalIncidents data={data} />
        <AffectedSystems data={data} />
        <SlaResolution data={data} />
      </motion.div>

      <motion.div
        variants={fade}
        custom={4}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 md:grid-cols-3"
      >
        <ResponseActions data={data} />
        <LinkedEvidenceRisks data={data} />
        <RecentIncidentActivity data={data} />
      </motion.div>
    </div>
  );
}
