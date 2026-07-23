"use client";

import { useMemo, useState } from "react";
import { Search, FolderOpen, FileCheck2, ExternalLink, Paperclip, Plus } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { ResourceUsageChip } from "@/components/common/ResourceUsageChip";
import { formatDate } from "@/lib/utils/format";
import type { EvidenceData } from "@/lib/hooks/useEvidence";
import { useHasPermission } from "@/lib/hooks/usePermissions";

function freshnessTone(status: string | null): "good" | "warn" | "bad" | "neutral" {
  switch (status) {
    case "fresh":
      return "good";
    case "expiring_soon":
    case "stale":
      return "warn";
    case "expired":
      return "bad";
    default:
      return "neutral";
  }
}

export function EvidenceTable({ data, onCreate, onSelect }: { data: EvidenceData; onCreate?: () => void; onSelect?: (id: string) => void }) {
  const { evidence } = data;
  const list = useMemo(() => evidence.data ?? [], [evidence.data]);
  // Gate the create action on evidence:write (mirrors every other domain).
  const canWriteEvidence = useHasPermission("evidence:write");

  const [query, setQuery] = useState("");
  const [review, setReview] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((e) => {
      if (review !== "all" && e.review_status !== review) return false;
      if (!q) return true;
      return [e.title, e.description, e.evidence_type, e.source]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q));
    });
  }, [list, query, review]);

  const reviewStatuses = useMemo(() => [...new Set(list.map((e) => e.review_status))], [list]);

  return (
    <SectionCard
      title="Evidence Library"
      subtitle="Chain-of-custody records with freshness and review status"
      icon={FileCheck2}
      accent="green"
      className="h-full"
      action={
        <div className="flex items-center gap-2">
          {evidence.isSuccess ? (
            <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">
              {list.length} items
            </span>
          ) : null}
          <ResourceUsageChip resource="evidence" />
          {onCreate && canWriteEvidence ? (
            <button
              type="button"
              data-testid="new-evidence"
              onClick={onCreate}
              className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-cv-brand px-3 py-1.5 text-[11px] font-bold text-white shadow-button transition hover:-translate-y-0.5"
            >
              <Plus size={12} strokeWidth={2.8} />
              New evidence
            </button>
          ) : null}
        </div>
      }
    >
      {evidence.isLoading ? (
        <SkeletonRows rows={6} />
      ) : evidence.isError ? (
        <ErrorState title="Unable to load evidence" onRetry={() => evidence.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No evidence uploaded"
          description="Upload your first evidence file to start building an audit-ready record."
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-2.5 rounded-full bg-white/60 px-4 py-2.5 ring-1 ring-white/70 focus-within:ring-cv-blue/40">
              <Search size={16} className="shrink-0 text-cv-mist" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search evidence…"
                className="min-w-0 flex-1 bg-transparent text-sm text-cv-ink placeholder:text-cv-mist focus:outline-none"
              />
            </div>
            <select
              value={review}
              onChange={(e) => setReview(e.target.value)}
              aria-label="Filter by review state"
              className="cv-ring-focus rounded-full bg-white/60 px-3.5 py-2 text-[13px] font-medium text-cv-ink ring-1 ring-white/70 focus:outline-none"
            >
              <option value="all">All review states</option>
              {reviewStatuses.map((s) => (
                <option key={s} value={s}>
                  {s.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>

          {filtered.length === 0 ? (
            <EmptyState compact icon={Search} title="No evidence matches" description="Try adjusting search or filters." />
          ) : (
            <ul className="space-y-2.5">
              {filtered.map((e) => (
                <li
                  key={e.id}
                  role={onSelect ? "button" : undefined}
                  tabIndex={onSelect ? 0 : undefined}
                  onClick={onSelect ? () => onSelect(e.id) : undefined}
                  onKeyDown={onSelect ? (ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); onSelect(e.id); } } : undefined}
                  data-testid={`evidence-row-${e.id}`}
                  className={`rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70 transition hover:bg-white/85 ${onSelect ? "cursor-pointer" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {e.external_reference_url ? (
                        <a
                          href={e.external_reference_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(ev) => ev.stopPropagation()}
                          className="group inline-flex items-center gap-1 text-[13px] font-semibold leading-snug text-cv-blue hover:underline"
                        >
                          <span className="truncate">{e.title}</span>
                          <ExternalLink size={12} className="shrink-0 opacity-70 group-hover:opacity-100" />
                        </a>
                      ) : (
                        <p className="text-[13px] font-semibold leading-snug text-cv-ink">{e.title}</p>
                      )}
                      <p className="mt-0.5 text-[11px] text-cv-slate">
                        {[
                          e.evidence_type?.replaceAll("_", " "),
                          e.source?.replaceAll("_", " "),
                          e.valid_until ? `valid until ${formatDate(e.valid_until) ?? e.valid_until}` : null
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {e.file_name ? (
                        <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-cv-mist">
                          <Paperclip size={11} className="shrink-0" />
                          <span className="truncate">{e.file_name}</span>
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {e.freshness_status ? (
                        <StatusBadge label={e.freshness_status.replaceAll("_", " ")} tone={freshnessTone(e.freshness_status)} />
                      ) : null}
                      <StatusBadge
                        label={e.review_status.replaceAll("_", " ")}
                        tone={e.review_status === "verified" ? "good" : e.review_status === "rejected" ? "bad" : "warn"}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </SectionCard>
  );
}
