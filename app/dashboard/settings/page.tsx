"use client";

import { motion, type Variants } from "framer-motion";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { SettingsStatusCards } from "@/components/settings/SettingsStatusCards";
import { ProfileWorkspace } from "@/components/settings/ProfileWorkspace";
import { OrganizationSettings } from "@/components/settings/OrganizationSettings";
import { TeamAccess } from "@/components/settings/TeamAccess";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { NotificationPreferences } from "@/components/settings/NotificationPreferences";
import { IntegrationsPanel } from "@/components/settings/IntegrationsPanel";
import { ApiKeysPanel } from "@/components/settings/ApiKeysPanel";
import { DataPreferences } from "@/components/settings/DataPreferences";
import { useSettings } from "@/lib/hooks/useSettings";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

export default function SettingsPage() {
  const data = useSettings();

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <SettingsHeader />
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <SettingsStatusCards data={data} />
      </motion.div>

      <motion.div variants={fade} custom={2} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ProfileWorkspace data={data} />
        <OrganizationSettings data={data} />
      </motion.div>

      <motion.div variants={fade} custom={3} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TeamAccess data={data} />
        </div>
        <div>
          <SecuritySettings data={data} />
        </div>
      </motion.div>

      <motion.div variants={fade} custom={4} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <NotificationPreferences data={data} />
        <IntegrationsPanel data={data} />
        <ApiKeysPanel data={data} />
      </motion.div>

      <motion.div variants={fade} custom={5} initial="hidden" animate="show">
        <DataPreferences data={data} />
      </motion.div>
    </div>
  );
}
