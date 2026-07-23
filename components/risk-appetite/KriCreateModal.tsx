"use client";

import { useMemo, useState } from "react";
import { Loader2, Gauge } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/lib/api/client";
import { EntitlementBanner } from "@/components/common/EntitlementBanner";
import { KRI_METRIC_TYPES, type KriCreatePayload, type KriMetricType } from "@/lib/api/risk-appetite";
import { useCreateKri } from "@/lib/hooks/useRiskAppetite";
import { useOrgUsers } from "@/lib/hooks/useRisks";

const inputBase =
  "w-full rounded-2xl bg-white/65 px-3.5 py-2.5 text-sm text-cv-ink placeholder:text-cv-mist ring-1 ring-white/70 transition focus:outline-none focus:ring-2 focus:ring-cv-blue/45";
const labelBase = "mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-cv-slate";

function prettify(v: string) {
  return v.replaceAll("_", " ");
}

/** Create form for POST /api/v1/compliance/risk-indicators (perm risk_indicators:write). */
export function KriCreateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateKri();
  const users = useOrgUsers();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [metricType, setMetricType] = useState<KriMetricType>("control_expiry_rate");
  const [targetValue, setTargetValue] = useState("0");
  const [warningThreshold, setWarningThreshold] = useState("5");
  const [criticalThreshold, setCriticalThreshold] = useState("10");
  const [ownerId, setOwnerId] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const err = create.error instanceof ApiError ? create.error : null;

  // Backend requires the owner to be an ACTIVE org member.
  const activeUsers = useMemo(
    () => (users.data ?? []).filter((u) => u.is_active && u.status === "active"),
    [users.data]
  );

  function resetAndClose() {
    setName("");
    setDescription("");
    setMetricType("control_expiry_rate");
    setTargetValue("0");
    setWarningThreshold("5");
    setCriticalThreshold("10");
    setOwnerId("");
    setNotes("");
    setFormError(null);
    create.reset();
    onClose();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (name.trim().length < 3) {
      setFormError("Give the indicator a name (at least 3 characters).");
      return;
    }
    if (!ownerId) {
      setFormError("Select an owner for this indicator.");
      return;
    }
    const target = Number(targetValue);
    const warn = Number(warningThreshold);
    const crit = Number(criticalThreshold);
    if ([target, warn, crit].some((n) => Number.isNaN(n))) {
      setFormError("Target, warning, and critical must be numbers.");
      return;
    }
    // Mirror the backend rule (400 otherwise) so we fail fast client-side.
    if (warn >= crit) {
      setFormError("Warning threshold must be less than the critical threshold.");
      return;
    }

    const body: KriCreatePayload = {
      name: name.trim(),
      description: description.trim() || null,
      metric_type: metricType,
      target_value: target,
      warning_threshold: warn,
      critical_threshold: crit,
      owner_user_id: ownerId,
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
      title="New Key Risk Indicator"
      subtitle="Define a metric with warning + critical thresholds"
      icon={Gauge}
      accent="teal"
      widthClassName="max-w-xl"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="kri-name" className={labelBase}>
              Name
            </label>
            <input
              id="kri-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={255}
              placeholder="e.g. Overdue control tests"
              className={inputBase}
            />
          </div>

          <div>
            <label htmlFor="kri-metric" className={labelBase}>
              Metric type
            </label>
            <select
              id="kri-metric"
              value={metricType}
              onChange={(e) => setMetricType(e.target.value as KriMetricType)}
              className={inputBase}
            >
              {KRI_METRIC_TYPES.map((m) => (
                <option key={m} value={m}>
                  {prettify(m)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="kri-owner" className={labelBase}>
              Owner
            </label>
            <select id="kri-owner" value={ownerId} onChange={(e) => setOwnerId(e.target.value)} className={inputBase}>
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

          <div>
            <label htmlFor="kri-target" className={labelBase}>
              Target value
            </label>
            <input
              id="kri-target"
              type="number"
              step="any"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              className={inputBase}
            />
          </div>

          <div />

          <div>
            <label htmlFor="kri-warning" className={labelBase}>
              Warning threshold
            </label>
            <input
              id="kri-warning"
              type="number"
              step="any"
              value={warningThreshold}
              onChange={(e) => setWarningThreshold(e.target.value)}
              className={inputBase}
            />
          </div>

          <div>
            <label htmlFor="kri-critical" className={labelBase}>
              Critical threshold
            </label>
            <input
              id="kri-critical"
              type="number"
              step="any"
              value={criticalThreshold}
              onChange={(e) => setCriticalThreshold(e.target.value)}
              className={inputBase}
            />
          </div>

          <p className="sm:col-span-2 -mt-1 text-[11px] text-cv-mist">
            Warning threshold must be less than the critical threshold.
          </p>

          <div className="sm:col-span-2">
            <label htmlFor="kri-description" className={labelBase}>
              Description <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
            </label>
            <textarea
              id="kri-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What this indicator measures"
              className={inputBase}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="kri-notes" className={labelBase}>
              Notes <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
            </label>
            <textarea
              id="kri-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className={inputBase}
            />
          </div>
        </div>

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
            Create indicator
          </button>
        </div>
      </form>
    </Modal>
  );
}
