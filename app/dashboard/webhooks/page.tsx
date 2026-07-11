"use client";

import { Webhook } from "lucide-react";
import { DeferredPage } from "@/components/ui/DeferredPage";

export default function Page() {
  return <DeferredPage icon={Webhook} kicker="Outbound Events" title="Webhooks" backendState="No /webhooks management endpoints exist in the live schema — outbound delivery is internal (outbox). Real gap; needs backend surface before a page can be honest." />;
}
