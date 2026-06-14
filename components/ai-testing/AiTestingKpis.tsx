"use client";

import { FlaskConical, XCircle, ShieldCheck, ClipboardCheck } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import { normalizeTesting, isTestPassed, isTestFailed, needsReview } from "@/lib/api/ai-testing-normalizers";
import type { AiTestingData } from "@/lib/hooks/useAiTesting";

export function AiTestingKpis({ data }: { data: AiTestingData }) {
  const { systems, list, testingById, anyTesting, testingLoading } = data;
  const loading = systems.isLoading || testingLoading;

  // Per-system overall testing status from real testing summaries only.
  const statuses = list
    .map((s) => (s.rawId ? testingById.get(s.rawId) : undefined))
    .filter((e) => e?.isSuccess)
    .map((e) => normalizeTesting(e!.data));

  const tested = systems.isSuccess && anyTesting ? statuses.filter((t) => t.hasAny).length : null;
  const failures = anyTesting ? statuses.filter((t) => isTestFailed(t.overallStatus)).length : null;
  const passed = anyTesting ? statuses.filter((t) => isTestPassed(t.overallStatus)).length : null;
  const review = anyTesting ? statuses.filter((t) => needsReview(t.overallStatus)).length : null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RegistryKpi label="AI Systems Tested" icon={FlaskConical} accent="blue" value={tested} caption={tested != null ? "with test results" : undefined} loading={loading} unavailableHint="Testing unavailable" />
      <RegistryKpi label="Open Test Failures" icon={XCircle} accent="red" value={failures} caption={failures != null ? "failed checks" : undefined} loading={loading} unavailableHint="No test status" />
      <RegistryKpi label="Safety Checks Passed" icon={ShieldCheck} accent="green" value={passed} caption={passed != null ? "passing systems" : undefined} loading={loading} unavailableHint="No test status" />
      <RegistryKpi label="Systems Needing Review" icon={ClipboardCheck} accent="amber" value={review} caption={review != null ? "flagged for review" : undefined} loading={loading} unavailableHint="No test status" />
    </div>
  );
}
