"use client";

import { Database, FileSearch, Boxes, CloudOff } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import { countByCategory } from "@/lib/api/search-normalizers";
import type { GlobalSearchData } from "@/lib/hooks/useGlobalSearch";

export function SearchSourceCards({ data }: { data: GlobalSearchData }) {
  const { records, isLoading, availableCount, unavailableCount, allUnavailable } = data;
  const indexed = countByCategory(records).size;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RegistryKpi label="Indexed Sources" icon={Database} accent="blue" value={isLoading && indexed === 0 ? null : indexed} caption={!isLoading ? "with records" : undefined} loading={isLoading && indexed === 0} unavailableHint="None indexed" />
      <RegistryKpi label="Searchable Records" icon={FileSearch} accent="purple" value={isLoading && records.length === 0 ? null : records.length} caption={!isLoading ? "across modules" : undefined} loading={isLoading && records.length === 0} unavailableHint="None available" />
      <RegistryKpi label="Available Modules" icon={Boxes} accent="green" value={allUnavailable ? null : availableCount} caption={!allUnavailable ? "responding" : undefined} loading={isLoading && availableCount === 0} unavailableHint="None available" />
      <RegistryKpi label="Unavailable Sources" icon={CloudOff} accent="red" value={unavailableCount} caption="not responding" loading={false} unavailableHint="—" />
    </div>
  );
}
