"use client";

import { SlidersHorizontal, Settings2 } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { boolFrom } from "@/lib/api/settings-normalizers";
import { getStringFromPaths } from "@/lib/api/normalizers";
import type { NotificationsData } from "@/lib/hooks/useNotifications";

function BoolRow({ label, value }: { label: string; value: boolean | null }) {
  if (value == null) return null;
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/50 py-2.5 last:border-0">
      <span className="text-[12px] font-semibold text-cv-slate">{label}</span>
      <StatusBadge label={value ? "Enabled" : "Disabled"} tone={value ? "good" : "neutral"} />
    </div>
  );
}

function TextRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/50 py-2.5 last:border-0">
      <span className="text-[12px] font-semibold text-cv-slate">{label}</span>
      <span className="text-right text-[13px] font-semibold capitalize text-cv-ink">{value}</span>
    </div>
  );
}

export function NotificationSettingsPanel({ data }: { data: NotificationsData }) {
  const { settings } = data;
  const d = settings.data;

  // Channel/preference metadata only — never raw tokens or webhook URLs.
  const email = boolFrom(d, ["email_notifications", "email", "email_enabled"]);
  const inApp = boolFrom(d, ["in_app", "in_app_enabled", "inapp", "in_app_notifications"]);
  const slack = boolFrom(d, ["slack_enabled", "slack", "slack_notifications"]);
  const telegram = boolFrom(d, ["telegram_enabled", "telegram"]);
  const webhook = boolFrom(d, ["webhook_enabled", "webhook_configured", "webhook"]);
  const digest = getStringFromPaths(d, ["digest_frequency", "digest", "frequency", "summary_frequency"]);
  const threshold = getStringFromPaths(d, ["severity_threshold", "min_severity", "threshold", "alert_threshold"]);

  const hasAny = [email, inApp, slack, telegram, webhook].some((v) => v != null) || Boolean(digest) || Boolean(threshold);

  return (
    <SectionCard
      title="Notification Settings"
      subtitle="Channels & delivery preferences"
      icon={SlidersHorizontal}
      accent="teal"
      className="h-full"
      action={
        <button type="button" disabled title="Action endpoint unavailable" className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full bg-white/55 px-2.5 py-1.5 text-[11px] font-semibold text-cv-mist ring-1 ring-white/60">
          <Settings2 size={12} /> Update
        </button>
      }
    >
      {settings.isLoading ? (
        <SkeletonRows rows={4} />
      ) : !hasAny ? (
        <EmptyState icon={SlidersHorizontal} title="Notification settings unavailable from backend." description="Channels, digest frequency, and severity threshold will appear here once the backend returns them. Tokens and webhook URLs are never displayed." />
      ) : (
        <div>
          <BoolRow label="Email" value={email} />
          <BoolRow label="In-app" value={inApp} />
          <BoolRow label="Slack" value={slack} />
          <BoolRow label="Telegram" value={telegram} />
          <BoolRow label="Webhook" value={webhook} />
          <TextRow label="Digest frequency" value={digest} />
          <TextRow label="Severity threshold" value={threshold} />
        </div>
      )}
    </SectionCard>
  );
}
