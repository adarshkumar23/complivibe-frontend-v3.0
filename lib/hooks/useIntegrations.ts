"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getIntegrations,
  getIntegrationStatus,
  getSyncLogs,
  getStorageStatus,
  getGithubSummary,
  getSlackSummary,
  getJiraSummary,
  getGoogleSummary,
  getMicrosoftSummary,
  getAwsSummary
} from "@/lib/api/integrations";

function useEndpoint<T = unknown>(key: string, fn: () => Promise<T>) {
  return useQuery({ queryKey: [key], queryFn: fn, retry: false });
}

export function useIntegrations() {
  const integrations = useEndpoint("integrations", getIntegrations);
  const status = useEndpoint("integration-status", getIntegrationStatus);
  const syncLogs = useEndpoint("integration-sync-logs", getSyncLogs);
  const storage = useEndpoint("storage-status", getStorageStatus);

  const github = useEndpoint("integration-github", getGithubSummary);
  const slack = useEndpoint("integration-slack", getSlackSummary);
  const jira = useEndpoint("integration-jira", getJiraSummary);
  const google = useEndpoint("integration-google", getGoogleSummary);
  const microsoft = useEndpoint("integration-microsoft", getMicrosoftSummary);
  const aws = useEndpoint("integration-aws", getAwsSummary);

  return { integrations, status, syncLogs, storage, github, slack, jira, google, microsoft, aws };
}

export type IntegrationsData = ReturnType<typeof useIntegrations>;
