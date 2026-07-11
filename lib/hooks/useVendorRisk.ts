"use client";

import { useQuery } from "@tanstack/react-query";
import { getVendors, getVendorRiskSummary, getVendorConcentrationRisk } from "@/lib/api/vendor-risk";

export function useVendorRisk() {
  const vendors = useQuery({ queryKey: ["vendors"], queryFn: () => getVendors() });
  const summary = useQuery({ queryKey: ["vendor-summary"], queryFn: getVendorRiskSummary });
  const concentration = useQuery({ queryKey: ["vendor-concentration"], queryFn: getVendorConcentrationRisk });

  return { vendors, summary, concentration };
}

export type VendorRiskData = ReturnType<typeof useVendorRisk>;
