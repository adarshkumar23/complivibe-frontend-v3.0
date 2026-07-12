"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { Share2, GitBranch, Waypoints, Building2 } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TrustGraphHeader } from "@/components/trust-graph/TrustGraphHeader";
import { EntityPicker, type EntityKind } from "@/components/trust-graph/EntityPicker";
import { GraphLegend } from "@/components/trust-graph/GraphLegend";
import { RiskEntityGraphView } from "@/components/trust-graph/RiskEntityGraphView";
import { RiskDependencyGraphView } from "@/components/trust-graph/RiskDependencyGraphView";
import { VendorSupplyChainView } from "@/components/trust-graph/VendorSupplyChainView";
import {
  useTrustGraphEntities,
  useRiskEntityGraph,
  useRiskDependencyGraph,
  useVendorSupplyChainGraph
} from "@/lib/hooks/useTrustGraph";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

const ENTITY_LEGEND = [
  { label: "Risk", swatchClass: "bg-rose-500" },
  { label: "Control", swatchClass: "bg-blue-500" },
  { label: "Obligation", swatchClass: "bg-teal-500" },
  { label: "Vendor", swatchClass: "bg-violet-500" },
  { label: "Evidence", swatchClass: "bg-emerald-500" },
  { label: "Policy", swatchClass: "bg-amber-500" }
];

const DEPENDENCY_LEGEND = [
  { label: "Triggers", swatchClass: "bg-amber-500" },
  { label: "Cascades to", swatchClass: "bg-rose-500" },
  { label: "Compounds", swatchClass: "bg-violet-500" }
];

