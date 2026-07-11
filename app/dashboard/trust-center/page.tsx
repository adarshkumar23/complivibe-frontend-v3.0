"use client";

import { motion, type Variants } from "framer-motion";
import { BadgeCheck, Globe } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { useTrustCenter } from "@/lib/hooks/useTrustCenter";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

export default function TrustCenterPage() {
  const { configuration } = useTrustCenter();

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cv-brand text-white shadow-tile">
              <BadgeCheck size={15} />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cv-blue">Public Trust</span>
          </div>
          <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-cv-ink sm:text-[34px]">
            Trust Center
          </h1>
          <p className="max-w-2xl text-[15px] text-cv-slate">
            The public page where customers verify your certifications, subprocessors, and security posture.
          </p>
        </div>
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <SectionCard title="Configuration" subtitle="Public trust page state" icon={Globe} accent="blue">
          {configuration.isLoading ? (
            <SkeletonRows rows={3} />
          ) : configuration.isError ? (
            <ErrorState title="Unable to load configuration" onRetry={() => configuration.refetch()} />
          ) : configuration.data == null ? (
            <EmptyState
              icon={Globe}
              title="Trust center not configured"
              description="Configure and publish your trust center to give customers a public, self-serve view of your compliance posture."
            />
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
                <span className="text-[13px] font-semibold text-cv-ink">Public slug</span>
                <span className="text-[12px] font-medium text-cv-slate">{String(configuration.data.slug ?? "—")}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
                <span className="text-[13px] font-semibold text-cv-ink">Status</span>
                <StatusBadge
                  label={configuration.data.is_published ? "Published" : "Draft"}
                  tone={configuration.data.is_published ? "good" : "warn"}
                />
              </div>
            </div>
          )}
        </SectionCard>
      </motion.div>
    </div>
  );
}
