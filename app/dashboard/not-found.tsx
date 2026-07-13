import Link from "next/link";
import { CompassIcon } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";

// Renders inside app/dashboard/layout.tsx (sidebar + topbar + mode switcher
// still show), so a bad sub-route inside the dashboard no longer drops to the
// bare, unstyled default Next.js 404 page.
export default function DashboardNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <GlassCard className="max-w-md p-8">
        <EmptyState
          icon={CompassIcon}
          title="Page not found"
          description="This dashboard page doesn't exist, or the link is out of date."
        />
        <Link
          href="/dashboard"
          className="cv-ring-focus mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-cv-brand px-4 py-2.5 text-[13px] font-bold text-white shadow-tile transition hover:opacity-90"
        >
          Back to dashboard
        </Link>
      </GlassCard>
    </div>
  );
}
