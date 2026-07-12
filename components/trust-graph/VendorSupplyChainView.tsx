"use client";

import { useMemo } from "react";
import ReactFlow, { Background, Controls, type Node, type Edge } from "reactflow";
import "reactflow/dist/style.css";
import type { VendorSupplyChainGraph } from "@/lib/api/trust-graph";
import { trustGraphNodeTypes, type TrustGraphNodeData } from "@/components/trust-graph/TrustGraphNode";
import { buildEdge } from "@/components/trust-graph/layout";

export function VendorSupplyChainView({ graph }: { graph: VendorSupplyChainGraph }) {
  const { nodes, edges } = useMemo(() => {
    const flowNodes: Node<TrustGraphNodeData>[] = graph.nodes.map((n, i) => ({
      id: n.id,
      type: "trustNode",
      draggable: true,
      position: { x: (i % 4) * 260, y: Math.floor(i / 4) * 110 },
      data: {
        label: n.name,
        kind: "vendor",
        status: n.status,
        caption: `${n.vendor_type ?? "vendor"} · ${n.risk_tier ?? "unrated"} tier`,
        isRoot: n.id === graph.root_vendor_id
      }
    }));

    const flowEdges: Edge[] = graph.edges
      .filter((e) => typeof e.source_id === "string" && typeof e.target_id === "string")
      .map((e, i) => buildEdge(`${e.source_id}-${e.target_id}-${i}`, e.source_id as string, e.target_id as string, "sub-processor", "#8B5CF6"));

    return { nodes: flowNodes, edges: flowEdges };
  }, [graph]);

  return (
    <div className="h-[260px] w-full overflow-hidden rounded-2xl bg-white/40 ring-1 ring-white/60">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={trustGraphNodeTypes}
        fitView
        fitViewOptions={{ padding: 0.4, maxZoom: 1.1 }}
        proOptions={{ hideAttribution: true }}
        nodesConnectable={false}
        edgesFocusable={false}
        minZoom={0.4}
        maxZoom={1.5}
      >
        <Background gap={22} color="rgba(100,116,139,0.18)" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
