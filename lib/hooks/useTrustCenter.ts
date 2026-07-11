"use client";

import { useQuery } from "@tanstack/react-query";
import { getTrustCenterConfiguration } from "@/lib/api/trust-center";

export function useTrustCenter() {
  const configuration = useQuery({ queryKey: ["trust-center-config"], queryFn: getTrustCenterConfiguration });

  return { configuration };
}

export type TrustCenterData = ReturnType<typeof useTrustCenter>;
