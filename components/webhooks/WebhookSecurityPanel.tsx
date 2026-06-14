"use client";

import { ShieldCheck } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeWebhookSecurity } from "@/lib/api/webhook-normalizers";
import { formatDate } from "@/lib/utils/format";
import type { WebhooksData } from "@/lib/hooks/useWebhooks";

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/50 py-2.5 last:border-0">
      <span className="text-[12px] font-semibold text-cv-slate">{label}</span>
      <span className={`text-right text-[13px] ${value ? "font-semibold text-cv-ink" : "text-cv-mist"}`}>{value || "Unavailable"}</span>
    </div>
  );
}

export function WebhookSecurityPanel({ data }: { data: WebhooksData }) {
  const { summary } = data;
  const s = normalizeWebhookSecurity(summary.data);

  return (
    <SectionCard title="Delivery Security" subtitle="Signing & retry configuration" icon={ShieldCheck} accent="teal" className="h-full">
      {summary.isLoading ? (
        <SkeletonRows rows={4} />
      ) : !s.hasAny ? (
        <EmptyState icon={ShieldCheck} title="Security configuration unavailable" description="Signing, secret rotation, and retry policy will appear here once the backend reports them. Secrets are never displayed." />
      ) : (
        <div>
          <div className="flex items-center justify-between gap-4 border-b border-white/50 py-2.5">
            <span className="text-[12px] font-semibold text-cv-slate">Request signing</span>
            {s.signingEnabled == null ? (
              <span className="text-[13px] text-cv-mist">Unavailable</span>
            ) : (
              <StatusBadge label={s.signingEnabled ? "Enabled" : "Disabled"} tone={s.signingEnabled ? "good" : "neutral"} />
            )}
          </div>
          <Row label="Secret rotation" value={s.secretRotation} />
          <Row label="Last rotated" value={formatDate(s.lastRotated)} />
          <Row label="Retry policy" value={s.retryPolicy} />
          <Row label="Authentication" value={s.authMethod} />
        </div>
      )}
    </SectionCard>
  );
}
