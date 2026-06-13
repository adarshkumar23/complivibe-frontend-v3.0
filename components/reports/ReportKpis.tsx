"use client";

import { FileStack, CalendarCheck, Download, TriangleAlert, LayoutTemplate, ClipboardCheck } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import { pickScore } from "@/lib/hooks/useCommandCenter";
import { normalizeReports, normalizeReportTemplates, isReady, isFailed, generatedThisMonth } from "@/lib/api/report-normalizers";
import type { ReportsData } from "@/lib/hooks/useReports";

export function ReportKpis({ data }: { data: ReportsData }) {
  const { reports, templates, scores, executive } = data;
  const list = normalizeReports(reports.data);
  const ok = reports.isSuccess;
  const loading = reports.isLoading;

  const total = ok ? list.length : null;

  const month = generatedThisMonth(list);
  const generated = ok && month.anyDates ? month.count : null;

  const anyStatusOrUrl = list.some((r) => r.status || r.url);
  const ready = ok && anyStatusOrUrl ? list.filter((r) => isReady(r.status) || Boolean(r.url)).length : null;

  const anyStatus = list.some((r) => r.status);
  const failed = ok && anyStatus ? list.filter((r) => isFailed(r.status)).length : null;

  const templateList = normalizeReportTemplates(templates.data);
  const templateCount = templates.isSuccess ? templateList.length : null;

  const audit = pickScore([scores.data, executive.data], ["audit_readiness", "audit_readiness_score", "audit_score", "audit", "readiness.audit"]);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
      <RegistryKpi label="Total Reports" icon={FileStack} accent="blue" value={total} caption={total != null ? "in library" : undefined} loading={loading} unavailableHint="Library unavailable" />
      <RegistryKpi label="Generated This Month" icon={CalendarCheck} accent="purple" value={generated} caption={generated != null ? "this month" : undefined} loading={loading} unavailableHint="No dates" />
      <RegistryKpi label="Ready for Export" icon={Download} accent="green" value={ready} caption={ready != null ? "downloadable" : undefined} loading={loading} unavailableHint="No status field" />
      <RegistryKpi label="Failed / Attention" icon={TriangleAlert} accent="red" value={failed} caption={failed != null ? "needs attention" : undefined} loading={loading} unavailableHint="No status field" />
      <RegistryKpi label="Available Templates" icon={LayoutTemplate} accent="cyan" value={templateCount} caption={templateCount != null ? "report templates" : undefined} loading={templates.isLoading} unavailableHint="Templates unavailable" />
      <RegistryKpi label="Audit Readiness" icon={ClipboardCheck} accent="teal" value={audit} suffix={audit != null ? "/100" : ""} scoreToneFor={audit} caption={audit != null ? "audit posture" : undefined} loading={loading && scores.isLoading} unavailableHint="No score returned" />
    </div>
  );
}
