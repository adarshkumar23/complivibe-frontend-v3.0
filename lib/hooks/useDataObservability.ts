"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDataAsset,
  getAssetLineage,
  getDataAccessSummary,
  getDataAssets,
  getDataAssetSummary,
  getDataIncidentSummary,
  getDataObsDashboard,
  getLineageNodes,
  getQualityDashboard,
  getResidencySummary,
  getRetentionSummary,
  type DataAssetCreate
} from "@/lib/api/data-observability";
import { getOrgUsers } from "@/lib/api/users";

export function useDataObservability() {
  const dashboard = useQuery({ queryKey: ["dobs-dashboard"], queryFn: getDataObsDashboard });
  const assets = useQuery({ queryKey: ["dobs-assets"], queryFn: () => getDataAssets() });
  const assetSummary = useQuery({ queryKey: ["dobs-asset-summary"], queryFn: getDataAssetSummary });
  const quality = useQuery({ queryKey: ["dobs-quality"], queryFn: getQualityDashboard });
  const retention = useQuery({ queryKey: ["dobs-retention"], queryFn: getRetentionSummary });
  const residency = useQuery({ queryKey: ["dobs-residency"], queryFn: getResidencySummary });
  const incidents = useQuery({ queryKey: ["dobs-incidents"], queryFn: getDataIncidentSummary });
  const access = useQuery({ queryKey: ["dobs-access"], queryFn: getDataAccessSummary });

  return { dashboard, assets, assetSummary, quality, retention, residency, incidents, access };
}

export type DataObservabilityData = ReturnType<typeof useDataObservability>;

/** Org members, for the asset-owner picker (POST /assets requires owner_id). */
export function useOrgUsersForOwnerPicker() {
  return useQuery({ queryKey: ["org-users"], queryFn: () => getOrgUsers() });
}

export function useCreateDataAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: DataAssetCreate) => createDataAsset(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dobs-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["dobs-assets"] });
      queryClient.invalidateQueries({ queryKey: ["dobs-asset-summary"] });
      queryClient.invalidateQueries({ queryKey: ["dobs-lineage-nodes"] });
    }
  });
}

export function useLineageNodes() {
  return useQuery({ queryKey: ["dobs-lineage-nodes"], queryFn: getLineageNodes });
}

export function useAssetLineage(assetId: string | null) {
  return useQuery({
    queryKey: ["dobs-asset-lineage", assetId],
    queryFn: () => getAssetLineage(assetId as string),
    enabled: assetId != null
  });
}
