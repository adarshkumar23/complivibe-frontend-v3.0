"use client";

import { useMemo, useState } from "react";
import { Search, BookOpenCheck, ShieldAlert, SquarePen } from "lucide-react";
import { RiskFormModal } from "@/components/risks/RiskFormModal";
import type { Risk } from "@/lib/api/risks";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { useHasPermission } from "@/lib/hooks/usePermissions";
import type { Severity } from "@/lib/api/types";
import type { RisksData } from "@/lib/hooks/useRisks";

export function RiskRegister({ data }: { data: RisksData }) {
  const { risks } = data;
  const list = useMemo(() => risks.data ?? [], [risks.data]);
  const canEditRisk = useHasPermission("risks:write");

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [editRisk, setEditRisk] = useState<Risk | null>(null);

  const categories = useMemo(
    () => [...new Set(list.map((r) => r.category).filter((c): c is string => Boolean(c)))],
    [list]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list
      .filter((r) => {
        if (category !== "all" && r.category !== category) return false;
        if (!q) return true;
        return [r.title, r.description, r.category].filter(Boolean).some((v) => (v as string).toLowerCase().includes(q));
      })
      .sort((a, b) => (b.inherent_score ?? 0) - (a.inherent_score ?? 0));
  }, [list, query, category]);

  return (
    <SectionCard
      title="Risk Register"
      subtitle="Ranked by inherent score; residual shows treatment effect"
      icon={BookOpenCheck}
      accent="blue"
      className="h-full"
      action={
        risks.isSuccess ? (
          <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">
            {list.length} risks
          </span>
        ) : null
      }
    >
      {risks.isLoading ? (
        <SkeletonRows rows={6} />
      ) : risks.isError ? (
        <ErrorState title="Unable to load risks" onRetry={() => risks.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="No risks registered"
          description="Register your first risk to start tracking likelihood, impact, and treatment."
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-2.5 rounded-full bg-white/60 px-4 py-2.5 ring-1 ring-white/70 focus-within:ring-cv-blue/40">
              <Search size={16} className="shrink-0 text-cv-mist" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search risks…"
                className="min-w-0 flex-1 bg-transparent text-sm text-cv-ink placeholder:text-cv-mist focus:outline-none"
              />
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Filter risks by category"
              className="cv-ring-focus rounded-full bg-white/60 px-3.5 py-2 text-[13px] font-medium text-cv-ink ring-1 ring-white/70 focus:outline-none"
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>

          {filtered.length === 0 ? (
            <EmptyState compact icon={Search} title="No risks match" description="Try adjusting search or filters." />
          ) : (
            <ul className="space-y-2.5">
              {filtered.map((r) => (
                <li key={r.id} className="rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70 transition hover:bg-white/85">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold leading-snug text-cv-ink">{r.title}</p>
                      <p className="mt-0.5 text-[11px] text-cv-slate">
                        {[
                          r.category?.replaceAll("_", " "),
                          r.likelihood != null && r.impact != null ? `L${r.likelihood} × I${r.impact}` : null,
                          r.treatment_strategy ? `treatment: ${r.treatment_strategy}` : null
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {canEditRisk ? (
                        <button
                          type="button"
                          onClick={() => setEditRisk(r)}
                          aria-label={`Edit risk: ${r.title}`}
                          className="cv-ring-focus inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/60 text-cv-slate ring-1 ring-white/70 transition hover:bg-white hover:text-cv-ink"
                        >
                          <SquarePen size={13} />
                        </button>
                      ) : null}
                      {r.inherent_score != null ? (
                        <span className="rounded-full bg-slate-500/10 px-2 py-0.5 text-[11px] font-bold text-cv-slate ring-1 ring-slate-400/20">
                          {r.inherent_score}
                          {r.residual_score != null && r.residual_score !== r.inherent_score
                            ? ` → ${r.residual_score}`
                            : ""}
                        </span>
                      ) : null}
                      {r.severity ? <SeverityBadge severity={r.severity as Severity} /> : null}
                      <StatusBadge label={r.status.replaceAll("_", " ")} tone={r.status === "mitigated" ? "good" : "info"} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <RiskFormModal open={editRisk !== null} onClose={() => setEditRisk(null)} risk={editRisk} />
    </SectionCard>
  );
}
