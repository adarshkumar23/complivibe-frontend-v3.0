"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { search } from "@/lib/api/search";

/** Debounce a rapidly-changing string (topbar keystrokes → live results). */
export function useDebouncedValue(value: string, delayMs = 250): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

/** Live global search against GET /api/v1/search. Disabled for empty queries. */
export function useGlobalSearch(query: string, entityTypes?: string[], limit = 20) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: ["global-search", trimmed, entityTypes ?? [], limit],
    queryFn: () => search(trimmed, entityTypes, limit),
    enabled: trimmed.length > 0,
    staleTime: 15_000,
    // keep last results on screen while the next keystroke's query loads
    placeholderData: (prev) => prev
  });
}
