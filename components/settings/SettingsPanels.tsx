"use client";

import { Users, KeyRound, MonitorSmartphone, Building2, Bot } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { formatRelativeTime } from "@/lib/utils/format";
import type { SettingsData } from "@/lib/hooks/useSettings";

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

/** Auth surface: SSO, OIDC, IP allowlist, AI credentials — each from its real endpoint. */
export function AuthConfigPanel({ data }: { data: SettingsData }) {
  const { sso, oidc, ipAllowlist, aiConfig } = data;
  const loading = sso.isLoading || oidc.isLoading || ipAllowlist.isLoading || aiConfig.isLoading;

  return (
    <SectionCard title="Access & Credentials" subtitle="SSO, OIDC, network policy, AI keys" icon={KeyRound} accent="teal">
      {loading ? (
        <SkeletonRows rows={4} />
      ) : (
        <ul className="space-y-2.5">
          <li className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
            <span className="text-[13px] font-semibold text-cv-ink">SAML SSO</span>
            <StatusBadge label={sso.data ? "Configured" : "Not configured"} tone={sso.data ? "good" : "neutral"} />
          </li>
          <li className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
            <span className="text-[13px] font-semibold text-cv-ink">OIDC</span>
            <StatusBadge label={oidc.data ? "Configured" : "Not configured"} tone={oidc.data ? "good" : "neutral"} />
          </li>
          <li className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
            <span className="text-[13px] font-semibold text-cv-ink">IP allowlist</span>
            <StatusBadge
              label={ipAllowlist.data && ipAllowlist.data.length > 0 ? `${ipAllowlist.data.length} ranges` : "Open"}
              tone={ipAllowlist.data && ipAllowlist.data.length > 0 ? "good" : "neutral"}
            />
          </li>
          <li className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
            <span className="flex items-center gap-1.5 text-[13px] font-semibold text-cv-ink">
              <Bot size={13} /> AI credentials
            </span>
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
          </li>
        </ul>
      )}
    </SectionCard>
  );
}

/** Active sessions from GET /api/v1/sessions. */
export function SessionsPanel({ data }: { data: SettingsData }) {
  const { sessions } = data;
  const list = sessions.data ?? [];

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
            <li key={s.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-cv-ink">{s.ip_address ?? "Unknown IP"}</p>
                <p className="truncate text-[11px] text-cv-slate">{s.user_agent ?? "Unknown client"}</p>
              </div>
              {s.created_at ? (
                <span className="shrink-0 text-[11px] font-medium text-cv-mist">{formatRelativeTime(String(s.created_at))}</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
