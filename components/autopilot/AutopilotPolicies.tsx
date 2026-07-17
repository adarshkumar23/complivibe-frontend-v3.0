"use client";

import { useState } from "react";
import { Archive, Loader2, Plus, ShieldCheck, Star } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { PolicyFormModal } from "@/components/autopilot/PolicyFormModal";
import { ApiError } from "@/lib/api/client";
import { useHasPermission } from "@/lib/hooks/usePermissions";
import { useArchivePolicy, useAutopilotPolicies, useSetDefaultPolicy } from "@/lib/hooks/useAutopilot";

function prettify(v: string) {
  return v.replaceAll("_", " ");
}

const smallBtn =
  "cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-1.5 text-[11px] font-semibold text-cv-slate ring-1 ring-white/70 transition hover:bg-white hover:text-cv-ink disabled:opacity-50";

/**
 * Guardrail policies stage — GET/POST /api/v1/ai-governance/autopilot/policies,
 * set-default and archive actions. The default policy is what resolves the
 * org-wide guardrail surface shown in the Guardrails card.
 */
export function AutopilotPolicies() {
  const policies = useAutopilotPolicies();
  const setDefault = useSetDefaultPolicy();
  const archive = useArchivePolicy();
  // Gate autopilot policy mutations on ai_systems:write (mirrors risks gating);
  // backend enforces the same, so an ungated action would 403.
  const canManageAutopilot = useHasPermission("ai_systems:write");
  const [createOpen, setCreateOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const active = (policies.data ?? []).filter((p) => p.status !== "archived" && !p.archived_at);

  const run = async (id: string, fn: () => Promise<unknown>) => {
    setActionError(null);
    setBusyId(id);
    try {
      await fn();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Request failed — the backend may be unavailable.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <SectionCard
      title="Guardrail Policies"
      subtitle="Deterministic bounds autopilot must operate within"
      icon={ShieldCheck}
      accent="teal"
      className="h-full"
      action={
        canManageAutopilot ? (
          <button type="button" onClick={() => setCreateOpen(true)} className={smallBtn} data-testid="new-policy">
            <Plus size={13} strokeWidth={2.6} />
            New policy
          </button>
        ) : null
      }
    >
      {policies.isLoading ? (
        <SkeletonRows rows={3} />
      ) : policies.isError ? (
        <ErrorState compact title="Unable to load policies" onRetry={() => policies.refetch()} />
      ) : active.length === 0 ? (
        <EmptyState
          compact
          icon={ShieldCheck}
          title="No guardrail policies yet"
          description="Autopilot falls back to the safe suggest-only default. Create a policy to define explicit bounds."
        />
      ) : (
        <ul className="space-y-2.5">
          {active.map((p) => (
            <li
              key={p.id}
              className="flex flex-col gap-2 rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[13px] font-semibold text-cv-ink">{p.name}</p>
                  {p.is_default ? <StatusBadge label="Default" tone="info" /> : null}
                  <StatusBadge label={prettify(p.mode)} tone={p.mode === "execute_safe_later" ? "warn" : "teal"} />
                </div>
                <p className="mt-0.5 text-[11px] text-cv-slate">
                  max auto band: {p.max_allowed_priority_band_for_auto}
                  {p.task_creation_allowed ? " · task creation allowed" : ""}
                  {p.review_creation_allowed ? " · review creation allowed" : ""}
                  {p.source_record_mutation_allowed ? " · source mutation allowed" : ""}
                  {p.external_effects_allowed ? " · external effects allowed" : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {canManageAutopilot && !p.is_default ? (
                  <button
                    type="button"
                    className={smallBtn}
                    disabled={busyId === p.id && setDefault.isPending}
                    onClick={() => run(p.id, () => setDefault.mutateAsync(p.id))}
                  >
                    {busyId === p.id && setDefault.isPending ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Star size={12} />
                    )}
                    Set default
                  </button>
                ) : null}
                {canManageAutopilot ? (
                  <button
                    type="button"
                    className={smallBtn}
                    disabled={busyId === p.id && archive.isPending}
                    onClick={() => run(p.id, () => archive.mutateAsync({ policyId: p.id }))}
                  >
                    {busyId === p.id && archive.isPending ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Archive size={12} />
                    )}
                    Archive
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {actionError ? (
        <p role="alert" className="mt-3 rounded-xl bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-600 ring-1 ring-rose-400/25">
          {actionError}
        </p>
      ) : null}

      <PolicyFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </SectionCard>
  );
}
