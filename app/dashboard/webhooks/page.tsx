"use client";

import { motion, type Variants } from "framer-motion";
import { WebhooksHeader } from "@/components/webhooks/WebhooksHeader";
import { WebhooksKpis } from "@/components/webhooks/WebhooksKpis";
import { WebhookEndpointsTable } from "@/components/webhooks/WebhookEndpointsTable";
import { DeliveryLogPanel } from "@/components/webhooks/DeliveryLogPanel";
import { EventCatalogPanel } from "@/components/webhooks/EventCatalogPanel";
import { WebhookSecurityPanel } from "@/components/webhooks/WebhookSecurityPanel";
import { useWebhooks } from "@/lib/hooks/useWebhooks";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

export default function WebhooksPage() {
  const data = useWebhooks();

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <WebhooksHeader />
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <WebhooksKpis data={data} />
      </motion.div>

      <motion.div variants={fade} custom={2} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WebhookEndpointsTable data={data} />
        </div>
        <div className="flex flex-col gap-4">
          <WebhookSecurityPanel data={data} />
          <EventCatalogPanel data={data} />
        </div>
      </motion.div>

      <motion.div variants={fade} custom={3} initial="hidden" animate="show">
        <DeliveryLogPanel data={data} />
      </motion.div>
    </div>
  );
}
