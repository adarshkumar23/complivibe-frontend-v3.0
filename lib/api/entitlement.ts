import { ApiError, type StructuredDetail } from "./client";

// App-local billing page. Note: the backend's structured detail carries an
// `upgrade_url` built from its FRONTEND_URL (path `/billing/upgrade`), but the
// actual frontend billing route is `/dashboard/billing` -- so we route the CTA
// to the known-good local route rather than trusting the backend's host/path.
export const UPGRADE_HREF = "/dashboard/billing";

export type EntitlementError =
  | { kind: "feature"; message: string; feature?: string; currentPlan?: string; upgradeHref: string }
  | {
      kind: "cap";
      message: string;
      resource?: string;
      cap?: number;
      currentCount?: number;
      currentPlan?: string;
      upgradeHref: string;
    }
  | { kind: "permission"; message: string }
  | { kind: "other"; message: string };

function structuredDetail(error: ApiError): StructuredDetail | null {
  const d = error.payload?.detail;
  return d && typeof d === "object" && !Array.isArray(d) ? d : null;
}

/**
 * Classify an ApiError into an entitlement outcome so the UI can respond
 * correctly and CONSISTENTLY:
 *  - feature_not_in_plan (403, object detail)  -> needs a higher plan (+ upgrade CTA)
 *  - record_cap_reached   (402, object detail) -> cap hit (X of Y) (+ upgrade CTA)
 *  - a bare-string 403 detail                  -> RBAC permission denial (NO upgrade CTA)
 *  - anything else                             -> generic error
 *
 * The critical fix vs. the old `err.status === 403` heuristic: an RBAC 403
 * (detail is a plain string) is NOT reported as a plan problem.
 */
export function parseEntitlementError(error: unknown): EntitlementError | null {
  if (!(error instanceof ApiError)) return null;
  const detail = structuredDetail(error);
  const code = detail?.error;

  if (error.status === 403 && code === "feature_not_in_plan") {
    return {
      kind: "feature",
      message: detail?.message ?? error.message,
      feature: detail?.feature,
      currentPlan: detail?.current_plan,
      upgradeHref: UPGRADE_HREF,
    };
  }
  if (error.status === 402 && code === "record_cap_reached") {
    return {
      kind: "cap",
      message: detail?.message ?? error.message,
      resource: detail?.resource,
      cap: detail?.cap,
      currentCount: detail?.current_count,
      currentPlan: detail?.current_plan,
      upgradeHref: UPGRADE_HREF,
    };
  }
  // A 403 that is NOT a structured plan error is an RBAC permission denial
  // (detail is a plain string like "Missing required permission: risks:write").
  if (error.status === 403) {
    return { kind: "permission", message: error.message };
  }
  return { kind: "other", message: error.message };
}

/**
 * Map a failed trial-code redemption to a distinct, user-meaningful message.
 * Each backend rejection code means something different to the user.
 */
export function redeemRejectionMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return "Unable to reach the server. Please try again.";
  const detail = structuredDetail(error);
  switch (detail?.error) {
    case "invalid_code":
      return "That code isn't valid. Double-check it for typos and try again.";
    case "code_already_used":
      return "This code has already been redeemed and can't be used again.";
    case "already_trialed":
      return "Your organization has already used its free trial. Only one trial is allowed per organization.";
    case "not_eligible":
      return "You're already on a paid plan — no trial needed.";
    default:
      return error.message || "We couldn't redeem that code. Please try again.";
  }
}
