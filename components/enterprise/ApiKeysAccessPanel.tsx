"use client";

import { KeyRound, RefreshCw, Power } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeApiKeys } from "@/lib/api/enterprise-normalizers";
import { formatRelativeTime } from "@/lib/utils/format";
import type { EnterpriseData } from "@/lib/hooks/useEnterpriseControl";

/** No backend action endpoint exists — disabled, never fakes a result. Raw key values are never read. */
function DisabledAction({ icon: Icon, label }: { icon: typeof RefreshCw; label: string }) {
  return (
    <button type="button" disabled title="Action endpoint unavailable" className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full bg-white/55 px-2.5 py-1.5 text-[11px] font-semibold text-cv-mist ring-1 ring-white/60">
      <Icon size={12} /> {label}
    </button>
  );
}

export function ApiKeysAccessPanel({ data }: { data: EnterpriseData }) {
  const { apiKeys } = data;
  const keys = normalizeApiKeys(apiKeys.data);

  return (
    <SectionCard title="API Keys & Access" subtitle="Key metadata (values masked)" icon={KeyRound} accent="cyan" className="h-full">
      {apiKeys.isLoading ? (
        <SkeletonRows rows={4} />
      ) : apiKeys.isError ? (
        <ErrorState title="API keys unavailable" onRetry={() => apiKeys.refetch()} />
      ) : keys.length === 0 ? (
        <EmptyState icon={KeyRound} title="No API keys" description="API key metadata will appear here. Full key values are never displayed." />
      ) : (
        <ul className="max-h-[420px] space-y-2.5 overflow-y-auto pr-1">
          {keys.slice(0, 10).map((k) => (
            <li key={k.id} className="rounded-2xl bg-white/55 px-3.5 py-2.5 ring-1 ring-white/70">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-[13px] font-semibold text-cv-ink">{k.name}</p>
                {k.status ? <StatusBadge label={k.status} tone={/active|enabled/i.test(k.status) ? "good" : "neutral"} /> : null}
              </div>
              <div className="mt-1 flex items-center justify-between gap-3">
                <code className="rounded-md bg-slate-900/5 px-2 py-0.5 font-mono text-[11px] tracking-wider text-cv-slate">{k.masked}</code>
                <span className="text-[11px] text-cv-mist">{k.lastUsed ? `Used ${formatRelativeTime(k.lastUsed)}` : k.createdAt ? `Created ${formatRelativeTime(k.createdAt)}` : ""}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 border-t border-white/50 pt-2">
                <DisabledAction icon={RefreshCw} label="Rotate" />
                <DisabledAction icon={Power} label="Disable" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
