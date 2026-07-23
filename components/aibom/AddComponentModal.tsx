"use client";

import { useState } from "react";
import { Loader2, PackagePlus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/lib/api/client";
import { EntitlementBanner } from "@/components/common/EntitlementBanner";
import {
  AIBOM_COMPONENT_TYPES,
  AIBOM_COMPONENT_TYPE_LABELS,
  type AibomComponentCreate,
  type AibomComponentType
} from "@/lib/api/aibom";
import { useAddAibomComponent } from "@/lib/hooks/useAibom";

const inputBase =
  "w-full rounded-2xl bg-white/65 px-3.5 py-2.5 text-sm text-cv-ink placeholder:text-cv-mist ring-1 ring-white/70 transition focus:outline-none focus:ring-2 focus:ring-cv-blue/45";

const labelBase = "mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-cv-slate";

/** Add-component form for POST .../aibom/components (409 on duplicate type+name). */
export function AddComponentModal({
  open,
  onClose,
  systemId
}: {
  open: boolean;
  onClose: () => void;
  systemId: string | null;
}) {
  const add = useAddAibomComponent(systemId);

  const [componentType, setComponentType] = useState<AibomComponentType>("base_model");
  const [name, setName] = useState("");
  const [version, setVersion] = useState("");
  const [source, setSource] = useState("");
  const [licenseType, setLicenseType] = useState("");
  const [isThirdParty, setIsThirdParty] = useState(false);
  const [riskNotes, setRiskNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const err = add.error instanceof ApiError ? add.error : null;
  const isDuplicate = err?.status === 409;

  function resetAndClose() {
    setComponentType("base_model");
    setName("");
    setVersion("");
    setSource("");
    setLicenseType("");
    setIsThirdParty(false);
    setRiskNotes("");
    setFormError(null);
    add.reset();
    onClose();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (name.trim().length < 2) {
      setFormError("Give the component a name (at least 2 characters).");
      return;
    }
    const body: AibomComponentCreate = {
      component_type: componentType,
      name: name.trim(),
      version: version.trim() || null,
      source: source.trim() || null,
      license_type: licenseType.trim() || null,
      is_third_party: isThirdParty,
      risk_notes: riskNotes.trim() || null
    };
    try {
      await add.mutateAsync(body);
      resetAndClose();
    } catch {
      // error surfaced below via add.error
    }
  }

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title="Add component"
      subtitle="Record a component on this AI system's latest BOM"
      icon={PackagePlus}
      accent="purple"
      widthClassName="max-w-xl"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="aibom-type" className={labelBase}>
              Component type
            </label>
            <select
              id="aibom-type"
              value={componentType}
              onChange={(e) => setComponentType(e.target.value as AibomComponentType)}
              className={inputBase}
            >
              {AIBOM_COMPONENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {AIBOM_COMPONENT_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="aibom-name" className={labelBase}>
              Name
            </label>
            <input
              id="aibom-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={255}
              placeholder="e.g. GPT-4o, llama-3-70b, imagenet-2012"
              className={inputBase}
            />
          </div>

          <div>
            <label htmlFor="aibom-version" className={labelBase}>
              Version <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
            </label>
            <input
              id="aibom-version"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              maxLength={120}
              placeholder="e.g. 2024-08, v1.3.0"
              className={inputBase}
            />
          </div>

          <div>
            <label htmlFor="aibom-license" className={labelBase}>
              License <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
            </label>
            <input
              id="aibom-license"
              value={licenseType}
              onChange={(e) => setLicenseType(e.target.value)}
              maxLength={120}
              placeholder="e.g. Apache-2.0, proprietary"
              className={inputBase}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="aibom-source" className={labelBase}>
              Source <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
            </label>
            <input
              id="aibom-source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              maxLength={255}
              placeholder="e.g. OpenAI API, Hugging Face, internal data lake"
              className={inputBase}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="aibom-risk" className={labelBase}>
              Risk notes <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
            </label>
            <textarea
              id="aibom-risk"
              value={riskNotes}
              onChange={(e) => setRiskNotes(e.target.value)}
              rows={2}
              placeholder="Provenance, licensing, or data-sensitivity concerns for this component"
              className={inputBase}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-cv-ink">
              <input
                type="checkbox"
                checked={isThirdParty}
                onChange={(e) => setIsThirdParty(e.target.checked)}
                className="h-4 w-4 rounded border-white/70 text-cv-brand focus:ring-cv-blue/45"
              />
              <span className="font-semibold">Third-party component</span>
              <span className="text-xs text-cv-slate">(supplied or hosted outside your organization)</span>
            </label>
          </div>
        </div>

        {formError ? (
          <p className="rounded-2xl bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-600 ring-1 ring-rose-400/25">
            {formError}
          </p>
        ) : null}
        {isDuplicate ? (
          <p className="rounded-2xl bg-amber-500/10 px-3.5 py-2.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-400/25">
            A component of this type with the same name already exists on this BOM.
          </p>
        ) : (
          <EntitlementBanner error={err} />
        )}

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
            disabled={add.isPending}
            className="cv-ring-focus inline-flex items-center gap-2 rounded-full bg-cv-brand px-4 py-2 text-xs font-bold text-white shadow-button transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {add.isPending ? <Loader2 size={13} className="animate-spin" /> : null}
            Add component
          </button>
        </div>
      </form>
    </Modal>
  );
}
