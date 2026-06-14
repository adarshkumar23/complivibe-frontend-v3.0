"use client";

import { useMemo } from "react";
import { Spline, GitFork } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { NODE_META } from "@/lib/api/trust-graph-normalizers";
import type { TrustGraphData } from "@/lib/hooks/useTrustGraph";

export function RelationshipTable({ data }: { data: TrustGraphData }) {
  const { nodes, edges, isLoading } = data;
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  return (
    <SectionCard title="Relationships" subtitle="Derived edges between real records" icon={Spline} accent="purple"
      action={edges.length > 0 ? <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">{edges.length}</span> : null}
    >
      {isLoading && nodes.length === 0 ? (
        <SkeletonRows rows={5} />
      ) : edges.length === 0 ? (
        <EmptyState icon={GitFork} title="No relationships found from available records." description="Edges appear when backend records reference each other (e.g. an evidence item linked to an AI system)." />
      ) : (
        <ul className="max-h-[480px] space-y-2 overflow-y-auto pr-1">
          {edges.slice(0, 200).map((e) => {
            const s = byId.get(e.source);
            const t = byId.get(e.target);
            if (!s || !t) return null;
            return (
              <li key={e.id} className="flex items-center gap-3 rounded-xl bg-white/55 px-3 py-2.5 text-[12px] ring-1 ring-white/60">
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: NODE_META[s.type].color }} />
                  <span className="truncate font-semibold text-cv-ink">{s.label}</span>
                </span>
                <span className="shrink-0 rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-medium text-cv-slate ring-1 ring-slate-200/70">{e.relationship}</span>
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: NODE_META[t.type].color }} />
                  <span className="truncate font-semibold text-cv-ink">{t.label}</span>
                </span>
                <span className="ml-auto shrink-0 text-[10px] font-medium text-cv-mist">{NODE_META[s.type].label} → {NODE_META[t.type].label}</span>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
