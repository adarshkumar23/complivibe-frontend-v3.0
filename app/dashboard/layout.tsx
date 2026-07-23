"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { BottomModeSwitcher } from "@/components/layout/BottomModeSwitcher";
import { Logo } from "@/components/ui/Logo";
import { useAuthStore } from "@/store/auth-store";
import { RouteFeatureGuard } from "@/components/common/RouteFeatureGuard";
import { TrialBanner } from "@/components/common/TrialBanner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const authenticated = useAuthStore((s) => s.authenticated);
  const hydrated = useAuthStore((s) => s.hydrated);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  useEffect(() => {
    if (hydrated && !authenticated) {
      router.replace("/login");
    }
  }, [hydrated, authenticated, router]);

  if (!hydrated || !authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Logo size="lg" className="animate-float-slow" />
          <p className="text-sm font-medium text-cv-slate">Loading your command center…</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardShell>
      <TrialBanner />
      <RouteFeatureGuard>{children}</RouteFeatureGuard>
      <BottomModeSwitcher />
    </DashboardShell>
  );
}
