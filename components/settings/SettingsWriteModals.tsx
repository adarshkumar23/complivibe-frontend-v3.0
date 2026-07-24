"use client";

import { useEffect, useState } from "react";
import { Loader2, Bot, Network, KeyRound, Trash2, CheckCircle2, PlayCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/lib/api/client";
import { EntitlementBanner } from "@/components/common/EntitlementBanner";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SSO_PROVIDERS, SSO_PROVIDER_LABELS, type SsoProvider } from "@/lib/api/settings";
import type { SettingsData } from "@/lib/hooks/useSettings";
import {
  usePutAiConfiguration,
  useCreateIpRange,
  useDeleteIpRange,
  useDisableIpAllowlist,
  useCreateSsoConfig,
  useActivateSsoConfig,
  useDeleteSsoConfig,
  useTestSsoConfig,
  useCreateOidcConfig,
  useActivateOidcConfig,
  useDeleteOidcConfig,
  useTestOidcConfig
} from "@/lib/hooks/useSettings";

const inputBase =
  "w-full rounded-2xl bg-white/65 px-3.5 py-2.5 text-sm text-cv-ink placeholder:text-cv-mist ring-1 ring-white/70 transition focus:outline-none focus:ring-2 focus:ring-cv-blue/45";
const labelBase = "mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-cv-slate";
const cfgId = (c: Record<string, unknown> | null | undefined) => (c && typeof c.id === "string" ? c.id : null);
const cfgActive = (c: Record<string, unknown> | null | undefined) => Boolean(c && c.is_active);

