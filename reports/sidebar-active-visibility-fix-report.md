# Sidebar Active Item Visibility Fix

**Date:** 2026-06-14
**Component:** `components/layout/FloatingSidebar.tsx`
**Scope:** Visual states only (active / hover / focus / inactive). No backend, route, nav-item, or page-logic changes.

---

## Root cause

The active nav item renders its gradient highlight as a **separate sibling element** — an
`absolute inset-0` `motion.span` with `layoutId="sidebar-active"` (the liquid-glass shared-layout
pill). The label and icon spans only had `relative` with **no explicit z-index**, so they relied
purely on DOM paint order to stay above the pill.

Framer-motion's `layoutId` shared-layout animation applies a `transform` to that pill while moving
it between items. A transformed, positioned element establishes its own stacking context, which let
the **opaque cyan→blue→violet gradient pill paint over the `text-white` label and icon**. The result:
the active label (e.g. "Executive Summary") was covered by the gradient and appeared nearly invisible,
even though the gradient background itself rendered correctly.

In short: it was a **stacking-order bug**, not a color/contrast value bug — the white text was being
occluded by its own active-state background pill.

A secondary latent issue: prefix route matching used a bare `pathname.startsWith(item.href)` with no
path-segment boundary, which could mark sibling routes active (e.g. a future `/dashboard/audit` vs
`/dashboard/audit-pack`).

---

## Files changed

| File | Change |
|------|--------|
| `components/layout/FloatingSidebar.tsx` | Stacking fix for active content, focus-visible ring, `aria-current`, boundary-safe route matching helper |

No other files were modified. Sidebar width (`w-[320px]` desktop / `w-[284px]` mobile), position
(`sticky top-0`), scroll (`overflow-y-auto`), topbar, and page layout are unchanged.

---

## Before / after behavior

| State | Before | After |
|-------|--------|-------|
| **Active** | Gradient pill painted over the white label → label/icon nearly invisible | Label + icon sit on `z-10` above the `z-0` pill → always readable white on gradient |
| **Inactive** | Readable slate (unchanged) | Readable slate (unchanged) |
| **Hover (inactive)** | `hover:bg-white/60`, text → ink | Unchanged — still clearly readable |
| **Keyboard focus** | No visible focus indicator (`outline` defaulted away) | Visible `focus-visible:ring-2 ring-cv-blue` with white offset |
| **Detail routes** (`/dashboard/ai-systems/[id]`) | Parent active via loose `startsWith` | Parent active via segment-boundary match |
| **Sibling routes** | Could over-match with loose prefix | Cannot over-match (boundary `href + "/"`) |

---

## Active / inactive / hover / focus styling summary

**Active**
- Background: `bg-cv-brand` gradient pill (`linear-gradient(135deg, #06B6D4 → #3B82F6 → #8B5CF6)`) with `shadow-button` glow — kept for premium liquid-glass look.
- Pill pinned to `z-0`; label + icon raised to `z-10` so content always paints above the pill.
- Text: `text-white drop-shadow-sm` (high contrast over the dark-enough gradient).
- Icon: `text-white` in a `bg-white/25` chip (high contrast).
- `aria-current="page"` added for accessibility.

**Inactive**
- Text: `text-cv-slate` (#64748B — readable on light glass).
- Icon: `text-cv-slate` in a `bg-white/70` chip.

**Hover (inactive)**
- `hover:bg-white/60` + `hover:text-cv-ink` (#0F172A); icon `group-hover:text-cv-blue`. Text never fades out.

**Focus (keyboard)**
- `outline-none` replaced with `focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 focus-visible:ring-offset-white`.

---

## Route matching

Replaced inline logic with `isNavItemActive(item, pathname)`:

```ts
if (item.match === "exact") return pathname === item.href;
return pathname === item.href || pathname.startsWith(item.href + "/");
```

Verified behavior:

| Route | Active item | Correct |
|-------|-------------|---------|
| `/dashboard` | Command Center (exact only) | ✅ |
| `/dashboard/executive` | Executive Summary | ✅ |
| `/dashboard/search` | Search | ✅ |
| `/dashboard/compliance` | Compliance | ✅ |
| `/dashboard/ai-systems` | AI Governance | ✅ |
| `/dashboard/ai-systems/{id}` | AI Governance (parent stays active) | ✅ |
| `/dashboard/data-observability/lineage` | Data Observability (parent stays active) | ✅ |

`/dashboard` (Command Center) uses `match: "exact"`, so it is **not** marked active on any
`/dashboard/*` sub-route — preventing the parent from over-matching every page.

---

## Scroll state

The active pill is part of the scrolling `<nav className="... overflow-y-auto">` content, so it
scrolls with its item and the `z-10` content fix keeps the label readable regardless of scroll
position (top, bottom, or while the glass background overlaps the page gradient). No change to scroll
behavior.

---

## Validation

| Check | Result |
|-------|--------|
| `tsc --noEmit` | ✅ Pass (exit 0, no errors) |
| `npm run build` | ✅ Pass (exit 0, all 40+ dashboard routes compiled) |
| Active label readable | ✅ White-on-gradient, content above pill |
| Hover label readable | ✅ Slate → ink, no fade |
| Icons visible (all states) | ✅ |
| Keyboard focus ring | ✅ Visible `focus-visible` ring |
| Nested `/dashboard/ai-systems/[id]` | ✅ Parent active (route exists) |
| Mobile drawer | ✅ Same `SidebarBody`, behavior preserved |

---

## Constraints honored

- No redesign, no backend changes, no route changes, no removed nav items, no page-logic changes.
- Liquid-glass premium style preserved (same gradient, glow, chips).
- Sidebar scroll, width, position, topbar, and responsive/mobile behavior unchanged.
