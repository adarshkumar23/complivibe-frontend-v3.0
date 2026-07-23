"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAiSystems } from "@/lib/api/ai-systems";
import { ApiError } from "@/lib/api/client";
import {
  getLatestAibom,
  createAibomVersion,
  addAibomComponent,
  type AibomComponentCreate,
  type AibomVersionCreate,
  type AibomWithComponents
} from "@/lib/api/aibom";

/** AI-system picker source. Reuses the shared ["ai-systems"] query key/cache. */
export function useAiSystemsList() {
  return useQuery({ queryKey: ["ai-systems"], queryFn: () => getAiSystems() });
}

/**
 * Latest BOM for the selected system. A 404 means "no AI-BOM generated yet" —
 * an expected empty state, resolved to `null` rather than an error so the page
 * can offer a "Generate AI-BOM" action.
 */
export function useLatestAibom(systemId: string | null) {
  return useQuery({
    queryKey: ["aibom", systemId],
    enabled: !!systemId,
    queryFn: async (): Promise<AibomWithComponents | null> => {
      try {
        return await getLatestAibom(systemId as string);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }
    }
  });
}

/** POST a new BOM version (copies the previous version forward by default). */
export function useCreateAibomVersion(systemId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body?: AibomVersionCreate) => createAibomVersion(systemId as string, body ?? {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["aibom", systemId] })
  });
}

/** POST a component onto the latest BOM. */
export function useAddAibomComponent(systemId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AibomComponentCreate) => addAibomComponent(systemId as string, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["aibom", systemId] })
  });
}
