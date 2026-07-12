"use client";

import { useMemo } from "react";
import ReactFlow, { Background, Controls, type Node, type Edge } from "reactflow";
import "reactflow/dist/style.css";
import type { RiskDependencyGraph } from "@/lib/api/trust-graph";
import { trustGraphNodeTypes, type TrustGraphNodeData } from "@/components/trust-graph/TrustGraphNode";
import { layoutByHopDistance, positionByHop, buildEdge } from "@/components/trust-graph/layout";

const RELATIONSHIP_COLOR: Record<string, string> = {
  cascades_to: "#EF4444",
  triggers: "#F59E0B",
  compounds: "#8B5CF6"
};

export function RiskDependencyGraphView({ graph }: { graph: RiskDependencyGraph }) {
  const { nodes, edges } = useMemo(() => {
    const nodeIds = graph.nodes.map((n) => n.risk_id);
    const edgePairs = graph.edges.map((e) => ({ source: e.upstream_risk_id, target: e.downstream_risk_id }));
    const hops = layoutByHopDistance(nodeIds, edgePairs, graph.root_risk_id);
    const positioned = positionByHop(
      graph.nodes.map((n) => ({ id: n.risk_id })),
      hops
    );

    const nodeById = new Map(graph.nodes.map((n) => [n.risk_id, n]));
    const flowNodes: Node<TrustGraphNodeData>[] = positioned.map((p) => {
      const n = nodeById.get(p.id);
      const isRoot = p.id === graph.root_risk_id;
      return {
        ...p,
        data: {
          label: n?.title ?? p.id,
          kind: isRoot ? "root-risk" : "dependency-risk",
          status: n?.status ?? null,
          caption: n ? `${n.category ?? "risk"} · severity ${n.severity ?? "—"}` : undefined,
          isRoot
        }
      };
    });

    const flowEdges: Edge[] = graph.edges.map((e) =>
      buildEdge(
        e.id,
        e.upstream_risk_id,
        e.downstream_risk_id,
        e.relationship_type.replace(/_/g, " "),
        RELATIONSHIP_COLOR[e.relationship_type] ?? "#94A3B8"
      )
    );

    return { nodes: flowNodes, edges: flowEdges };
  }, [graph]);

  return (
    <div className="h-[340px] w-full overflow-hidden rounded-2xl bg-white/40 ring-1 ring-white/60">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={trustGraphNodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
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
