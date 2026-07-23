"use client";

import { useMemo, useState } from "react";
import { Loader2, SlidersHorizontal } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/lib/api/client";
import { EntitlementBanner } from "@/components/common/EntitlementBanner";
import {
  RISK_APPETITE_CATEGORIES,
  type AppetiteThresholdCreatePayload,
  type RiskAppetiteCategory
} from "@/lib/api/risk-appetite";
import { useCreateAppetiteThreshold } from "@/lib/hooks/useRiskAppetite";
import { useOrgUsers } from "@/lib/hooks/useRisks";

const inputBase =
  "w-full rounded-2xl bg-white/65 px-3.5 py-2.5 text-sm text-cv-ink placeholder:text-cv-mist ring-1 ring-white/70 transition focus:outline-none focus:ring-2 focus:ring-cv-blue/45";
const labelBase = "mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-cv-slate";

function prettify(v: string) {
  return v.replaceAll("_", " ");
}

/**
 * Create form for POST /api/v1/compliance/risk-appetite (perm risk_appetite:write).
 * Scope is kept simple: org-wide (scope_type "org", scope_id null). risk_category
 * is the CLOSED 7-value enum (server rejects others with 422).
 */
export function AppetiteThresholdModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateAppetiteThreshold();
  const users = useOrgUsers();

  const [category, setCategory] = useState<RiskAppetiteCategory>("operational");
  const [maxScore, setMaxScore] = useState("12");
  const [escalationOwnerId, setEscalationOwnerId] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const err = create.error instanceof ApiError ? create.error : null;

  const activeUsers = useMemo(
    () => (users.data ?? []).filter((u) => u.is_active && u.status === "active"),
    [users.data]
  );

  function resetAndClose() {
    setCategory("operational");
    setMaxScore("12");
    setEscalationOwnerId("");
    setNotes("");
    setFormError(null);
    create.reset();
    onClose();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const score = Number(maxScore);
    if (!Number.isInteger(score) || score < 1 || score > 25) {
      setFormError("Max acceptable score must be a whole number between 1 and 25.");
      return;
    }
    if (!escalationOwnerId) {
      setFormError("Select an escalation owner.");
      return;
    }

    const body: AppetiteThresholdCreatePayload = {
      scope_type: "org",
      scope_id: null,
      risk_category: category,
      max_acceptable_score: score,
      escalation_owner_id: escalationOwnerId,
      notes: notes.trim() || null
    };
    try {
      await create.mutateAsync(body);
      resetAndClose();
    } catch {
      // error surfaced below via create.error
    }
  }

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title="New Appetite Threshold"
      subtitle="Set the maximum acceptable risk score for a category"
      icon={SlidersHorizontal}
      accent="purple"
      widthClassName="max-w-lg"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="appetite-category" className={labelBase}>
              Risk category
            </label>
            <select
              id="appetite-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as RiskAppetiteCategory)}
              className={inputBase}
            >
              {RISK_APPETITE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {prettify(c)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="appetite-score" className={labelBase}>
              Max acceptable score <span className="font-medium normal-case tracking-normal text-cv-mist">(1–25)</span>
            </label>
            <input
              id="appetite-score"
              type="number"
              min={1}
              max={25}
              step={1}
              value={maxScore}
              onChange={(e) => setMaxScore(e.target.value)}
              className={inputBase}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="appetite-owner" className={labelBase}>
              Escalation owner
            </label>
            <select
              id="appetite-owner"
              value={escalationOwnerId}
              onChange={(e) => setEscalationOwnerId(e.target.value)}
              className={inputBase}
            >
              <option value="">Select owner…</option>
              {activeUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name || u.email}
                </option>
              ))}
            </select>
            {users.isSuccess && activeUsers.length === 0 ? (
              <p className="mt-1 text-[11px] text-cv-mist">No active members to assign.</p>
            ) : null}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="appetite-notes" className={labelBase}>
              Notes <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
            </label>
            <textarea
              id="appetite-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className={inputBase}
            />
          </div>
        </div>

        <p className="rounded-2xl bg-blue-500/10 px-3.5 py-2.5 text-[11px] leading-relaxed text-blue-700 ring-1 ring-blue-400/20">
          Thresholds are scoped org-wide. Score is on the 1–25 (likelihood × impact) risk scale.
        </p>

        {formError ? (
          <p className="rounded-2xl bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-600 ring-1 ring-rose-400/25">
            {formError}
          </p>
        ) : null}
        <EntitlementBanner error={err} />

        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={resetAndClose}
            className="cv-ring-focus rounded-full bg-white/70 px-4 py-2 text-xs font-semibold text-cv-ink ring-1 ring-white/70 transition hover:bg-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={create.isPending}
            className="cv-ring-focus inline-flex items-center gap-2 rounded-full bg-cv-brand px-4 py-2 text-xs font-bold text-white shadow-button transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {create.isPending ? <Loader2 size={13} className="animate-spin" /> : null}
            Create threshold
          </button>
        </div>
      </form>
    </Modal>
  );
}
