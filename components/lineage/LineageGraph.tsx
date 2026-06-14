"use client";

import { useMemo, useState } from "react";
import { Workflow, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils/cn";
import { NODE_STYLES, TYPE_ORDER } from "@/components/lineage/node-style";
import type { LineageGraph as Graph, LineageNodeType } from "@/lib/api/lineage-normalizers";

const COL_W = 210;
const NODE_W = 168;
const NODE_H = 46;
const V_GAP = 14;
const TOP = 40;
const LEFT = 24;
const MAX_PER_COL = 10;

type Placed = { id: string; x: number; y: number; type: LineageNodeType; label: string };

export function LineageGraph({
  graph,
  selectedId,
  onSelect
}: {
  graph: Graph;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [hidden, setHidden] = useState<Set<LineageNodeType>>(new Set());

  const presentTypes = useMemo(
    () => TYPE_ORDER.filter((t) => graph.nodes.some((n) => n.type === t)),
    [graph.nodes]
  );

  const { placed, width, height, hiddenCounts } = useMemo(() => {
    const cols = presentTypes.filter((t) => !hidden.has(t));
    const map = new Map<string, Placed>();
    const hiddenCounts: Record<string, number> = {};
    let maxRows = 0;

    cols.forEach((type, colIndex) => {
      const nodesOfType = graph.nodes.filter((n) => n.type === type);
      const shown = nodesOfType.slice(0, MAX_PER_COL);
      if (nodesOfType.length > MAX_PER_COL) hiddenCounts[type] = nodesOfType.length - MAX_PER_COL;
      shown.forEach((n, row) => {
        map.set(n.id, {
          id: n.id,
          type,
          label: n.label,
          x: LEFT + colIndex * COL_W,
          y: TOP + row * (NODE_H + V_GAP)
        });
      });
      maxRows = Math.max(maxRows, shown.length);
    });

    return {
      placed: map,
      width: Math.max(cols.length * COL_W + LEFT, 320),
      height: Math.max(maxRows * (NODE_H + V_GAP) + TOP + 20, 240),
      hiddenCounts
    };
  }, [graph.nodes, presentTypes, hidden]);

  const visibleEdges = useMemo(
    () => graph.edges.filter((e) => placed.has(e.from) && placed.has(e.to)),
    [graph.edges, placed]
  );

  const connected = useMemo(() => {
    const active = hoverId ?? selectedId;
    if (!active) return null;
    const set = new Set<string>([active]);
    visibleEdges.forEach((e) => {
      if (e.from === active) set.add(e.to);
      if (e.to === active) set.add(e.from);
    });
    return set;
  }, [hoverId, selectedId, visibleEdges]);

  if (graph.nodes.length === 0) {
    return (
      <EmptyState
        icon={Workflow}
        title="No lineage data available"
        description="Once datasets, pipelines, AI systems and their references are reported by the backend, the lineage graph will render here."
      />
    );
  }

  const toggleType = (t: LineageNodeType) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });

  return (
    <div className="space-y-3">
      {/* Filter chips + zoom controls */}
      <div className="flex flex-wrap items-center gap-2">
        {presentTypes.map((t) => {
          const s = NODE_STYLES[t];
          const off = hidden.has(t);
          return (
            <button
              key={t}
              type="button"
              onClick={() => toggleType(t)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 outline-none transition",
                "focus-visible:ring-2 focus-visible:ring-cv-blue",
                off ? "bg-white/40 text-cv-mist ring-white/60" : cn(s.soft, s.text, "ring-white/70")
              )}
              aria-pressed={!off}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: off ? "#CBD5E1" : s.hex }} />
              {s.label}
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.15).toFixed(2)))}
            className="cv-ring-focus inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-cv-slate ring-1 ring-white/70 transition hover:text-cv-ink"
            aria-label="Zoom out"
          >
            <ZoomOut size={15} />
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            className="cv-ring-focus inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-cv-slate ring-1 ring-white/70 transition hover:text-cv-ink"
            aria-label="Reset zoom"
          >
            <Maximize2 size={14} />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(1.8, +(z + 0.15).toFixed(2)))}
            className="cv-ring-focus inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-cv-slate ring-1 ring-white/70 transition hover:text-cv-ink"
            aria-label="Zoom in"
          >
            <ZoomIn size={15} />
          </button>
        </div>
      </div>

      {/* Graph */}
      <div className="overflow-auto rounded-2xl bg-white/40 ring-1 ring-white/60">
        <svg
          width={width * zoom}
          height={height * zoom}
          viewBox={`0 0 ${width} ${height}`}
          className="block"
          role="img"
          aria-label="Data lineage graph"
        >
          {/* edges */}
          {visibleEdges.map((e) => {
            const a = placed.get(e.from)!;
            const b = placed.get(e.to)!;
            const x1 = a.x + NODE_W;
            const y1 = a.y + NODE_H / 2;
            const x2 = b.x;
            const y2 = b.y + NODE_H / 2;
            const mx = (x1 + x2) / 2;
            const active = connected && (connected.has(e.from) && connected.has(e.to));
            const dim = connected && !active;
            return (
              <path
                key={e.id}
                d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                fill="none"
                stroke={active ? "#3B82F6" : "#94A3B8"}
                strokeWidth={active ? 2 : 1.2}
                strokeOpacity={dim ? 0.18 : active ? 0.9 : 0.4}
              />
            );
          })}

          {/* nodes */}
          {Array.from(placed.values()).map((p) => {
            const s = NODE_STYLES[p.type];
            const isSelected = selectedId === p.id;
            const dim = connected && !connected.has(p.id);
            return (
              <g
                key={p.id}
                transform={`translate(${p.x}, ${p.y})`}
                className="cursor-pointer"
                opacity={dim ? 0.35 : 1}
                onMouseEnter={() => setHoverId(p.id)}
                onMouseLeave={() => setHoverId(null)}
                onClick={() => onSelect(p.id)}
              >
                <rect
                  width={NODE_W}
                  height={NODE_H}
                  rx={12}
                  fill="white"
                  stroke={isSelected ? s.hex : "#E2E8F0"}
                  strokeWidth={isSelected ? 2.5 : 1}
                />
                <rect width={5} height={NODE_H} rx={2.5} fill={s.hex} />
                <circle cx={20} cy={NODE_H / 2} r={4} fill={s.hex} />
                <text x={34} y={NODE_H / 2 - 3} fontSize={11} fontWeight={700} fill="#0F172A">
                  {p.label.length > 18 ? `${p.label.slice(0, 17)}…` : p.label}
                </text>
                <text x={34} y={NODE_H / 2 + 11} fontSize={9} fontWeight={600} fill="#94A3B8">
                  {s.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* hidden-node note */}
      {Object.keys(hiddenCounts).length > 0 ? (
        <p className="text-[11px] text-cv-mist">
          Showing up to {MAX_PER_COL} nodes per type ·{" "}
          {Object.entries(hiddenCounts)
            .map(([t, n]) => `+${n} ${NODE_STYLES[t as LineageNodeType].label.toLowerCase()}`)
            .join(" · ")}{" "}
          not shown (visible in the relationships table).
        </p>
      ) : null}
    </div>
  );
}
