"use client";

import { useEffect, useState } from "react";
import { Loader2, Wand2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/lib/api/client";
import { EntitlementBanner } from "@/components/common/EntitlementBanner";
import {
  AUTOMATION_TRIGGERS,
  AUTOMATION_CONDITIONS,
  AUTOMATION_ACTIONS,
  AUTOMATION_PRIORITIES,
  AUTOMATION_STATUSES,
  type AutomationRule,
  type AutomationRuleInput
} from "@/lib/api/automation";
import { useCreateAutomationRule, useUpdateAutomationRule } from "@/lib/hooks/useAutomation";

const inputBase =
  "w-full rounded-2xl bg-white/65 px-3.5 py-2.5 text-sm text-cv-ink placeholder:text-cv-mist ring-1 ring-white/70 transition focus:outline-none focus:ring-2 focus:ring-cv-blue/45";
const labelBase = "mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-cv-slate";
const tidy = (v: string) => v.replaceAll("_", " ");

/** Create or edit an automation rule. POST/PATCH /api/v1/automation/rules.
 * Gated at the call site on automation:write. */
export function AutomationRuleModal({ open, onClose, rule }: { open: boolean; onClose: () => void; rule?: AutomationRule | null }) {
  const create = useCreateAutomationRule();
  const update = useUpdateAutomationRule();
  const editing = Boolean(rule?.id);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [trigger, setTrigger] = useState<AutomationRuleInput["trigger_type"]>("manual_scan");
  const [condition, setCondition] = useState<AutomationRuleInput["condition_type"]>(AUTOMATION_CONDITIONS[0]);
  const [action, setAction] = useState<AutomationRuleInput["action_type"]>("create_task");
  const [priority, setPriority] = useState<AutomationRuleInput["priority"]>("normal");
  const [status, setStatus] = useState<AutomationRuleInput["status"]>("active");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName((rule?.name as string) ?? "");
    setDescription((rule?.description as string) ?? "");
    setTrigger(((rule?.trigger_type as AutomationRuleInput["trigger_type"]) ?? "manual_scan"));
    setCondition(((rule?.condition_type as AutomationRuleInput["condition_type"]) ?? AUTOMATION_CONDITIONS[0]));
    setAction(((rule?.action_type as AutomationRuleInput["action_type"]) ?? "create_task"));
    setPriority(((rule?.priority as AutomationRuleInput["priority"]) ?? "normal"));
    setStatus(((rule?.status as AutomationRuleInput["status"]) === "inactive" ? "inactive" : "active"));
    setFormError(null);
    create.reset();
    update.reset();
  }, [open, rule]); // eslint-disable-line react-hooks/exhaustive-deps

  const err = (create.error ?? update.error) instanceof ApiError ? ((create.error ?? update.error) as ApiError) : null;
  const pending = create.isPending || update.isPending;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (name.trim().length < 3) {
      setFormError("Give the rule a name (at least 3 characters).");
      return;
    }
    const body: AutomationRuleInput = {
      name: name.trim(),
      description: description.trim() || null,
      trigger_type: trigger,
      condition_type: condition,
      action_type: action,
      priority,
      status
    };
    try {
      if (editing && rule?.id) await update.mutateAsync({ ruleId: rule.id, body });
      else await create.mutateAsync(body);
      onClose();
    } catch {
      // surfaced via err
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit rule" : "New automation rule"} subtitle="When a condition matches, run an action" icon={Wand2} accent="blue" widthClassName="max-w-xl">
      <form onSubmit={onSubmit} className="space-y-4" data-testid="automation-rule-form">
        <div>
          <label htmlFor="ar-name" className={labelBase}>Rule name</label>
          <input id="ar-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={255} placeholder="e.g. Flag critical risks with no control" className={inputBase} />
        </div>
        <div>
          <label htmlFor="ar-desc" className={labelBase}>Description <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span></label>
          <textarea id="ar-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputBase} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ar-trigger" className={labelBase}>Trigger</label>
            <select id="ar-trigger" value={trigger} onChange={(e) => setTrigger(e.target.value as AutomationRuleInput["trigger_type"])} className={inputBase}>
              {AUTOMATION_TRIGGERS.map((t) => (<option key={t} value={t}>{tidy(t)}</option>))}
            </select>
          </div>
          <div>
            <label htmlFor="ar-condition" className={labelBase}>Condition (when)</label>
            <select id="ar-condition" value={condition} onChange={(e) => setCondition(e.target.value as AutomationRuleInput["condition_type"])} className={inputBase}>
              {AUTOMATION_CONDITIONS.map((c) => (<option key={c} value={c}>{tidy(c)}</option>))}
            </select>
          </div>
          <div>
            <label htmlFor="ar-action" className={labelBase}>Action (then)</label>
            <select id="ar-action" value={action} onChange={(e) => setAction(e.target.value as AutomationRuleInput["action_type"])} className={inputBase}>
              {AUTOMATION_ACTIONS.map((a) => (<option key={a} value={a}>{tidy(a)}</option>))}
            </select>
          </div>
          <div>
            <label htmlFor="ar-priority" className={labelBase}>Priority</label>
            <select id="ar-priority" value={priority} onChange={(e) => setPriority(e.target.value as AutomationRuleInput["priority"])} className={inputBase}>
              {AUTOMATION_PRIORITIES.map((p) => (<option key={p} value={p}>{p}</option>))}
            </select>
          </div>
          <div>
            <label htmlFor="ar-status" className={labelBase}>Status</label>
            <select id="ar-status" value={status} onChange={(e) => setStatus(e.target.value as AutomationRuleInput["status"])} className={inputBase}>
              {AUTOMATION_STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
          </div>
        </div>

        {formError ? <p className="rounded-2xl bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-600 ring-1 ring-rose-400/25">{formError}</p> : null}
        <EntitlementBanner error={err} />

        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button type="button" onClick={onClose} className="cv-ring-focus rounded-full bg-white/70 px-4 py-2 text-xs font-semibold text-cv-ink ring-1 ring-white/70 hover:bg-white">Cancel</button>
          <button type="submit" data-testid="automation-rule-submit" disabled={pending} className="cv-ring-focus inline-flex items-center gap-2 rounded-full bg-cv-brand px-4 py-2 text-xs font-bold text-white shadow-button transition hover:-translate-y-0.5 disabled:opacity-70">
            {pending ? <Loader2 size={13} className="animate-spin" /> : null} {editing ? "Save changes" : "Create rule"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
