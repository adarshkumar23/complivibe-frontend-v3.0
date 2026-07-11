"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import { ArrowLeft, ArrowRight, Boxes, Database, GitBranch, Workflow } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAssetLineage, useDataObservability, useLineageNodes } from "@/lib/hooks/useDataObservability";
import type { LineageGraph, LineageGraphNode } from "@/lib/api/data-observability";
import { cn } from "@/lib/utils/cn";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

function NodeChip({ node, highlighted = false }: { node: LineageGraphNode; highlighted?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl px-3.5 py-2.5 ring-1",
        highlighted ? "bg-cv-brand text-white shadow-button ring-transparent" : "bg-white/60 ring-white/70"
      )}
    >
      <p className={cn("text-[13px] font-bold", highlighted ? "text-white" : "text-cv-ink")}>{node.name}</p>
      <p className={cn("text-[11px] font-medium", highlighted ? "text-white/80" : "text-cv-slate")}>
        {node.node_type.replace(/_/g, " ")}
      </p>
    </div>
  );
}

/** Column view of an asset's lineage graph: upstream feeds → asset node → downstream consumers. */
function LineageGraphView({ graph, assetName }: { graph: LineageGraph; assetName: string | null }) {
  const nodesById = new Map(graph.nodes.map((n) => [n.id, n]));
  // The asset's own node is any node that both up- and down-stream edges attach to;
  // derive membership strictly from the returned edges.
  const downstreamTargets = new Set(graph.edges.map((e) => e.downstream_id));
  const upstreamSources = new Set(graph.edges.map((e) => e.upstream_id));
  const roots = graph.nodes.filter((n) => !downstreamTargets.has(n.id));
  const leaves = graph.nodes.filter((n) => !upstreamSources.has(n.id));
  const middle = graph.nodes.filter((n) => downstreamTargets.has(n.id) && upstreamSources.has(n.id));

  if (graph.nodes.length === 0) {
    return (
      <EmptyState
        icon={GitBranch}
        title="No lineage recorded for this asset"
        description="The live lineage endpoint returned an empty graph — no lineage nodes or edges reference this asset yet."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge label={`${graph.node_count} nodes`} tone="info" />
        <StatusBadge label={`${graph.edge_count} edges`} tone="info" />
        {graph.cycle_detected ? <StatusBadge label="Cycle detected" tone="bad" /> : null}
        {graph.stale_edge_count > 0 ? <StatusBadge label={`${graph.stale_edge_count} stale edges`} tone="warn" /> : null}
        {graph.isolated_node_count > 0 ? <StatusBadge label={`${graph.isolated_node_count} isolated`} tone="neutral" /> : null}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-cv-mist">
            <ArrowRight size={12} /> Upstream sources
          </p>
          {roots.length === 0 ? <p className="text-xs text-cv-slate">None</p> : roots.map((n) => <NodeChip key={n.id} node={n} />)}
        </div>
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-cv-mist">
            <Boxes size={12} /> {assetName ?? "This asset"}
          </p>
          {middle.length === 0 ? <p className="text-xs text-cv-slate">No intermediate nodes</p> : middle.map((n) => <NodeChip key={n.id} node={n} highlighted />)}
        </div>
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-cv-mist">
            <ArrowRight size={12} /> Downstream consumers
          </p>
          {leaves.length === 0 ? <p className="text-xs text-cv-slate">None</p> : leaves.map((n) => <NodeChip key={n.id} node={n} />)}
        </div>
      </div>

      {graph.edges.length > 0 ? (
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-cv-mist">Edges</p>
          <div className="space-y-1.5">
            {graph.edges.map((e, idx) => (
              <div key={idx} className="flex flex-wrap items-center gap-2 rounded-2xl bg-white/50 px-3 py-2 text-xs ring-1 ring-white/60">
                <span className="font-semibold text-cv-ink">{nodesById.get(e.upstream_id)?.name ?? e.upstream_id}</span>
                <ArrowRight size={12} className="text-cv-mist" />
                <span className="font-semibold text-cv-ink">{nodesById.get(e.downstream_id)?.name ?? e.downstream_id}</span>
                <span className="ml-auto text-cv-mist">via {e.source_method.replace(/_/g, " ")}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function LineagePageInner() {
  const params = useSearchParams();
  const urlAsset = params.get("asset");
  const nodes = useLineageNodes();
  const { assets } = useDataObservability();
  const [selectedAsset, setSelectedAsset] = useState<string | null>(urlAsset);

  useEffect(() => {
    setSelectedAsset(urlAsset);
  }, [urlAsset]);

  // Default to the first registered asset once loaded, so the graph panel is never dead.
  useEffect(() => {
    if (!selectedAsset && (assets.data ?? []).length > 0) {
      setSelectedAsset(assets.data![0].id);
    }
  }, [assets.data, selectedAsset]);

  const lineage = useAssetLineage(selectedAsset);
  const selectedName = (assets.data ?? []).find((a) => a.id === selectedAsset)?.name ?? null;

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cv-brand text-white shadow-tile">
                <Workflow size={15} />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cv-blue">Data Governance</span>
            </div>
            <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-cv-ink sm:text-[34px]">Data Lineage</h1>
            <p className="max-w-2xl text-sm leading-relaxed text-cv-slate">
              Upstream and downstream flow for each registered data asset, from the live lineage graph endpoints.
            </p>
          </div>
          <Link
            href="/dashboard/data-observability"
            className="cv-ring-focus inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2.5 text-xs font-bold text-cv-ink ring-1 ring-white/70 transition hover:bg-white"
          >
            <ArrowLeft size={14} />
            Observability overview
          </Link>
        </div>
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <SectionCard
          title="Asset lineage graph"
          subtitle="GET /data-observability/lineage/assets/{id}/lineage"
          icon={GitBranch}
          accent="purple"
          action={
            (assets.data ?? []).length > 0 ? (
              <select
                value={selectedAsset ?? ""}
                onChange={(e) => setSelectedAsset(e.target.value || null)}
                aria-label="Select asset"
                className="rounded-full bg-white/60 px-3.5 py-2 text-xs font-semibold text-cv-ink ring-1 ring-white/70 focus:outline-none focus:ring-2 focus:ring-cv-blue/40"
              >
                {(assets.data ?? []).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            ) : undefined
          }
        >
          {assets.isLoading ? (
            <SkeletonRows rows={3} />
          ) : (assets.data ?? []).length === 0 ? (
            <EmptyState
              icon={Database}
              title="No data assets to trace"
              description="Lineage graphs attach to registered data assets. Register an asset on the observability page first."
            />
          ) : lineage.isLoading ? (
            <SkeletonRows rows={3} />
          ) : lineage.isError ? (
            <ErrorState
              title="Lineage could not load"
              description={lineage.error instanceof Error ? lineage.error.message : undefined}
              onRetry={() => lineage.refetch()}
            />
          ) : lineage.data ? (
            <LineageGraphView graph={lineage.data} assetName={selectedName} />
          ) : null}
        </SectionCard>
      </motion.div>

      <motion.div variants={fade} custom={2} initial="hidden" animate="show">
        <SectionCard
          title="Lineage nodes"
          subtitle="All registered nodes for this organization"
          icon={Boxes}
          accent="cyan"
        >
          {nodes.isLoading ? (
            <SkeletonRows rows={3} />
          ) : nodes.isError ? (
            <ErrorState
              title="Nodes could not load"
              description={nodes.error instanceof Error ? nodes.error.message : undefined}
              onRetry={() => nodes.refetch()}
            />
          ) : (nodes.data ?? []).length === 0 ? (
            <EmptyState
              icon={Boxes}
              title="No lineage nodes registered"
              description="The live endpoint returned zero lineage nodes. Nodes appear here when pipelines emit lineage events or OpenMetadata sync is configured."
            />
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {(nodes.data ?? []).map((n) => (
                <div key={n.id} className="rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[13px] font-bold text-cv-ink">{n.name}</p>
                    {n.is_orphan ? <StatusBadge label="orphan" tone="warn" /> : null}
                  </div>
                  <p className="mt-0.5 text-[11px] text-cv-slate">
                    {n.node_type.replace(/_/g, " ")}
                    {n.system_name ? ` · ${n.system_name}` : ""}
                  </p>
                  <p className="mt-1.5 text-[11px] font-medium text-cv-mist">
                    {n.upstream_edge_count} upstream · {n.downstream_edge_count} downstream
                  </p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </motion.div>
    </div>
  );
}

export default function LineagePage() {
  // useSearchParams requires a Suspense boundary in the app router.
  return (
    <Suspense fallback={<SkeletonRows rows={4} />}>
      <LineagePageInner />
    </Suspense>
  );
}
