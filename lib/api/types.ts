export type UnknownRecord = Record<string, unknown>;

export type ScoreValue = {
  value: number | null;
  sourcePath: string | null;
};

export type Severity = "critical" | "high" | "medium" | "low" | "info";

export type NormalizedAlert = {
  id: string;
  severity: Severity;
  hasSeverity: boolean;
  title: string;
  description: string | null;
  timestamp: string | null;
  confidence: number | null;
};

export type NormalizedSystem = {
  id: string;
  name: string;
  riskLevel: Severity;
  score: number | null;
  owner: string | null;
  useCase: string | null;
  lifecycleStage: string | null;
};

export type EvidenceSummary = {
  totalCount: number;
  freshCount: number | null;
  staleCount: number | null;
  expiredCount: number | null;
};

export type NormalizedDeadline = {
  id: string;
  title: string;
  dueDate: string | null;
  daysRemaining: number | null;
  priority: string | null;
};

export type NormalizedEvent = {
  id: string;
  title: string;
  eventType: string;
  timestamp: string | null;
};