export default function TrustGraphPage() {
  const { risks, vendors } = useTrustGraphEntities();

  const [kind, setKind] = useState<EntityKind>("risk");
  const [selectedRiskId, setSelectedRiskId] = useState<string | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

  // Auto-select the first entity of each kind once its list loads, so the graph renders
  // immediately instead of sitting on an empty picker.
  useEffect(() => {
    if (!selectedRiskId && risks.data && risks.data.length > 0) {
      setSelectedRiskId(risks.data[0].id);
    }
  }, [risks.data, selectedRiskId]);

  useEffect(() => {
    if (!selectedVendorId && vendors.data && vendors.data.length > 0) {
      setSelectedVendorId(vendors.data[0].id);
    }
  }, [vendors.data, selectedVendorId]);

  const selectedId = kind === "risk" ? selectedRiskId : selectedVendorId;

  const entityGraph = useRiskEntityGraph(kind === "risk" ? selectedRiskId : null, 2);
  const dependencyGraph = useRiskDependencyGraph(kind === "risk" ? selectedRiskId : null);
  const vendorGraph = useVendorSupplyChainGraph(kind === "vendor" ? selectedVendorId : null);

  const listsLoading = risks.isLoading || vendors.isLoading;
  const listsErrored = risks.isError || vendors.isError;
  const noEntitiesAtAll = !listsLoading && !listsErrored && (risks.data?.length ?? 0) === 0 && (vendors.data?.length ?? 0) === 0;

  const selectedRiskTitle = useMemo(
    () => risks.data?.find((r) => r.id === selectedRiskId)?.title ?? null,
    [risks.data, selectedRiskId]
  );
  const selectedVendorName = useMemo(
    () => vendors.data?.find((v) => v.id === selectedVendorId)?.name ?? null,
    [vendors.data, selectedVendorId]
  );

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <TrustGraphHeader />
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <GlassCard className="p-5 sm:p-6">
          {listsLoading ? (
            <LoadingSkeleton className="h-10 w-full max-w-xl" />
          ) : listsErrored ? (
            <ErrorState
              compact
              title="Could not load risks or vendors"
              description="The entity picker needs the risk and vendor lists to load first."
              onRetry={() => {
                risks.refetch();
                vendors.refetch();
              }}
            />
          ) : noEntitiesAtAll ? (
            <EmptyState
              compact
              icon={Share2}
              title="No risks or vendors yet"
              description="Register a risk or vendor to start building a trust graph around it."
            />
          ) : (
            <EntityPicker
              kind={kind}
              onKindChange={setKind}
              risks={risks.data ?? []}
              vendors={vendors.data ?? []}
              selectedId={selectedId}
              onSelectId={(id) => (kind === "risk" ? setSelectedRiskId(id) : setSelectedVendorId(id))}
            />
          )}
        </GlassCard>
      </motion.div>

      {kind === "risk" && selectedRiskId ? (
        <>
          <motion.div variants={fade} custom={2} initial="hidden" animate="show">
            <SectionCard
              title="Entity coverage graph"
              subtitle={selectedRiskTitle ? `Controls, obligations, evidence, policies, and vendors covering "${selectedRiskTitle}"` : undefined}
              icon={Waypoints}
              accent="blue"
              action={
                entityGraph.data ? (
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    <StatusBadge label={`${entityGraph.data.summary.total_nodes} nodes`} tone="info" />
                    <StatusBadge label={`depth ${entityGraph.data.summary.depth_reached}`} tone="neutral" />
                  </div>
                ) : undefined
              }
            >
              {entityGraph.isLoading ? (
                <LoadingSkeleton className="h-[420px] w-full" />
              ) : entityGraph.isError ? (
                <ErrorState
                  title="Could not load the entity graph"
                  description="GET /api/v1/risks/{id}/graph failed. The backend may be temporarily unavailable."
                  onRetry={() => entityGraph.refetch()}
                />
              ) : entityGraph.data && entityGraph.data.nodes.length > 0 ? (
                <div className="space-y-3">
                  <GraphLegend items={ENTITY_LEGEND} />
                  <RiskEntityGraphView graph={entityGraph.data} />
                </div>
              ) : (
                <EmptyState
                  icon={Waypoints}
                  title="No linked coverage yet"
                  description="This risk has no controls, obligations, evidence, policies, or vendors linked to it."
                />
              )}
            </SectionCard>
          </motion.div>

          <motion.div variants={fade} custom={3} initial="hidden" animate="show">
            <SectionCard
              title="Risk dependency graph"
              subtitle={selectedRiskTitle ? `Upstream and downstream cascade relationships for "${selectedRiskTitle}"` : undefined}
              icon={GitBranch}
              accent="purple"
              action={
                dependencyGraph.data ? (
                  <StatusBadge label={`${dependencyGraph.data.summary.total_edges} cascade links`} tone="purple" />
                ) : undefined
              }
            >
              {dependencyGraph.isLoading ? (
                <LoadingSkeleton className="h-[340px] w-full" />
              ) : dependencyGraph.isError ? (
                <ErrorState
                  title="Could not load the dependency graph"
                  description="GET /api/v1/risks/{id}/dependency-graph failed. The backend may be temporarily unavailable."
                  onRetry={() => dependencyGraph.refetch()}
                />
              ) : dependencyGraph.data && dependencyGraph.data.edges.length > 0 ? (
                <div className="space-y-3">
                  <GraphLegend items={DEPENDENCY_LEGEND} />
                  <RiskDependencyGraphView graph={dependencyGraph.data} />
                </div>
              ) : (
                <EmptyState
                  icon={GitBranch}
                  title="No cascade relationships mapped"
                  description="No other risk has been modeled as upstream or downstream of this one yet."
                />
              )}
            </SectionCard>
          </motion.div>
        </>
      ) : null}

      {kind === "vendor" && selectedVendorId ? (
        <motion.div variants={fade} custom={2} initial="hidden" animate="show">
          <SectionCard
            title="Vendor supply-chain graph"
            subtitle={selectedVendorName ? `Sub-processor and nth-party chain for "${selectedVendorName}"` : undefined}
            icon={Building2}
            accent="teal"
            action={
              vendorGraph.data ? (
                <StatusBadge
                  label={`${vendorGraph.data.risk_summary.node_count} node${vendorGraph.data.risk_summary.node_count === 1 ? "" : "s"} · ${vendorGraph.data.risk_summary.edge_count} edges`}
                  tone="teal"
                />
              ) : undefined
            }
          >
            {vendorGraph.isLoading ? (
              <LoadingSkeleton className="h-[260px] w-full" />
            ) : vendorGraph.isError ? (
              <ErrorState
                title="Could not load the supply-chain graph"
                description="GET /api/v1/vendors/{id}/supply-chain-graph failed. The backend may be temporarily unavailable."
                onRetry={() => vendorGraph.refetch()}
              />
            ) : vendorGraph.data ? (
              <div className="space-y-3">
                <VendorSupplyChainView graph={vendorGraph.data} />
                {vendorGraph.data.risk_summary.edge_count === 0 ? (
                  <p className="rounded-2xl bg-slate-400/8 px-4 py-3 text-[12px] leading-relaxed text-cv-slate ring-1 ring-slate-400/15">
                    This vendor has no sub-processor or nth-party chain recorded, so the graph shows a single
                    unconnected node — that is the real, current state of this vendor's supply-chain data, not a
                    loading or error condition. Chain edges appear here once sub-processor relationships are
                    added for this vendor.
                  </p>
                ) : null}
              </div>
            ) : null}
          </SectionCard>
        </motion.div>
      ) : null}
    </div>
  );
}
