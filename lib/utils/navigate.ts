/**
 * Maps a backend `navigate_path` (from GET /api/v1/inbox items) to a real
 * frontend route, or `null` if no matching page exists yet.
 *
 * The backend emits several distinct entity-detail path shapes
 * (`/tasks/{id}`, `/audits/pbc/{id}`, `/compliance/policies/{id}/approvals/{id}`,
 * `/control-exceptions/{id}`) but the frontend has no per-entity detail routes
 * for any of them -- only list pages for a couple of these entity types exist.
 * Blindly prefixing every path with `/dashboard` (the old behavior) produced a
 * real 404 on every click for task-type items, and a working-but-misleading
 * "detail" link for pbc/approval items that actually just hit a 404 too. Only
 * resolve a path when we can confidently point at a real list page; otherwise
 * return null so the caller renders plain (non-clickable) text instead of a
 * dead link.
 */
export function resolveInboxNavigatePath(navigatePath: string | null | undefined): string | null {
  if (!navigatePath) return null;
  if (navigatePath.startsWith("/audits/pbc/")) return "/dashboard/audit-pack";
  if (navigatePath.startsWith("/compliance/policies/") && navigatePath.includes("/approvals/")) {
    return "/dashboard/approvals";
  }
  // /tasks, /tasks/{id}, /control-exceptions/{id}: no matching frontend route yet.
  return null;
}
