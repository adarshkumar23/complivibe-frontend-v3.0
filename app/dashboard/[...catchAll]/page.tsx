import { notFound } from "next/navigation";

// Catch-all for any /dashboard/* path with no matching page. Without this,
// Next's implicit not-found fallback for a deeply unmatched path doesn't
// reliably resolve to app/dashboard/not-found.tsx -- it can fall through to
// the bare default 404, dropping the sidebar/topbar/branded shell. Explicitly
// matching every otherwise-unmatched /dashboard/* segment and calling
// notFound() guarantees Next renders app/dashboard/not-found.tsx inside
// app/dashboard/layout.tsx, per Next's documented pattern for a custom 404
// scoped to a nested layout.
export default function DashboardCatchAll() {
  notFound();
}
