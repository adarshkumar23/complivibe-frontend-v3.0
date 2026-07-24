"use client";

import { useEffect, useMemo, useState } from "react";
import { FilePlus2, LayoutTemplate, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useCreatePolicy, useApplyPolicyTemplate, usePolicyUsers, usePolicies } from "@/lib/hooks/usePolicies";
import { POLICY_TYPES, type PolicyCreatePayload, type PolicyType } from "@/lib/api/policies";
import { ApiError } from "@/lib/api/client";
import { EntitlementBanner } from "@/components/common/EntitlementBanner";
import { cn } from "@/lib/utils/cn";

const inputCls =
  "cv-ring-focus w-full rounded-xl bg-white/60 px-3.5 py-2.5 text-[13px] font-medium text-cv-ink ring-1 ring-white/70 placeholder:text-cv-mist focus:outline-none";
const labelCls = "mb-1 block text-[11px] font-bold uppercase tracking-wide text-cv-slate";

function tidy(s: string) {
  return s.replaceAll("_", " ");
}

type Mode = "blank" | "template";

/**
 * Create a policy either from scratch (POST /api/v1/compliance/policies, plus an
 * initial version when content is provided) or from a system template
 * (POST /api/v1/compliance/policy-templates/{id}/apply — the backend seeds a
 * draft policy + version 1.0 from the template content).
 */
