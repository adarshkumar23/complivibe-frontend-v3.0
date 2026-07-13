"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShieldHalf, Loader2, TriangleAlert, CheckCircle2, Ban, Info } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { getAiSystems } from "@/lib/api/ai-systems";
import {
  simulatePolicyResolution,
  GUARDRAIL_REVIEW_TYPES,
  type PolicyResolutionSimulationResponse,
  type GuardrailReviewType
} from "@/lib/api/simulation";

/**
 * What this actually is: the backend's deterministic guardrail
 * policy-resolution precedence walk (sequence pack -> AI system -> review
 * type -> rollout class -> org default), replayed against a hypothetical
 * context. It is a single-context, read-only preview — not a general
 * "what happens if..." engine. Nothing is created, blocked, or scheduled.
 */
export function GuardrailResolutionSimulator() {
  const aiSystems = useQuery({ queryKey: ["ai-systems"], queryFn: () => getAiSystems() });

  const [selectedSystemIds, setSelectedSystemIds] = useState<string[]>([]);
  const [reviewType, setReviewType] = useState<GuardrailReviewType | "">("");
  const [rolloutClass, setRolloutClass] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PolicyResolutionSimulationResponse | null>(null);

  function toggleSystem(id: string) {
    setSelectedSystemIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function runSimulation() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const response = await simulatePolicyResolution({
        title: "Manual guardrail resolution simulation",
        persist_report: false,
        contexts: [
          {
            context_key: "manual-simulation",
            ai_system_ids: selectedSystemIds.length ? selectedSystemIds : null,
            review_types: reviewType ? [reviewType] : null,
            rollout_class: rolloutClass.trim() || null
          }
        ]
      });
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Simulation failed.");
    } finally {
      setBusy(false);
    }
  }

  const context = result?.contexts[0] ?? null;
  const resolutionSource = context?.policy_resolution.resolution_source ?? null;
  const blocked = context?.guardrail_resolution.blocked ?? false;

  return (
    <SectionCard
      title="Guardrail Policy-Resolution Simulation"
      subtitle="Real backend simulator — deterministic precedence replay, read-only"
      icon={ShieldHalf}
      accent="purple"
    >
      <div className="space-y-4">
        <p className="text-[13px] leading-relaxed text-cv-slate">
          This runs the backend&apos;s actual guardrail policy-resolution logic against a hypothetical context
          (which AI system, review type, rollout class) and reports which guardrail policy set would apply and
          whether it would block or warn — the same precedence walk used for real reviews, but non-executing. It
          does not create a review, sequence run, or policy change.
        </p>

        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wide text-cv-slate">AI system(s) in scope</label>
          {aiSystems.isLoading ? (
            <SkeletonRows rows={2} />
          ) : aiSystems.isError ? (
            <ErrorState compact title="Could not load AI systems" onRetry={() => aiSystems.refetch()} />
          ) : !aiSystems.data?.length ? (
            <EmptyState compact title="No AI systems registered" description="Register an AI system first to scope a simulation to it." />
          ) : (
            <div className="flex max-h-40 flex-col gap-1.5 overflow-y-auto rounded-xl bg-white/50 p-2.5 ring-1 ring-white/60">
              {aiSystems.data.map((sys) => (
                <label key={sys.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 text-[13px] text-cv-ink hover:bg-white/70">
                  <input
                    type="checkbox"
                    checked={selectedSystemIds.includes(sys.id)}
                    onChange={() => toggleSystem(sys.id)}
                    className="cv-ring-focus h-3.5 w-3.5 rounded border-cv-mist"
                  />
                  <span className="font-medium">{sys.name}</span>
                  <span className="text-cv-mist">· {sys.system_type}</span>
                </label>
              ))}
            </div>
          )}
          <p className="text-[11px] text-cv-mist">Leave unchecked to simulate an org-wide context with no specific AI system.</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wide text-cv-slate">Review type</label>
            <select
              value={reviewType}
              onChange={(e) => setReviewType(e.target.value as GuardrailReviewType | "")}
              aria-label="Review type"
              className="cv-ring-focus w-full rounded-xl bg-white/60 px-3.5 py-2.5 text-[13px] font-medium text-cv-ink ring-1 ring-white/70 focus:outline-none"
            >
              <option value="">(any)</option>
              {GUARDRAIL_REVIEW_TYPES.map((rt) => (
                <option key={rt} value={rt}>
                  {rt.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wide text-cv-slate">Rollout class</label>
            <input
              value={rolloutClass}
              onChange={(e) => setRolloutClass(e.target.value)}
              placeholder="e.g. standard, canary"
              className="cv-ring-focus w-full rounded-xl bg-white/60 px-3.5 py-2.5 text-[13px] font-medium text-cv-ink ring-1 ring-white/70 placeholder:text-cv-mist focus:outline-none"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={runSimulation}
          disabled={busy}
          className="cv-ring-focus inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-cv-brand px-4 py-2.5 text-[13px] font-bold text-white shadow-tile transition hover:opacity-90 disabled:opacity-60"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <ShieldHalf size={14} />}
          Run resolution simulation
        </button>

        {error ? (
          <p className="flex items-start gap-1.5 text-[12px] font-medium text-rose-600">
            <TriangleAlert size={13} className="mt-0.5 shrink-0" />
            {error}
          </p>
        ) : null}

        {context ? (
          <div className="space-y-3 rounded-xl bg-white/50 px-3.5 py-3 ring-1 ring-white/60">
            <div className="flex items-center gap-2">
              {blocked ? (
                <Ban size={15} className="text-rose-500" />
              ) : resolutionSource === "none" ? (
                <Info size={15} className="text-amber-500" />
              ) : (
                <CheckCircle2 size={15} className="text-emerald-500" />
              )}
              <p className="text-[13px] font-bold text-cv-ink">
                {blocked
                  ? "Guardrail would block this context"
                  : resolutionSource === "none"
                    ? "No guardrail policy resolves for this context"
                    : `Resolved via: ${resolutionSource}`}
              </p>
            </div>

            {resolutionSource === "none" ? (
              <p className="text-[12px] leading-relaxed text-cv-slate">
                No guardrail policy set is assigned to a scope that matches this context (AI system, sequence pack,
                review type, rollout class, or org-wide default). This is a real, honest result — it reflects the
                organization&apos;s current guardrail assignments, not a fabricated outcome.
              </p>
            ) : (
              <p className="text-[12px] leading-relaxed text-cv-slate">
                Resolved policy set: <span className="font-mono text-[11px]">{context.policy_resolution.resolved_policy_set_id}</span>
                {" · "}Enforcement level: <span className="font-semibold">{context.guardrail_resolution.resolution.enforcement_level}</span>
              </p>
            )}

            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wide text-cv-slate">Precedence trace</p>
              <ol className="space-y-1">
                {context.precedence_trace.map((step, i) => (
                  <li key={i} className="flex items-center justify-between rounded-lg bg-white/60 px-2.5 py-1.5 text-[11px]">
                    <span className="font-medium text-cv-ink">{String(step.scope_type)}</span>
                    <span className={step.matched ? "font-semibold text-emerald-600" : "text-cv-mist"}>
                      {step.matched ? "matched" : "no match"}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <p className="text-[11px] italic leading-relaxed text-cv-mist">{context.caveat}</p>
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
}
