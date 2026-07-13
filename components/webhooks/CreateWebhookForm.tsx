"use client";

import { useState } from "react";
import { Webhook, Loader2, CheckCircle2, TriangleAlert, KeyRound } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { createWebhookEndpoint, WEBHOOK_EVENT_TYPES } from "@/lib/api/webhooks";
import type { WebhooksData } from "@/lib/hooks/useWebhooks";

function randomSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function CreateWebhookForm({ data }: { data: WebhooksData }) {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [secret, setSecret] = useState(randomSecret);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  // The full secret is only ever returned once, at creation — shown here so the
  // caller can copy it before it's masked on every subsequent read.
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);

  function toggleEventType(et: string) {
    setEventTypes((prev) => (prev.includes(et) ? prev.filter((x) => x !== et) : [...prev, et]));
  }

  async function handleCreate() {
    if (!url.trim() || !name.trim()) {
      setMessage({ tone: "err", text: "URL and name are both required." });
      return;
    }
    if (eventTypes.length === 0) {
      setMessage({ tone: "err", text: "Select at least one event type." });
      return;
    }
    setBusy(true);
    setMessage(null);
    setCreatedSecret(null);
    try {
      const created = await createWebhookEndpoint({
        url: url.trim(),
        name: name.trim(),
        secret,
        event_types: eventTypes
      });
      setCreatedSecret(created.secret);
      setMessage({ tone: "ok", text: "Webhook endpoint registered — copy the signing secret now, it won't be shown again." });
      setUrl("");
      setName("");
      setSecret(randomSecret());
      setEventTypes([]);
      data.endpoints.refetch();
    } catch (err) {
      setMessage({ tone: "err", text: err instanceof Error ? err.message : "Creation failed." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <SectionCard title="Register Endpoint" subtitle="Deliver events to your own URL" icon={Webhook} accent="purple">
      <div className="space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Display name (e.g. Security SIEM)"
          className="cv-ring-focus w-full rounded-xl bg-white/60 px-3.5 py-2.5 text-[13px] font-medium text-cv-ink ring-1 ring-white/70 placeholder:text-cv-mist focus:outline-none"
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/hooks/complivibe"
          className="cv-ring-focus w-full rounded-xl bg-white/60 px-3.5 py-2.5 text-[13px] font-medium text-cv-ink ring-1 ring-white/70 placeholder:text-cv-mist focus:outline-none"
        />
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wide text-cv-slate">Event types</label>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {WEBHOOK_EVENT_TYPES.map((et) => (
              <button
                key={et}
                type="button"
                onClick={() => toggleEventType(et)}
                aria-pressed={eventTypes.includes(et)}
                className={`cv-ring-focus rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 transition ${
                  eventTypes.includes(et)
                    ? "bg-cv-brand text-white ring-cv-brand"
                    : "bg-white/60 text-cv-slate ring-white/70 hover:bg-white"
                }`}
              >
                {et}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={handleCreate}
          disabled={busy}
          className="cv-ring-focus inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-cv-brand px-4 py-2.5 text-[13px] font-bold text-white shadow-tile transition hover:opacity-90 disabled:opacity-60"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Webhook size={14} />}
          Register endpoint
        </button>
        {message ? (
          <p
            className={`flex items-start gap-1.5 text-[12px] font-medium ${message.tone === "err" ? "text-rose-600" : "text-emerald-600"}`}
          >
            {message.tone === "err" ? (
              <TriangleAlert size={13} className="mt-0.5 shrink-0" />
            ) : (
              <CheckCircle2 size={13} className="mt-0.5 shrink-0" />
            )}
            {message.text}
          </p>
        ) : null}
        {createdSecret ? (
          <div className="space-y-1.5 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
            <p className="flex items-center gap-1.5 text-[12px] font-bold text-cv-ink">
              <KeyRound size={13} /> Signing secret (shown once)
            </p>
            <p className="break-all font-mono text-[11px] text-cv-slate">{createdSecret}</p>
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
}
