"use client";

import Link from "next/link";
import { X, ExternalLink, Download, MousePointerClick } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";
import { NODE_STYLES } from "@/components/lineage/node-style";
import { EmptyState } from "@/components/ui/EmptyState";
import type { LineageGraph, LineageNode } from "@/lib/api/lineage-normalizers";

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-3 border-b border-white/60 py-2 last:border-0">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-cv-mist">{label}</span>
      <span className="max-w-[60%] truncate text-right text-[12px] font-semibold text-cv-ink">{value}</span>
    </div>
  );
}

export function LineageDetailPanel({
  node,
  graph,
  onSelect,
  onClose
}: {
  node: LineageNode | null;
  graph: LineageGraph;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  if (!node) {
    return (
      <EmptyState
        icon={MousePointerClick}
        title="Select a node"
        description="Click any node in the lineage graph to inspect its real metadata and linked records."
        compact
      />
    );
  }

  const s = NODE_STYLES[node.type];
  const Icon = s.icon;
  const linked = node.linkedIds
    .map((id) => graph.nodes.find((n) => n.id === id))
    .filter((n): n is LineageNode => !!n);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-xl", s.soft, s.text)}>
            <Icon size={17} />
          </span>
          <div>
            <p className="text-[14px] font-bold leading-tight text-cv-ink">{node.label}</p>
            <p className={cn("text-[11px] font-semibold", s.text)}>{s.label}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="cv-ring-focus inline-flex h-7 w-7 items-center justify-center rounded-full text-cv-slate hover:bg-white/70"
          aria-label="Close detail"
        >
          <X size={15} />
        </button>
      </div>

      <div className="rounded-2xl bg-white/55 px-3.5 py-1.5 ring-1 ring-white/70">
        <Field label="Status" value={node.status} />
        <Field label="Source system" value={node.sourceSystem} />
        <Field label="Owner" value={node.owner} />
        <Field label="Sensitivity" value={node.sensitivity} />
        <Field label="Last updated" value={formatDate(node.lastUpdated)} />
        <Field label="Module" value={node.module} />
      </div>

      {/* Linked records (real edges only) */}
      <div>
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-cv-mist">
          Linked records {linked.length > 0 ? `(${linked.length})` : ""}
        </p>
        {linked.length === 0 ? (
          <p className="text-[12px] text-cv-slate">No linked records reported.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {linked.slice(0, 12).map((l) => {
              const ls = NODE_STYLES[l.type];
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => onSelect(l.id)}
                  className={cn(
                    "cv-ring-focus inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-white/70 transition hover:bg-white",
                    ls.soft,
                    ls.text
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: ls.hex }} />
                  {l.label.length > 20 ? `${l.label.slice(0, 19)}…` : l.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-1">
        {node.href ? (
          <Link
            href={node.href}
            className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-cv-brand px-3.5 py-2 text-[12px] font-bold text-white shadow-button transition hover:-translate-y-0.5"
          >
            <ExternalLink size={13} />
            Open {s.label.toLowerCase()}
          </Link>
        ) : null}
        <button
          type="button"
          disabled
          title="Action endpoint unavailable."
          className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full bg-white/50 px-3.5 py-2 text-[12px] font-semibold text-cv-mist ring-1 ring-white/60"
        >
          <Download size={13} />
          Export node
        </button>
      </div>
    </div>
  );
}
