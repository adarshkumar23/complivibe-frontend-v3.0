"use client";

import { ShieldCheck } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeSecurity } from "@/lib/api/settings-normalizers";
import type { SettingsData } from "@/lib/hooks/useSettings";

function BoolRow({ label, value }: { label: string; value: boolean | null }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/50 py-2.5 last:border-0">
      <span className="text-[12px] font-semibold text-cv-slate">{label}</span>
      {value == null ? (
        <span className="text-[12px] text-cv-mist">Unavailable</span>
      ) : (
        <StatusBadge label={value ? "Enabled" : "Disabled"} tone={value ? "good" : "neutral"} />
      )}
    </div>
  );
}

function TextRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/50 py-2.5 last:border-0">
      <span className="text-[12px] font-semibold text-cv-slate">{label}</span>
      <span className={`text-right text-[13px] capitalize ${value ? "font-semibold text-cv-ink" : "text-cv-mist"}`}>{value || "Unavailable"}</span>
    </div>
  );
}

export function SecuritySettings({ data }: { data: SettingsData }) {
  const { security, settings } = data;
  const s = normalizeSecurity(security.data, settings.data);

  return (
    <SectionCard title="Security Settings" subtitle="Account protection controls" icon={ShieldCheck} accent="teal" className="h-full">
      {security.isLoading ? (
        <SkeletonRows rows={5} />
      ) : security.isError && !s.hasAny ? (
        <ErrorState title="Unable to load security settings" onRetry={() => security.refetch()} />
      ) : !s.hasAny ? (
        <EmptyState icon={ShieldCheck} title="No security settings" description="MFA, SSO, session, and policy controls will appear here once the backend returns them." />
      ) : (
        <div>
          <BoolRow label="Multi-factor auth" value={s.mfaEnabled} />
          <TextRow label="Single sign-on" value={s.ssoStatus} />
          <TextRow label="Session timeout" value={s.sessionTimeout} />
          <TextRow label="Password policy" value={s.passwordPolicy} />
          <BoolRow label="Audit logging" value={s.auditLogging} />
          <TextRow label="IP allowlist" value={s.ipAllowlist} />
        </div>
      )}
    </SectionCard>
  );
}
