"use client";

import { useState } from "react";
import { Users, KeyRound, MonitorSmartphone, Building2, Bot, Loader2, LogOut } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { formatRelativeTime } from "@/lib/utils/format";
import { useHasPermission } from "@/lib/hooks/usePermissions";
import { useRevokeSession, type SettingsData } from "@/lib/hooks/useSettings";
import { AiConfigModal, IpAllowlistModal, SsoConfigModal, OidcConfigModal } from "@/components/settings/SettingsWriteModals";

/** Org + workspace identity from GET /api/v1/organizations/me. */
export function OrgProfilePanel({ data }: { data: SettingsData }) {
  const { orgs } = data;
  const org = orgs.data?.[0];

  return (
    <SectionCard title="Organization" subtitle="Workspace identity" icon={Building2} accent="blue">
      {orgs.isLoading ? (
        <SkeletonRows rows={2} />
      ) : orgs.isError ? (
        <ErrorState compact title="Unable to load organization" onRetry={() => orgs.refetch()} />
      ) : org ? (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
            <span className="text-[13px] font-semibold text-cv-ink">Name</span>
            <span className="text-[12px] font-medium text-cv-slate">{org.name}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
            <span className="text-[13px] font-semibold text-cv-ink">Slug</span>
            <span className="text-[12px] font-medium text-cv-slate">{org.slug}</span>
          </div>
        </div>
      ) : (
        <EmptyState compact icon={Building2} title="No organization" description="You are not a member of any organization." />
      )}
    </SectionCard>
  );
}

