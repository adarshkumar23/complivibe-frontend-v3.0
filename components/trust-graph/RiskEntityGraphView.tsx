"use client";

import { useMemo } from "react";
import ReactFlow, { Background, Controls, type Node, type Edge } from "reactflow";
import "reactflow/dist/style.css";
import type { RiskEntityGraph, GraphNodeType } from "@/lib/api/trust-graph";
import { trustGraphNodeTypes, type TrustGraphNodeData } from "@/components/trust-graph/TrustGraphNode";
import { layoutEntityGraphColumns, buildEdge } from "@/components/trust-graph/layout";

const TYPE_COLUMN: Record<GraphNodeType, number> = {
  control: 1,
  obligation: 2,
  vendor: 3,
  evidence: 4,
  policy: 5
};

const TYPE_CAPTION: Record<GraphNodeType, string> = {
  control: "Control",
  obligation: "Obligation",
  vendor: "Vendor",
  evidence: "Evidence",
  policy: "Policy"
};

const EDGE_COLOR: Record<string, string> = {
  mitigated_by: "#3B82F6",
  affects: "#8B5CF6",
  governed_by: "#14B8A6",
  evidenced_by: "#10B981",
  has_evidence: "#10B981",
  policy_linked: "#F59E0B",
  vendor_risk_factor: "#8B5CF6"
};

export function RiskEntityGraphView({ graph }: { graph: RiskEntityGraph }) {
  const { nodes, edges } = useMemo(() => {
    const items = [
      { id: graph.risk.id, column: 0 },
      ...graph.nodes.map((n) => ({ id: n.node_id, column: TYPE_COLUMN[n.node_type] ?? 6 }))
    ];
    const positioned = layoutEntityGraphColumns(items);

    const nodeById = new Map(graph.nodes.map((n) => [n.node_id, n]));
    const flowNodes: Node<TrustGraphNodeData>[] = positioned.map((p) => {
      if (p.id === graph.risk.id) {
        return {
          ...p,
          data: {
            label: graph.risk.name,
            kind: "root-risk",
            status: graph.risk.status,
            caption: `Risk · score ${graph.risk.score ?? "—"}`,
            isRoot: true
          }
        };
      }
      const n = nodeById.get(p.id);
      return {
        ...p,
        data: {
          label: n?.label ?? p.id,
          kind: (n?.node_type ?? "control") as TrustGraphNodeData["kind"],
          status: n?.status ?? null,
          health: n?.health,
          caption: n ? TYPE_CAPTION[n.node_type] : undefined
        }
      };
    });

    const flowEdges: Edge[] = graph.edges.map((e, i) =>
      buildEdge(
        `${e.source_id}-${e.target_id}-${i}`,
        e.source_id,
        e.target_id,
        e.relationship.replace(/_/g, " "),
        EDGE_COLOR[e.relationship] ?? "#94A3B8"
      )
    );

    return { nodes: flowNodes, edges: flowEdges };
  }, [graph]);

  return (
    <div className="h-[420px] w-full overflow-hidden rounded-2xl bg-white/40 ring-1 ring-white/60">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={trustGraphNodeTypes}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        proOptions={{ hideAttribution: true }}
        nodesConnectable={false}
        edgesFocusable={false}
        minZoom={0.3}
        maxZoom={1.5}
      >
        <Background gap={22} color="rgba(100,116,139,0.18)" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
