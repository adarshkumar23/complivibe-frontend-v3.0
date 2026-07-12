"use client";

import Link from "next/link";
import { ClipboardList, TriangleAlert, ListTodo, Gauge } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import type { CommandCenterData } from "@/lib/hooks/useCommandCenter";

export function KpiRow({ data }: { data: CommandCenterData }) {
  const { summary, issues } = data;
  const s = summary.data;
  const iss = issues.data;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* Deep-links to the score explainer (real /scoring breakdown of this number). */}
      <Link
        href="/dashboard/score-explainer"
        aria-label="Explain the compliance score"
        className="cv-ring-focus block rounded-3xl transition hover:-translate-y-0.5"
      >
        <RegistryKpi
          label="Compliance Score"
          icon={Gauge}
          accent="blue"
          value={s?.current_score ?? null}
          caption={
            s
              ? s.current_score != null
                ? `grade ${s.current_score_grade ?? "—"} · tap to explain`
                : "no score snapshot computed yet"
              : undefined
          }
          loading={summary.isLoading}
          unavailableHint="Score not yet computed"
        />
      </Link>
      <RegistryKpi
        label="Open Obligations"
        icon={ClipboardList}
        accent="purple"
        value={s ? s.open_obligations : null}
        caption={s ? `${s.total_controls} controls · ${s.total_policies} policies` : undefined}
        loading={summary.isLoading}
        unavailableHint="Dashboard summary unavailable"
      />
      <RegistryKpi
        label="Open Risks"
        icon={TriangleAlert}
        accent="red"
        value={s ? s.open_risks : null}
        caption={iss ? `${iss.open_critical_count} critical issues open` : undefined}
        loading={summary.isLoading}
        unavailableHint="Dashboard summary unavailable"
      />
      <RegistryKpi
        label="Pending Tasks"
        icon={ListTodo}
        accent="amber"
        value={s ? s.pending_tasks : null}
        caption={iss && iss.unassigned_count > 0 ? `${iss.unassigned_count} issues unassigned` : undefined}
        loading={summary.isLoading}
        unavailableHint="Dashboard summary unavailable"
      />
    </div>
  );
}
