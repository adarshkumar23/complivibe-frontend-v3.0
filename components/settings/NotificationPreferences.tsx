"use client";

import { useEffect, useState } from "react";
import { BellRing, Loader2, Check, TriangleAlert } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { updateNotificationSettings } from "@/lib/api/settings";
import { ApiError } from "@/lib/api/client";
import { normalizeNotifications } from "@/lib/api/settings-normalizers";
import { cn } from "@/lib/utils/cn";
import type { SettingsData } from "@/lib/hooks/useSettings";

type State = "idle" | "saving" | "success" | "error" | "unavailable";

const ROWS: { key: string; label: string; payloadKey: string }[] = [
  { key: "email", label: "Email notifications", payloadKey: "email_notifications" },
  { key: "compliance", label: "Compliance alerts", payloadKey: "compliance_alerts" },
  { key: "risk", label: "Risk alerts", payloadKey: "risk_alerts" },
  { key: "incident", label: "Incident alerts", payloadKey: "incident_alerts" },
  { key: "report", label: "Report generation alerts", payloadKey: "report_generation_alerts" },
  { key: "weeklySummary", label: "Weekly summary", payloadKey: "weekly_summary" }
];

function Switch({ checked, disabled, onChange }: { checked: boolean; disabled?: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50",
        checked ? "bg-cv-brand" : "bg-slate-300/70"
      )}
    >
      <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", checked ? "left-[22px]" : "left-0.5")} />
    </button>
  );
}

export function NotificationPreferences({ data }: { data: SettingsData }) {
  const { notifications } = data;
  const notif = normalizeNotifications(notifications.data);
  const available = notif.hasAny && !notifications.isError;

  const [form, setForm] = useState<Record<string, boolean>>({});
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setForm({
      email: notif.email ?? false,
      compliance: notif.compliance ?? false,
      risk: notif.risk ?? false,
      incident: notif.incident ?? false,
      report: notif.report ?? false,
      weeklySummary: notif.weeklySummary ?? false
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications.data]);

  async function handleSave() {
    setState("saving");
    setMessage(null);
    const payload: Record<string, unknown> = {};
    for (const r of ROWS) payload[r.payloadKey] = form[r.key];
    try {
      await updateNotificationSettings(payload);
      setState("success");
      setMessage("Notification preferences saved.");
      notifications.refetch();
    } catch (err) {
      if (err instanceof ApiError && [404, 405, 501].includes(err.status)) {
        setState("unavailable");
        setMessage("Saving notifications is not available on this backend yet.");
      } else {
        setState("error");
        setMessage(err instanceof ApiError ? err.message : "Save failed. Please try again.");
      }
    }
  }

  return (
    <SectionCard title="Notification Preferences" subtitle="Choose what you're alerted about" icon={BellRing} accent="amber" className="h-full">
      {notifications.isLoading ? (
        <SkeletonRows rows={5} />
      ) : notifications.isError && !notif.hasAny ? (
        <ErrorState title="Unable to load notifications" onRetry={() => notifications.refetch()} />
      ) : (
        <div className="space-y-2">
          {!available ? (
            <p className="mb-2 rounded-xl bg-amber-400/12 px-3 py-2 text-[11px] font-medium text-amber-700 ring-1 ring-amber-400/25">
              Notification settings are unavailable on this backend — controls are read-only.
            </p>
          ) : null}
          {ROWS.map((r) => (
            <div key={r.key} className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2 ring-1 ring-white/60">
              <span className="text-[13px] font-semibold text-cv-ink">{r.label}</span>
              <Switch checked={Boolean(form[r.key])} disabled={!available} onChange={(v) => setForm((prev) => ({ ...prev, [r.key]: v }))} />
            </div>
          ))}
          {available ? (
            <button
              type="button"
              onClick={handleSave}
              disabled={state === "saving"}
              className="cv-ring-focus mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-cv-brand py-2.5 text-sm font-bold text-white shadow-button transition hover:-translate-y-0.5 disabled:opacity-70"
            >
              {state === "saving" ? <Loader2 size={15} className="animate-spin" /> : null}
              {state === "saving" ? "Saving…" : "Save preferences"}
            </button>
          ) : null}
          {state !== "idle" && state !== "saving" && message ? (
            <p className={cn("flex items-center gap-1.5 text-[12px] font-medium", state === "success" ? "text-emerald-600" : state === "unavailable" ? "text-amber-600" : "text-rose-600")}>
              {state === "success" ? <Check size={13} /> : <TriangleAlert size={13} />}
              {message}
            </p>
          ) : null}
        </div>
      )}
    </SectionCard>
  );
}
