/**
 * Executive page reads from the same typed real endpoints as the rest of the app:
 * posture summary, dashboard summary, board scorecards, and the risk register.
 */
export { getPostureSummary, getDeadlines } from "@/lib/api/compliance";
export { getDashboardSummary } from "@/lib/api/command";
export { getBoardScorecards } from "@/lib/api/reports";
export { getRisks, getRiskSummary } from "@/lib/api/risks";
