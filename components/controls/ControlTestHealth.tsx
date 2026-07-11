"use client";

import { FlaskConical } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { DonutChart, type DonutSegment } from "@/components/charts/DonutChart";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import type { ControlsData } from "@/lib/hooks/useControls";

/** Latest test outcomes from GET /api/v1/control-tests/summary. */
export function ControlTestHealth({ data }: { data: ControlsData }) {
  const { tests } = data;
  const t = tests.data;

  const segments: DonutSegment[] = t
    ? [
        { label: "Passed", value: t.latest_passed, color: "#10B981" },
        { label: "Failed", value: t.latest_failed, color: "#EF4444" },
        { label: "Needs review", value: t.latest_needs_review, color: "#F59E0B" }
      ].filter((s) => s.value > 0)
    : [];

  return (
    <SectionCard title="Control Test Health" subtitle="Latest automated + manual test outcomes" icon={FlaskConical} accent="purple">
      {tests.isLoading ? (
        <LoadingSkeleton className="mx-auto h-36 w-full" />
      ) : tests.isError ? (
        <ErrorState compact title="Unable to load test summary" onRetry={() => tests.refetch()} />
      ) : segments.length > 0 ? (
        <>
          <DonutChart
            segments={segments}
            size={130}
            centerLabel={String(t!.active_tests)}
            centerSub="active tests"
          />
          {t!.tests_overdue > 0 ? (
            <p className="mt-2 text-center text-[11px] font-medium text-rose-600">
              {t!.tests_overdue} test{t!.tests_overdue === 1 ? "" : "s"} overdue — stale results hide control failures.
            </p>
          ) : null}
        </>
      ) : t && t.controls_without_tests > 0 ? (
        <EmptyState
          compact
          icon={FlaskConical}
          title="No control tests defined"
          description={`${t.controls_without_tests} controls have no tests — define tests to prove controls keep working.`}
        />
      ) : (
        <EmptyState
          compact
          icon={FlaskConical}
          title="No test results yet"
          description="Control test outcomes will appear here after the first run."
        />
      )}
    </SectionCard>
  );
}
