/**
 * Pure filesystem guard (no browser, no backend). Regression test for the
 * cv_carbon_key client-side credential exposure: the carbon ingest key must never
 * be provisioned into, cached in, or transmitted from the browser again.
 *
 * The interactive UI now records readings via the session-authenticated
 * /carbon-accounting/readings/manual endpoint (cookie + CSRF), so neither the
 * localStorage slot name "cv_carbon_key" nor the machine ingest header
 * "X-CompliVibe-Key" may appear in any client-served source module or in the built
 * client bundle.
 *
 * Runs under the dependency-free `carbonkeyguard` project:
 *   npx playwright test --project=carbonkeyguard --config e2e/playwright.config.ts
 */
import { test, expect } from "playwright/test";
import fs from "node:fs";
import path from "node:path";

// Case-insensitive tokens that indicate the carbon ingest credential leaking client-side.
const FORBIDDEN = [/cv_carbon_key/i, /x-complivibe-key/i, /provisionCarbonApiKey/i];

const REPO_ROOT = path.resolve(__dirname, "..");

// Client-served surfaces. app/api/** is excluded: those are server-only route
// handlers (Next.js runs them on the server, never shipped to the browser).
const CLIENT_SOURCE_DIRS = ["lib", "components", "app"];
const SOURCE_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);

function walk(dir: string, filter: (p: string) => boolean): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules") continue;
      out.push(...walk(full, filter));
    } else if (filter(full)) {
      out.push(full);
    }
  }
  return out;
}

function offenders(files: string[]): string[] {
  const hits: string[] = [];
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    for (const re of FORBIDDEN) {
      if (re.test(text)) hits.push(`${path.relative(REPO_ROOT, file)} :: ${re}`);
    }
  }
  return hits;
}

test("client source modules never reference the carbon ingest key", () => {
  const files: string[] = [];
  for (const dir of CLIENT_SOURCE_DIRS) {
    files.push(
      ...walk(path.join(REPO_ROOT, dir), (p) => {
        if (!SOURCE_EXTS.has(path.extname(p))) return false;
        // app/api/** are server-only route handlers, not client-served.
        if (p.includes(`${path.sep}app${path.sep}api${path.sep}`)) return false;
        return true;
      }),
    );
  }
  // Sanity: we actually scanned a meaningful surface (and the carbon UI itself).
  expect(files.length).toBeGreaterThan(50);
  expect(files.some((f) => f.includes("billing.ts"))).toBe(true);

  expect(offenders(files), "carbon ingest key leaked into client source").toEqual([]);
});

test("built client bundle never contains the carbon ingest key", () => {
  const staticDir = path.join(REPO_ROOT, ".next", "static");
  if (!fs.existsSync(staticDir)) {
    test.skip(true, ".next/static not present — run `npm run build` to exercise this assertion");
    return;
  }
  const bundleFiles = walk(staticDir, (p) => path.extname(p) === ".js");
  expect(bundleFiles.length).toBeGreaterThan(0);
  expect(offenders(bundleFiles), "carbon ingest key present in built client bundle").toEqual([]);
});
