"use client";

import { useQuery } from "@tanstack/react-query";
import { getLegalMatters, getWhistleblowerReports } from "@/lib/api/legal";

export function useLegal() {
  const matters = useQuery({ queryKey: ["legal-matters"], queryFn: () => getLegalMatters() });
  const reports = useQuery({ queryKey: ["wb-reports"], queryFn: () => getWhistleblowerReports() });

  return { matters, reports };
}

export type LegalData = ReturnType<typeof useLegal>;
