"use client";

import { useState } from "react";
import { FlaskConical, Loader2, Play } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { normalizeTesting } from "@/lib/api/ai-system-detail-normalizers";
import { runAllTests } from "@/lib/api/ai-system-detail";
import { scoreTone } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { AiSystemDetail } from "@/lib/hooks/useAiSystemDetail";

const toneColor = { good: "#10B981", warn: "#F59E0B", bad: "#EF4444" } as const;

export function TestingSummary({ data, systemId }: { data: AiSystemDetail; systemId: string }) {
  const { testing } = data;
  const t = normalizeTesting(testing.data);
  const [running, setRunning] = useState(false);

  async function handleRun() {
    setRunning(true);
    try {
      await runAllTests(systemId);
      testing.refetch();
    } catch {
      /* surfaced via section error state on next load */
    } finally {
      setRunning(false);
    }
  }

  return (
    <SectionCard
      title="Testing Summary"
      subtitle="Safety, bias & robustness checks"
      icon={FlaskConical}
      accent="cyan"
      className="h-full"
      action={
        <button
          type="button"
          onClick={handleRun}
          disabled={running}
          className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-cv-ink ring-1 ring-white/70 transition hover:bg-white disabled:opacity-60"
        >
          {running ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
          {running ? "Running…" : "Run all"}
        </button>
      }
    >
      {testing.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      ) : testing.isError ? (
        <ErrorState title="Unable to load testing summary" onRetry={() => testing.refetch()} />
      ) : !t.hasAny ? (
        <EmptyState
          icon={FlaskConical}
          title="No test results"
          description="Bias, safety, hallucination, explainability, and red-team results will appear here once tests run."
        />
      ) : (
        <div className="space-y-3.5">
          {t.overallStatus ? (
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-cv-slate">Overall status</span>
              <StatusBadge label={t.overallStatus} tone="info" />
            </div>
          ) : null}
          <ul className="space-y-3">
            {t.categories.map((c) => {
              const has = c.value != null;
              const tone = scoreTone(c.value);
              return (
                <li key={c.label}>
                  <div className="mb-1.5 flex items-center justify-between text-[13px]">
                    <span className="font-semibold text-cv-ink">{c.label}</span>
                    {has ? (
                      <span className="font-bold text-cv-ink">{Math.round(c.value!)}%</span>
                    ) : c.status ? (
                      <StatusBadge label={c.status} tone="neutral" />
                    ) : (
                      <span className="text-cv-mist">—</span>
                    )}
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-400/12">
                    {has ? (
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.max(4, Math.min(100, c.value!))}%`, background: toneColor[tone] }}
                      />
                    ) : (
                      <div className={cn("h-full w-full bg-[repeating-linear-gradient(90deg,rgba(148,163,184,0.25)_0_8px,transparent_8px_16px)]")} />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </SectionCard>
  );
}
