"use client";

import type { ReactNode } from "react";
import { usePlan } from "@/lib/hooks/usePlan";
import { useHasPermission } from "@/lib/hooks/usePermissions";

/**
 * Gate UI on the TWO independent axes -- never conflated (per Stage 1):
 *   - `feature`: the org's PLAN entitlement (usePlan / /billing/status).
 *   - `permission`: the user's RBAC permission (usePermissions).
 * Renders `children` only if all provided checks pass; otherwise `fallback`
 * (default: nothing). Both hooks are always called (Rules of Hooks).
 */
export function FeatureGate({
  feature,
  permission,
  children,
  fallback = null,
}: {
  feature?: string;
  permission?: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { hasFeature } = usePlan();
  const hasPerm = useHasPermission(permission ?? "");
  if (feature && !hasFeature(feature)) return <>{fallback}</>;
  if (permission && !hasPerm) return <>{fallback}</>;
  return <>{children}</>;
}