// ─────────────── AI credentials (PUT /organizations/ai-configuration) ───────────────
export function AiConfigModal({ open, onClose, data }: { open: boolean; onClose: () => void; data: SettingsData }) {
  const put = usePutAiConfiguration();
  const cfg = data.aiConfig.data;
  const [byo, setByo] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [groq, setGroq] = useState("");
  const [azureKey, setAzureKey] = useState("");
  const [azureEndpoint, setAzureEndpoint] = useState("");
  const [azureDeployment, setAzureDeployment] = useState("");

  useEffect(() => {
    if (!open || !cfg) return;
    setByo(cfg.use_byo_credentials);
    setIsActive(cfg.is_active);
    setGroq("");
    setAzureKey("");
    setAzureEndpoint(cfg.azure_endpoint ?? "");
    setAzureDeployment(cfg.azure_deployment_name ?? "");
    put.reset();
  }, [open, cfg]); // eslint-disable-line react-hooks/exhaustive-deps

  const err = put.error instanceof ApiError ? put.error : null;
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await put.mutateAsync({
        use_byo_credentials: byo,
        is_active: isActive,
        groq_api_key: byo && groq.trim() ? groq.trim() : null,
        azure_api_key: byo && azureKey.trim() ? azureKey.trim() : null,
        azure_endpoint: byo && azureEndpoint.trim() ? azureEndpoint.trim() : null,
        azure_deployment_name: byo && azureDeployment.trim() ? azureDeployment.trim() : null
      });
      onClose();
    } catch { /* err */ }
  }

  return (
    <Modal open={open} onClose={onClose} title="AI credentials" subtitle="Bring your own LLM keys, or use platform-managed" icon={Bot} accent="teal" widthClassName="max-w-lg">
      <form onSubmit={onSubmit} className="space-y-4" data-testid="ai-config-form">
        <label className="flex items-center gap-2 text-[13px] font-semibold text-cv-ink">
          <input type="checkbox" checked={byo} onChange={(e) => setByo(e.target.checked)} className="h-4 w-4 rounded" data-testid="ai-byo-toggle" />
          Use my own credentials (BYO)
        </label>
        <label className="flex items-center gap-2 text-[13px] font-medium text-cv-ink">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 rounded" />
          AI features active
        </label>
        {byo ? (
          <div className="space-y-3 rounded-2xl bg-white/45 p-3.5 ring-1 ring-white/60">
            <div>
              <label htmlFor="ai-groq" className={labelBase}>Groq API key {cfg?.groq_api_key_configured ? <span className="text-emerald-600">(set — leave blank to keep)</span> : null}</label>
              <input id="ai-groq" type="password" value={groq} onChange={(e) => setGroq(e.target.value)} placeholder="gsk_…" className={inputBase} />
            </div>
            <div>
              <label htmlFor="ai-azkey" className={labelBase}>Azure OpenAI key {cfg?.azure_api_key_configured ? <span className="text-emerald-600">(set — leave blank to keep)</span> : null}</label>
              <input id="ai-azkey" type="password" value={azureKey} onChange={(e) => setAzureKey(e.target.value)} placeholder="…" className={inputBase} />
            </div>
            <div>
              <label htmlFor="ai-azep" className={labelBase}>Azure endpoint</label>
              <input id="ai-azep" value={azureEndpoint} onChange={(e) => setAzureEndpoint(e.target.value)} placeholder="https://…openai.azure.com" className={inputBase} />
            </div>
            <div>
              <label htmlFor="ai-azdep" className={labelBase}>Azure deployment name</label>
              <input id="ai-azdep" value={azureDeployment} onChange={(e) => setAzureDeployment(e.target.value)} placeholder="gpt-4o" className={inputBase} />
            </div>
          </div>
        ) : null}
        <EntitlementBanner error={err} />
        <div className="flex items-center justify-end gap-2.5">
          <button type="button" onClick={onClose} className="cv-ring-focus rounded-full bg-white/70 px-4 py-2 text-xs font-semibold text-cv-ink ring-1 ring-white/70 hover:bg-white">Cancel</button>
          <button type="submit" data-testid="ai-config-submit" disabled={put.isPending} className="cv-ring-focus inline-flex items-center gap-2 rounded-full bg-cv-brand px-4 py-2 text-xs font-bold text-white shadow-button transition hover:-translate-y-0.5 disabled:opacity-70">
            {put.isPending ? <Loader2 size={13} className="animate-spin" /> : null} Save
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─────────────── IP allowlist (POST/DELETE/disable) ───────────────
export function IpAllowlistModal({ open, onClose, data }: { open: boolean; onClose: () => void; data: SettingsData }) {
  const ranges = data.ipAllowlist.data ?? [];
  const add = useCreateIpRange();
  const del = useDeleteIpRange();
  const disable = useDisableIpAllowlist();
  const [cidr, setCidr] = useState("");
  const [label, setLabel] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  useEffect(() => { if (open) { setCidr(""); setLabel(""); setFormError(null); add.reset(); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const err = (add.error ?? del.error ?? disable.error) instanceof ApiError ? ((add.error ?? del.error ?? disable.error) as ApiError) : null;
  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!cidr.trim()) { setFormError("Enter a CIDR range (e.g. 203.0.113.0/24)."); return; }
    try { await add.mutateAsync({ cidr_range: cidr.trim(), label: label.trim() || null }); setCidr(""); setLabel(""); } catch { /* err */ }
  }

  return (
    <Modal open={open} onClose={onClose} title="IP allowlist" subtitle="Restrict access to specific network ranges" icon={Network} accent="blue" widthClassName="max-w-lg">
      <div className="space-y-4">
        <ul className="space-y-2" data-testid="ip-range-list">
          {ranges.length === 0 ? (
            <li className="rounded-2xl bg-white/45 px-3.5 py-2.5 text-[12px] text-cv-mist ring-1 ring-white/60">No ranges — access is open to any IP.</li>
          ) : ranges.map((r) => (
            <li key={r.id} data-testid={`ip-range-${r.id}`} className="flex items-center justify-between gap-2 rounded-2xl bg-white/50 px-3.5 py-2.5 ring-1 ring-white/60">
              <span className="text-[12px] font-semibold text-cv-ink">{r.cidr ?? String(r.cidr_range ?? "")}<span className="ml-2 font-normal text-cv-mist">{r.description ?? String(r.label ?? "")}</span></span>
              <button type="button" data-testid={`ip-range-delete-${r.id}`} onClick={() => del.mutate(r.id)} disabled={del.isPending} className="cv-ring-focus inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/60 text-cv-slate ring-1 ring-white/70 transition hover:text-rose-600 disabled:opacity-60">
                <Trash2 size={12} />
              </button>
            </li>
          ))}
        </ul>
        <form onSubmit={onAdd} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <input value={cidr} onChange={(e) => setCidr(e.target.value)} placeholder="CIDR e.g. 203.0.113.0/24" className={inputBase} data-testid="ip-cidr" />
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label (optional)" className={inputBase} />
          <button type="submit" data-testid="ip-add" disabled={add.isPending} className="cv-ring-focus inline-flex items-center justify-center gap-2 rounded-full bg-cv-brand px-4 py-2 text-xs font-bold text-white shadow-button transition hover:-translate-y-0.5 disabled:opacity-70">
            {add.isPending ? <Loader2 size={13} className="animate-spin" /> : null} Add
          </button>
        </form>
        {formError ? <p className="text-[11px] font-semibold text-rose-600">{formError}</p> : null}
        <EntitlementBanner error={err} />
        <div className="flex items-center justify-between">
          {ranges.length > 0 ? (
            <button type="button" data-testid="ip-disable-all" onClick={() => disable.mutate()} disabled={disable.isPending} className="cv-ring-focus text-[11px] font-semibold text-rose-600 hover:underline disabled:opacity-60">
              Disable allowlist (open access)
            </button>
          ) : <span />}
          <button type="button" onClick={onClose} className="cv-ring-focus rounded-full bg-white/70 px-4 py-2 text-xs font-semibold text-cv-ink ring-1 ring-white/70 hover:bg-white">Done</button>
        </div>
      </div>
    </Modal>
  );
}

// ─────────────── SAML SSO (create/activate/deactivate/test/delete) ───────────────
export function SsoConfigModal({ open, onClose, data }: { open: boolean; onClose: () => void; data: SettingsData }) {
  const cfg = data.sso.data as Record<string, unknown> | null;
  const id = cfgId(cfg);
  const create = useCreateSsoConfig();
  const toggle = useActivateSsoConfig();
  const del = useDeleteSsoConfig();
  const test = useTestSsoConfig();
  const [provider, setProvider] = useState<SsoProvider>("okta");
  const [entityId, setEntityId] = useState("");
  const [ssoUrl, setSsoUrl] = useState("");
  const [sloUrl, setSloUrl] = useState("");
  const [cert, setCert] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [testMsg, setTestMsg] = useState<string | null>(null);
  useEffect(() => { if (open) { setProvider("okta"); setEntityId(""); setSsoUrl(""); setSloUrl(""); setCert(""); setFormError(null); setTestMsg(null); create.reset(); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const err = (create.error ?? toggle.error ?? del.error) instanceof ApiError ? ((create.error ?? toggle.error ?? del.error) as ApiError) : null;
  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!entityId.trim() || !ssoUrl.trim() || !cert.trim()) { setFormError("Entity ID, SSO URL, and certificate are required."); return; }
    try { await create.mutateAsync({ provider, entity_id: entityId.trim(), sso_url: ssoUrl.trim(), slo_url: sloUrl.trim() || null, certificate: cert.trim() }); onClose(); } catch { /* err */ }
  }

  return (
    <Modal open={open} onClose={onClose} title="SAML SSO" subtitle="Configure single sign-on with your identity provider" icon={KeyRound} accent="teal" widthClassName="max-w-lg">
      {id ? (
        <div className="space-y-4" data-testid="sso-configured">
          <div className="flex items-center justify-between rounded-2xl bg-white/50 px-3.5 py-2.5 ring-1 ring-white/60">
            <span className="text-[13px] font-semibold text-cv-ink">SAML SSO</span>
            <StatusBadge label={cfgActive(cfg) ? "active" : "inactive"} tone={cfgActive(cfg) ? "good" : "neutral"} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" data-testid="sso-toggle" onClick={() => toggle.mutate({ id, active: !cfgActive(cfg) })} disabled={toggle.isPending} className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-cv-ink ring-1 ring-white/70 hover:bg-white disabled:opacity-60">
              <CheckCircle2 size={11} /> {cfgActive(cfg) ? "Deactivate" : "Activate"}
            </button>
            <button type="button" data-testid="sso-test" onClick={async () => { setTestMsg(null); try { await test.mutateAsync(id); setTestMsg("Test passed"); } catch (e) { setTestMsg(e instanceof ApiError ? e.message : "Test failed"); } }} disabled={test.isPending} className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-cv-ink ring-1 ring-white/70 hover:bg-white disabled:opacity-60">
              <PlayCircle size={11} /> Test
            </button>
            <button type="button" data-testid="sso-delete" onClick={() => del.mutate(id, { onSuccess: onClose })} disabled={del.isPending} className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-cv-slate ring-1 ring-white/70 hover:text-rose-600 disabled:opacity-60">
              <Trash2 size={11} /> Remove
            </button>
          </div>
          {testMsg ? <p className="text-[11px] font-semibold text-cv-slate">{testMsg}</p> : null}
          <EntitlementBanner error={err} />
        </div>
      ) : (
        <form onSubmit={onCreate} className="space-y-3" data-testid="sso-create-form">
          <div>
            <label htmlFor="sso-provider" className={labelBase}>Identity provider</label>
            <select id="sso-provider" data-testid="sso-provider" value={provider} onChange={(e) => setProvider(e.target.value as SsoProvider)} className={inputBase}>
              {SSO_PROVIDERS.map((p) => (
                <option key={p} value={p}>{SSO_PROVIDER_LABELS[p]}</option>
              ))}
            </select>
          </div>
          <div><label htmlFor="sso-entity" className={labelBase}>Entity ID (IdP issuer)</label><input id="sso-entity" value={entityId} onChange={(e) => setEntityId(e.target.value)} className={inputBase} /></div>
          <div><label htmlFor="sso-url" className={labelBase}>SSO URL</label><input id="sso-url" value={ssoUrl} onChange={(e) => setSsoUrl(e.target.value)} placeholder="https://idp.example.com/sso" className={inputBase} /></div>
          <div><label htmlFor="sso-slo" className={labelBase}>SLO URL (optional)</label><input id="sso-slo" value={sloUrl} onChange={(e) => setSloUrl(e.target.value)} className={inputBase} /></div>
          <div><label htmlFor="sso-cert" className={labelBase}>X.509 certificate</label><textarea id="sso-cert" value={cert} onChange={(e) => setCert(e.target.value)} rows={3} placeholder="-----BEGIN CERTIFICATE-----" className={inputBase} /></div>
          {formError ? <p className="text-[11px] font-semibold text-rose-600">{formError}</p> : null}
          <EntitlementBanner error={err} />
          <div className="flex items-center justify-end gap-2.5">
            <button type="button" onClick={onClose} className="cv-ring-focus rounded-full bg-white/70 px-4 py-2 text-xs font-semibold text-cv-ink ring-1 ring-white/70 hover:bg-white">Cancel</button>
            <button type="submit" data-testid="sso-create-submit" disabled={create.isPending} className="cv-ring-focus inline-flex items-center gap-2 rounded-full bg-cv-brand px-4 py-2 text-xs font-bold text-white shadow-button transition hover:-translate-y-0.5 disabled:opacity-70">
              {create.isPending ? <Loader2 size={13} className="animate-spin" /> : null} Configure SSO
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

// ─────────────── OIDC (create/activate/deactivate/test/delete) ───────────────
export function OidcConfigModal({ open, onClose, data }: { open: boolean; onClose: () => void; data: SettingsData }) {
  const cfg = data.oidc.data as Record<string, unknown> | null;
  const id = cfgId(cfg);
  const create = useCreateOidcConfig();
  const toggle = useActivateOidcConfig();
  const del = useDeleteOidcConfig();
  const test = useTestOidcConfig();
  const [issuer, setIssuer] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [testMsg, setTestMsg] = useState<string | null>(null);
  useEffect(() => { if (open) { setIssuer(""); setClientId(""); setClientSecret(""); setFormError(null); setTestMsg(null); create.reset(); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const err = (create.error ?? toggle.error ?? del.error) instanceof ApiError ? ((create.error ?? toggle.error ?? del.error) as ApiError) : null;
  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!issuer.trim() || !clientId.trim() || !clientSecret.trim()) { setFormError("Issuer URL, client ID, and client secret are required."); return; }
    try { await create.mutateAsync({ provider: "oidc", issuer_url: issuer.trim(), client_id: clientId.trim(), client_secret: clientSecret.trim() }); onClose(); } catch { /* err */ }
  }

  return (
    <Modal open={open} onClose={onClose} title="OIDC" subtitle="Configure OpenID Connect single sign-on" icon={KeyRound} accent="teal" widthClassName="max-w-lg">
      {id ? (
        <div className="space-y-4" data-testid="oidc-configured">
          <div className="flex items-center justify-between rounded-2xl bg-white/50 px-3.5 py-2.5 ring-1 ring-white/60">
            <span className="text-[13px] font-semibold text-cv-ink">OIDC</span>
            <StatusBadge label={cfgActive(cfg) ? "active" : "inactive"} tone={cfgActive(cfg) ? "good" : "neutral"} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" data-testid="oidc-toggle" onClick={() => toggle.mutate({ id, active: !cfgActive(cfg) })} disabled={toggle.isPending} className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-cv-ink ring-1 ring-white/70 hover:bg-white disabled:opacity-60">
              <CheckCircle2 size={11} /> {cfgActive(cfg) ? "Deactivate" : "Activate"}
            </button>
            <button type="button" data-testid="oidc-test" onClick={async () => { setTestMsg(null); try { await test.mutateAsync(id); setTestMsg("Test passed"); } catch (e) { setTestMsg(e instanceof ApiError ? e.message : "Test failed"); } }} disabled={test.isPending} className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-cv-ink ring-1 ring-white/70 hover:bg-white disabled:opacity-60">
              <PlayCircle size={11} /> Test
            </button>
            <button type="button" data-testid="oidc-delete" onClick={() => del.mutate(id, { onSuccess: onClose })} disabled={del.isPending} className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-cv-slate ring-1 ring-white/70 hover:text-rose-600 disabled:opacity-60">
              <Trash2 size={11} /> Remove
            </button>
          </div>
          {testMsg ? <p className="text-[11px] font-semibold text-cv-slate">{testMsg}</p> : null}
          <EntitlementBanner error={err} />
        </div>
      ) : (
        <form onSubmit={onCreate} className="space-y-3" data-testid="oidc-create-form">
          <div><label htmlFor="oidc-issuer" className={labelBase}>Issuer URL</label><input id="oidc-issuer" value={issuer} onChange={(e) => setIssuer(e.target.value)} placeholder="https://idp.example.com" className={inputBase} /></div>
          <div><label htmlFor="oidc-client" className={labelBase}>Client ID</label><input id="oidc-client" value={clientId} onChange={(e) => setClientId(e.target.value)} className={inputBase} /></div>
          <div><label htmlFor="oidc-secret" className={labelBase}>Client secret</label><input id="oidc-secret" type="password" value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} className={inputBase} /></div>
          {formError ? <p className="text-[11px] font-semibold text-rose-600">{formError}</p> : null}
          <EntitlementBanner error={err} />
          <div className="flex items-center justify-end gap-2.5">
            <button type="button" onClick={onClose} className="cv-ring-focus rounded-full bg-white/70 px-4 py-2 text-xs font-semibold text-cv-ink ring-1 ring-white/70 hover:bg-white">Cancel</button>
            <button type="submit" data-testid="oidc-create-submit" disabled={create.isPending} className="cv-ring-focus inline-flex items-center gap-2 rounded-full bg-cv-brand px-4 py-2 text-xs font-bold text-white shadow-button transition hover:-translate-y-0.5 disabled:opacity-70">
              {create.isPending ? <Loader2 size={13} className="animate-spin" /> : null} Configure OIDC
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
