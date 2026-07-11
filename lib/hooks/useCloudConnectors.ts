"use client";

import { useQuery } from "@tanstack/react-query";
import { getCloudConnectors, getMappingRules } from "@/lib/api/cloud-connectors";
import { getControls } from "@/lib/api/controls";

export function useCloudConnectors() {
  const connectors = useQuery({ queryKey: ["cloud-connectors"], queryFn: getCloudConnectors });
  const mappingRules = useQuery({ queryKey: ["cc-mapping-rules"], queryFn: getMappingRules });
  // Controls feed the mapping-rule target picker.
  const controls = useQuery({ queryKey: ["controls"], queryFn: () => getControls() });

  return { connectors, mappingRules, controls };
}

export type CloudConnectorsData = ReturnType<typeof useCloudConnectors>;
