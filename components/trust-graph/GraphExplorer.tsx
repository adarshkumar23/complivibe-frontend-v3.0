"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Share2, ZoomIn, ZoomOut, CloudOff, ArrowUpRight, X } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { NODE_META, isHighSeverity, type GraphNode, type NodeType } from "@/lib/api/trust-graph-normalizers";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { TrustGraphData } from "@/lib/hooks/useTrustGraph";

const CAP = 140;
const SIZE = 680;
const C = SIZE / 2;
const R = 280;

export function GraphExplorer({ data }: { data: TrustGraphData }) {
  const { nodes, edges, isLoading, allUnavailable, unavailableCount } = data;
  const router = useRouter();

  const presentTypes = useMemo(() => {
    const set = new Set<NodeType>();
    for (const n of nodes) set.add(n.type);
    return [...set];
  }, [nodes]);

  const [hidden, setHidden] = useState<Set<NodeType>>(new Set());
  const [severity, setSeverity] = useState<"all" | "high">("all");
  const [linkFilter, setLinkFilter] = useState<"all" | "linked" | "unlinked">("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  const linkedIds = useMemo(() => {
    const s = new Set<string>();
    for (const e of edges) { s.add(e.source); s.add(e.target); }
    return s;
  }, [edges]);

  const filtered = useMemo(() => {
    return nodes.filter((n) => {
      if (hidden.has(n.type)) return false;
      if (severity === "high" && !isHighSeverity(n.severity)) return false;
      if (linkFilter === "linked" && !linkedIds.has(n.id)) return false;
      if (linkFilter === "unlinked" && linkedIds.has(n.id)) return false;
      return true;
    });
  }, [nodes, hidden, severity, linkFilter, linkedIds]);

  const visible = filtered.slice(0, CAP);
  const positions = useMemo(() => {
    const sorted = [...visible].sort((a, b) => (a.type === b.type ? a.label.localeCompare(b.label) : a.type.localeCompare(b.type)));
    const map = new Map<string, { x: number; y: number }>();
    const n = sorted.length || 1;
    sorted.forEach((node, i) => {
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
      map.set(node.id, { x: C + R * Math.cos(angle), y: C + R * Math.sin(angle) });
    });
    return map;
  }, [visible]);

  const visibleIds = useMemo(() => new Set(visible.map((n) => n.id)), [visible]);
  const visibleEdges = useMemo(() => edges.filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target)), [edges, visibleIds]);

  const connectedToSelected = useMemo(() => {
    if (!selected) return null;
    const s = new Set<string>([selected]);
    for (const e of visibleEdges) {
      if (e.source === selected) s.add(e.target);
      if (e.target === selected) s.add(e.source);
    }
    return s;
  }, [selected, visibleEdges]);

  const selectedNode = selected ? nodes.find((n) => n.id === selected) ?? null : null;
  const selectedEdges = useMemo(() => {
    if (!selectedNode) return [];
    const byId = new Map(nodes.map((n) => [n.id, n]));
    return edges
      .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
      .map((e) => ({ rel: e.relationship, other: byId.get(e.source === selectedNode.id ? e.target : e.source) }))
      .filter((x) => x.other);
  }, [selectedNode, edges, nodes]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <SectionCard title="Governance Graph" subtitle="Real records & derived relationships" icon={Share2} accent="blue">
          {isLoading && nodes.length === 0 ? (
            <LoadingSkeleton className="mx-auto aspect-square w-full max-w-[520px] rounded-2xl" />
          ) : allUnavailable ? (
            <EmptyState icon={CloudOff} title="Trust graph unavailable from backend." description="No module endpoints returned records, so there is nothing to map yet." />
          ) : nodes.length === 0 ? (
            <EmptyState icon={Share2} title="No records to graph" description="Records and relationships will appear here once the backend returns them." />
          ) : (
            <div className="flex flex-col gap-3">
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-1.5">
                {presentTypes.map((t) => {
                  const active = !hidden.has(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setHidden((prev) => { const n = new Set(prev); if (n.has(t)) n.delete(t); else n.add(t); return n; })}
                      className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 transition", active ? "bg-white/70 text-cv-ink ring-white/70" : "bg-white/40 text-cv-mist ring-white/50")}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ background: active ? NODE_META[t].color : "#cbd5e1" }} />
                      {NODE_META[t].label}
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 rounded-full bg-white/55 p-1 ring-1 ring-white/70">
                  {(["all", "high"] as const).map((s) => (
                    <button key={s} type="button" onClick={() => setSeverity(s)} className={cn("rounded-full px-3 py-1.5 text-xs font-semibold transition", severity === s ? "bg-cv-brand text-white shadow-button" : "text-cv-slate hover:text-cv-ink")}>
                      {s === "all" ? "All severity" : "High risk"}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1 rounded-full bg-white/55 p-1 ring-1 ring-white/70">
                  {(["all", "linked", "unlinked"] as const).map((s) => (
                    <button key={s} type="button" onClick={() => setLinkFilter(s)} className={cn("rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition", linkFilter === s ? "bg-cv-brand text-white shadow-button" : "text-cv-slate hover:text-cv-ink")}>
                      {s}
                    </button>
                  ))}
                </div>
                <div className="ml-auto flex items-center gap-1">
                  <button type="button" aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.2).toFixed(2)))} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/60 text-cv-slate ring-1 ring-white/70 hover:text-cv-ink"><ZoomOut size={15} /></button>
                  <button type="button" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(2.2, +(z + 0.2).toFixed(2)))} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/60 text-cv-slate ring-1 ring-white/70 hover:text-cv-ink"><ZoomIn size={15} /></button>
                </div>
              </div>

              {visible.length === 0 ? (
                <EmptyState compact icon={Share2} title="No nodes match your filters" description="Try enabling more node types or clearing filters." />
              ) : (
                <div className="overflow-hidden rounded-2xl bg-white/40 ring-1 ring-white/60">
                  <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-auto w-full" role="img" aria-label="Governance graph">
                    <g style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}>
                      {visibleEdges.map((e) => {
                        const a = positions.get(e.source);
                        const b = positions.get(e.target);
                        if (!a || !b) return null;
                        const dim = connectedToSelected ? !(connectedToSelected.has(e.source) && connectedToSelected.has(e.target)) : false;
                        return <path key={e.id} d={`M ${a.x} ${a.y} Q ${C} ${C} ${b.x} ${b.y}`} fill="none" stroke="#6366f1" strokeOpacity={dim ? 0.05 : 0.22} strokeWidth={1.2} />;
                      })}
                      {visible.map((node) => {
                        const p = positions.get(node.id);
                        if (!p) return null;
                        const isSel = node.id === selected;
                        const dim = connectedToSelected ? !connectedToSelected.has(node.id) : false;
                        const high = isHighSeverity(node.severity);
                        return (
                          <g key={node.id} transform={`translate(${p.x} ${p.y})`} className="cursor-pointer" onClick={() => setSelected(isSel ? null : node.id)}>
                            <circle r={isSel ? 10 : high ? 8 : 6} fill={NODE_META[node.type].color} fillOpacity={dim ? 0.2 : 1} stroke={isSel ? "#0f172a" : "#ffffff"} strokeWidth={isSel ? 2 : 1.2} />
                            {high ? <circle r={isSel ? 14 : 11} fill="none" stroke="#ef4444" strokeOpacity={dim ? 0.15 : 0.5} strokeWidth={1.5} /> : null}
                          </g>
                        );
                      })}
                    </g>
                  </svg>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-cv-mist">
                <span>Showing {visible.length} of {filtered.length} nodes{filtered.length > CAP ? ` (capped at ${CAP})` : ""}</span>
                {unavailableCount > 0 ? <span className="inline-flex items-center gap-1 text-amber-600"><CloudOff size={12} /> {unavailableCount} source{unavailableCount === 1 ? "" : "s"} unavailable</span> : null}
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Detail panel */}
      <div>
        <SectionCard title="Node Detail" subtitle="Selected record" icon={Share2} accent="purple" className="h-full">
          {!selectedNode ? (
            <EmptyState compact icon={Share2} title="No node selected" description="Click a node in the graph to inspect its real backend fields and relationships." />
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-cv-brand-soft px-2 py-0.5 text-[10px] font-semibold text-cv-blue ring-1 ring-white/60">
                    <span className="h-2 w-2 rounded-full" style={{ background: NODE_META[selectedNode.type].color }} /> {NODE_META[selectedNode.type].label}
                  </span>
                  <p className="mt-1 text-[15px] font-bold text-cv-ink">{selectedNode.label}</p>
                </div>
                <button type="button" onClick={() => setSelected(null)} aria-label="Clear selection" className="inline-flex h-7 w-7 items-center justify-center rounded-full text-cv-mist hover:bg-white/70 hover:text-cv-ink"><X size={15} /></button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {selectedNode.severity ? <StatusBadge label={selectedNode.severity} tone={isHighSeverity(selectedNode.severity) ? "bad" : "neutral"} /> : null}
                {selectedNode.status ? <StatusBadge label={selectedNode.status} tone="neutral" /> : null}
              </div>

              <div className="space-y-1 text-[12px] text-cv-slate">
                {selectedNode.owner ? <p><span className="font-semibold text-cv-ink">Owner:</span> {selectedNode.owner}</p> : null}
                {selectedNode.date ? <p><span className="font-semibold text-cv-ink">Date:</span> {formatDate(selectedNode.date)}</p> : null}
              </div>

              <div>
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-cv-mist">Relationships ({selectedEdges.length})</p>
                {selectedEdges.length === 0 ? (
                  <p className="text-[12px] text-cv-mist">No linked records.</p>
                ) : (
                  <ul className="max-h-[220px] space-y-1.5 overflow-y-auto pr-1">
                    {selectedEdges.map((e, i) => (
                      <li key={i} className="rounded-lg bg-white/55 px-2.5 py-1.5 text-[11px] ring-1 ring-white/60">
                        <span className="text-cv-slate">{e.rel}</span>{" "}
                        <span className="font-semibold text-cv-ink">{e.other!.label}</span>{" "}
                        <span className="text-cv-mist">· {NODE_META[e.other!.type].label}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {selectedNode.route ? (
                <button type="button" onClick={() => router.push(selectedNode.route!)} className="cv-ring-focus inline-flex items-center justify-center gap-1.5 rounded-full bg-white/70 px-3 py-2 text-[12px] font-bold text-cv-ink ring-1 ring-white/70 transition hover:bg-white">
                  Open in module <ArrowUpRight size={13} />
                </button>
              ) : null}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
