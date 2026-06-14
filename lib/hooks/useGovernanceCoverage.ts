"use client";

import { useMemo } from "react";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import {
  Brain,
  FileCheck2,
  TriangleAlert,
  Siren,
  FileBarChart,
  PackageCheck,
  ClipboardList,
  BadgeCheck,
  ScrollText,
  Building,
  Stamp,
  ClipboardCheck,
  Bell,
  Lightbulb,
  CalendarClock,
  Award,
  Plug,
  Database,
  type LucideIcon
} from "lucide-react";
import { getCountFromPayload } from "@/lib/api/normalizers";
import type { Accent } from "@/components/ui/accent";
import { getAiSystems } from "@/lib/api/ai-systems";
import { getComplianceEvidence, getRisks } from "@/lib/api/compliance";
import { getIncidents } from "@/lib/api/incidents";
import { getReports } from "@/lib/api/reports";
import { getAuditPacks } from "@/lib/api/audit-pack";
import { getQuestionnaires } from "@/lib/api/questionnaires";
import { getTrustCenter, getCertifications } from "@/lib/api/trust-center";
import { getPolicies } from "@/lib/api/policies";
import { getVendors } from "@/lib/api/vendor-risk";
import { getApprovals } from "@/lib/api/approvals";
import { getAssuranceCases } from "@/lib/api/assurance";
import { getPredictiveAlerts, getProactiveInsights, getRegulatoryDeadlines } from "@/lib/api/command";
import { getIntegrations, getSyncLogs } from "@/lib/api/integrations";
import { getDataObsOverview } from "@/lib/api/data-observability";

export type CoverageStatus = "loading" | "available" | "empty" | "unavailable";

export type CoverageItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  accent: Accent;
  href: string;
  /** real backend count, or null when the payload carries data but no countable list/total */
  count: number | null;
  status: CoverageStatus;
  /** optional secondary line (e.g. integration sync-log activity) */
  note?: string | null;
};

export type CoverageSummary = {
  /** endpoints that responded successfully */
  connectedSources: number;
  /** endpoints that failed / are unavailable */
  unavailableSources: number;
  /** total endpoints probed */
  totalSources: number;
  /** sum of real counts across modules that returned records */
  availableRecords: number;
  /** whether any source is still loading */
  loading: boolean;
};

export type GovernanceCoverage = {
  items: CoverageItem[];
  byId: Record<string, CoverageItem>;
  summary: CoverageSummary;
};

function useEndpoint<T = unknown>(key: string, fn: () => Promise<T>) {
  // 5-minute staleTime keeps the Command Center light: shared keys are reused
  // across module pages and we never refetch in a loop.
  return useQuery({ queryKey: [key], queryFn: fn, retry: 1, staleTime: 300_000 });
}

function resolve(query: UseQueryResult<unknown>): { status: CoverageStatus; count: number | null } {
  if (query.isLoading || query.isPending) return { status: "loading", count: null };
  if (query.isError) return { status: "unavailable", count: null };
  const count = getCountFromPayload(query.data);
  if (count === null) return { status: "available", count: null }; // data present, not countable
  if (count <= 0) return { status: "empty", count: 0 };
  return { status: "available", count };
}

type Config = {
  id: string;
  label: string;
  icon: LucideIcon;
  accent: Accent;
  href: string;
  query: UseQueryResult<unknown>;
};

