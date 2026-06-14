"use client";

import { Database, ShieldAlert, EyeOff, Clock, Activity, type LucideIcon } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { IconTile } from "@/components/ui/IconTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { sensitiveSignals, normalizeDataCategories, sensitivityTone } from "@/lib/api/privacy-normalizers";
import type { Accent } from "@/components/ui/accent";
import type { PrivacyData } from "@/lib/hooks/usePrivacy";

export function DataMapPanel({ data }: { data: PrivacyData }) {
  const { sensitive, dataMap } = data;
  const sig = sensitive.isSuccess ? sensitiveSignals(sensitive.data) : null;
  // Categories are metadata only — never raw PII values.
  const categories = normalizeDataCategories(dataMap.isSuccess ? dataMap.data : sensitive.data);

  const tiles: { label: string; value: number | null; icon: LucideIcon; accent: Accent }[] = [
    { label: "PII findings", value: sig?.pii ?? null, icon: ShieldAlert, accent: "red" },
    { label: "Exposure risks", value: sig?.exposure ?? null, icon: EyeOff, accent: "amber" },
    { label: "Access anomalies", value: sig?.accessAnomalies ?? null, icon: Activity, accent: "purple" },
    { label: "Retention items", value: sig?.retention ?? null, icon: Clock, accent: "blue" }
  ];
  const anySignal = tiles.some((t) => t.value != null);
  const loading = sensitive.isLoading && dataMap.isLoading;

  return (
    <SectionCard title="Data Map & Sensitive Data" subtitle="Categories & signals (metadata only)" icon={Database} accent="amber">
      {loading ? (
        <SkeletonRows rows={4} />
      ) : !anySignal && categories.length === 0 ? (
        <EmptyState icon={Database} title="Sensitive data signals unavailable from backend." description="Data categories and sensitivity signals will appear here once the backend reports them. Raw values are never displayed." />
      ) : (
        <div className="flex flex-col gap-4">
          {anySignal ? (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {tiles.map((t) => (
                <div key={t.label} className="flex items-center gap-2.5 rounded-xl bg-white/55 px-3 py-2.5 ring-1 ring-white/60">
                  <IconTile icon={t.icon} accent={t.accent} size="sm" />
                  <div className="min-w-0">
                    <p className={`text-lg font-extrabold leading-none ${t.value != null ? "text-cv-ink" : "text-cv-mist"}`}>{t.value != null ? t.value : "—"}</p>
                    <p className="mt-0.5 truncate text-[11px] font-medium text-cv-slate">{t.label}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {categories.length > 0 ? (
            <ul className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
              {categories.slice(0, 16).map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-cv-ink">{c.category}</p>
                    <p className="truncate text-[11px] text-cv-slate">{[c.source, c.count != null ? `${c.count} records` : null, c.status].filter(Boolean).join(" · ") || "—"}</p>
                  </div>
                  {c.sensitivity ? <StatusBadge label={c.sensitivity} tone={sensitivityTone(c.sensitivity)} /> : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </SectionCard>
  );
}
