"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link2, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/lib/api/client";
import { EntitlementBanner } from "@/components/common/EntitlementBanner";
import {
  CONTROL_TYPES,
  CONTROL_CRITICALITIES,
  OBLIGATION_MAPPING_TYPES,
  getControls,
  type ControlObligationMapInput
} from "@/lib/api/controls";
import {
  useActiveFrameworks,
  useFrameworkCoverage,
  useCreateControl,
  useMapControlToObligation
} from "@/lib/hooks/useControls";

const inputBase =
  "w-full rounded-2xl bg-white/65 px-3.5 py-2.5 text-sm text-cv-ink placeholder:text-cv-mist ring-1 ring-white/70 transition focus:outline-none focus:ring-2 focus:ring-cv-blue/45";

const labelBase = "mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-cv-slate";

function prettify(v: string) {
  return v.replaceAll("_", " ");
}

export type ObligationPreset = {
  frameworkId: string;
  obligationId: string;
  reference: string;
  title: string;
};

export type ControlPreset = {
  controlId: string;
  title: string;
  controlCode: string | null;
};

const NEW_CONTROL = "__new__";

/**
 * Maps a control to a framework obligation via
 * POST /api/v1/controls/{control_id}/obligations.
 *
 * Launched either from a coverage-gap row (obligation preset, pick/create the
 * control) or from a control-register row (control preset, pick the obligation
 * from a framework's coverage matrix).
 */
