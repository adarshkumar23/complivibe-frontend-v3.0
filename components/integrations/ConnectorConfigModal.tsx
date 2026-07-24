"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plug, AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/lib/api/client";
import { EntitlementBanner } from "@/components/common/EntitlementBanner";
import { type ConnectorCatalogEntry } from "@/lib/api/integrations";
import { useEnableConnector } from "@/lib/hooks/useIntegrations";

const inputBase =
  "w-full rounded-2xl bg-white/65 px-3.5 py-2.5 text-sm text-cv-ink placeholder:text-cv-mist ring-1 ring-white/70 transition focus:outline-none focus:ring-2 focus:ring-cv-blue/45";
const labelBase = "mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-cv-slate";

const isSecret = (name: string) => /token|secret|password|key|credential|api[_-]?key/i.test(name);

/** Connect a catalog connector: render its config_schema fields and POST
 * /connectors/{id}/enable. Secret-shaped fields are encrypted at rest (needs the
 * secrets/Vault backend -> a clean 503 if unset); non-secret connectors enable with
 * no Vault. Gated at the call site on connectors:write. */
export function ConnectorConfigModal({ connector, onClose }: { connector: ConnectorCatalogEntry | null; onClose: () => void }) {
  const enable = useEnableConnector();
  const [values, setValues] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const schema = (connector?.config_schema ?? null) as { properties?: Record<string, { type?: string }>; required?: string[] } | null;
  const fields = useMemo(() => Object.keys(schema?.properties ?? {}), [schema]);
  const required = useMemo(() => new Set(schema?.required ?? []), [schema]);
  const hasSecret = fields.some(isSecret);

  useEffect(() => {
    if (connector) { setValues({}); setFormError(null); enable.reset(); }
  }, [connector]); // eslint-disable-line react-hooks/exhaustive-deps

  const err = enable.error instanceof ApiError ? enable.error : null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!connector) return;
    setFormError(null);
    const missing = [...required].filter((k) => !(values[k]?.trim()));
    if (missing.length) { setFormError(`Fill required field(s): ${missing.join(", ")}.`); return; }
    // Only send provided values (object-typed fields would need JSON; kept simple as strings).
    const config = Object.fromEntries(fields.filter((k) => values[k]?.trim()).map((k) => [k, values[k].trim()]));
    try {
      await enable.mutateAsync({ connectorId: connector.id, config: Object.keys(config).length ? config : null });
      onClose();
    } catch {
      // surfaced via err (incl. Vault 503 / missing-field 422)
    }
  }

  return (
    <Modal open={connector != null} onClose={onClose} title={`Connect ${connector?.name ?? ""}`} subtitle="Provide the connector's configuration to enable it" icon={Plug} accent="blue" widthClassName="max-w-lg">
      <form onSubmit={onSubmit} className="space-y-3.5" data-testid="connector-config-form">
        {fields.length === 0 ? (
          <p className="text-[12px] text-cv-slate">This connector needs no configuration — click Connect to enable it.</p>
        ) : (
          fields.map((k) => (
            <div key={k}>
              <label htmlFor={`cfg-${k}`} className={labelBase}>
                {k.replaceAll("_", " ")} {required.has(k) ? <span className="text-rose-500">*</span> : <span className="font-medium normal-case tracking-normal text-cv-mist">(optional)</span>}
              </label>
              <input
                id={`cfg-${k}`}
                data-testid={`cfg-${k}`}
                type={isSecret(k) ? "password" : "text"}
                value={values[k] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [k]: e.target.value }))}
                className={inputBase}
              />
            </div>
          ))
        )}
        {hasSecret ? (
          <div className="flex items-start gap-2 rounded-2xl bg-amber-500/10 px-3.5 py-2.5 ring-1 ring-amber-400/25">
            <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-600" />
            <p className="text-[11px] leading-relaxed text-amber-700">
              This connector stores credentials, which are encrypted at rest via the secrets backend. If Vault/OpenBao
              isn&apos;t configured, enabling returns a clear &quot;not configured&quot; error (same as SSO/cloud connectors).
            </p>
          </div>
        ) : null}
        {formError ? <p className="rounded-2xl bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-600 ring-1 ring-rose-400/25">{formError}</p> : null}
        <EntitlementBanner error={err} />
        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button type="button" onClick={onClose} className="cv-ring-focus rounded-full bg-white/70 px-4 py-2 text-xs font-semibold text-cv-ink ring-1 ring-white/70 hover:bg-white">Cancel</button>
          <button type="submit" data-testid="connector-connect-submit" disabled={enable.isPending} className="cv-ring-focus inline-flex items-center gap-2 rounded-full bg-cv-brand px-4 py-2 text-xs font-bold text-white shadow-button transition hover:-translate-y-0.5 disabled:opacity-70">
            {enable.isPending ? <Loader2 size={13} className="animate-spin" /> : null} Connect
          </button>
        </div>
      </form>
    </Modal>
  );
}
