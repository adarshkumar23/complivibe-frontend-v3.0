/**
 * Pure render guard test (no browser, no backend). Proves the trust-graph node
 * icon lookup degrades gracefully for a node_type outside the known union --
 * the hardening for the previously-latent unguarded cast in RiskEntityGraphView.
 *
 * Runs under the dependency-free `iconguard` project:
 *   npx playwright test --project=iconguard
 */
import { test, expect } from "playwright/test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  iconForKind,
  KIND_ICON,
  FALLBACK_ICON,
  type NodeKind,
} from "../components/trust-graph/nodeIcons";

const KNOWN_KINDS: NodeKind[] = [
  "root-risk",
  "dependency-risk",
  "control",
  "vendor",
  "obligation",
  "evidence",
  "policy",
];

test("mapped kinds resolve to their specific icon", () => {
  for (const kind of KNOWN_KINDS) {
    expect(iconForKind(kind)).toBe(KIND_ICON[kind]);
  }
});

test("regression: the raw map lookup IS unsafe for an unmapped kind", () => {
  // This is exactly the pre-fix expression (KIND_ICON[data.kind]); it returns
  // undefined -> <Icon/> would be an invalid element type -> crash. The guard exists
  // precisely because this is undefined.
  expect((KIND_ICON as Record<string, unknown>)["totally-bogus-node-type"]).toBeUndefined();
});

test("unmapped / null / undefined kinds degrade to the fallback icon (never undefined)", () => {
  expect(iconForKind("totally-bogus-node-type" as NodeKind)).toBe(FALLBACK_ICON);
  expect(iconForKind("incident" as NodeKind)).toBe(FALLBACK_ICON); // plausible future backend type
  expect(iconForKind(null)).toBe(FALLBACK_ICON);
  expect(iconForKind(undefined)).toBe(FALLBACK_ICON);
  // the guard never yields undefined for ANY input
  for (const v of ["", "  ", "CONTROL", "policy ", "42"]) {
    expect(iconForKind(v as NodeKind)).toBeTruthy();
  }
});

test("an unmapped node_type renders a real SVG instead of throwing", () => {
  // With the old unguarded lookup this line threw "Element type is invalid".
  const render = (kind: string) =>
    renderToStaticMarkup(React.createElement(iconForKind(kind as NodeKind), { size: 14 }));

  const bogus = render("totally-bogus-node-type");
  expect(bogus).toContain("<svg");
  expect(bogus.length).toBeGreaterThan(0);

  // every known kind also renders a real SVG
  for (const kind of KNOWN_KINDS) {
    expect(render(kind)).toContain("<svg");
  }
});