export function MapObligationModal({
  open,
  onClose,
  obligationPreset,
  controlPreset
}: {
  open: boolean;
  onClose: () => void;
  obligationPreset?: ObligationPreset | null;
  controlPreset?: ControlPreset | null;
}) {
  const [frameworkId, setFrameworkId] = useState("");
  const [obligationId, setObligationId] = useState("");
  const [controlId, setControlId] = useState("");
  const [mappingType, setMappingType] = useState<(typeof OBLIGATION_MAPPING_TYPES)[number]>("satisfies");
  const [rationale, setRationale] = useState("");
  // inline new-control fields (only when controlId === NEW_CONTROL)
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<(typeof CONTROL_TYPES)[number]>("technical");
  const [newCriticality, setNewCriticality] = useState<(typeof CONTROL_CRITICALITIES)[number]>("medium");
  const [formError, setFormError] = useState<string | null>(null);

  const effectiveFrameworkId = obligationPreset?.frameworkId ?? frameworkId;
  const effectiveObligationId = obligationPreset?.obligationId ?? obligationId;
  const creatingNewControl = !controlPreset && controlId === NEW_CONTROL;

  const frameworks = useActiveFrameworks(open && !obligationPreset);
  const coverage = useFrameworkCoverage(open && !obligationPreset ? effectiveFrameworkId || null : null);
  // Shares the controls page query key so the cached register is reused.
  const controls = useQuery({ queryKey: ["controls"], queryFn: () => getControls(), enabled: open && !controlPreset });

  const createControlMut = useCreateControl();
  const mapMut = useMapControlToObligation();

  const obligationOptions = useMemo(() => {
    const rows = (coverage.data?.sections ?? []).flatMap((s) => s.obligations);
    // uncovered first — that is the gap being closed
    return [...rows].sort((a, b) => {
      const rank = (st: string) => (st === "uncovered" ? 0 : st === "partial" ? 1 : 2);
      return rank(a.coverage_status) - rank(b.coverage_status) || a.reference.localeCompare(b.reference);
    });
  }, [coverage.data]);

  const err =
    createControlMut.error instanceof ApiError
      ? createControlMut.error
      : mapMut.error instanceof ApiError
        ? mapMut.error
        : null;
  const pending = createControlMut.isPending || mapMut.isPending;

  function resetAndClose() {
    setFrameworkId("");
    setObligationId("");
    setControlId("");
    setMappingType("satisfies");
    setRationale("");
    setNewTitle("");
    setNewType("technical");
    setNewCriticality("medium");
    setFormError(null);
    createControlMut.reset();
    mapMut.reset();
    onClose();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!effectiveObligationId) {
      setFormError(effectiveFrameworkId ? "Select the obligation to cover." : "Select a framework and obligation.");
      return;
    }
    let targetControlId = controlPreset?.controlId ?? controlId;
    if (!controlPreset && !controlId) {
      setFormError("Select an existing control or create a new one.");
      return;
    }
    if (creatingNewControl && newTitle.trim().length < 3) {
      setFormError("Give the new control a title (at least 3 characters).");
      return;
    }
    try {
      if (creatingNewControl) {
        const created = await createControlMut.mutateAsync({
          title: newTitle.trim(),
          control_type: newType,
          criticality: newCriticality
        });
        targetControlId = created.id;
      }
      const body: ControlObligationMapInput = {
        obligation_id: effectiveObligationId,
        mapping_type: mappingType,
        rationale: rationale.trim() || null
      };
      await mapMut.mutateAsync({ controlId: targetControlId, body });
      resetAndClose();
    } catch {
      // error surfaced below
    }
  }

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title="Map Control to Obligation"
      subtitle="Close a coverage gap by mapping a control that satisfies the obligation"
      icon={Link2}
      accent="amber"
      widthClassName="max-w-xl"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {obligationPreset ? (
            <div>
              <span className={labelBase}>Obligation</span>
              <div className="rounded-2xl bg-amber-500/10 px-3.5 py-2.5 ring-1 ring-amber-400/25">
                <p className="text-[13px] font-semibold text-cv-ink">
                  <span className="mr-1.5 text-amber-700">{obligationPreset.reference}</span>
                  {obligationPreset.title}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label htmlFor="map-framework" className={labelBase}>
                  Framework
                </label>
                <select
                  id="map-framework"
                  value={frameworkId}
                  onChange={(e) => {
                    setFrameworkId(e.target.value);
                    setObligationId("");
                  }}
                  className={inputBase}
                  disabled={frameworks.isLoading}
                >
                  <option value="">
                    {frameworks.isLoading
                      ? "Loading frameworks…"
                      : frameworks.isError
                        ? "Could not load frameworks"
                        : "Select an active framework…"}
                  </option>
                  {(frameworks.data ?? []).map((f) => (
                    <option key={f.framework_id} value={f.framework_id}>
                      {f.framework.name}
                      {f.active_obligation_count != null ? ` (${f.active_obligation_count} obligations)` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="map-obligation" className={labelBase}>
                  Obligation
                </label>
                <select
                  id="map-obligation"
                  value={obligationId}
                  onChange={(e) => setObligationId(e.target.value)}
                  className={inputBase}
                  disabled={!effectiveFrameworkId || coverage.isLoading}
                >
                  <option value="">
                    {!effectiveFrameworkId
                      ? "Pick a framework first…"
                      : coverage.isLoading
                        ? "Loading obligations…"
                        : coverage.isError
                          ? "Could not load coverage matrix"
                          : "Select an obligation…"}
                  </option>
                  {obligationOptions.map((o) => (
                    <option key={o.obligation_id} value={o.obligation_id}>
                      {o.reference} — {o.title} ({o.coverage_status}
                      {o.controls_count > 0 ? `, ${o.controls_count} controls` : ""})
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {controlPreset ? (
            <div>
              <span className={labelBase}>Control</span>
              <div className="rounded-2xl bg-blue-500/10 px-3.5 py-2.5 ring-1 ring-blue-400/30">
                <p className="text-[13px] font-semibold text-cv-ink">
                  {controlPreset.controlCode ? <span className="mr-1.5 text-cv-blue">{controlPreset.controlCode}</span> : null}
                  {controlPreset.title}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <label htmlFor="map-control" className={labelBase}>
                Control
              </label>
              <select
                id="map-control"
                value={controlId}
                onChange={(e) => setControlId(e.target.value)}
                className={inputBase}
                disabled={controls.isLoading}
              >
                <option value="">
                  {controls.isLoading
                    ? "Loading controls…"
                    : controls.isError
                      ? "Could not load controls"
                      : "Select an existing control…"}
                </option>
                {(controls.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.control_code ? `${c.control_code} — ` : ""}
                    {c.title} ({prettify(c.status)})
                  </option>
                ))}
                <option value={NEW_CONTROL}>+ Create a new control…</option>
              </select>
            </div>
          )}

          {creatingNewControl ? (
            <div className="grid grid-cols-1 gap-4 rounded-2xl bg-white/45 p-3.5 ring-1 ring-white/70 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="map-new-title" className={labelBase}>
                  New control title
                </label>
                <input
                  id="map-new-title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  maxLength={255}
                  placeholder="e.g. Quarterly review of processing purposes"
                  className={inputBase}
                />
              </div>
              <div>
                <label htmlFor="map-new-type" className={labelBase}>
                  Control type
                </label>
                <select
                  id="map-new-type"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as (typeof CONTROL_TYPES)[number])}
                  className={inputBase}
                >
                  {CONTROL_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {prettify(t)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="map-new-criticality" className={labelBase}>
                  Criticality
                </label>
                <select
                  id="map-new-criticality"
                  value={newCriticality}
                  onChange={(e) => setNewCriticality(e.target.value as (typeof CONTROL_CRITICALITIES)[number])}
                  className={inputBase}
                >
                  {CONTROL_CRITICALITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}

          <div>
            <label htmlFor="map-type" className={labelBase}>
              Mapping type
            </label>
            <select
              id="map-type"
              value={mappingType}
              onChange={(e) => setMappingType(e.target.value as (typeof OBLIGATION_MAPPING_TYPES)[number])}
              className={inputBase}
            >
              {OBLIGATION_MAPPING_TYPES.map((t) => (
                <option key={t} value={t}>
                  {prettify(t)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="map-rationale" className={labelBase}>
              Rationale <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
            </label>
            <textarea
              id="map-rationale"
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              rows={2}
              placeholder="Why this control satisfies the obligation"
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
            disabled={pending}
            className="cv-ring-focus inline-flex items-center gap-2 rounded-full bg-cv-brand px-4 py-2 text-xs font-bold text-white shadow-button transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {pending ? <Loader2 size={13} className="animate-spin" /> : null}
            Map control
          </button>
        </div>
      </form>
    </Modal>
  );
}
