"use client";

import { motion, type Variants } from "framer-motion";
import { AlertOctagon, Database, ShieldAlert, Siren } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import { DataIncidentsTable } from "@/components/incidents/DataIncidentsTable";
import { IssuesTable } from "@/components/incidents/IssuesTable";
import { BreachPanel } from "@/components/incidents/BreachPanel";
import { useIncidentsPageData } from "@/lib/hooks/useIncidentsPage";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

export default function IncidentsPage() {
  const data = useIncidentsPageData();
  const { dataIncidentSummary, issueDashboard } = data;
  const dobs = dataIncidentSummary.data;
  const cmp = issueDashboard.data;

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cv-brand text-white shadow-tile">
              <Siren size={15} />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cv-blue">Response</span>
          </div>
          <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-cv-ink sm:text-[34px]">Incidents</h1>
          <p className="max-w-3xl text-[15px] leading-relaxed text-cv-slate">
            Two distinct real backend domains, kept deliberately separate: automated <strong className="text-cv-ink">data-observability
            incidents</strong> (quality breaches, access anomalies, retention/residency violations detected on data assets) and
            manually- or escalation-opened <strong className="text-cv-ink">compliance issues</strong> (governance findings with SLA and
            root-cause tracking). A data incident can be escalated into a compliance issue, but the two records — and their lifecycles —
            never merge.
          </p>
        </div>
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show" className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <RegistryKpi
          label="Data Incidents"
          icon={Database}
          accent="red"
          value={dobs ? dobs.total : null}
          caption={dobs ? `${dobs.open_count} open, ${dobs.critical_open_count} critical` : undefined}
          loading={dataIncidentSummary.isLoading}
          unavailableHint="Incident summary unavailable"
        />
        <RegistryKpi
          label="New / Unreviewed"
          icon={ShieldAlert}
          accent="amber"
          value={dobs ? dobs.new_count : null}
          caption={dobs ? `${dobs.stale_new_count} stale >24h` : undefined}
          loading={dataIncidentSummary.isLoading}
          unavailableHint="Incident summary unavailable"
        />
        <RegistryKpi
          label="Compliance Issues"
          icon={AlertOctagon}
          accent="blue"
          value={cmp ? cmp.total : null}
          caption={cmp ? `${cmp.open_critical_count} open critical` : undefined}
          loading={issueDashboard.isLoading}
          unavailableHint="Issue dashboard unavailable"
        />
        <RegistryKpi
          label="Unassigned Issues"
          icon={AlertOctagon}
          accent="purple"
          value={cmp ? cmp.unassigned_count : null}
          caption={cmp ? `${cmp.overdue_count} overdue` : undefined}
          loading={issueDashboard.isLoading}
          unavailableHint="Issue dashboard unavailable"
        />
      </motion.div>

      <motion.div variants={fade} custom={2} initial="hidden" animate="show">
        <DataIncidentsTable data={data} />
      </motion.div>

      <motion.div variants={fade} custom={3} initial="hidden" animate="show">
        <IssuesTable data={data} />
      </motion.div>

      <motion.div variants={fade} custom={4} initial="hidden" animate="show">
        <BreachPanel issues={data.issues.data ?? []} />
      </motion.div>
    </div>
  );
}
