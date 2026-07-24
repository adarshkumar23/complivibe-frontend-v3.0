"use client";

import { useMemo, useState } from "react";
import { Search, ListChecks, FileText, Gavel } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import type { RegulatoryData } from "@/lib/hooks/useRegulatory";
import { useHasPermission } from "@/lib/hooks/usePermissions";
import { ObligationDecisionModal, type DecisionObligation } from "@/components/regulatory/ObligationDecisionModal";

function applicabilityTone(status: string | null | undefined): "good" | "warn" | "bad" | "neutral" | "info" {
  switch (status) {
    case "applicable":
      return "info";
    case "not_applicable":
      return "neutral";
    case "needs_review":
      return "warn";
    default:
      return "neutral";
  }
}

function implementationTone(status: string | null | undefined): "good" | "warn" | "bad" | "neutral" | "info" {
  switch (status) {
    case "implemented":
      return "good";
    case "in_progress":
      return "warn";
    case "not_started":
      return "bad";
    default:
      return "neutral";
  }
}

/** Obligations of the selected framework, from GET /api/v1/frameworks/{id}/obligations. */
export function ObligationsTable({ data }: { data: RegulatoryData }) {
  const { obligations, applicability, frameworkId } = data;
  const list = useMemo(() => obligations.data ?? [], [obligations.data]);
  // Deciding applicability writes obligation state (frameworks:activate on the backend).
  const canDecide = useHasPermission("frameworks:activate");

  const [query, setQuery] = useState("");
  const [appFilter, setAppFilter] = useState("all");
  const [decision, setDecision] = useState<DecisionObligation | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((o) => {
      const app = o.organization_state?.applicability_status ?? "unknown";
      if (appFilter !== "all" && app !== appFilter) return false;
      if (!q) return true;
      return [o.title, o.reference_code, o.plain_language_summary, o.obligation_type]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q));
    });
  }, [list, query, appFilter]);

  const summary = applicability.data;

  return (
    <SectionCard
      title="Obligations"
      subtitle={
        summary
          ? `${summary.applicable_obligations} applicable · ${summary.unknown_obligations} undecided · ${summary.not_applicable_obligations} not applicable`
          : "Requirements of the selected framework"
      }
      icon={ListChecks}
      accent="blue"
      action={
        obligations.isSuccess ? (
          <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">
            {list.length} total
          </span>
        ) : null
      }
    >
      {frameworkId == null ? (
        <EmptyState
          icon={FileText}
          title="No framework selected"
          description="Activate and select a framework to browse its obligations."
        />
      ) : obligations.isLoading ? (
        <SkeletonRows rows={6} />
      ) : obligations.isError ? (
        <ErrorState title="Unable to load obligations" onRetry={() => obligations.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No obligations in this framework"
          description="This framework has no obligation content loaded yet."
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-2.5 rounded-full bg-white/60 px-4 py-2.5 ring-1 ring-white/70 focus-within:ring-cv-blue/40">
              <Search size={16} className="shrink-0 text-cv-mist" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search obligations by title, code, or summary…"
                className="min-w-0 flex-1 bg-transparent text-sm text-cv-ink placeholder:text-cv-mist focus:outline-none"
              />
            </div>
            <select
              value={appFilter}
              onChange={(e) => setAppFilter(e.target.value)}
              className="cv-ring-focus rounded-full bg-white/60 px-3.5 py-2 text-[13px] font-medium text-cv-ink ring-1 ring-white/70 focus:outline-none"
            >
              <option value="all">All applicability</option>
              <option value="applicable">Applicable</option>
              <option value="not_applicable">Not applicable</option>
              <option value="needs_review">Needs review</option>
              <option value="unknown">Undecided</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <EmptyState compact icon={Search} title="No obligations match your filters" description="Try adjusting search or filters." />
          ) : (
            <ul className="max-h-[560px] space-y-2.5 overflow-y-auto pr-1">
              {filtered.map((o) => {
                const app = o.organization_state?.applicability_status;
                const impl = o.organization_state?.implementation_status;
                return (
                  <li key={o.id} className="rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70 transition hover:bg-white/85">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold leading-snug text-cv-ink">
                          {o.reference_code ? <span className="mr-1.5 text-cv-blue">{o.reference_code}</span> : null}
                          {o.title}
                        </p>
                        {o.plain_language_summary ? (
                          <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-cv-slate">
                            {o.plain_language_summary}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <StatusBadge
                          label={(app ?? "undecided").replaceAll("_", " ")}
                          tone={applicabilityTone(app)}
                        />
                        {app === "applicable" && impl ? (
                          <StatusBadge label={impl.replaceAll("_", " ")} tone={implementationTone(impl)} />
                        ) : null}
                        {canDecide ? (
                          <button
                            type="button"
                            data-testid={`obligation-decide-${o.id}`}
                            onClick={() =>
                              setDecision({
                                id: o.id,
                                title: o.title,
                                reference_code: o.reference_code,
                                applicability_status: app,
                                implementation_status: impl
                              })
                            }
                            className="cv-ring-focus mt-0.5 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-cv-ink ring-1 ring-white/70 transition hover:bg-white"
                          >
                            <Gavel size={11} strokeWidth={2.6} />
                            {app && app !== "unknown" ? "Change decision" : "Decide"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
      <ObligationDecisionModal obligation={decision} onClose={() => setDecision(null)} />
    </SectionCard>
  );
}
