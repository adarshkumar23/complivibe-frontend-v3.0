"use client";

import { motion, type Variants } from "framer-motion";
import { NotificationsHeader } from "@/components/notifications/NotificationsHeader";
import { NotificationsKpis } from "@/components/notifications/NotificationsKpis";
import { NotificationFeed } from "@/components/notifications/NotificationFeed";
import { NotificationSettingsPanel } from "@/components/notifications/NotificationSettingsPanel";
import { useNotifications } from "@/lib/hooks/useNotifications";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

export default function NotificationsPage() {
  const data = useNotifications();

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <NotificationsHeader />
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <NotificationsKpis data={data} />
      </motion.div>

      <motion.div variants={fade} custom={2} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <NotificationFeed data={data} />
        </div>
        <div>
          <NotificationSettingsPanel data={data} />
        </div>
      </motion.div>
    </div>
  );
}
