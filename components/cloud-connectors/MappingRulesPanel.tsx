"use client";

import { useState } from "react";
import { GitMerge, Loader2, Trash2, Plus } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { createMappingRule, deleteMappingRule } from "@/lib/api/cloud-connectors";
import type { CloudConnectorsData } from "@/lib/hooks/useCloudConnectors";

/**
 * Finding-category → control mapping rules
 * (GET/POST/DELETE /api/v1/cloud-connectors/mapping-rules).
 */
export function MappingRulesPanel({ data }: { data: CloudConnectorsData }) {
  const { mappingRules, controls } = data;
  const rules = mappingRules.data ?? [];
  const controlList = controls.data ?? [];
  const controlNames = new Map(controlList.map((c) => [c.id, c.title]));

  const [category, setCategory] = useState("");
  const [controlId, setControlId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!category.trim() || !controlId) {
      setError("Provide a finding category and pick a target control.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // Allowed confidence vocabulary: deterministic_exact | deterministic_partial | needs_review.
      await createMappingRule({
        finding_category: category.trim(),
        target_control_id: controlId,
        confidence: "deterministic_exact"
      });
      setCategory("");
      mappingRules.refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create rule.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(ruleId: string) {
    try {
      await deleteMappingRule(ruleId);
      mappingRules.refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete rule.");
    }
  }

  return (
    <SectionCard
      title="Finding → Control Mapping Rules"
      subtitle="Route ingested findings to the controls they test"
      icon={GitMerge}
      accent="teal"
      className="h-full"
    >
      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Finding category (e.g. iam.mfa_disabled)"
            className="cv-ring-focus min-w-0 flex-1 rounded-xl bg-white/60 px-3.5 py-2.5 text-[13px] font-medium text-cv-ink ring-1 ring-white/70 placeholder:text-cv-mist focus:outline-none"
          />
          <select
            value={controlId}
            onChange={(e) => setControlId(e.target.value)}
            className="cv-ring-focus rounded-xl bg-white/60 px-3.5 py-2.5 text-[13px] font-medium text-cv-ink ring-1 ring-white/70 focus:outline-none"
          >
            <option value="">Target control…</option>
            {controlList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.control_code ? `${c.control_code} — ` : ""}
                {c.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleCreate}
            disabled={busy}
            className="cv-ring-focus inline-flex items-center justify-center gap-1.5 rounded-xl bg-cv-brand px-4 py-2.5 text-[13px] font-bold text-white shadow-tile transition hover:opacity-90 disabled:opacity-60"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Add rule
          </button>
        </div>
        {error ? <p className="text-[12px] font-medium text-rose-600">{error}</p> : null}

        {mappingRules.isLoading ? (
          <SkeletonRows rows={4} />
        ) : mappingRules.isError ? (
          <ErrorState compact title="Unable to load mapping rules" onRetry={() => mappingRules.refetch()} />
        ) : rules.length === 0 ? (
          <EmptyState
            compact
            icon={GitMerge}
            title="No mapping rules"
            description="Without rules, ingested findings wait in the suggestion queue for manual triage."
          />
        ) : (
          <ul className="space-y-2">
            {rules.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-cv-ink">{r.finding_category}</p>
                  <p className="truncate text-[11px] text-cv-slate">
                    → {r.target_control_id ? (controlNames.get(r.target_control_id) ?? r.target_control_id) : r.target_control_common_tag}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <StatusBadge label={r.is_active ? "Active" : "Inactive"} tone={r.is_active ? "good" : "neutral"} />
                  <button
                    type="button"
                    onClick={() => handleDelete(r.id)}
                    className="cv-ring-focus rounded-lg p-1.5 text-cv-mist transition hover:bg-rose-500/10 hover:text-rose-600"
                    aria-label="Delete rule"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SectionCard>
  );
}
