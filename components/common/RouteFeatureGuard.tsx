"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { usePlan } from "@/lib/hooks/usePlan";
import { featureForPath } from "@/lib/nav/feature-map";
import { UpgradeRequired } from "@/components/common/UpgradeRequired";

/**
 * Page-level plan guard. If the current route requires a premium feature the
 * org's plan lacks, render a clean UpgradeRequired page instead of letting the
 * page hit a raw 403. Category-B/D routes (featureForPath === null) always
 * render normally. Waits for the plan to resolve before deciding, so entitled
 * users never flash the upgrade screen.
 */
export function RouteFeatureGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const { hasFeature, isReady } = usePlan();
  const feature = featureForPath(pathname);

  if (feature) {
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