export function useGovernanceCoverage(): GovernanceCoverage {
  // Each key matches the key used by its module page hook, so React Query
  // dedupes the request instead of issuing a second fetch.
  const aiSystems = useEndpoint("ai-systems", getAiSystems);
  const evidence = useEndpoint("cmp-evidence", getComplianceEvidence);
  const risks = useEndpoint("risks", getRisks);
  const incidents = useEndpoint("incidents", getIncidents);
  const reports = useEndpoint("reports", getReports);
  const auditPacks = useEndpoint("audit-packs", getAuditPacks);
  const questionnaires = useEndpoint("questionnaires", getQuestionnaires);
  const trustCenter = useEndpoint("trust-center", getTrustCenter);
  const policies = useEndpoint("policies", getPolicies);
  const vendors = useEndpoint("vendors", getVendors);
  const approvals = useEndpoint("approvals", getApprovals);
  const assurance = useEndpoint("assurance-cases", getAssuranceCases);
  const alerts = useEndpoint("predictive-alerts", getPredictiveAlerts);
  const insights = useEndpoint("proactive-insights", getProactiveInsights);
  const deadlines = useEndpoint("regulatory-deadlines", getRegulatoryDeadlines);
  const certifications = useEndpoint("certifications", getCertifications);
  const integrations = useEndpoint("integrations", getIntegrations);
  const syncLogs = useEndpoint("integration-sync-logs", getSyncLogs);
  const dataObs = useEndpoint("dataobs-overview", getDataObsOverview);

  return useMemo<GovernanceCoverage>(() => {
    const configs: Config[] = [
      { id: "ai-systems", label: "AI Systems", icon: Brain, accent: "purple", href: "/dashboard/ai-systems", query: aiSystems },
      { id: "evidence", label: "Evidence", icon: FileCheck2, accent: "blue", href: "/dashboard/evidence", query: evidence },
      { id: "risks", label: "Risks", icon: TriangleAlert, accent: "amber", href: "/dashboard/risks", query: risks },
      { id: "incidents", label: "Incidents", icon: Siren, accent: "red", href: "/dashboard/incidents", query: incidents },
      { id: "reports", label: "Reports", icon: FileBarChart, accent: "cyan", href: "/dashboard/reports", query: reports },
      { id: "audit-packs", label: "Audit Packs", icon: PackageCheck, accent: "teal", href: "/dashboard/audit-pack", query: auditPacks },
      { id: "questionnaires", label: "Questionnaires", icon: ClipboardList, accent: "blue", href: "/dashboard/questionnaires", query: questionnaires },
      { id: "trust-center", label: "Trust Center", icon: BadgeCheck, accent: "green", href: "/dashboard/trust-center", query: trustCenter },
      { id: "policies", label: "Policies", icon: ScrollText, accent: "purple", href: "/dashboard/policies", query: policies },
      { id: "vendors", label: "Vendors", icon: Building, accent: "amber", href: "/dashboard/vendor-risk", query: vendors },
      { id: "approvals", label: "Approvals", icon: Stamp, accent: "cyan", href: "/dashboard/approvals", query: approvals },
      { id: "assurance", label: "Assurance", icon: ClipboardCheck, accent: "teal", href: "/dashboard/assurance", query: assurance },
      { id: "alerts", label: "Alerts", icon: Bell, accent: "red", href: "/dashboard/alerts", query: alerts },
      { id: "insights", label: "Insights", icon: Lightbulb, accent: "amber", href: "/dashboard/insights", query: insights },
      { id: "deadlines", label: "Deadlines", icon: CalendarClock, accent: "blue", href: "/dashboard/regulatory", query: deadlines },
      { id: "certifications", label: "Certifications", icon: Award, accent: "green", href: "/dashboard/certifications", query: certifications },
      { id: "integrations", label: "Integrations", icon: Plug, accent: "cyan", href: "/dashboard/integrations", query: integrations },
      { id: "data-observability", label: "Data Observability", icon: Database, accent: "purple", href: "/dashboard/data-observability", query: dataObs }
    ];

    const items: CoverageItem[] = configs.map((c) => {
      const { status, count } = resolve(c.query);
      const item: CoverageItem = { id: c.id, label: c.label, icon: c.icon, accent: c.accent, href: c.href, count, status };
      if (c.id === "integrations" && !syncLogs.isLoading && !syncLogs.isError) {
        const syncCount = getCountFromPayload(syncLogs.data);
        if (syncCount && syncCount > 0) item.note = `${syncCount} sync events`;
      }
      return item;
    });

    const byId = Object.fromEntries(items.map((i) => [i.id, i])) as Record<string, CoverageItem>;

    const connectedSources = items.filter((i) => i.status === "available" || i.status === "empty").length;
    const unavailableSources = items.filter((i) => i.status === "unavailable").length;
    const availableRecords = items.reduce((sum, i) => sum + (i.count ?? 0), 0);
    const loading = items.some((i) => i.status === "loading");

    return {
      items,
      byId,
      summary: {
        connectedSources,
        unavailableSources,
        totalSources: items.length,
        availableRecords,
        loading
      }
    };
  }, [
    aiSystems,
    evidence,
    risks,
    incidents,
    reports,
    auditPacks,
    questionnaires,
    trustCenter,
    policies,
    vendors,
    approvals,
    assurance,
    alerts,
    insights,
    deadlines,
    certifications,
    integrations,
    syncLogs,
    dataObs
  ]);
}
