"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getRiskIndicators,
  getKriSummary,
  createRiskIndicator,
  recalculateRiskIndicator,
  getAppetiteThresholds,
  getAppetiteSummary,
  getAppetiteBreaches,
  createAppetiteThreshold,
  type KriCreatePayload,
  type AppetiteThresholdCreatePayload
} from "@/lib/api/risk-appetite";

/** KRI + Risk Appetite queries for the /dashboard/risk-appetite route. */
export function useRiskAppetite() {
  const kris = useQuery({ queryKey: ["kris"], queryFn: getRiskIndicators });
  const kriSummary = useQuery({ queryKey: ["kri-summary"], queryFn: getKriSummary });
  const thresholds = useQuery({ queryKey: ["appetite-thresholds"], queryFn: getAppetiteThresholds });
  const appetiteSummary = useQuery({ queryKey: ["appetite-summary"], queryFn: getAppetiteSummary });
  const breaches = useQuery({ queryKey: ["appetite-breaches"], queryFn: getAppetiteBreaches });

  return { kris, kriSummary, thresholds, appetiteSummary, breaches };
}

export type RiskAppetiteData = ReturnType<typeof useRiskAppetite>;

function invalidateKriQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["kris"] });
  queryClient.invalidateQueries({ queryKey: ["kri-summary"] });
}

function invalidateAppetiteQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["appetite-thresholds"] });
  queryClient.invalidateQueries({ queryKey: ["appetite-summary"] });
  queryClient.invalidateQueries({ queryKey: ["appetite-breaches"] });
}

/** POST /api/v1/compliance/risk-indicators */
export function useCreateKri() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: KriCreatePayload) => createRiskIndicator(payload),
    onSuccess: () => invalidateKriQueries(queryClient)
  });
}

/** POST /api/v1/compliance/risk-indicators/{id}/recalculate */
export function useRecalculateKri() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => recalculateRiskIndicator(id),
    onSuccess: () => invalidateKriQueries(queryClient)
  });
}

/** POST /api/v1/compliance/risk-appetite */
export function useCreateAppetiteThreshold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AppetiteThresholdCreatePayload) => createAppetiteThreshold(payload),
    onSuccess: () => invalidateAppetiteQueries(queryClient)
  });
}
