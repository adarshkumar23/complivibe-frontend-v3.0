"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getProactiveInsights,
  getPredictiveAlerts,
  getControlCenterFeed,
  getRegulatoryDeadlines,
  getScoresSummary
} from "@/lib/api/command";
import { getRisks } from "@/lib/api/risks";
import { getIncidents } from "@/lib/api/incidents";

function useEndpoint<T = unknown>(key: string, fn: () => Promise<T>) {
  return useQuery({ queryKey: [key], queryFn: fn });
}

export function useAlerts() {
  const insights = useEndpoint("proactive-insights", getProactiveInsights);
  const predictive = useEndpoint("predictive-alerts", getPredictiveAlerts);
  const feed = useEndpoint("control-center-feed", getControlCenterFeed);
  const deadlines = useEndpoint("regulatory-deadlines", getRegulatoryDeadlines);
  const risks = useEndpoint("risks", getRisks);
  const incidents = useEndpoint("incidents", getIncidents);
  const scores = useEndpoint("scores-summary", getScoresSummary);

  return { insights, predictive, feed, deadlines, risks, incidents, scores };
}

export type AlertsData = ReturnType<typeof useAlerts>;
