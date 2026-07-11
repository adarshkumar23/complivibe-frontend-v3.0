"use client";

import { Search } from "lucide-react";
import { DeferredPage } from "@/components/ui/DeferredPage";

export default function Page() {
  return <DeferredPage icon={Search} kicker="Discovery" title="Search" backendState="A real Meilisearch-backed /search endpoint exists; the global search page is queued for Phase B." />;
}
