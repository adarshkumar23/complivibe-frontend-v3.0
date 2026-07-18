"use client";

import { useState } from "react";
import { CloudCog, Loader2, CheckCircle2, TriangleAlert, KeyRound } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { useHasPermission } from "@/lib/hooks/usePermissions";
import {
  createCloudConnector,
  getConnectorSetup,
  CONNECTOR_TYPES,
  type ConnectorType,
  type ConnectorSetup
} from "@/lib/api/cloud-connectors";
import type { CloudConnectorsData } from "@/lib/hooks/useCloudConnectors";

/** Per-provider auth model, matching the backend's verification behavior. */
const PROVIDER_AUTH_NOTES: Record<ConnectorType, string> = {
  aws: "EventBridge → API destination with HMAC-signed webhook (signing secret below).",
  azure: "Logic App / Event Grid push with initial handshake + shared-secret header.",
  gcp: "Pub/Sub push authenticated via Google OIDC token — no shared secret to store.",
  github: "Org webhook with HMAC signature (X-Hub-Signature-256).",
  okta: "Event hook with one-time verification handshake + shared-secret header."
};

export function CreateConnectorForm({ data }: { data: CloudConnectorsData }) {
  const canWriteConnectors = useHasPermission("connectors:write");
  const [type, setType] = useState<ConnectorType>("aws");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [setup, setSetup] = useState<ConnectorSetup | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  async function handleCreate() {
    if (!name.trim()) {
      setMessage({ tone: "err", text: "Give the connector a display name." });
      return;
    }
    setBusy(true);
    setMessage(null);
    setSetup(null);
    try {
      const connector = await createCloudConnector({ connector_type: type, display_name: name.trim() });
      const s = await getConnectorSetup(connector.id);
      setSetup(s);
      setMessage({ tone: "ok", text: "Connector registered — follow the setup steps below." });
      data.connectors.refetch();
    } catch (err) {
      const detail = err instanceof Error ? err.message : "Creation failed.";
      setMessage({
        tone: "err",
        text: detail.includes("500")
          ? "Creation failed — the backend secrets vault (VAULT_ADDR) is not configured."
          : detail
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <SectionCard title="Register Connector" subtitle="AWS · Azure · GCP · GitHub · Okta" icon={CloudCog} accent="purple">
      <div className="space-y-3">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as ConnectorType)}
          aria-label="Connector provider type"
          className="cv-ring-focus w-full rounded-xl bg-white/60 px-3.5 py-2.5 text-[13px] font-medium text-cv-ink ring-1 ring-white/70 focus:outline-none"
        >
          {CONNECTOR_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.toUpperCase()}
            </option>
          ))}
        </select>
        <p className="text-[11px] leading-relaxed text-cv-slate">{PROVIDER_AUTH_NOTES[type]}</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Display name (e.g. AWS prod account)"
          className="cv-ring-focus w-full rounded-xl bg-white/60 px-3.5 py-2.5 text-[13px] font-medium text-cv-ink ring-1 ring-white/70 placeholder:text-cv-mist focus:outline-none"
        />
        {canWriteConnectors ? (
          <button
            type="button"
            data-testid="register-connector"
            onClick={handleCreate}
            disabled={busy}
            className="cv-ring-focus inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-cv-brand px-4 py-2.5 text-[13px] font-bold text-white shadow-tile transition hover:opacity-90 disabled:opacity-60"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <CloudCog size={14} />}
            Register connector
          </button>
        ) : null}
        {message ? (
          <p className={`flex items-start gap-1.5 text-[12px] font-medium ${message.tone === "err" ? "text-rose-600" : "text-emerald-600"}`}>
            {message.tone === "err" ? <TriangleAlert size={13} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={13} className="mt-0.5 shrink-0" />}
            {message.text}
          </p>
        ) : null}
        {setup ? (
          <div className="space-y-2 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
            <p className="flex items-center gap-1.5 text-[12px] font-bold text-cv-ink">
              <KeyRound size={13} /> Setup
            </p>
            <p className="break-all text-[11px] text-cv-slate">Webhook URL: {setup.webhook_url}</p>
            {setup.signing_secret ? (
              <p className="break-all text-[11px] text-cv-slate">Signing secret: {setup.signing_secret}</p>
            ) : null}
            <ol className="list-inside list-decimal space-y-1 text-[11px] text-cv-slate">
              {setup.provider_setup_steps.map((step, i) => (
                <li key={i}>{String((step as { description?: string }).description ?? JSON.stringify(step))}</li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
}
