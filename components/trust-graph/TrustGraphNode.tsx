"use client";

import { Handle, Position, type NodeProps } from "reactflow";
import { cn } from "@/lib/utils/cn";
import { iconForKind, type NodeKind } from "./nodeIcons";

export type TrustGraphNodeData = {
  label: string;
  kind: NodeKind;
  status?: string | null;
  health?: "healthy" | "degraded" | "critical" | "unknown";
  caption?: string;
  isRoot?: boolean;
};

const KIND_TONE: Record<TrustGraphNodeData["kind"], string> = {
  "root-risk": "bg-rose-500/12 ring-rose-500/30 text-rose-600",
  "dependency-risk": "bg-rose-500/10 ring-rose-400/25 text-rose-600",
  control: "bg-blue-500/10 ring-blue-400/25 text-blue-600",
  vendor: "bg-violet-500/10 ring-violet-400/25 text-violet-600",
  obligation: "bg-teal-500/10 ring-teal-400/25 text-teal-600",
  evidence: "bg-emerald-500/10 ring-emerald-400/25 text-emerald-600",
  policy: "bg-amber-500/10 ring-amber-400/25 text-amber-600"
};

const HEALTH_DOT: Record<NonNullable<TrustGraphNodeData["health"]>, string> = {
  healthy: "bg-emerald-500",
  degraded: "bg-amber-500",
  critical: "bg-rose-500",
  unknown: "bg-slate-400"
};

export function TrustGraphNode({ data }: NodeProps<TrustGraphNodeData>) {
  const Icon = iconForKind(data.kind);
  return (
    <div
      className={cn(
        "w-56 rounded-2xl border px-3.5 py-3 shadow-sm backdrop-blur-sm",
        data.isRoot
          ? "border-rose-400/50 bg-white/95 ring-2 ring-rose-400/40"
          : "border-white/70 bg-white/85"
      )}
    >
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-none !bg-slate-300" />
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-none !bg-slate-300" />
      <div className="flex items-start gap-2.5">
        <span
          className={cn(
            "mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ring-1",
            KIND_TONE[data.kind]
          )}
        >
          <Icon size={14} strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] font-bold leading-tight text-cv-ink" title={data.label}>
            {data.label}
          </p>
          {data.caption ? <p className="mt-0.5 truncate text-[10.5px] text-cv-slate">{data.caption}</p> : null}
          <div className="mt-1.5 flex items-center gap-1.5">
            {data.status ? (
              <span className="rounded-full bg-slate-400/10 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-cv-slate ring-1 ring-slate-400/15">
                {data.status.replace(/_/g, " ")}
              </span>
            ) : null}
            {data.health ? (
              <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-cv-slate">
                <span className={cn("h-1.5 w-1.5 rounded-full", HEALTH_DOT[data.health])} />
                {data.health}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export const trustGraphNodeTypes = { trustNode: TrustGraphNode };
