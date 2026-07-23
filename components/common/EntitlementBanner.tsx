"use client";

import Link from "next/link";
import { ArrowUpRight, ShieldAlert, TriangleAlert } from "lucide-react";

import { parseEntitlementError } from "@/lib/api/entitlement";

/**
 * Consistent banner for a failed create/mutation, replacing the copy-pasted
 * `err.status === 403 ? "Plan upgrade required" : red` heuristic across modals.
 *
 * - feature_not_in_plan (403): amber "needs a higher plan" + Upgrade link.
 * - record_cap_reached (402): amber "X of Y used" + Upgrade link.
 * - RBAC permission denial (bare-string 403): red "you don't have permission"
 *   -- NOT an upgrade prompt (fixes the old conflation).
 * - anything else: red generic error.
 */
export function EntitlementBanner({ error }: { error: unknown }) {
  const parsed = parseEntitlementError(error);
  if (!parsed) return null;

  if (parsed.kind === "feature" || parsed.kind === "cap") {
    return (
      <div className="flex items-start gap-2.5 rounded-2xl bg-amber-500/10 px-3.5 py-2.5 ring-1 ring-amber-400/25">
        <ShieldAlert size={15} className="mt-0.5 shrink-0 text-amber-600" />
        <div className="text-xs leading-relaxed text-amber-700">
          <p>
            <span className="font-bold">
              {parsed.kind === "cap" ? "Plan limit reached." : "Plan upgrade required."}
            </span>{" "}
            {parsed.message}
          </p>
          <Link
            href={parsed.upgradeHref}
            className="mt-1 inline-flex items-center gap-1 font-semibold text-amber-800 underline decoration-amber-400/50 underline-offset-2 hover:text-amber-900"
          >
            View plans &amp; upgrade <ArrowUpRight size={12} />
          </Link>
        </div>
      </div>
    );
  }

  if (parsed.kind === "permission") {
    return (
      <div className="flex items-start gap-2.5 rounded-2xl bg-rose-500/10 px-3.5 py-2.5 ring-1 ring-rose-400/25">
        <ShieldAlert size={15} className="mt-0.5 shrink-0 text-rose-600" />
        <p className="text-xs leading-relaxed text-rose-700">
          <span className="font-bold">You don&apos;t have permission to do this.</span>{" "}
          Ask an owner or admin to grant access. ({parsed.message})
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5 rounded-2xl bg-rose-500/10 px-3.5 py-2.5 ring-1 ring-rose-400/25">
      <TriangleAlert size={15} className="mt-0.5 shrink-0 text-rose-600" />
      <p className="text-xs font-semibold leading-relaxed text-rose-600">{parsed.message}</p>
    </div>
  );
}
