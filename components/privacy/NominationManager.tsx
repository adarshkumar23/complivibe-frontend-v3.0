"use client";

import { useState } from "react";
import { UserPlus, Search, Loader2 } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { createNomination, getActiveNomination, type Nomination } from "@/lib/api/privacy";
import { ApiError } from "@/lib/api/client";

const inputCls =
  "cv-ring-focus w-full rounded-xl bg-white/60 px-3.5 py-2.5 text-[13px] font-medium text-cv-ink ring-1 ring-white/70 placeholder:text-cv-mist focus:outline-none";

/**
 * DPDP Section 14 nomination management: register a nominee for a data principal
 * and look up the active nomination by subject identifier.
 */
export function NominationManager() {
  const [subject, setSubject] = useState("");
  const [nomineeName, setNomineeName] = useState("");
  const [nomineeContact, setNomineeContact] = useState("");
  const [trigger, setTrigger] = useState("death");
  const [busy, setBusy] = useState<"create" | "lookup" | null>(null);
  const [result, setResult] = useState<Nomination | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  async function handleCreate() {
    if (!subject.trim() || !nomineeName.trim()) {
      setMessage({ tone: "err", text: "Subject identifier and nominee name are required." });
      return;
    }
    setBusy("create");
    setMessage(null);
    try {
      const n = await createNomination({
        subject_identifier: subject.trim(),
        nominee_name: nomineeName.trim(),
        nominee_contact: nomineeContact.trim() || undefined,
        activation_trigger: trigger
      });
      setResult(n);
      setMessage({ tone: "ok", text: "Nomination registered." });
    } catch (err) {
      setMessage({ tone: "err", text: err instanceof Error ? err.message : "Failed to register nomination." });
    } finally {
      setBusy(null);
    }
  }

  async function handleLookup() {
    if (!subject.trim()) {
      setMessage({ tone: "err", text: "Enter a subject identifier to look up." });
      return;
    }
    setBusy("lookup");
    setMessage(null);
    setResult(null);
    try {
      const n = await getActiveNomination(subject.trim());
      if (n == null) {
        setMessage({ tone: "err", text: "No ACTIVE nomination — one may exist but not yet be activated (trigger not met)." });
      } else {
        setResult(n);
        setMessage({ tone: "ok", text: "Active nomination found." });
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setMessage({ tone: "err", text: "No active nomination for that subject." });
      } else {
        setMessage({ tone: "err", text: err instanceof Error ? err.message : "Lookup failed." });
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <SectionCard
      title="Nominee Management"
      subtitle="DPDP §14 — who may exercise rights if the data principal dies or is incapacitated"
      icon={UserPlus}
      accent="purple"
      className="h-full"
    >
      <div className="space-y-3">
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject identifier (email or ID)" className={inputCls} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input value={nomineeName} onChange={(e) => setNomineeName(e.target.value)} placeholder="Nominee name" className={inputCls} />
          <input value={nomineeContact} onChange={(e) => setNomineeContact(e.target.value)} placeholder="Nominee contact (optional)" className={inputCls} />
        </div>
        <select value={trigger} onChange={(e) => setTrigger(e.target.value)} className={inputCls}>
          <option value="death">Activates on death</option>
          <option value="incapacity">Activates on incapacity</option>
        </select>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCreate}
            disabled={busy != null}
            className="cv-ring-focus inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-cv-brand px-4 py-2.5 text-[13px] font-bold text-white shadow-tile transition hover:opacity-90 disabled:opacity-60"
          >
            {busy === "create" ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
            Register nominee
          </button>
          <button
            type="button"
            onClick={handleLookup}
            disabled={busy != null}
            className="cv-ring-focus inline-flex items-center justify-center gap-1.5 rounded-xl bg-white/70 px-4 py-2.5 text-[13px] font-bold text-cv-ink ring-1 ring-white/70 transition hover:bg-white disabled:opacity-60"
          >
            {busy === "lookup" ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            Look up
          </button>
        </div>
        {message ? (
          <p className={`text-[12px] font-medium ${message.tone === "err" ? "text-rose-600" : "text-emerald-600"}`}>{message.text}</p>
        ) : null}
        {result ? (
          <div className="rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] font-semibold text-cv-ink">{result.nominee_name ?? "Nominee"}</p>
              <StatusBadge label={result.status} tone={result.status === "active" ? "good" : "info"} />
            </div>
            <p className="mt-0.5 text-[11px] text-cv-slate">
              {[result.nominee_contact, result.activation_trigger ? `trigger: ${result.activation_trigger}` : null]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
}
