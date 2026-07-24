"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { usePlan } from "@/lib/hooks/usePlan";
import { featureForPath } from "@/lib/nav/feature-map";
import { UpgradeRequired } from "@/components/common/UpgradeRequired";
import { PlanLoadError } from "@/components/common/PlanLoadError";

/**
 * Page-level plan guard. If the current route requires a premium feature the
 * org's plan lacks, render a clean UpgradeRequired page instead of letting the
 * page hit a raw 403. Category-B/D routes (featureForPath === null) always
 * render normally.
 *
 * Three distinct states for a gated route, in priority order:
 *   1. isError  -> /billing/status failed even after retries. Show a retryable
 *      "couldn't load your plan" state -- NOT an infinite spinner, and NOT a tier
 *      lock. (A transient blip must never permanently strand the paid product.)
 *   2. !isReady -> still loading (incl. retry backoff). Show a brief spinner. We
 *      deliberately do NOT optimistically render the page here, so entitled users
 *      never flash the UpgradeRequired lock before the plan resolves (Stage 3).
 *   3. resolved -> gate on the actual entitlement.
 */
export function RouteFeatureGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const { hasFeature, isReady, isError, refetch } = usePlan();
  const feature = featureForPath(pathname);

  if (feature) {
    if (isError) {
      return <PlanLoadError onRetry={refetch} />;
    }
    if (!isReady) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center">
          <span className="text-sm font-medium text-cv-slate">Loading…</span>
        </div>
      );
    }
    if (!hasFeature(feature)) {
      return <UpgradeRequired feature={feature} />;
    }
  }
  return <>{children}</>;
}
