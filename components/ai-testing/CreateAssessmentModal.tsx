"use client";

import { useState } from "react";
import { ClipboardCheck, Loader2, ShieldAlert } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Modal } from "@/components/ui/Modal";
import { getAiSystems } from "@/lib/api/ai-systems";
import { ASSESSMENT_TYPES, ASSESSMENT_RISK_LEVELS, type AiRiskAssessmentCreate } from "@/lib/api/ai-systems";
import { useCreateAiRiskAssessment } from "@/lib/hooks/useAiTesting";
import { ApiError } from "@/lib/api/client";

const inputBase =
  "w-full rounded-2xl bg-white/65 px-3.5 py-2.5 text-sm text-cv-ink placeholder:text-cv-mist ring-1 ring-white/70 transition focus:outline-none focus:ring-2 focus:ring-cv-blue/45";

const labelBase = "mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-cv-slate";

function prettify(v: string) {
  return v.replaceAll("_", " ");
}

/** Create form for POST /api/v1/ai-governance/ai-risk/assessments. */
export function CreateAssessmentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  // Reuses the registry query key so the cached list is shared with the AI Systems page.
  const systems = useQuery({ queryKey: ["ai-systems"], queryFn: () => getAiSystems(), enabled: open });
  const create = useCreateAiRiskAssessment();

  const [aiSystemId, setAiSystemId] = useState("");
  const [title, setTitle] = useState("");
  const [assessmentType, setAssessmentType] = useState<(typeof ASSESSMENT_TYPES)[number]>("initial");
  const [riskLevel, setRiskLevel] = useState<(typeof ASSESSMENT_RISK_LEVELS)[number]>("unknown");
  const [likelihood, setLikelihood] = useState<(typeof ASSESSMENT_RISK_LEVELS)[number]>("unknown");
  const [impact, setImpact] = useState<(typeof ASSESSMENT_RISK_LEVELS)[number]>("unknown");
  const [description, setDescription] = useState("");
  const [mitigation, setMitigation] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const err = create.error instanceof ApiError ? create.error : null;
  const featureGated = err?.status === 403;

  function resetAndClose() {
    setAiSystemId("");
    setTitle("");
    setAssessmentType("initial");
    setRiskLevel("unknown");
    setLikelihood("unknown");
    setImpact("unknown");
    setDescription("");
    setMitigation("");
    setFormError(null);
    create.reset();
    onClose();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!aiSystemId) {
      setFormError("Select the AI system this assessment covers.");
      return;
    }
    if (!title.trim()) {
      setFormError("Give the assessment a title.");
      return;
    }
    const body: AiRiskAssessmentCreate = {
      ai_system_id: aiSystemId,
      title: title.trim(),
      assessment_type: assessmentType,
      risk_level: riskLevel,
      likelihood,
      impact,
      description: description.trim() || null,
      mitigation_summary: mitigation.trim() || null
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
      title="New AI Risk Assessment"
      subtitle="Manual governance record for one AI system"
      icon={ClipboardCheck}
      accent="purple"
      widthClassName="max-w-xl"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="assess-system" className={labelBase}>
              AI System
            </label>
            <select
              id="assess-system"
              value={aiSystemId}
              onChange={(e) => setAiSystemId(e.target.value)}
              className={inputBase}
              disabled={systems.isLoading}
            >
              <option value="">
                {systems.isLoading ? "Loading systems…" : systems.isError ? "Could not load systems" : "Select an AI system…"}
              </option>
              {(systems.data ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({prettify(s.system_type)})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="assess-title" className={labelBase}>
              Title
            </label>
            <input
              id="assess-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
              placeholder="e.g. Initial risk assessment — Fraud Anomaly Detector"
              className={inputBase}
            />
          </div>

          <div>
            <label htmlFor="assess-type" className={labelBase}>
              Assessment type
            </label>
            <select
              id="assess-type"
              value={assessmentType}
              onChange={(e) => setAssessmentType(e.target.value as (typeof ASSESSMENT_TYPES)[number])}
              className={inputBase}
            >
              {ASSESSMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {prettify(t)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="assess-risk" className={labelBase}>
              Risk level
            </label>
            <select
              id="assess-risk"
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value as (typeof ASSESSMENT_RISK_LEVELS)[number])}
              className={inputBase}
            >
              {ASSESSMENT_RISK_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="assess-likelihood" className={labelBase}>
              Likelihood
            </label>
            <select
              id="assess-likelihood"
              value={likelihood}
              onChange={(e) => setLikelihood(e.target.value as (typeof ASSESSMENT_RISK_LEVELS)[number])}
              className={inputBase}
            >
              {ASSESSMENT_RISK_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="assess-impact" className={labelBase}>
              Impact
            </label>
            <select
              id="assess-impact"
              value={impact}
              onChange={(e) => setImpact(e.target.value as (typeof ASSESSMENT_RISK_LEVELS)[number])}
              className={inputBase}
            >
              {ASSESSMENT_RISK_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="assess-description" className={labelBase}>
              Description <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
            </label>
            <textarea
              id="assess-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Scope, context, and what triggered this assessment"
              className={inputBase}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="assess-mitigation" className={labelBase}>
              Mitigation summary <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>
            </label>
            <textarea
              id="assess-mitigation"
              value={mitigation}
              onChange={(e) => setMitigation(e.target.value)}
              rows={2}
              placeholder="Planned or existing mitigations"
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
            Create assessment
          </button>
        </div>
      </form>
    </Modal>
  );
}
