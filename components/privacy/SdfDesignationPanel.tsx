"use client";

import { useState } from "react";
import { Landmark, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { suggestSdfDesignation, confirmSdfDesignation, type SdfSuggestion } from "@/lib/api/privacy";
import { useHasPermission } from "@/lib/hooks/usePermissions";

/**
 * SDF designation workflow (DPDP Rules 2025, Rule 13):
 * backend heuristic suggestion → human confirmation, never auto-designation.
 */
export function SdfDesignationPanel() {
  const canConfirmSdf = useHasPermission("org:update");
  const [suggestion, setSuggestion] = useState<SdfSuggestion | null>(null);
  const [busy, setBusy] = useState<"suggest" | "confirm" | null>(null);
  const [confirmed, setConfirmed] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSuggest() {
    setBusy("suggest");
    setError(null);
    setConfirmed(null);
    try {
      setSuggestion(await suggestSdfDesignation());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Suggestion failed.");
    } finally {
      setBusy(null);
    }
  }

  async function handleConfirm(value: boolean) {
    setBusy("confirm");
    setError(null);
    try {
      await confirmSdfDesignation({ confirmed_value: value });
      setConfirmed(value);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Confirmation failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <SectionCard
      title="SDF Designation"
      subtitle="Significant Data Fiduciary assessment — heuristic signal, human decision"
      icon={Landmark}
      accent="amber"
      className="h-full"
    >
      <div className="space-y-3">
        <button
          type="button"
          onClick={handleSuggest}
          disabled={busy != null}
          className="cv-ring-focus inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-cv-brand px-4 py-2.5 text-[13px] font-bold text-white shadow-tile transition hover:opacity-90 disabled:opacity-60"
        >
          {busy === "suggest" ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          Run assessment
        </button>

        {suggestion ? (
          <div className="rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] font-semibold text-cv-ink">
                Suggestion: {suggestion.suggested_sdf ? "Likely SDF" : "Below SDF signal threshold"}
              </p>
              <StatusBadge
                label={`${suggestion.sensitive_asset_count}/${suggestion.total_asset_count} sensitive assets`}
                tone={suggestion.suggested_sdf ? "warn" : "neutral"}
              />
            </div>
            {suggestion.rationale ? (
              <p className="mt-1.5 text-[11px] leading-relaxed text-cv-slate">{suggestion.rationale}</p>
            ) : null}
            <div className="mt-3 flex gap-2">
              {canConfirmSdf ? (
                <button
                  type="button"
                  data-testid="confirm-sdf"
                  onClick={() => handleConfirm(true)}
                  disabled={busy != null}
                  className="cv-ring-focus flex-1 rounded-lg bg-amber-500/15 px-3 py-2 text-[12px] font-bold text-amber-700 ring-1 ring-amber-400/30 transition hover:bg-amber-500/25 disabled:opacity-60"
                >
                  Confirm as SDF
                </button>
              ) : null}
              {canConfirmSdf ? (
                <button
                  type="button"
                  data-testid="confirm-not-sdf"
                  onClick={() => handleConfirm(false)}
                  disabled={busy != null}
                  className="cv-ring-focus flex-1 rounded-lg bg-white/70 px-3 py-2 text-[12px] font-bold text-cv-ink ring-1 ring-white/70 transition hover:bg-white disabled:opacity-60"
                >
                  Confirm not SDF
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {confirmed != null ? (
          <p className="flex items-center gap-1.5 text-[12px] font-medium text-emerald-600">
            <CheckCircle2 size={13} /> Designation recorded: {confirmed ? "Significant Data Fiduciary" : "not an SDF"}.
          </p>
        ) : null}
        {error ? <p className="text-[12px] font-medium text-rose-600">{error}</p> : null}
      </div>
    </SectionCard>
  );
}
