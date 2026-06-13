"use client";

import { useState } from "react";
import { Target, CheckCircle2, Loader2, ScanLine } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizePriorityActions } from "@/lib/api/compliance-normalizers";
import { runProactiveScan } from "@/lib/api/compliance";
import type { Compliance } from "@/lib/hooks/useCompliance";

export function PriorityActions({ data }: { data: Compliance }) {
  const { gaps, risks } = data;
  const [scanning, setScanning] = useState(false);
  const [scanState, setScanState] = useState<"idle" | "done" | "error">("idle");

  const actions = normalizePriorityActions(gaps.data, risks.data).slice(0, 5);
  const loading = gaps.isLoading || risks.isLoading;
  const errored = gaps.isError && risks.isError;

  async function handleScan() {
    setScanning(true);
    setScanState("idle");
    try {
      await runProactiveScan();
      setScanState("done");
      gaps.refetch();
      risks.refetch();
    } catch {
      setScanState("error");
    } finally {
      setScanning(false);
    }
  }

  return (
    <SectionCard
      title="Priority Actions"
      subtitle="Top gaps to resolve next"
      icon={Target}
      accent="red"
      className="h-full"
      action={
        <button
          type="button"
          onClick={handleScan}
          disabled={scanning}
          className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-cv-ink ring-1 ring-white/70 transition hover:bg-white disabled:opacity-60"
        >
          {scanning ? <Loader2 size={13} className="animate-spin" /> : <ScanLine size={13} />}
          {scanning ? "Scanning…" : "Run scan"}
        </button>
      }
    >
      {loading ? (
        <SkeletonRows rows={4} />
      ) : errored ? (
        <ErrorState
          title="Unable to load priority actions"
          onRetry={() => {
            gaps.refetch();
            risks.refetch();
          }}
        />
      ) : actions.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No priority gaps"
          description={
            scanState === "done"
              ? "Scan complete — no outstanding compliance gaps were detected."
              : "No outstanding compliance gaps detected. Run a scan to refresh."
          }
        />
      ) : (
        <ul className="space-y-2.5">
          {actions.map((action) => (
            <li key={action.id} className="rounded-2xl bg-white/55 p-3.5 ring-1 ring-white/70 transition hover:bg-white/80">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] font-semibold leading-snug text-cv-ink">{action.title}</p>
                <SeverityBadge severity={action.severity} />
              </div>
              {action.description ? (
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-cv-slate">{action.description}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
