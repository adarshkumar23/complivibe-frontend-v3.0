"use client";

import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import { Workflow, RefreshCw, Download } from "lucide-react";
import { LineageHeader } from "@/components/lineage/LineageHeader";
import { LineageKpis } from "@/components/lineage/LineageKpis";
import { LineageGraph } from "@/components/lineage/LineageGraph";
import { LineageDetailPanel } from "@/components/lineage/LineageDetailPanel";
import { LineageTable } from "@/components/lineage/LineageTable";
import { LineageSensitivePanel } from "@/components/lineage/LineageSensitivePanel";
import { LineageSourceStrip } from "@/components/lineage/LineageSourceStrip";
import { SectionCard } from "@/components/ui/SectionCard";
import { GlassCard } from "@/components/ui/GlassCard";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useDataLineage } from "@/lib/hooks/useDataLineage";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 }
  })
};

export default function DataLineagePage() {
  const data = useDataLineage();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedNode = data.graph.nodes.find((n) => n.id === selectedId) ?? null;

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <LineageHeader />
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show" className="space-y-4">
        <LineageKpis data={data} />
        <LineageSourceStrip statuses={data.sourceStatuses} />
      </motion.div>

      <motion.div
        variants={fade}
        custom={2}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 lg:grid-cols-3"
      >
        <div className="lg:col-span-2">
          <SectionCard
            title="Lineage graph"
            subtitle={
              data.fromBackendGraph
                ? "Source: backend lineage endpoint"
                : "Derived from real cross-module references"
            }
            icon={Workflow}
            accent="blue"
            action={
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={data.refetch}
                  className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[12px] font-semibold text-cv-ink ring-1 ring-white/70 transition hover:bg-white"
                >
                  <RefreshCw size={13} />
                  Refresh
                </button>
                <button
                  type="button"
                  disabled
                  title="Action endpoint unavailable."
                  className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full bg-white/50 px-3 py-1.5 text-[12px] font-semibold text-cv-mist ring-1 ring-white/60"
                >
                  <Download size={13} />
                  Export
                </button>
              </div>
            }
          >
            {data.isLoading ? (
              <LoadingSkeleton className="h-72 w-full" />
            ) : data.isError ? (
              <ErrorState title="Unable to load lineage" onRetry={data.refetch} />
            ) : (
              <LineageGraph graph={data.graph} selectedId={selectedId} onSelect={setSelectedId} />
            )}
          </SectionCard>
        </div>

        <div>
          <GlassCard className="h-full p-5 sm:p-6">
            <h3 className="mb-3 text-[15px] font-bold leading-tight text-cv-ink">Node details</h3>
            <LineageDetailPanel
              node={selectedNode}
              graph={data.graph}
              onSelect={setSelectedId}
              onClose={() => setSelectedId(null)}
            />
          </GlassCard>
        </div>
      </motion.div>

      <motion.div
        variants={fade}
        custom={3}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 lg:grid-cols-3"
      >
        <div className="lg:col-span-2">
          <LineageTable rows={data.tableRows} />
        </div>
        <div>
          <LineageSensitivePanel data={data} />
        </div>
      </motion.div>
    </div>
  );
}
