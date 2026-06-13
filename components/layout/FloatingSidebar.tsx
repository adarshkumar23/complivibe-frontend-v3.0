"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShieldCheck,
  BrainCircuit,
  Database,
  FileBarChart,
  Bell,
  Settings,
  Sparkles,
  LogOut,
  X,
  type LucideIcon
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { Logo } from "@/components/ui/Logo";
import { useUiStore } from "@/store/ui-store";
import { useAuthStore } from "@/store/auth-store";

type NavItem = {
  label: string;
  icon: LucideIcon;
  href: string;
  active?: boolean;
};

const NAV: NavItem[] = [
  { label: "Command Center", icon: LayoutDashboard, href: "/dashboard", active: true },
  { label: "Compliance", icon: ShieldCheck, href: "/dashboard" },
  { label: "AI Governance", icon: BrainCircuit, href: "/dashboard" },
  { label: "Data Observability", icon: Database, href: "/dashboard" },
  { label: "Reports", icon: FileBarChart, href: "/dashboard" },
  { label: "Alerts", icon: Bell, href: "/dashboard" },
  { label: "Settings", icon: Settings, href: "/dashboard" }
];

function SidebarBody() {
  const router = useRouter();
  const pathname = usePathname();
  const clearToken = useAuthStore((s) => s.clearToken);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);

  const logout = () => {
    clearToken();
    router.replace("/login");
  };

  return (
    <div className="flex h-full flex-col rounded-shell cv-glass-strong p-4 shadow-sidebar">
      {/* Brand */}
      <div className="flex items-center gap-3 px-2 pb-2 pt-1">
        <Logo size="md" />
        <div className="leading-tight">
          <p className="text-[15px] font-extrabold tracking-tight text-cv-ink">CompliVibe</p>
          <p className="text-[11px] font-medium text-cv-slate">Governance OS</p>
        </div>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full text-cv-slate hover:bg-white/70 lg:hidden"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="mt-3 flex-1 space-y-1.5 overflow-y-auto px-0.5">
        {NAV.map((item) => {
          const Icon = item.icon;
          const isActive = Boolean(item.active && pathname?.startsWith("/dashboard"));
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setSidebarOpen(false);
                router.push(item.href);
              }}
              className={cn(
                "group relative flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition",
                isActive ? "text-white" : "text-cv-slate hover:bg-white/60 hover:text-cv-ink"
              )}
            >
              {isActive ? (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-2xl bg-cv-brand shadow-button"
                  transition={{ type: "spring", stiffness: 360, damping: 30 }}
                />
              ) : null}
              <span
                className={cn(
                  "relative inline-flex h-8 w-8 items-center justify-center rounded-xl transition",
                  isActive ? "bg-white/20 text-white" : "bg-white/70 text-cv-slate group-hover:text-cv-blue"
                )}
              >
                <Icon size={17} strokeWidth={2.2} />
              </span>
              <span className="relative">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Upgrade / footer card */}
      <div className="mt-3 space-y-3">
        <div className="relative overflow-hidden rounded-2xl bg-cv-brand p-4 text-white shadow-button">
          <span className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/20 blur-xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wide">
              <Sparkles size={12} /> Enterprise
            </span>
            <p className="mt-2 text-sm font-bold leading-snug">Unlock full AI governance suite</p>
            <p className="mt-1 text-[11px] text-white/80">40+ modules, copilot & audit automation.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-semibold text-cv-slate transition hover:bg-white/60 hover:text-rose-500"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/70">
            <LogOut size={16} strokeWidth={2.2} />
          </span>
          Sign out
        </button>
      </div>
    </div>
  );
}

export function FloatingSidebar() {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);

  return (
    <>
      {/* Desktop: floating, sticky */}
      <aside className="sticky top-0 hidden h-screen w-[320px] shrink-0 p-5 lg:block">
        <SidebarBody />
      </aside>

      {/* Mobile: drawer */}
      <div className={cn("fixed inset-0 z-50 lg:hidden", sidebarOpen ? "pointer-events-auto" : "pointer-events-none")}>
        <motion.div
          initial={false}
          animate={{ opacity: sidebarOpen ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => setSidebarOpen(false)}
          className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
        />
        <motion.div
          initial={false}
          animate={{ x: sidebarOpen ? 0 : "-110%" }}
          transition={{ type: "spring", stiffness: 320, damping: 34 }}
          className="absolute left-0 top-0 h-full w-[284px] p-4"
        >
          <SidebarBody />
        </motion.div>
      </div>
    </>
  );
}
