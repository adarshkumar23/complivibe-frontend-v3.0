"use client";

import { useQuery } from "@tanstack/react-query";
import { getRisks } from "@/lib/api/risks";
import { getVendors } from "@/lib/api/vendor-risk";
import { getRiskEntityGraph, getRiskDependencyGraph, getVendorSupplyChainGraph } from "@/lib/api/trust-graph";

/** Entity picker source lists — risks and vendors are the only two root entity types with a real graph endpoint. */
export function useTrustGraphEntities() {
  const risks = useQuery({ queryKey: ["risks"], queryFn: () => getRisks() });
  const vendors = useQuery({ queryKey: ["vendors"], queryFn: () => getVendors() });
  return { risks, vendors };
}

/** GET /api/v1/risks/{risk_id}/graph — entity coverage graph for the selected risk. */
export function useRiskEntityGraph(riskId: string | null, depth: 1 | 2 = 2) {
  return useQuery({
    queryKey: ["trust-graph", "risk-entity", riskId, depth],
    queryFn: () => getRiskEntityGraph(riskId as string, depth),
    enabled: riskId != null && riskId !== ""
  });
}

/** GET /api/v1/risks/{risk_id}/dependency-graph — risk-to-risk cascade graph for the selected risk. */
export function useRiskDependencyGraph(riskId: string | null) {
  return useQuery({
    queryKey: ["trust-graph", "risk-dependency", riskId],
    queryFn: () => getRiskDependencyGraph(riskId as string),
    enabled: riskId != null && riskId !== ""
  });
}

/** GET /api/v1/vendors/{vendor_id}/supply-chain-graph — sub-processor / nth-party chain for the selected vendor. */
export function useVendorSupplyChainGraph(vendorId: string | null) {
  return useQuery({
    queryKey: ["trust-graph", "vendor-supply-chain", vendorId],
    queryFn: () => getVendorSupplyChainGraph(vendorId as string),
    enabled: vendorId != null && vendorId !== ""
  });
}
