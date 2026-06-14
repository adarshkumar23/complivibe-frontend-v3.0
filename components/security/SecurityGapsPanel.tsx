"use client";

import { ShieldAlert, ShieldCheck } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeSecurity, normalizeHealth, healthTone, normalizeSecurityFindings } from "@/lib/api/security-normalizers";
import type { SecurityData } from "@/lib/hooks/useSecurity";

type Gap = { id: string; label: string; severity: string | null };

export function SecurityGapsPanel({ data }: { data: SecurityData }) {
  const { securitySettings, health, readiness, scan } = data;

  const sec = normalizeSecurity(securitySettings.data);
  const h = normalizeHealth(health.data, readiness.data, scan.data);
  const findings = scan.isSuccess ? normalizeSecurityFindings(scan.data) : [];

  const anySource = securitySettings.isSuccess || health.isSuccess || readiness.isSuccess || scan.isSuccess;
  const loading = securitySettings.isLoading && health.isLoading && scan.isLoading;

  const gaps: Gap[] = [];
  // Only explicit, real backend signals — never inferred from missing data.
  if (sec.mfaEnabled === false) gaps.push({ id: "mfa", label: "Multi-factor auth is disabled", severity: "high" });
  if (sec.auditLogging === false) gaps.push({ id: "audit", label: "Audit logging is disabled", severity: "medium" });
  if (h.monitoring && healthTone(h.monitoring) === "bad") gaps.push({ id: "monitoring", label: `Monitoring: ${h.monitoring}`, severity: "medium" });
  if (h.backup && healthTone(h.backup) === "bad") gaps.push({ id: "backup", label: `Backup: ${h.backup}`, severity: "high" });
  for (const f of findings) gaps.push({ id: `scan-${f.id}`, label: f.title, severity: f.severity });

  return (
    <SectionCard title="Security Gaps" subtitle="Failed checks & scan findings" icon={ShieldAlert} accent="red" className="h-full">
      {loading ? (
        <SkeletonRows rows={4} />
      ) : !anySource ? (
        <EmptyState icon={ShieldAlert} title="Security gap data unavailable from backend." description="Failed checks, disabled controls, and scan findings will appear here once the backend reports them." />
      ) : gaps.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No security gaps reported" description="No disabled controls or scan findings were returned by the backend." />
      ) : (
        <ul className="max-h-[420px] space-y-2.5 overflow-y-auto pr-1">
          {gaps.map((g) => (
            <li key={g.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/55 px-3 py-2.5 ring-1 ring-white/60">
              <span className="min-w-0 truncate text-[13px] font-semibold text-cv-ink">{g.label}</span>
              {g.severity ? <StatusBadge label={g.severity} tone={/(high|critical)/i.test(g.severity) ? "bad" : /(medium|moderate)/i.test(g.severity) ? "warn" : "neutral"} /> : null}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
