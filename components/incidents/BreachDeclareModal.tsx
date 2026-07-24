"use client";

import { useState } from "react";
import { Loader2, Siren, AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/lib/api/client";
import { EntitlementBanner } from "@/components/common/EntitlementBanner";
import { BREACH_TYPES, BREACH_FRAMEWORKS, type BreachType, type BreachFramework } from "@/lib/api/breach";
import { useDeclareBreach } from "@/lib/hooks/useBreach";
import type { Issue } from "@/lib/api/compliance";

const inputBase =
  "w-full rounded-2xl bg-white/65 px-3.5 py-2.5 text-sm text-cv-ink placeholder:text-cv-mist ring-1 ring-white/70 transition focus:outline-none focus:ring-2 focus:ring-cv-blue/45";
const labelBase = "mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-cv-slate";

function prettify(v: string) {
  return v.replaceAll("_", " ");
}

// The backend only allows a breach on these issue types (422 otherwise).
const BREACH_ELIGIBLE_ISSUE_TYPES = ["security_incident", "data_loss", "unauthorized_access"];

/** Declare a breach against an existing compliance issue.
 * POST /compliance/issues/{issue_id}/breach-notification. Gated at the call site on
 * issues:admin; write entitlement is privacy_basic (available on every plan). */
export function BreachDeclareModal({ open, onClose, issues, breachedIssueIds }: { open: boolean; onClose: () => void; issues: Issue[]; breachedIssueIds?: Set<string> }) {
  const declare = useDeclareBreach();

  const [issueId, setIssueId] = useState("");
  const [breachType, setBreachType] = useState<BreachType>("personal_data");
  const [personalDataAffected, setPersonalDataAffected] = useState(true);
  const [estimatedCount, setEstimatedCount] = useState("");
  const [regRequired, setRegRequired] = useState(true);
  const [framework, setFramework] = useState<BreachFramework>("gdpr");
  const [hours, setHours] = useState("72");
  const [authority, setAuthority] = useState("");
  const [subjectRequired, setSubjectRequired] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Only breach-eligible, non-closed issues that don't already carry a breach
  // (one breach per issue — the backend 409s otherwise).
  const openIssues = issues.filter(
    (i) => i.status !== "closed" && BREACH_ELIGIBLE_ISSUE_TYPES.includes(i.issue_type) && !(breachedIssueIds?.has(i.id))
  );

  function reset() {
    setIssueId("");
    setBreachType("personal_data");
    setPersonalDataAffected(true);
    setEstimatedCount("");
    setRegRequired(true);
    setFramework("gdpr");
    setHours("72");
    setAuthority("");
    setSubjectRequired(false);
    setFormError(null);
    declare.reset();
  }
  function close() {
    reset();
    onClose();
  }

  const err = declare.error instanceof ApiError ? declare.error : null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!issueId) {
      setFormError("Select the compliance issue this breach relates to.");
      return;
    }
    const hoursNum = Number(hours);
    if (!Number.isFinite(hoursNum) || hoursNum < 1) {
      setFormError("Notification window must be at least 1 hour.");
      return;
    }
    try {
      await declare.mutateAsync({
        issueId,
        body: {
          breach_type: breachType,
          personal_data_affected: personalDataAffected,
          estimated_affected_count: estimatedCount.trim() ? Number(estimatedCount) : null,
          regulatory_notification_required: regRequired,
          regulatory_framework: regRequired ? framework : null,
          regulatory_notification_hours: hoursNum,
          supervisory_authority: authority.trim() || null,
          subject_notification_required: subjectRequired
        }
      });
      close();
    } catch {
      // surfaced via err
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Declare a breach"
      subtitle="Record a data breach against a compliance issue and start the regulatory clock"
      icon={Siren}
      accent="amber"
      widthClassName="max-w-xl"
    >
      <form onSubmit={onSubmit} className="space-y-4" data-testid="breach-declare-form">
        <div>
          <label htmlFor="breach-issue" className={labelBase}>Related compliance issue</label>
          <select id="breach-issue" value={issueId} onChange={(e) => setIssueId(e.target.value)} className={inputBase}>
            <option value="">{openIssues.length ? "Select an issue…" : "No open issues — create one on the Issues list first"}</option>
            {openIssues.map((i) => (
              <option key={i.id} value={i.id}>{i.title}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="breach-type" className={labelBase}>Breach type</label>
            <select id="breach-type" value={breachType} onChange={(e) => setBreachType(e.target.value as BreachType)} className={inputBase}>
              {BREACH_TYPES.map((t) => (<option key={t} value={t}>{prettify(t)}</option>))}
            </select>
          </div>
          <div>
            <label htmlFor="breach-count" className={labelBase}>Estimated records affected <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span></label>
            <input id="breach-count" type="number" min={0} value={estimatedCount} onChange={(e) => setEstimatedCount(e.target.value)} placeholder="e.g. 1200" className={inputBase} />
          </div>
        </div>

        <label className="flex items-center gap-2 text-[13px] font-medium text-cv-ink">
          <input type="checkbox" checked={personalDataAffected} onChange={(e) => setPersonalDataAffected(e.target.checked)} className="h-4 w-4 rounded" />
          Personal data affected
        </label>

        <div className="rounded-2xl bg-white/45 p-3.5 ring-1 ring-white/60">
          <label className="flex items-center gap-2 text-[13px] font-semibold text-cv-ink">
            <input type="checkbox" checked={regRequired} onChange={(e) => setRegRequired(e.target.checked)} className="h-4 w-4 rounded" />
            Regulatory notification required
          </label>
          {regRequired ? (
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="breach-framework" className={labelBase}>Framework</label>
                <select id="breach-framework" value={framework} onChange={(e) => setFramework(e.target.value as BreachFramework)} className={inputBase}>
                  {BREACH_FRAMEWORKS.map((f) => (<option key={f} value={f}>{f.toUpperCase()}</option>))}
                </select>
              </div>
              <div>
                <label htmlFor="breach-hours" className={labelBase}>Window (hrs)</label>
                <input id="breach-hours" type="number" min={1} value={hours} onChange={(e) => setHours(e.target.value)} className={inputBase} />
              </div>
              <div>
                <label htmlFor="breach-authority" className={labelBase}>Authority</label>
                <input id="breach-authority" value={authority} onChange={(e) => setAuthority(e.target.value)} placeholder="e.g. ICO" className={inputBase} />
              </div>
            </div>
          ) : null}
        </div>

        <label className="flex items-center gap-2 text-[13px] font-medium text-cv-ink">
          <input type="checkbox" checked={subjectRequired} onChange={(e) => setSubjectRequired(e.target.checked)} className="h-4 w-4 rounded" />
          Data-subject notification required
        </label>

        <div className="flex items-start gap-2 rounded-2xl bg-amber-500/10 px-3.5 py-2.5 ring-1 ring-amber-400/25">
          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="text-[11px] leading-relaxed text-amber-700">
            Declaring a breach records a <span className="font-semibold">data_breach</span> event. Any matching
            contractual breach-notification commitments will be created and their deadlines started automatically.
          </p>
        </div>

        {formError ? (
          <p className="rounded-2xl bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-600 ring-1 ring-rose-400/25">{formError}</p>
        ) : null}
        <EntitlementBanner error={err} />

        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button type="button" onClick={close} className="cv-ring-focus rounded-full bg-white/70 px-4 py-2 text-xs font-semibold text-cv-ink ring-1 ring-white/70 transition hover:bg-white">
            Cancel
          </button>
          <button
            type="submit"
            data-testid="breach-declare-submit"
            disabled={declare.isPending}
            className="cv-ring-focus inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-button transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {declare.isPending ? <Loader2 size={13} className="animate-spin" /> : <Siren size={13} />}
            Declare breach
          </button>
        </div>
      </form>
    </Modal>
  );
}
