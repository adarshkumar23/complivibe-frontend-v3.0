"use client";

import { Workflow, Database, ArrowRight } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { normalizeLineage, type LineageNode } from "@/lib/api/data-observability-normalizers";
import type { DataObservability } from "@/lib/hooks/useDataObservability";

function NodeChip({ node }: { node: LineageNode }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-white/65 px-3 py-2 ring-1 ring-white/70">
      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-cv-brand-soft text-cv-blue">
        <Database size={13} />
      </span>
      <span className="truncate text-[12px] font-semibold text-cv-ink">{node.label}</span>
    </div>
  );
}

function Column({ title, nodes }: { title: string; nodes: LineageNode[] }) {
  if (nodes.length === 0) return null;
  return (
    <div className="min-w-[150px] flex-1 space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-wide text-cv-mist">{title}</p>
      {nodes.slice(0, 5).map((n) => (
        <NodeChip key={n.id} node={n} />
      ))}
      {nodes.length > 5 ? <p className="text-[11px] text-cv-mist">+{nodes.length - 5} more</p> : null}
    </div>
  );
}

export function LineageMap({ data }: { data: DataObservability }) {
  const { catalog, rag } = data;
  const { nodes, edges } = normalizeLineage(catalog.data, rag.data);
  const loading = catalog.isLoading && rag.isLoading;
  const errored = catalog.isError && rag.isError;

  const incoming = new Set(edges.map((e) => e.to));
  const outgoing = new Set(edges.map((e) => e.from));
  const upstream = nodes.filter((n) => !incoming.has(n.id));
  const downstream = nodes.filter((n) => incoming.has(n.id) && !outgoing.has(n.id));
  const middle = nodes.filter((n) => incoming.has(n.id) && outgoing.has(n.id));

  return (
    <SectionCard
      title="Lineage & Dependency Map"
      subtitle="Upstream → processing → downstream"
      icon={Workflow}
      accent="blue"
      className="h-full"
      action={
        nodes.length > 0 ? (
          <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">
            {nodes.length} nodes · {edges.length} links
          </span>
        ) : null
      }
    >
      {loading ? (
        <LoadingSkeleton className="h-40 w-full" />
      ) : errored ? (
        <ErrorState title="Unable to load lineage" onRetry={() => catalog.refetch()} />
      ) : nodes.length === 0 ? (
        <EmptyState
          icon={Workflow}
          title="No lineage data available"
          description="Once dataset dependencies are reported, an interactive lineage map will render here."
        />
      ) : edges.length === 0 ? (
        <div className="flex flex-wrap gap-2">
          {nodes.slice(0, 12).map((n) => (
            <NodeChip key={n.id} node={n} />
          ))}
        </div>
      ) : (
        <div className="flex items-start gap-3 overflow-x-auto pb-1">
          <Column title="Upstream" nodes={upstream} />
          <ArrowRight size={18} className="mt-7 shrink-0 text-cv-mist" />
          <Column title="Processing" nodes={middle.length ? middle : upstream.slice(0, 0)} />
          {middle.length ? <ArrowRight size={18} className="mt-7 shrink-0 text-cv-mist" /> : null}
          <Column title="Downstream" nodes={downstream} />
        </div>
      )}
    </SectionCard>
  );
}