/** Team from GET /api/v1/memberships. */
export function TeamPanel({ data }: { data: SettingsData }) {
  const { memberships } = data;
  const list = memberships.data ?? [];

  return (
    <SectionCard
      title="Team"
      subtitle="Members and their roles"
      icon={Users}
      accent="purple"
      className="h-full"
      action={
        memberships.isSuccess ? (
          <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">
            {list.length} members
          </span>
        ) : null
      }
    >
      {memberships.isLoading ? (
        <SkeletonRows rows={4} />
      ) : memberships.isError ? (
        <ErrorState compact title="Unable to load team" onRetry={() => memberships.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState compact icon={Users} title="No members" description="Invite teammates to collaborate." />
      ) : (
        <ul className="space-y-2.5">
          {list.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-cv-ink">{m.user?.full_name ?? m.user?.email ?? m.user_id}</p>
                <p className="text-[11px] text-cv-slate">{m.user?.email}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {m.role_name ? <StatusBadge label={m.role_name} tone="info" /> : null}
                <StatusBadge label={m.status} tone={m.status === "active" ? "good" : "warn"} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

function ConfigureBtn({ label, testid, onClick, disabled }: { label: string; testid: string; onClick: () => void; disabled?: boolean }) {
  if (disabled) return null;
  return (
    <button type="button" data-testid={testid} onClick={onClick} className="cv-ring-focus rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-cv-blue ring-1 ring-white/70 transition hover:bg-white">
      {label}
    </button>
  );
}

/** Auth surface: SSO, OIDC, IP allowlist, AI credentials — each read + WRITE. */
export function AuthConfigPanel({ data }: { data: SettingsData }) {
  const { sso, oidc, ipAllowlist, aiConfig } = data;
  const loading = sso.isLoading || oidc.isLoading || ipAllowlist.isLoading || aiConfig.isLoading;
  // SSO/OIDC/IP writes require org:update; AI credentials require compliance:write.
  const canOrg = useHasPermission("org:update");
  const canAi = useHasPermission("compliance:write");
  const [modal, setModal] = useState<null | "sso" | "oidc" | "ip" | "ai">(null);

  return (
    <SectionCard title="Access & Credentials" subtitle="SSO, OIDC, network policy, AI keys" icon={KeyRound} accent="teal">
      {loading ? (
        <SkeletonRows rows={4} />
      ) : (
        <ul className="space-y-2.5">
          <li className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
            <span className="text-[13px] font-semibold text-cv-ink">SAML SSO</span>
            <div className="flex items-center gap-2">
              <StatusBadge label={sso.data ? "Configured" : "Not configured"} tone={sso.data ? "good" : "neutral"} />
              <ConfigureBtn label={sso.data ? "Manage" : "Configure"} testid="sso-open" onClick={() => setModal("sso")} disabled={!canOrg} />
            </div>
          </li>
          <li className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
            <span className="text-[13px] font-semibold text-cv-ink">OIDC</span>
            <div className="flex items-center gap-2">
              <StatusBadge label={oidc.data ? "Configured" : "Not configured"} tone={oidc.data ? "good" : "neutral"} />
              <ConfigureBtn label={oidc.data ? "Manage" : "Configure"} testid="oidc-open" onClick={() => setModal("oidc")} disabled={!canOrg} />
            </div>
          </li>
          <li className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
            <span className="text-[13px] font-semibold text-cv-ink">IP allowlist</span>
            <div className="flex items-center gap-2">
              <StatusBadge
                label={ipAllowlist.data && ipAllowlist.data.length > 0 ? `${ipAllowlist.data.length} ranges` : "Open"}
                tone={ipAllowlist.data && ipAllowlist.data.length > 0 ? "good" : "neutral"}
              />
              <ConfigureBtn label="Manage" testid="ip-open" onClick={() => setModal("ip")} disabled={!canOrg} />
            </div>
          </li>
          <li className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
            <span className="flex items-center gap-1.5 text-[13px] font-semibold text-cv-ink">
              <Bot size={13} /> AI credentials
            </span>
            <div className="flex items-center gap-2">
              <StatusBadge
                label={
                  aiConfig.data
                    ? aiConfig.data.use_byo_credentials
                      ? aiConfig.data.groq_api_key_configured || aiConfig.data.azure_api_key_configured
                        ? "BYO keys set"
                        : "BYO enabled, keys missing"
                      : "Platform-managed"
                    : "Unavailable"
                }
                tone={aiConfig.data?.is_active ? "good" : "neutral"}
              />
              <ConfigureBtn label="Edit" testid="ai-open" onClick={() => setModal("ai")} disabled={!canAi} />
            </div>
          </li>
        </ul>
      )}
      <SsoConfigModal open={modal === "sso"} onClose={() => setModal(null)} data={data} />
      <OidcConfigModal open={modal === "oidc"} onClose={() => setModal(null)} data={data} />
      <IpAllowlistModal open={modal === "ip"} onClose={() => setModal(null)} data={data} />
      <AiConfigModal open={modal === "ai"} onClose={() => setModal(null)} data={data} />
    </SectionCard>
  );
}

/** Active sessions from GET /api/v1/sessions, with per-session revoke (DELETE /sessions/{id}). */
export function SessionsPanel({ data }: { data: SettingsData }) {
  const { sessions } = data;
  const list = sessions.data ?? [];
  const revoke = useRevokeSession();

  return (
    <SectionCard title="Active Sessions" subtitle="Where this account is signed in" icon={MonitorSmartphone} accent="amber">
      {sessions.isLoading ? (
        <SkeletonRows rows={3} />
      ) : sessions.isError ? (
        <ErrorState compact title="Unable to load sessions" onRetry={() => sessions.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState compact icon={MonitorSmartphone} title="No active sessions" description="Session records will appear here." />
      ) : (
        <ul className="space-y-2.5">
          {list.slice(0, 6).map((s) => (
            <li key={s.id} data-testid={`session-${s.id}`} className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-cv-ink">{s.ip_address ?? "Unknown IP"}</p>
                <p className="truncate text-[11px] text-cv-slate">{s.user_agent ?? "Unknown client"}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {s.created_at ? (
                  <span className="text-[11px] font-medium text-cv-mist">{formatRelativeTime(String(s.created_at))}</span>
                ) : null}
                <button
                  type="button"
                  data-testid={`session-revoke-${s.id}`}
                  onClick={() => revoke.mutate(s.id)}
                  disabled={revoke.isPending}
                  title="Revoke this session"
                  className="cv-ring-focus inline-flex items-center gap-1 rounded-full bg-white/60 px-2.5 py-1 text-[11px] font-semibold text-cv-slate ring-1 ring-white/70 transition hover:bg-white hover:text-rose-600 disabled:opacity-60"
                >
                  {revoke.isPending ? <Loader2 size={10} className="animate-spin" /> : <LogOut size={10} />} Revoke
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
