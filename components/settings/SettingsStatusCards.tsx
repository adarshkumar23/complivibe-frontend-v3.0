"use client";

import { CircleCheck, Users, Plug, ShieldCheck, BellRing, KeyRound, type LucideIcon } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { IconTile } from "@/components/ui/IconTile";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { getStringFromPaths } from "@/lib/api/normalizers";
import { normalizeTeam, normalizeIntegrations, normalizeApiKeys, normalizeSecurity, normalizeNotifications } from "@/lib/api/settings-normalizers";
import type { Accent } from "@/components/ui/accent";
import type { SettingsData } from "@/lib/hooks/useSettings";

function Card({
  icon,
  accent,
  label,
  value,
  display,
  loading,
  unavailableHint = "Unavailable"
}: {
  icon: LucideIcon;
  accent: Accent;
  label: string;
  value: number | null;
  display?: string | null;
  loading?: boolean;
  unavailableHint?: string;
}) {
  const isText = display !== undefined;
  const has = isText ? Boolean(display) : value != null;
  return (
    <GlassCard hover className="flex flex-col gap-3 p-4">
      <IconTile icon={icon} accent={accent} size="sm" />
      <div>
        <p className="text-[12px] font-semibold text-cv-slate">{label}</p>
        {loading ? (
          <LoadingSkeleton className="mt-2 h-7 w-16" />
        ) : has ? (
          isText ? (
            <p className="mt-1 text-lg font-extrabold capitalize leading-tight text-cv-ink">{display}</p>
          ) : (
            <p className="mt-1 text-[26px] font-extrabold leading-none text-cv-ink">{value}</p>
          )
        ) : (
          <div className="mt-1.5">
            <span className="text-2xl font-extrabold leading-none text-cv-mist">—</span>
            <p className="mt-1 inline-flex items-center rounded-full bg-slate-400/10 px-2 py-0.5 text-[10px] font-semibold text-cv-slate ring-1 ring-slate-400/15">
              {unavailableHint}
            </p>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

export function SettingsStatusCards({ data }: { data: SettingsData }) {
  const { settings, organization, team, integrations, apiKeys, security, notifications } = data;

  // Only real, backend-provided status — never fall back to "Active".
  const workspaceStatus =
    getStringFromPaths(settings.data, ["status", "workspace_status", "plan", "state"]) ||
    getStringFromPaths(organization.data, ["status", "plan", "state"]);

  const memberCount = team.isSuccess ? normalizeTeam(team.data).length : null;
  const integ = normalizeIntegrations(integrations.data);
  // Count only integrations whose status is present AND a real connected value; missing status is never "connected".
  const activeIntegrations = integrations.isSuccess
    ? integ.filter((i) => i.status != null && /connect|active|enabled|ok|live|synced/i.test(i.status)).length
    : null;
  const sec = normalizeSecurity(security.data, settings.data);
  const securityControls = security.isSuccess || sec.hasAny ? [sec.mfaEnabled, sec.ssoStatus, sec.sessionTimeout, sec.passwordPolicy, sec.auditLogging, sec.ipAllowlist].filter((v) => v != null).length : null;
  const notif = normalizeNotifications(notifications.data);
  const notifRules = notifications.isSuccess || notif.hasAny ? [notif.email, notif.compliance, notif.risk, notif.incident, notif.report, notif.weeklySummary].filter((v) => v != null).length : null;
  const keyCount = apiKeys.isSuccess ? normalizeApiKeys(apiKeys.data).length : null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
      <Card icon={CircleCheck} accent="green" label="Workspace Status" value={null} display={workspaceStatus} loading={settings.isLoading && organization.isLoading} unavailableHint="Unknown" />
      <Card icon={Users} accent="blue" label="Team Members" value={memberCount} loading={team.isLoading} unavailableHint="Team unavailable" />
      <Card icon={Plug} accent="purple" label="Active Integrations" value={activeIntegrations} loading={integrations.isLoading} unavailableHint="Unavailable" />
      <Card icon={ShieldCheck} accent="teal" label="Security Controls" value={securityControls} loading={security.isLoading} unavailableHint="Unavailable" />
      <Card icon={BellRing} accent="amber" label="Notification Rules" value={notifRules} loading={notifications.isLoading} unavailableHint="Unavailable" />
      <Card icon={KeyRound} accent="cyan" label="API Keys" value={keyCount} loading={apiKeys.isLoading} unavailableHint="Unavailable" />
    </div>
  );
}
