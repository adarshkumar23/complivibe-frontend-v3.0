/**
 * Regulatory page API surface — thin re-exports of the typed framework catalog
 * endpoints (see lib/api/frameworks.ts) so the page reads from one module.
 */
export {
  getFrameworkCatalog,
  getActiveFrameworks,
  getFrameworkObligations,
  getApplicabilitySummary,
  activateFramework,
  deactivateFramework
} from "@/lib/api/frameworks";
export type { Framework, ActiveFramework, Obligation, ApplicabilitySummary } from "@/lib/api/frameworks";
