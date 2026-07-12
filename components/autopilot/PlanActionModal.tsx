"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils/cn";
import { AUTOPILOT_PRIORITY_BANDS, type PriorityBand } from "@/lib/api/autopilot";
import { ApiError } from "@/lib/api/client";
import { useActionTemplates, useCreateIntent } from "@/lib/hooks/useAutopilot";

const labelCls = "text-[11px] font-bold uppercase tracking-[0.12em] text-cv-slate";
const inputCls =
  "cv-ring-focus w-full rounded-xl bg-white/60 px-3.5 py-2.5 text-sm text-cv-ink ring-1 ring-white/70 placeholder:text-cv-mist focus:outline-none";
const selectCls =
  "cv-ring-focus w-full rounded-xl bg-white/60 px-3 py-2.5 text-sm font-medium text-cv-ink ring-1 ring-white/70 focus:outline-none";

function prettify(v: string) {
  return v.replaceAll("_", " ");
}

/**
 * Plan a candidate action — POST /api/v1/ai-governance/autopilot/execution-intents
 * with source_type=candidate_action. Templates come from the backend's
 * deterministic catalog (GET /api/v1/ai-governance/actions/templates); the
 * resolved policy then decides planned / approval_required / blocked, so this
 * is the real entry point that feeds the whole pipeline with data.
 */
export function PlanActionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const templates = useActionTemplates();
  const createIntent = useCreateIntent();

  const [actionKey, setActionKey] = useState("");
  const [title, setTitle] = useState("");
  const [band, setBand] = useState<PriorityBand>("medium");
  const [automationAllowed, setAutomationAllowed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ status: string; blockedReasons: string[]; autoExecuted: boolean } | null>(
    null
  );

  const list = templates.data?.templates ?? [];
  const selected = useMemo(() => list.find((t) => t.action_key === actionKey) ?? null, [list, actionKey]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setResult(null);
    createIntent.reset();
    setActionKey("");
    setTitle("");
    setBand("medium");
    setAutomationAllowed(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Seed band/title from the chosen template's backend defaults.
  useEffect(() => {
    if (!selected) return;
    setBand(selected.default_priority_band as PriorityBand);
    setTitle(selected.title);
  }, [selected]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setError(null);
    setResult(null);
    try {
      const intent = await createIntent.mutateAsync({
        action_key: selected.action_key,
        action_type: selected.action_type,
        priority_band: band,
        source_reason_codes: selected.source_reason_codes,
        title: title || selected.title,
        automation_allowed: automationAllowed
      });
      setResult({
        status: intent.intent_status,
        blockedReasons: intent.blocked_reasons_json ?? [],
        // The backend auto-executes eligible low-risk actions synchronously; a
        // "planned" intent submitted with automation_allowed may carry an
        // auto_execute verdict or an already-created execution.
        autoExecuted: Boolean(
          intent.plan_payload_json?.auto_execute === undefined &&
            automationAllowed &&
            intent.intent_status === "planned"
        )
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Request failed — the backend may be unavailable.");
    }
  };

  const statusTone = result
    ? result.status === "planned"
      ? ("good" as const)
      : result.status === "approval_required"
        ? ("warn" as const)
        : ("bad" as const)
    : ("neutral" as const);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Plan Candidate Action"
      subtitle="Creates a real execution intent evaluated against the resolved guardrail policy"
      icon={Sparkles}
      accent="purple"
      widthClassName="max-w-xl"
    >
      {templates.isLoading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-cv-slate">
          <Loader2 size={15} className="animate-spin" /> Loading action catalog…
        </div>
      ) : templates.isError ? (
        <p role="alert" className="rounded-xl bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-600 ring-1 ring-rose-400/25">
          Unable to load the backend action catalog (GET /api/v1/ai-governance/actions/templates).
        </p>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pa-template" className={labelCls}>
              Action template
            </label>
            <select
              id="pa-template"
              value={actionKey}
              onChange={(e) => setActionKey(e.target.value)}
              required
              className={selectCls}
            >
              <option value="" disabled>
                Choose from the deterministic catalog…
              </option>
              {list.map((t) => (
                <option key={t.action_key} value={t.action_key}>
                  {t.title} ({prettify(t.action_type)})
                </option>
              ))}
            </select>
            {selected ? <p className="text-[11px] leading-snug text-cv-mist">{selected.description}</p> : null}
          </div>

          {selected ? (
            <>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="pa-title" className={labelCls}>
                  Title
                </label>
                <input
                  id="pa-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  maxLength={255}
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="pa-band" className={labelCls}>
                    Priority band
                  </label>
                  <select
                    id="pa-band"
                    value={band}
                    onChange={(e) => setBand(e.target.value as PriorityBand)}
                    className={selectCls}
                  >
                    {AUTOPILOT_PRIORITY_BANDS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className={labelCls}>Signal reason codes</span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selected.source_reason_codes.map((c) => (
                      <StatusBadge key={c} label={prettify(c)} tone="neutral" />
                    ))}
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-2.5 text-[13px] font-semibold text-cv-ink">
                <input
                  type="checkbox"
                  checked={automationAllowed}
                  onChange={(e) => setAutomationAllowed(e.target.checked)}
                  className="cv-ring-focus mt-0.5 h-4 w-4 rounded accent-cv-blue"
                />
                <span>
                  Mark automation-allowed
                  <span className="block text-[11px] font-medium text-cv-slate">
                    Low-risk actions may genuinely auto-execute (reversibly, audited) if the org has opted in and the
                    policy allows it. Leave off to keep this a human-approval suggestion.
                  </span>
                </span>
              </label>
            </>
          ) : null}

          {result ? (
            <div
              role="status"
              className="flex flex-col gap-1.5 rounded-xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70"
              data-testid="plan-result"
            >
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-bold text-cv-ink">Intent created:</span>
                <StatusBadge label={prettify(result.status)} tone={statusTone} />
              </div>
              {result.blockedReasons.length > 0 ? (
                <p className="text-[11px] text-cv-slate">Blocked by policy: {result.blockedReasons.map(prettify).join(", ")}</p>
              ) : null}
              <p className="text-[11px] text-cv-mist">
                Find it in the Execution Intents table below — request approval from there if required.
              </p>
            </div>
          ) : null}

          {error ? (
            <p role="alert" className="rounded-xl bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-600 ring-1 ring-rose-400/25">
              {error}
            </p>
          ) : null}

          <div className="mt-1 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="cv-ring-focus rounded-full bg-white/60 px-4 py-2 text-[13px] font-semibold text-cv-slate ring-1 ring-white/70 transition hover:bg-white hover:text-cv-ink"
            >
              {result ? "Done" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={createIntent.isPending || !selected}
              className={cn(
                "cv-ring-focus inline-flex items-center gap-2 rounded-full bg-cv-brand px-5 py-2 text-[13px] font-semibold text-white shadow-tile transition hover:opacity-90 disabled:opacity-60"
              )}
            >
              {createIntent.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
              Plan action
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
