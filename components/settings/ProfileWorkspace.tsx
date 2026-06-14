"use client";

import { UserCog } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeProfile } from "@/lib/api/settings-normalizers";
import { formatDate } from "@/lib/utils/format";
import type { SettingsData } from "@/lib/hooks/useSettings";

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/50 py-2.5 last:border-0">
      <span className="text-[12px] font-semibold text-cv-slate">{label}</span>
      <span className={`text-right text-[13px] ${value ? "font-semibold text-cv-ink" : "text-cv-mist"}`}>{value || "Not provided"}</span>
    </div>
  );
}

export function ProfileWorkspace({ data }: { data: SettingsData }) {
  const { profile, settings } = data;
  const p = normalizeProfile(profile.data, settings.data);
  const rows = [
    { label: "Name", value: p.name },
    { label: "Email", value: p.email },
    { label: "Role", value: p.role },
    { label: "Workspace", value: p.workspaceName },
    { label: "Organization", value: p.orgName },
    { label: "Timezone", value: p.timezone },
    { label: "Locale", value: p.locale },
    { label: "Member since", value: formatDate(p.createdAt) }
  ];
  const hasAny = rows.some((r) => r.value);

  return (
    <SectionCard title="Profile & Workspace" subtitle="Your account details" icon={UserCog} accent="blue" className="h-full">
      {profile.isLoading ? (
        <SkeletonRows rows={5} />
      ) : profile.isError && !hasAny ? (
        <ErrorState title="Unable to load profile" onRetry={() => profile.refetch()} />
      ) : !hasAny ? (
        <EmptyState icon={UserCog} title="No profile details" description="Profile and workspace fields will appear here once the backend provides them." />
      ) : (
        <div>
          {rows.map((r) => (
            <Row key={r.label} label={r.label} value={r.value} />
          ))}
        </div>
      )}
    </SectionCard>
  );
}
