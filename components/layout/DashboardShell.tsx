"use client";

import type { ReactNode } from "react";
import { FloatingSidebar } from "@/components/layout/FloatingSidebar";
import { Topbar } from "@/components/layout/Topbar";
import { CopilotDrawer } from "@/components/copilot/CopilotDrawer";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      <FloatingSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 pb-28 pt-5 sm:px-6 lg:pl-0 lg:pr-6">
          <div className="mx-auto w-full max-w-[1480px]">{children}</div>
        </main>
      </div>
      {/* Global, page-aware Copilot — mounted once for the whole dashboard shell */}
      <CopilotDrawer />
    </div>
  );
}
