"use client";

import { useEffect, useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils/cn";
import { DATA_INCIDENT_SEVERITIES, type DataAsset } from "@/lib/api/data-observability";
import { ApiError } from "@/lib/api/client";
import { useCreateDataIncident } from "@/lib/hooks/useIncidentsPage";

const labelCls = "text-[11px] font-bold uppercase tracking-[0.12em] text-cv-slate";
const inputCls =
  "cv-ring-focus w-full rounded-xl bg-white/60 px-3.5 py-2.5 text-sm text-cv-ink ring-1 ring-white/70 placeholder:text-cv-mist focus:outline-none";
const selectCls =
  "cv-ring-focus w-full rounded-xl bg-white/60 px-3 py-2.5 text-sm font-medium text-cv-ink ring-1 ring-white/70 focus:outline-none";

function prettify(v: string) {
  return v.replaceAll("_", " ");
}

type Props = {
  open: boolean;
  onClose: () => void;
  assets: DataAsset[];
};

/**
 * POST /api/v1/data-observability/incidents — manual data-incident creation.
 * data_asset_id is required by the backend, so this modal only opens data
 * incidents against real registered assets (the asset picker sources from
 * the live /assets endpoint; if there are none, we say so instead of faking it).
 */
export function DataIncidentCreateModal({ open, onClose, assets }: Props) {
  const createIncident = useCreateDataIncident();

  const [assetId, setAssetId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<string>("medium");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    createIncident.reset();
    setAssetId(assets[0]?.id ?? "");
    setTitle("");
    setDescription("");
    setSeverity("medium");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await createIncident.mutateAsync({
        data_asset_id: assetId,
        title,
        description,
        severity,
        detector_type: "manual",
        detected_by: "manual"
      });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Request failed — the backend may be unavailable.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Report Data Incident"
      subtitle="Manually opens a data-observability incident against a registered asset"
      icon={ShieldAlert}
      accent="red"
    >
      {assets.length === 0 ? (
        <p className="rounded-xl bg-amber-400/10 px-3.5 py-3 text-xs font-semibold text-amber-700 ring-1 ring-amber-400/25">
          No data assets are registered yet. Register an asset on the Data Observability page before opening an incident
          against it — the backend requires a valid data_asset_id.
        </p>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="incident-asset" className={labelCls}>
              Data asset
            </label>
            <select id="incident-asset" value={assetId} onChange={(e) => setAssetId(e.target.value)} required className={selectCls}>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="incident-title" className={labelCls}>
              Title
            </label>
            <input
              id="incident-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={1}
              maxLength={255}
              placeholder="e.g. Unusual bulk export from customer PII table"
              className={inputCls}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="incident-description" className={labelCls}>
              Description
            </label>
            <textarea
              id="incident-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              minLength={1}
              rows={3}
              placeholder="What was detected, when, and why it matters…"
              className={cn(inputCls, "resize-y")}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="incident-severity" className={labelCls}>
              Severity
            </label>
            <select id="incident-severity" value={severity} onChange={(e) => setSeverity(e.target.value)} className={selectCls}>
              {DATA_INCIDENT_SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {prettify(s)}
                </option>
              ))}
            </select>
          </div>

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
              Cancel
            </button>
            <button
              type="submit"
              disabled={createIncident.isPending}
              className="cv-ring-focus inline-flex items-center gap-2 rounded-full bg-cv-brand px-5 py-2 text-[13px] font-semibold text-white shadow-tile transition hover:opacity-90 disabled:opacity-60"
            >
              {createIncident.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
              Report incident
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
