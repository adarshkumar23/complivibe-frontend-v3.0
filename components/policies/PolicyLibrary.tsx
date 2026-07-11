"use client";

import { useMemo, useState } from "react";
import { Search, Library, FileText } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { formatDate } from "@/lib/utils/format";
import type { PoliciesData } from "@/lib/hooks/usePolicies";

function statusTone(status: string): "good" | "warn" | "bad" | "neutral" | "info" {
  switch (status) {
    case "approved":
      return "good";
    case "under_review":
      return "info";
    case "draft":
      return "warn";
    case "deprecated":
    case "archived":
      return "neutral";
    default:
      return "neutral";
  }
}

/** Days until review is due; negative = overdue. */
function reviewDays(reviewDue: string | null): number | null {
  if (!reviewDue) return null;
  return Math.ceil((new Date(reviewDue).getTime() - Date.now()) / 86400000);
}

export function PolicyLibrary({ data }: { data: PoliciesData }) {
  const { policies } = data;
  const list = useMemo(() => policies.data ?? [], [policies.data]);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const statuses = useMemo(() => [...new Set(list.map((p) => p.status))], [list]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((p) => {
      if (status !== "all" && p.status !== status) return false;
      if (!q) return true;
      return [p.title, p.description, p.policy_type].filter(Boolean).some((v) => (v as string).toLowerCase().includes(q));
    });
  }, [list, query, status]);

  return (
    <SectionCard
      title="Policy Library"
      subtitle="Governance policies with review cycles"
      icon={Library}
      accent="blue"
      className="h-full"
      action={
        policies.isSuccess ? (
          <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">
            {list.length} policies
          </span>
        ) : null
      }
    >
      {policies.isLoading ? (
        <SkeletonRows rows={6} />
      ) : policies.isError ? (
        <ErrorState title="Unable to load policies" onRetry={() => policies.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No policies yet"
          description="Create your first governance policy or start from a template."
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-2.5 rounded-full bg-white/60 px-4 py-2.5 ring-1 ring-white/70 focus-within:ring-cv-blue/40">
              <Search size={16} className="shrink-0 text-cv-mist" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search policies…"
                className="min-w-0 flex-1 bg-transparent text-sm text-cv-ink placeholder:text-cv-mist focus:outline-none"
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="cv-ring-focus rounded-full bg-white/60 px-3.5 py-2 text-[13px] font-medium text-cv-ink ring-1 ring-white/70 focus:outline-none"
            >
              <option value="all">All statuses</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>

          {filtered.length === 0 ? (
            <EmptyState compact icon={Search} title="No policies match" description="Try adjusting search or filters." />
          ) : (
            <ul className="space-y-2.5">
              {filtered.map((p) => {
                const days = reviewDays(p.review_due_date);
                return (
                  <li key={p.id} className="rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70 transition hover:bg-white/85">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold leading-snug text-cv-ink">
                          {p.title}
                          {p.version ? <span className="ml-1.5 text-[11px] font-medium text-cv-mist">v{p.version}</span> : null}
                        </p>
                        <p className="mt-0.5 text-[11px] text-cv-slate">
                          {p.policy_type.replaceAll("_", " ")}
                          {p.effective_date ? ` · effective ${formatDate(p.effective_date) ?? p.effective_date}` : ""}
                          {days != null
                            ? days < 0
                              ? ` · review overdue by ${Math.abs(days)}d`
                              : ` · review due in ${days}d`
                            : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {days != null && days < 0 ? <StatusBadge label="Review overdue" tone="bad" /> : null}
                        <StatusBadge label={p.status.replaceAll("_", " ")} tone={statusTone(p.status)} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </SectionCard>
  );
}
