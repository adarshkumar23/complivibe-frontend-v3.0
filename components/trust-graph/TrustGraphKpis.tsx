"use client";

import { Share2, Spline, Flame, Unlink } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import { highRiskConnections, unlinkedNodes } from "@/lib/api/trust-graph-normalizers";
import type { TrustGraphData } from "@/lib/hooks/useTrustGraph";

export function TrustGraphKpis({ data }: { data: TrustGraphData }) {
  const { nodes, edges, isLoading, allUnavailable } = data;

  const nodeCount = allUnavailable ? null : nodes.length;
  const edgeCount = allUnavailable ? null : edges.length;
  const highRisk = allUnavailable ? null : highRiskConnections(nodes, edges);
  const unlinked = allUnavailable ? null : unlinkedNodes(nodes, edges).length;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RegistryKpi label="Graph Nodes" icon={Share2} accent="blue" value={nodeCount} caption={nodeCount != null ? "real records" : undefined} loading={isLoading && nodes.length === 0} unavailableHint="Graph unavailable" />
      <RegistryKpi label="Relationships" icon={Spline} accent="purple" value={edgeCount} caption={edgeCount != null ? "derived links" : undefined} loading={isLoading && nodes.length === 0} unavailableHint="No relationships" />
      <RegistryKpi label="High-Risk Connections" icon={Flame} accent="red" value={highRisk} caption={highRisk != null ? "risk/incident links" : undefined} loading={isLoading && nodes.length === 0} unavailableHint="Unavailable" />
      <RegistryKpi label="Unlinked Records" icon={Unlink} accent="amber" value={unlinked} caption={unlinked != null ? "no relationships" : undefined} loading={isLoading && nodes.length === 0} unavailableHint="Unavailable" />
    </div>
  );
}
