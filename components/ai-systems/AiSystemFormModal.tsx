"use client";

import { useEffect, useState } from "react";
import { BrainCircuit, Loader2, PencilLine, ShieldAlert } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import {
  AI_SYSTEM_TYPES,
  AI_LIFECYCLE_STATUSES,
  type AiSystem,
  type AiSystemCreate
} from "@/lib/api/ai-systems";
import { useCreateAiSystem, useUpdateAiSystem } from "@/lib/hooks/useAiSystems";
import { ApiError } from "@/lib/api/client";

const inputBase =
  "w-full rounded-2xl bg-white/65 px-3.5 py-2.5 text-sm text-cv-ink placeholder:text-cv-mist ring-1 ring-white/70 transition focus:outline-none focus:ring-2 focus:ring-cv-blue/45";

const labelBase = "mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-cv-slate";

function prettify(v: string) {
  return v.replaceAll("_", " ");
}

type Props = {
  open: boolean;
  onClose: () => void;
  /** When provided the modal edits this system (PATCH); otherwise it registers a new one (POST). */
  system?: AiSystem | null;
};

/** Create/edit form for POST /api/v1/ai-systems and PATCH /api/v1/ai-systems/{id}. */
export function AiSystemFormModal({ open, onClose, system }: Props) {
  const isEdit = Boolean(system);
  const create = useCreateAiSystem();
  const update = useUpdateAiSystem();
  const pending = create.isPending || update.isPending;
  const rawError = (isEdit ? update.error : create.error) ?? null;
  const err = rawError instanceof ApiError ? rawError : null;
  const featureGated = err?.status === 403;

  const [name, setName] = useState("");
  const [systemType, setSystemType] = useState<(typeof AI_SYSTEM_TYPES)[number]>("internal_model");
  const [lifecycle, setLifecycle] = useState<(typeof AI_LIFECYCLE_STATUSES)[number]>("proposed");
  const [deploymentEnv, setDeploymentEnv] = useState("");
  const [modelName, setModelName] = useState("");
  const [modelVersion, setModelVersion] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [providerName, setProviderName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Prefill when opening in edit mode (or reset for create mode).
  useEffect(() => {
    if (!open) return;
    setName(system?.name ?? "");
    setSystemType(
      (AI_SYSTEM_TYPES as readonly string[]).includes(system?.system_type ?? "")
        ? (system!.system_type as (typeof AI_SYSTEM_TYPES)[number])
        : "internal_model"
    );
    setLifecycle(
      (AI_LIFECYCLE_STATUSES as readonly string[]).includes(system?.lifecycle_status ?? "")
        ? (system!.lifecycle_status as (typeof AI_LIFECYCLE_STATUSES)[number])
        : "proposed"
    );
    setDeploymentEnv(system?.deployment_environment ?? "");
    setModelName(system?.model_name ?? "");
    setModelVersion(system?.model_version ?? "");
    setVendorName(system?.vendor_name ?? "");
    setProviderName(system?.provider_name ?? "");
    setPurpose(system?.intended_purpose ?? "");
    setDescription(system?.description ?? "");
    setFormError(null);
    create.reset();
    update.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, system?.id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError("System name is required.");
      return;
    }
    const body: AiSystemCreate = {
      name: name.trim(),
      system_type: systemType,
      lifecycle_status: lifecycle,
      deployment_environment: deploymentEnv.trim() || null,
      model_name: modelName.trim() || null,
      model_version: modelVersion.trim() || null,
      vendor_name: vendorName.trim() || null,
      provider_name: providerName.trim() || null,
      intended_purpose: purpose.trim() || null,
      description: description.trim() || null
    };
    try {
      if (isEdit && system) {
        await update.mutateAsync({ id: system.id, body });
      } else {
        await create.mutateAsync(body);
      }
      onClose();
    } catch {
      // surfaced below via err
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit AI System" : "Register AI System"}
      subtitle={isEdit ? `Update the governance record for ${system?.name ?? "this system"}` : "Bring a new model, feature, or agent under governance"}
      icon={isEdit ? PencilLine : BrainCircuit}
      accent="purple"
      widthClassName="max-w-xl"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="sys-name" className={labelBase}>
              Name
            </label>
            <input
              id="sys-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={255}
              placeholder="e.g. Support Ticket Triage Agent"
              className={inputBase}
            />
          </div>

          <div>
            <label htmlFor="sys-type" className={labelBase}>
              System type
            </label>
            <select
              id="sys-type"
              value={systemType}
              onChange={(e) => setSystemType(e.target.value as (typeof AI_SYSTEM_TYPES)[number])}
              className={inputBase}
            >
              {AI_SYSTEM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {prettify(t)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="sys-lifecycle" className={labelBase}>
              Lifecycle status
            </label>
            <select
              id="sys-lifecycle"
              value={lifecycle}
              onChange={(e) => setLifecycle(e.target.value as (typeof AI_LIFECYCLE_STATUSES)[number])}
              className={inputBase}
            >
              {AI_LIFECYCLE_STATUSES.map((l) => (
                <option key={l} value={l}>
                  {prettify(l)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="sys-model" className={labelBase}>
              Model name <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
            </label>
            <input
              id="sys-model"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              maxLength={255}
              placeholder="e.g. ticket-triage-v2"
              className={inputBase}
            />
          </div>

          <div>
            <label htmlFor="sys-model-version" className={labelBase}>
              Model version <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
            </label>
            <input
              id="sys-model-version"
              value={modelVersion}
              onChange={(e) => setModelVersion(e.target.value)}
              maxLength={128}
              placeholder="e.g. 2.4.1"
              className={inputBase}
            />
          </div>

          <div>
            <label htmlFor="sys-vendor" className={labelBase}>
              Vendor <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
            </label>
            <input
              id="sys-vendor"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              maxLength={255}
              placeholder="e.g. Acme AI Inc."
              className={inputBase}
            />
          </div>

          <div>
            <label htmlFor="sys-provider" className={labelBase}>
              Provider <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
            </label>
            <input
              id="sys-provider"
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
              maxLength={255}
              placeholder="e.g. AWS Bedrock"
              className={inputBase}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="sys-env" className={labelBase}>
              Deployment environment <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
            </label>
            <input
              id="sys-env"
              value={deploymentEnv}
              onChange={(e) => setDeploymentEnv(e.target.value)}
              maxLength={64}
              placeholder="e.g. aws-ap-south-1"
              className={inputBase}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="sys-purpose" className={labelBase}>
              Intended purpose <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
            </label>
            <textarea
              id="sys-purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              rows={2}
              placeholder="What this system is for and who it serves"
              className={inputBase}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="sys-description" className={labelBase}>
              Description <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
            </label>
            <textarea
              id="sys-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Technical or governance notes"
              className={inputBase}
            />
          </div>
        </div>

        {formError ? (
          <p className="rounded-2xl bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-600 ring-1 ring-rose-400/25">
            {formError}
          </p>
        ) : null}
        {err ? (
          featureGated ? (
            <div className="flex items-start gap-2.5 rounded-2xl bg-amber-500/10 px-3.5 py-2.5 ring-1 ring-amber-400/25">
              <ShieldAlert size={15} className="mt-0.5 shrink-0 text-amber-600" />
              <p className="text-xs leading-relaxed text-amber-700">
                <span className="font-bold">Plan upgrade required.</span> {err.message}
              </p>
            </div>
          ) : (
            <p className="rounded-2xl bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-600 ring-1 ring-rose-400/25">
              {err.message}
            </p>
          )
        ) : null}

        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
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
            {isEdit ? "Save changes" : "Register system"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
