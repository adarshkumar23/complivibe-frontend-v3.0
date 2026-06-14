"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getNotifications, getNotificationSettings } from "@/lib/api/notifications";
import { getPredictiveAlerts, getRegulatoryDeadlines } from "@/lib/api/command";
import { getRisks } from "@/lib/api/compliance";
import { getIncidents } from "@/lib/api/incidents";
import { getApprovals } from "@/lib/api/approvals";
import { getAssuranceCases } from "@/lib/api/assurance";
import { getQuestionnaires } from "@/lib/api/questionnaires";
import { getSyncLogs } from "@/lib/api/integrations";
import { getAutomationRuns } from "@/lib/api/automation";
import { getWorkflows } from "@/lib/api/workflows";
import { buildSignals, normalizeNotificationFeed, type SignalSources } from "@/lib/api/notification-normalizers";

function useEndpoint<T = unknown>(key: string, fn: () => Promise<T>) {
  return useQuery({ queryKey: [key], queryFn: fn, retry: false });
}

export function useNotifications() {
  const feed = useEndpoint("notifications-feed", getNotifications);
  const settings = useEndpoint("notification-settings", getNotificationSettings);

  const alerts = useEndpoint("predictive-alerts", getPredictiveAlerts);
  const incidents = useEndpoint("incidents", getIncidents);
  const risks = useEndpoint("risks", getRisks);
  const regulatory = useEndpoint("regulatory-deadlines", getRegulatoryDeadlines);
  const approvals = useEndpoint("approvals", getApprovals);
  const assurance = useEndpoint("assurance-cases", getAssuranceCases);
  const questionnaires = useEndpoint("questionnaires", getQuestionnaires);
  const syncLogs = useEndpoint("integration-sync-logs", getSyncLogs);
  const automationRuns = useEndpoint("automation-runs", getAutomationRuns);
  const workflows = useEndpoint("workflows", getWorkflows);

  const sources = [alerts, incidents, risks, regulatory, approvals, assurance, questionnaires, syncLogs, automationRuns, workflows];

  // Prefer a dedicated notifications feed when it exists; otherwise aggregate real governance signals.
  const usingDedicatedFeed = feed.isSuccess && normalizeNotificationFeed(feed.data).length > 0;

  const signals = useMemo(() => {
    if (usingDedicatedFeed) return normalizeNotificationFeed(feed.data);
    const s: SignalSources = {};
    if (alerts.isSuccess) s.alerts = alerts.data;
    if (incidents.isSuccess) s.incidents = incidents.data;
    if (risks.isSuccess) s.risks = risks.data;
    if (regulatory.isSuccess) s.regulatory = regulatory.data;
    if (approvals.isSuccess) s.approvals = approvals.data;
    if (assurance.isSuccess) s.assurance = assurance.data;
    if (questionnaires.isSuccess) s.questionnaires = questionnaires.data;
    if (syncLogs.isSuccess) s.syncLogs = syncLogs.data;
    if (automationRuns.isSuccess) s.automationRuns = automationRuns.data;
    if (workflows.isSuccess) s.workflows = workflows.data;
    return buildSignals(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usingDedicatedFeed, feed.data, alerts.data, incidents.data, risks.data, regulatory.data, approvals.data, assurance.data, questionnaires.data, syncLogs.data, automationRuns.data, workflows.data]);

  const isLoading = sources.some((s) => s.isLoading) || feed.isLoading;
  const anyAvailable = usingDedicatedFeed || sources.some((s) => s.isSuccess);
  const allUnavailable = !isLoading && !anyAvailable;

  return { feed, settings, signals, usingDedicatedFeed, isLoading, anyAvailable, allUnavailable };
}

export type NotificationsData = ReturnType<typeof useNotifications>;
