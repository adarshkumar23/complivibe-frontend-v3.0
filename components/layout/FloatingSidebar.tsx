"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShieldCheck,
  BrainCircuit,
  Database,
  FileCheck2,
  TriangleAlert,
  Siren,
  FileBarChart,
  PackageCheck,
  BadgeCheck,
  ClipboardList,
  Bell,
  Settings,
  Scale,
  Award,
  ScrollText,
  Building,
  FlaskConical,
  Activity,
  Waves,
  Stamp,
  ClipboardCheck,
  Plug,
  Webhook,
  Zap,
  Network,
  Search,
  Inbox,
  Share2,
  Calculator,
  Briefcase,
  Lightbulb,
  Lock,
  Fingerprint,
  Building2,
  UserCheck,
  Atom,
  Bot,
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
  match?: "exact" | "prefix";
};

const NAV: NavItem[] = [
  { label: "Command Center", icon: LayoutDashboard, href: "/dashboard", match: "exact" },
  { label: "Executive Summary", icon: Briefcase, href: "/dashboard/executive", match: "prefix" },
  { label: "Search", icon: Search, href: "/dashboard/search", match: "prefix" },
  { label: "Compliance", icon: ShieldCheck, href: "/dashboard/compliance", match: "prefix" },
  { label: "Regulatory", icon: Scale, href: "/dashboard/regulatory", match: "prefix" },
  { label: "Policies", icon: ScrollText, href: "/dashboard/policies", match: "prefix" },
  { label: "AI Governance", icon: BrainCircuit, href: "/dashboard/ai-systems", match: "prefix" },
  { label: "AI Testing", icon: FlaskConical, href: "/dashboard/ai-testing", match: "prefix" },
  { label: "AI Monitoring", icon: Activity, href: "/dashboard/ai-monitoring", match: "prefix" },
  { label: "Drift Detection", icon: Waves, href: "/dashboard/drift", match: "prefix" },
  { label: "Trust Graph", icon: Share2, href: "/dashboard/trust-graph", match: "prefix" },
  { label: "Proactive Insights", icon: Lightbulb, href: "/dashboard/insights", match: "prefix" },
  { label: "Score Explainer", icon: Calculator, href: "/dashboard/score-explainer", match: "prefix" },
  { label: "Scenario Simulation", icon: Atom, href: "/dashboard/simulation", match: "prefix" },
  { label: "Data Observability", icon: Database, href: "/dashboard/data-observability", match: "prefix" },
  { label: "Evidence", icon: FileCheck2, href: "/dashboard/evidence", match: "prefix" },
  { label: "Risks", icon: TriangleAlert, href: "/dashboard/risks", match: "prefix" },
  { label: "Incidents", icon: Siren, href: "/dashboard/incidents", match: "prefix" },
  { label: "Reports", icon: FileBarChart, href: "/dashboard/reports", match: "prefix" },
  { label: "Audit Pack", icon: PackageCheck, href: "/dashboard/audit-pack", match: "prefix" },
  { label: "Approvals", icon: Stamp, href: "/dashboard/approvals", match: "prefix" },
  { label: "Assurance Review", icon: ClipboardCheck, href: "/dashboard/assurance", match: "prefix" },
  { label: "Trust Center", icon: BadgeCheck, href: "/dashboard/trust-center", match: "prefix" },
  { label: "Certifications", icon: Award, href: "/dashboard/certifications", match: "prefix" },
  { label: "Vendor Risk", icon: Building, href: "/dashboard/vendor-risk", match: "prefix" },
  { label: "Questionnaires", icon: ClipboardList, href: "/dashboard/questionnaires", match: "prefix" },
  { label: "Alerts", icon: Bell, href: "/dashboard/alerts", match: "prefix" },
  { label: "Integrations", icon: Plug, href: "/dashboard/integrations", match: "prefix" },
  { label: "Webhooks", icon: Webhook, href: "/dashboard/webhooks", match: "prefix" },
  { label: "Automation", icon: Zap, href: "/dashboard/automation", match: "prefix" },
  { label: "Workflows", icon: Network, href: "/dashboard/workflows", match: "prefix" },
  { label: "Agents", icon: Bot, href: "/dashboard/agents", match: "prefix" },
  { label: "Notifications", icon: Inbox, href: "/dashboard/notifications", match: "prefix" },
  { label: "Security", icon: Fingerprint, href: "/dashboard/security", match: "prefix" },
  { label: "Privacy", icon: Lock, href: "/dashboard/privacy", match: "prefix" },
  { label: "Enterprise Control", icon: Building2, href: "/dashboard/enterprise", match: "prefix" },
  { label: "Employee Compliance", icon: UserCheck, href: "/dashboard/employee-compliance", match: "prefix" },
  { label: "Settings", icon: Settings, href: "/dashboard/settings", match: "prefix" }
];

/**
 * Determine whether a nav item is active for the current pathname.
 * Prefix matching uses a path-segment boundary (href === path or path starts
 * with `href/`) so a parent like `/dashboard/ai-systems` stays active on its
 * detail routes (`/dashboard/ai-systems/{id}`) without bleeding into siblings
 * such as `/dashboard/ai-testing`.
 */
function isNavItemActive(item: NavItem, pathname: string | null): boolean {
  if (!pathname) return false;
  if (item.match === "exact") return pathname === item.href;
  // default to prefix matching for everything else
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

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
          const isActive = isNavItemActive(item, pathname);
          return (
            <button
              key={item.label}
              type="button"
              aria-current={isActive ? "page" : undefined}
              onClick={() => {
                setSidebarOpen(false);
                router.push(item.href);
              }}
              className={cn(
                "group relative flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold outline-none transition",
                "focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                isActive
                  ? "text-white drop-shadow-sm"
                  : "text-cv-slate hover:bg-white/60 hover:text-cv-ink"
              )}
            >
              {isActive ? (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 z-0 rounded-2xl bg-cv-brand shadow-button"
                  transition={{ type: "spring", stiffness: 360, damping: 30 }}
                />
              ) : null}
              <span
                className={cn(
                  "relative z-10 inline-flex h-8 w-8 items-center justify-center rounded-xl transition",
                  isActive ? "bg-white/25 text-white" : "bg-white/70 text-cv-slate group-hover:text-cv-blue"
                )}
              >
                <Icon size={17} strokeWidth={2.2} />
              </span>
              <span className="relative z-10">{item.label}</span>
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
