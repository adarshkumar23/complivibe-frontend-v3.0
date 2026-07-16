"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMyPermissions } from "@/lib/api/permissions";

/**
 * Reusable client-side permission gating, backed by GET /api/v1/auth/permissions.
 *
 * This is generic over any permission code the backend defines — it is NOT
 * hardcoded to any particular feature. Use `has("some:code")` anywhere a button
 * or route should only appear for users the backend would actually authorize,
 * so the UI never offers an action that will 403 at submit time.
 *
 * Loaded once and cached for the whole app (shared query key + 5min staleTime);
 * after the first fetch, checks are synchronous and instant everywhere.
 */
export function useMyPermissions() {
  return useQuery({
    queryKey: ["my-permissions"],
    queryFn: getMyPermissions,
    staleTime: 300_000
  });
}

export type PermissionUtils = {
  /** True if the caller holds `code`. */
  has: (code: string) => boolean;
  /** True if the caller holds at least one of `codes`. */
  hasAny: (codes: string[]) => boolean;
  /** True if the caller holds every one of `codes`. */
  hasAll: (codes: string[]) => boolean;
  /** The raw code set (read-only use). */
  codes: Set<string>;
  /** Permissions are still being fetched for the first time. */
  isLoading: boolean;
  /** Permissions have loaded successfully at least once. */
  isReady: boolean;
};

export function usePermissions(): PermissionUtils {
  const { data, isLoading, isSuccess } = useMyPermissions();
  return useMemo(() => {
    const codes = new Set(data?.permission_codes ?? []);
    return {
      has: (code: string) => codes.has(code),
      hasAny: (list: string[]) => list.some((c) => codes.has(c)),
      hasAll: (list: string[]) => list.every((c) => codes.has(c)),
      codes,
      isLoading,
      isReady: isSuccess
    };
  }, [data, isLoading, isSuccess]);
}

/** Convenience for gating on a single permission code. */
export function useHasPermission(code: string): boolean {
  return usePermissions().has(code);
}
