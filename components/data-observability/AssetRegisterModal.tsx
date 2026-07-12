"use client";

import { useState, type FormEvent } from "react";
import { Database, TriangleAlert } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/lib/api/client";
import { ASSET_TYPES, CLASSIFICATION_TYPES, SENSITIVITY_TIERS } from "@/lib/api/data-observability";
import { useCreateDataAsset, useOrgUsersForOwnerPicker } from "@/lib/hooks/useDataObservability";

const inputCls =
  "w-full rounded-2xl bg-white/60 px-3.5 py-2.5 text-sm text-cv-ink ring-1 ring-white/70 placeholder:text-cv-mist focus:outline-none focus:ring-2 focus:ring-cv-blue/40";
const labelCls = "mb-1.5 block text-xs font-bold text-cv-slate";

/** Register a data asset via POST /api/v1/data-observability/assets. */
export function AssetRegisterModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const users = useOrgUsersForOwnerPicker();
  const create = useCreateDataAsset();

  const [name, setName] = useState("");
  const [assetType, setAssetType] = useState<string>("database");
  const [ownerId, setOwnerId] = useState("");
  const [description, setDescription] = useState("");
  const [sensitivityTier, setSensitivityTier] = useState("");
  const [classificationType, setClassificationType] = useState("");
  const [sourceSystem, setSourceSystem] = useState("");
  const [isPhi, setIsPhi] = useState(false);

  const reset = () => {
    setName("");
    setAssetType("database");
    setOwnerId("");
    setDescription("");
    setSensitivityTier("");
    setClassificationType("");
    setSourceSystem("");
    setIsPhi(false);
    create.reset();
  };

  const close = () => {
    reset();
    onClose();
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    create.mutate(
      {
        name: name.trim(),
        asset_type: assetType,
        owner_id: ownerId,
        description: description.trim() || null,
        sensitivity_tier: sensitivityTier || null,
        classification_type: classificationType || null,
        source_system: sourceSystem.trim() || null,
        is_phi: isPhi
      },
      { onSuccess: close }
    );
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Register data asset"
      subtitle="Creates a real asset record in the data-observability inventory"
      icon={Database}
      accent="cyan"
      widthClassName="max-w-xl"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="asset-name" className={labelCls}>
              Name *
            </label>
            <input
              id="asset-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. customers_prod (PostgreSQL)"
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="asset-type" className={labelCls}>
              Asset type *
            </label>
            <select id="asset-type" value={assetType} onChange={(e) => setAssetType(e.target.value)} className={inputCls}>
              {ASSET_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="asset-owner" className={labelCls}>
              Owner *
            </label>
            <select id="asset-owner" required value={ownerId} onChange={(e) => setOwnerId(e.target.value)} className={inputCls}>
              <option value="" disabled>
                {users.isLoading ? "Loading members..." : users.isError ? "Could not load members" : "Select owner"}
              </option>
              {(users.data ?? []).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name || u.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="asset-tier" className={labelCls}>
              Sensitivity tier
            </label>
            <select id="asset-tier" value={sensitivityTier} onChange={(e) => setSensitivityTier(e.target.value)} className={inputCls}>
              <option value="">Not set</option>
              {SENSITIVITY_TIERS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="asset-class" className={labelCls}>
              Classification
            </label>
            <select
              id="asset-class"
              value={classificationType}
              onChange={(e) => setClassificationType(e.target.value)}
              className={inputCls}
            >
              <option value="">Not classified</option>
              {CLASSIFICATION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="asset-source" className={labelCls}>
              Source system
            </label>
            <input
              id="asset-source"
              type="text"
              value={sourceSystem}
              onChange={(e) => setSourceSystem(e.target.value)}
              placeholder="e.g. AWS RDS eu-west-1"
              className={inputCls}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="asset-desc" className={labelCls}>
              Description
            </label>
            <textarea
              id="asset-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this asset store, and for which product area?"
              className={inputCls}
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-cv-slate sm:col-span-2">
            <input type="checkbox" checked={isPhi} onChange={(e) => setIsPhi(e.target.checked)} className="h-4 w-4 accent-blue-600" />
            Contains protected health information (PHI)
          </label>
        </div>

        {create.isError ? (
          <div className="flex items-start gap-2 rounded-2xl bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-600 ring-1 ring-rose-400/25">
            <TriangleAlert size={14} className="mt-0.5 shrink-0" />
            <span>{create.error instanceof ApiError ? create.error.message : "Failed to register the asset."}</span>
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={close}
            className="cv-ring-focus rounded-full bg-white/70 px-4 py-2 text-xs font-semibold text-cv-ink ring-1 ring-white/70 transition hover:bg-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={create.isPending || !name.trim() || !ownerId}
            className="cv-ring-focus rounded-full bg-cv-brand px-5 py-2 text-xs font-bold text-white shadow-button transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {create.isPending ? "Registering..." : "Register asset"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