export function PolicyFormModal({
  open,
  onClose,
  initialTemplateId
}: {
  open: boolean;
  onClose: () => void;
  /** Pre-select a template (opened from the templates card). */
  initialTemplateId?: string | null;
}) {
  const { templates } = usePolicies();
  const users = usePolicyUsers();
  const createPolicy = useCreatePolicy();
  const applyTemplate = useApplyPolicyTemplate();
  const pending = createPolicy.isPending || applyTemplate.isPending;

  const [mode, setMode] = useState<Mode>("blank");
  const [templateId, setTemplateId] = useState("");
  const [title, setTitle] = useState("");
  const [policyType, setPolicyType] = useState<PolicyType>("other");
  const [ownerUserId, setOwnerUserId] = useState("");
  const [description, setDescription] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [reviewDueDate, setReviewDueDate] = useState("");
  const [content, setContent] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Re-seed each time the modal opens.
  useEffect(() => {
    if (!open) return;
    setMode(initialTemplateId ? "template" : "blank");
    setTemplateId(initialTemplateId ?? "");
    setTitle("");
    setPolicyType("other");
    setOwnerUserId("");
    setDescription("");
    setEffectiveDate("");
    setReviewDueDate("");
    setContent("");
    setFormError(null);
  }, [open, initialTemplateId]);

  const templateList = templates.data ?? [];
  const selectedTemplate = useMemo(
    () => templateList.find((t) => t.id === templateId) ?? null,
    [templateList, templateId]
  );
  // Backend requires the owner to be an ACTIVE org member.
  const activeUsers = (users.data ?? []).filter((u) => u.is_active);

  // Reset local form state and close. Mirrors ControlCreateModal.resetAndClose so
  // the modal returns to a clean slate on every close (not just re-open).
  function resetAndClose() {
    setMode("blank");
    setTemplateId("");
    setTitle("");
    setPolicyType("other");
    setOwnerUserId("");
    setDescription("");
    setEffectiveDate("");
    setReviewDueDate("");
    setContent("");
    setFormError(null);
    createPolicy.reset();
    applyTemplate.reset();
    onClose();
  }

  // Imperative await + resetAndClose (mirrors ControlCreateModal). This closes the
  // modal in the same awaited flow as the successful mutation, instead of relying
  // on react-query's mutate() onSuccess callback -- which is skipped if the modal
  // unmounts before the mutation settles (e.g. a slow list-invalidation refetch
  // under load), the failure mode the sweep observed.
  async function handleSubmit() {
    setFormError(null);
    try {
      if (mode === "template") {
        if (!templateId) {
          setFormError("Pick a template to start from.");
          return;
        }
        await applyTemplate.mutateAsync({ templateId, overrideTitle: title.trim() || null });
      } else {
        if (!title.trim()) {
          setFormError("Title is required.");
          return;
        }
        if (!ownerUserId) {
          setFormError("Select an owner — the backend requires an active org member.");
          return;
        }
        const payload: PolicyCreatePayload = {
          title: title.trim(),
          policy_type: policyType,
          owner_user_id: ownerUserId,
          description: description.trim() || null,
          effective_date: effectiveDate || null,
          review_due_date: reviewDueDate || null
        };
        await createPolicy.mutateAsync({ payload, initialContent: content });
      }
      resetAndClose();
    } catch (err) {
      // ApiError is surfaced via the EntitlementBanner below; anything else here.
      if (!(err instanceof ApiError)) {
        setFormError((err as Error)?.message || "The backend rejected this request.");
      }
    }
  }

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title="New policy"
      subtitle="Draft a governance policy from scratch or a system template"
      icon={FilePlus2}
      accent="blue"
      widthClassName="max-w-xl"
    >
      <div className="space-y-3" data-testid="policy-form">
        <div className="flex gap-1.5 rounded-full bg-white/45 p-1 ring-1 ring-white/60">
          {(["blank", "template"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              data-testid={`policy-mode-${m}`}
              className={cn(
                "cv-ring-focus flex-1 rounded-full px-3 py-1.5 text-[12px] font-bold transition",
                mode === m ? "bg-cv-brand text-white shadow-tile" : "text-cv-slate hover:text-cv-ink"
              )}
            >
              {m === "blank" ? "From scratch" : "From template"}
            </button>
          ))}
        </div>

        {mode === "template" ? (
          <>
            <div>
              <label htmlFor="policy-template" className={labelCls}>
                Template
              </label>
              <select
                id="policy-template"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className={inputCls}
              >
                <option value="">
                  {templates.isLoading
                    ? "Loading templates…"
                    : templates.isError
                      ? "Could not load templates"
                      : "Select a template…"}
                </option>
                {templateList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                    {t.category ? ` — ${t.category}` : ""}
                  </option>
                ))}
              </select>
            </div>
            {selectedTemplate ? (
              <div className="rounded-xl bg-white/45 p-3 ring-1 ring-white/60">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[12px] text-cv-slate">{selectedTemplate.description}</p>
                  <LayoutTemplate size={14} className="mt-0.5 shrink-0 text-cv-mist" />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {selectedTemplate.policy_type ? (
                    <StatusBadge label={tidy(selectedTemplate.policy_type)} tone="info" />
                  ) : null}
                  {(selectedTemplate.framework_tags ?? []).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-cv-brand-soft px-2 py-0.5 text-[10px] font-semibold text-cv-blue"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            <div>
              <label htmlFor="policy-override-title" className={labelCls}>
                Title override (optional)
              </label>
              <input
                id="policy-override-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={selectedTemplate ? selectedTemplate.title : "Keep the template title"}
                className={inputCls}
              />
            </div>
            <p className="text-[11px] text-cv-mist">
              Applying a template creates a draft policy plus a version 1.0 seeded with the template content, ready to
              submit for review.
            </p>
          </>
        ) : (
          <>
            <div>
              <label htmlFor="policy-title" className={labelCls}>
                Title
              </label>
              <input
                id="policy-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Remote Access Policy"
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="policy-type" className={labelCls}>
                  Policy type
                </label>
                <select
                  id="policy-type"
                  value={policyType}
                  onChange={(e) => setPolicyType(e.target.value as PolicyType)}
                  className={inputCls}
                >
                  {POLICY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {tidy(t)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="policy-owner" className={labelCls}>
                  Owner
                </label>
                <select
                  id="policy-owner"
                  value={ownerUserId}
                  onChange={(e) => setOwnerUserId(e.target.value)}
                  className={inputCls}
                >
                  <option value="">
                    {users.isLoading ? "Loading org users…" : users.isError ? "Could not load org users" : "Select owner…"}
                  </option>
                  {activeUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name || u.email}
                      {u.full_name ? ` — ${u.email}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="policy-description" className={labelCls}>
                Description (optional)
              </label>
              <textarea
                id="policy-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="What this policy governs"
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="policy-effective" className={labelCls}>
                  Effective date (optional)
                </label>
                <input
                  id="policy-effective"
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="policy-review-due" className={labelCls}>
                  Review due (optional)
                </label>
                <input
                  id="policy-review-due"
                  type="date"
                  value={reviewDueDate}
                  onChange={(e) => setReviewDueDate(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
            <div>
              <label htmlFor="policy-content" className={labelCls}>
                Policy content (optional — creates version 1.0)
              </label>
              <textarea
                id="policy-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                placeholder="Markdown policy text. Leave empty to add versions later."
                className={inputCls}
              />
            </div>
          </>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={pending}
          data-testid="policy-form-submit"
          className="cv-ring-focus inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-cv-brand px-4 py-2.5 text-[13px] font-bold text-white shadow-tile transition hover:opacity-90 disabled:opacity-60"
        >
          {pending ? <Loader2 size={14} className="animate-spin" /> : <FilePlus2 size={14} />}
          {mode === "template" ? "Create from template" : "Create policy"}
        </button>

        {(() => {
          const mutErr = createPolicy.error ?? applyTemplate.error;
          if (mutErr instanceof ApiError) return <EntitlementBanner error={mutErr} />;
          return formError ? (
            <p className="text-[12px] font-medium text-rose-600" data-testid="policy-form-error">
              {formError}
            </p>
          ) : null;
        })()}
      </div>
    </Modal>
  );
}
