import { apiFetch, ApiError } from "@/lib/api/client";

/**
 * Trust center API — typed against the live backend schema
 * (/api/v1/compliance/trust-center/configuration; public page is /api/v1/trust-center/{slug}).
 */

export type TrustCenterConfiguration = {
  id?: string;
  slug?: string | null;
  is_published?: boolean | null;
  [key: string]: unknown;
};

/** Returns null when the trust center has not been configured yet (404). */
export async function getTrustCenterConfiguration(): Promise<TrustCenterConfiguration | null> {
  try {
    return await apiFetch<TrustCenterConfiguration>("/api/v1/compliance/trust-center/configuration");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}
