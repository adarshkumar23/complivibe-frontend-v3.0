"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  containIncident,
  createDataIncident,
  dismissIncident,
  escalateIncidentToIssue,
  getDataAssets,
  getDataIncidentSummary,
  getDataIncidents,
  investigateIncident,
  resolveIncident,
  type DataIncidentCreate
} from "@/lib/api/data-observability";
import {
  assignIssue,
  createIssue,
  getIssueDashboard,
  getIssues,
  transitionIssue,
  type IssueCreate
} from "@/lib/api/compliance";
import { getOrgUsers } from "@/lib/api/users";

/**
 * Combined data source for /dashboard/incidents. Two genuinely distinct backend
 * domains are queried in parallel and never merged into one list:
 *   - data-observability incidents (app/data_observability/routers/incidents.py)
 *   - compliance issues            (app/api/v1/issues.py)
 * Query keys intentionally reuse the ones already used elsewhere in the app
 * (`dobs-incidents`, `cmp-issues`, `cmp-issue-dashboard`, `org-users`,
 * `dobs-assets`) so mutations here keep other pages' caches in sync.
 */
export function useIncidentsPageData() {
  const dataIncidents = useQuery({ queryKey: ["dobs-incidents-list"], queryFn: () => getDataIncidents({ limit: 100 }) });
  const dataIncidentSummary = useQuery({ queryKey: ["dobs-incidents"], queryFn: getDataIncidentSummary });
  const issues = useQuery({ queryKey: ["cmp-issues"], queryFn: () => getIssues({ limit: 100 }) });
  const issueDashboard = useQuery({ queryKey: ["cmp-issue-dashboard"], queryFn: getIssueDashboard });
  const assets = useQuery({ queryKey: ["dobs-assets"], queryFn: () => getDataAssets() });
  const users = useQuery({ queryKey: ["org-users"], queryFn: () => getOrgUsers() });

  return { dataIncidents, dataIncidentSummary, issues, issueDashboard, assets, users };
}

export type IncidentsPageData = ReturnType<typeof useIncidentsPageData>;

function invalidateDataIncidents(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["dobs-incidents-list"] });
  queryClient.invalidateQueries({ queryKey: ["dobs-incidents"] });
  queryClient.invalidateQueries({ queryKey: ["dobs-dashboard"] });
}

function invalidateIssues(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["cmp-issues"] });
  queryClient.invalidateQueries({ queryKey: ["cmp-issue-dashboard"] });
}

// ── Data-observability incident mutations ────────────────────────────────────

export function useCreateDataIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: DataIncidentCreate) => createDataIncident(body),
    onSuccess: () => invalidateDataIncidents(queryClient)
  });
}

export function useInvestigateDataIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => investigateIncident(id, notes),
    onSuccess: () => invalidateDataIncidents(queryClient)
  });
}

export function useContainDataIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => containIncident(id, notes),
    onSuccess: () => invalidateDataIncidents(queryClient)
  });
}

export function useResolveDataIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => resolveIncident(id, notes),
    onSuccess: () => invalidateDataIncidents(queryClient)
  });
}

export function useDismissDataIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => dismissIncident(id, notes),
    onSuccess: () => invalidateDataIncidents(queryClient)
  });
}

/** Escalating a data incident creates a real compliance Issue — invalidate both domains. */
export function useEscalateDataIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => escalateIncidentToIssue(id),
    onSuccess: () => {
      invalidateDataIncidents(queryClient);
      invalidateIssues(queryClient);
    }
  });
}

// ── Compliance issue mutations ────────────────────────────────────────────────

export function useCreateIssue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: IssueCreate) => createIssue(body),
    onSuccess: () => invalidateIssues(queryClient)
  });
}

export function useTransitionIssue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      newStatus,
      notes,
      resolutionNote
    }: {
      id: string;
      newStatus: string;
      notes?: string;
      resolutionNote?: string;
    }) => transitionIssue(id, newStatus, { notes, resolutionNote }),
    onSuccess: () => invalidateIssues(queryClient)
  });
}

export function useAssignIssue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, assignedTo }: { id: string; assignedTo: string }) => assignIssue(id, assignedTo),
    onSuccess: () => invalidateIssues(queryClient)
  });
}
