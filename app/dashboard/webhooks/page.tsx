"use client";

import { motion, type Variants } from "framer-motion";
import { Webhook } from "lucide-react";
import { WebhookEndpointList } from "@/components/webhooks/WebhookEndpointList";
import { CreateWebhookForm } from "@/components/webhooks/CreateWebhookForm";
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
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cv-brand text-white shadow-tile">
              <Webhook size={15} />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cv-blue">Outbound Events</span>
          </div>
          <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-cv-ink sm:text-[34px]">
            Webhooks
          </h1>
          <p className="max-w-2xl text-[15px] text-cv-slate">
            Deliver control failures, critical risks, and other compliance events to your own systems in real time.
          </p>
        </div>
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WebhookEndpointList data={data} />
        </div>
        <div>
          <CreateWebhookForm data={data} />
        </div>
      </motion.div>
    </div>
  );
}
