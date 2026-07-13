import { NextResponse } from "next/server";

// Lets a deploy script (or a human) verify the *running* process actually
// reflects the commit that was just built, instead of trusting that a
// restart happened. `NEXT_PUBLIC_GIT_SHA`/`NEXT_PUBLIC_BUILD_TIME` are baked
// in at build time by scripts/deploy.sh (see docs/deploy.md) — if the
// process was never restarted after a new build, or the deploy script
// wasn't used at all, this endpoint keeps reporting the old commit instead
// of silently looking fine, which is exactly the failure mode this exists
// to catch.
export async function GET() {
  return NextResponse.json({
    gitSha: process.env.NEXT_PUBLIC_GIT_SHA ?? "unknown",
    buildTime: process.env.NEXT_PUBLIC_BUILD_TIME ?? "unknown"
  });
}
