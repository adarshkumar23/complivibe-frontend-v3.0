# CompliVibe Frontend Style Guide

## Purpose

This file is the permanent visual and UX rulebook for the CompliVibe frontend.

Codex must read and follow this file before creating or modifying any frontend page, layout, component, chart, table, drawer, modal, empty state, loading state, or responsive behavior.

CompliVibe is not a normal SaaS dashboard. It must feel like a premium enterprise AI governance command center: calm, intelligent, trustworthy, futuristic, and investor-grade.

The product should look like a high-end AI governance operating system, not a generic admin template.

---

# 1. Product Feeling

CompliVibe should feel like:

* Premium enterprise AI command center
* AI governance operating system
* Compliance intelligence cockpit
* Trust infrastructure platform
* Soft, calm, glassmorphism dashboard
* High-confidence boardroom product
* Beautiful but not decorative
* Dense but not cluttered
* Technical but still human-readable

Avoid:

* Cheap admin dashboard look
* Dark cyberpunk theme
* Random gradients
* Overcrowded cards
* Low-quality shadows
* Default Tailwind UI feeling
* Bootstrap-style layouts
* Fake numbers
* Placeholder-heavy dashboard
* Uncontrolled color usage

---

# 2. Brand Style

CompliVibe uses a light blue-purple glass gradient identity.

Primary brand feeling:

* Blue = trust, security, compliance, enterprise
* Purple = AI, intelligence, governance
* Teal = health, stability, monitoring
* Amber = warning, pending, medium risk
* Red = critical, high risk, breached
* Green = complete, compliant, safe

Use gradients carefully. Gradients should feel soft and expensive, not loud.

Main brand gradient:

```css
linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)
```

Background gradient:

```css
linear-gradient(135deg, #EEF2FF 0%, #F0F4FF 45%, #F5F0FF 100%)
```

Accent glow:

```css
radial-gradient(circle at top right, rgba(59,130,246,0.18), transparent 36%),
radial-gradient(circle at bottom left, rgba(139,92,246,0.16), transparent 38%)
```

---

# 3. Core Design Tokens

Use these values across all pages.

```css
:root {
  --cv-blue: #3B82F6;
  --cv-purple: #8B5CF6;
  --cv-teal: #14B8A6;
  --cv-green: #10B981;
  --cv-amber: #F59E0B;
  --cv-red: #EF4444;

  --cv-text-primary: #0F172A;
  --cv-text-secondary: #64748B;
  --cv-text-muted: #94A3B8;

  --cv-bg-start: #EEF2FF;
  --cv-bg-mid: #F0F4FF;
  --cv-bg-end: #F5F0FF;

  --cv-card-bg: rgba(255, 255, 255, 0.82);
  --cv-card-border: rgba(255, 255, 255, 0.64);
  --cv-card-shadow: 0 20px 55px rgba(59, 130, 246, 0.10);

  --cv-radius-sm: 12px;
  --cv-radius-md: 16px;
  --cv-radius-lg: 20px;
  --cv-radius-xl: 28px;
}
```

Use Inter or system UI.

```css
font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

---

# 4. Layout System

All authenticated pages use the same dashboard shell.

## Sidebar

Desktop sidebar:

* Width: 276px to 292px
* Fixed left
* Full height
* Soft glass background
* Border-right with white transparency
* Grouped navigation
* Rounded active item
* Active item uses blue-purple gradient or soft blue-purple glow
* Icons from Lucide
* Labels should be clear and enterprise-grade

Sidebar groups:

```txt
Command
Compliance
AI Governance
Risk & Evidence
Trust & Assurance
Data
Enterprise
Security & Privacy
System
```

Sidebar must not feel crowded. Use group labels, spacing, and active states.

## Topbar

Topbar contains:

* Page context / breadcrumb
* Search bar
* Mode switcher
* Notifications
* Ask Copilot button
* User/org profile

Topbar height:

```txt
72px to 84px
```

Search bar:

* Rounded pill
* White translucent background
* Subtle border
* Icon on left
* Placeholder text muted
* No heavy shadow

Ask Copilot button:

* Blue-purple gradient
* Rounded pill
* Small sparkle/bot icon
* Smooth hover lift

## Main Content

Main content should use:

```txt
padding: 28px to 36px desktop
padding: 16px mobile
max-width: none for dashboards
```

Pages should breathe. Do not compress everything into a tight grid.

Use consistent vertical rhythm:

```txt
Page header
Primary KPI row
Main content grid
Tables/charts/details
Secondary sections
```

---

# 5. Page Header Pattern

Every page should start with a strong page header.

Required elements:

* Page title
* One-sentence page description
* Optional status badge
* Optional primary action
* Optional secondary action
* Optional last updated text

Example:

```txt
AI Systems
Monitor every AI system, model, dataset, owner, lifecycle stage, and governance risk in one place.
```

Header style:

* Title: 28px to 34px, weight 700/800
* Description: 14px to 16px, muted slate
* Actions aligned right on desktop
* Stack actions below title on mobile

---

# 6. Glass Card Rules

Use glass cards everywhere, but keep them controlled.

Glass card style:

```css
background: rgba(255, 255, 255, 0.82);
backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.64);
border-radius: 20px;
box-shadow: 0 20px 55px rgba(59, 130, 246, 0.10);
```

Hover:

```css
transform: translateY(-2px);
box-shadow: 0 26px 70px rgba(59, 130, 246, 0.14);
```

Cards should have:

* Clear title
* Optional subtitle
* Metric or content
* Footer/action area if needed
* Enough internal padding

Padding:

```txt
Small card: 18px
Normal card: 22px to 24px
Large panel: 28px
```

Avoid:

* Pure white flat cards
* Gray admin panels
* Heavy black shadows
* Too much border contrast
* Too many nested cards

---

# 7. Metric Cards

Metric cards are used for:

* Scores
* Counts
* Alerts
* Risks
* Evidence
* Deadlines
* Health status
* Readiness

Metric card structure:

```txt
Icon / label
Main value
Change / status
Mini sparkline or badge
```

Rules:

* Main number should be large and confident
* Use real API data only
* If data missing, show empty state or unavailable state
* Never invent numbers
* Never hardcode dashboard values

Score color rules:

```txt
>= 70: green
>= 40 and < 70: amber
< 40: red
```

Deadline color rules:

```txt
<= 30 days: red
<= 60 days: amber
> 60 days: green
```

---

# 8. Tables

Tables must feel enterprise-grade.

Every important table should support:

* Search
* Filter
* Sort
* Pagination
* Row hover
* Status badges
* Empty state
* Error state
* Loading skeleton
* Optional row action menu
* Optional detail drawer

Table style:

* Glass container
* Rounded 20px outer wrapper
* Sticky header if table is long
* Compact but readable rows
* 44px to 56px row height
* Light separators
* No heavy borders

Toolbar pattern:

```txt
Left: section title + count
Middle/right: search + filters
Right: primary action
```

Avoid:

* Raw HTML tables
* Dense spreadsheet look
* No spacing
* No empty state
* Showing JSON directly

---

# 9. Badges & Pills

Use rounded pill badges.

Severity badges:

```txt
Critical: red
High: red/amber
Medium: amber
Low: green/teal
Info: blue
```

Status badges:

```txt
Compliant: green
Ready: green
In Review: blue
Pending: amber
Blocked: red
Draft: slate
Published: purple
Monitoring: teal
```

Badge style:

* Soft background tint
* Small dot or icon optional
* Text should be readable
* Avoid neon colors

---

# 10. Charts & Data Visuals

Charts must be calm and readable.

Use:

* Score rings
* Donut charts
* Sparklines
* Line charts
* Bar charts
* Heatmaps
* Timeline
* Graph visualization where needed

Rules:

* Use brand colors consistently
* Avoid rainbow charts
* Use labels and tooltips
* Empty chart must show empty state
* Loading chart must use skeleton
* Do not render broken charts with fake data

For graph pages like Trust Graph or Data Lineage:

* Use spacious canvas
* Node details in side panel/drawer
* Highlight selected node
* Provide zoom/pan controls if possible
* Provide summary cards above graph

---

# 11. Forms

Forms should feel premium and simple.

Use for:

* Login
* Create risk
* Create incident
* Invite user
* Generate report
* Apply certification
* Upload questionnaire
* Policy creation

Rules:

* Labels above inputs
* Helpful descriptions
* Clear error messages
* Primary action obvious
* Secondary action muted
* Never use raw browser default inputs
* Inputs should have 14px to 16px text
* Radius 12px to 16px
* Focus state: blue-purple ring

---

# 12. Drawers & Modals

Use drawers for:

* Copilot
* Details
* Review evidence
* Approval action
* Row details
* Quick edit
* Search result preview

Use modals for:

* Confirm delete
* Confirm approve/reject
* Generate report
* Critical irreversible actions

Drawer style:

* Right side
* 420px to 620px desktop
* Full width on mobile
* Glass/white panel
* Header, content, footer action area

Modal style:

* Centered
* Rounded 24px
* Soft backdrop blur
* Clear title and message
* Primary/secondary actions

---

# 13. Loading, Error & Empty States

Never use full-page failure unless auth is invalid.

Loading:

* Use skeletons
* Never use spinner-only loading
* Skeleton should match actual layout

Error:

* Section-level error
* Friendly message
* Retry button
* Technical detail hidden or muted
* Do not log user out for network failure

Empty:

* Icon
* Title
* Short explanation
* Optional action
* Never leave blank card/table

Examples:

```txt
No evidence uploaded yet.
Upload your first evidence file to start building an audit-ready chain of custody.
```

```txt
Unable to load predictive alerts.
The backend may be temporarily unavailable. Retry this section.
```

---

# 14. Motion Rules

Use Framer Motion lightly.

Allowed motion:

* Page fade/slide on load
* Card hover lift
* Skeleton shimmer
* Drawer slide
* Modal scale/fade
* Staggered card entrance
* Score ring animation
* Subtle graph/link animation

Timing:

```txt
Fast: 120ms
Normal: 180ms to 240ms
Slow: 320ms
```

Easing:

```txt
easeOut
spring only for interactive elements
```

Avoid:

* Bouncy childish animation
* Too many moving elements
* Infinite animations everywhere
* Slow transitions that hurt productivity

---

# 15. Responsive Rules

Desktop first, but mobile must be usable.

Desktop:

* Sidebar visible
* Topbar full
* 2 to 4 column dashboard grids
* Large charts

Tablet:

* Sidebar collapsible
* 2 column grids
* Tables may scroll horizontally

Mobile:

* Sidebar becomes drawer
* Topbar simplified
* Cards stack
* Tables become cards or horizontal scroll
* Primary action stays visible
* Copilot drawer full width

Never allow:

* Horizontal page overflow
* Cut-off buttons
* Broken charts
* Invisible text
* Tiny tap targets

Minimum tap target:

```txt
44px
```

---

# 16. Data & API Rules

Use real backend data only.

Backend:

```txt
https://api.adarshkumar.app
```

Token:

```txt
localStorage key: cv_token
```

Rules:

* Never hardcode fake metric numbers
* Never mock successful business data
* Never silently swallow API errors
* Use TanStack Query for fetching
* Use typed API service files by module
* Use pagination where APIs support limit
* Protected endpoint 401 means session/auth issue
* Network error means show section retry
* Empty array means designed empty state
* Missing field means graceful fallback, not crash

API client should be organized by domain:

```txt
lib/api/auth.ts
lib/api/command.ts
lib/api/compliance.ts
lib/api/ai-systems.ts
lib/api/evidence.ts
lib/api/risks.ts
lib/api/intelligence.ts
lib/api/data-observability.ts
lib/api/trust.ts
lib/api/reports.ts
lib/api/enterprise.ts
lib/api/security.ts
lib/api/privacy.ts
lib/api/settings.ts
```

---

# 17. Page Architecture Pattern

Every page should follow this pattern:

```txt
1. Page header
2. Primary summary cards
3. Main content area
4. Secondary supporting panels
5. Table/list/detail/graph
6. Empty/error/loading handling
7. Responsive behavior
```

Do not create pages as random collections of cards.

Every page must answer:

```txt
What is the user trying to understand?
What decision can they make?
What action can they take?
What risk/compliance/evidence status changed?
```

---

# 18. Module Personality

## Command Center

Must feel like the mission-control cockpit.

Use:

* Score cards
* Trust graph
* Alerts
* Deadlines
* Governance feed
* Executive summary

Avoid:

* Too many tables
* Small text everywhere

## Compliance

Must feel structured and trustworthy.

Use:

* Framework cards
* Progress bars
* Obligations table
* Gap analysis
* Deadline timeline
* Certification status

## AI Systems

Must feel like an AI asset registry.

Use:

* System cards/grid
* Risk badges
* Lifecycle pills
* Owner/use-case metadata
* Detail page with tabs

## Evidence

Must feel audit-ready.

Use:

* Evidence freshness
* Chain of custody
* Upload action
* Missing evidence alerts
* Review workflow

## Risks

Must feel decision-oriented.

Use:

* Heatmap
* Severity grouping
* Accepted risks
* Forecast
* AI recommendations

## Incidents

Must feel operational.

Use:

* Severity
* Status
* Root cause
* Postmortem
* Blast radius

## Data Observability

Must feel like clean infrastructure monitoring.

Use:

* Health score
* Sources
* Pipelines
* Freshness
* Quality
* Sensitive data
* Lineage

## Trust Center

Must feel buyer-facing.

Use:

* Trust score
* Badges
* Certifications
* Public preview
* Publish action

## Assurance

Must feel human-reviewed.

Use:

* Approval queue
* Findings
* Attestations
* Technical files
* Reviewer actions

## Reports

Must feel export-ready.

Use:

* Templates
* Generated reports
* Download actions
* Board/investor/due diligence categories

## Enterprise

Must feel operationally mature.

Use:

* Workload
* SLA breaches
* RACI
* Approval matrix
* Risk appetite

---

# 19. Component Naming Rules

Use clean component names.

Examples:

```txt
GlassCard
StatCard
ScoreRing
DonutChart
Sparkline
SeverityBadge
StatusBadge
DataTable
PageHeader
SectionHeader
EmptyState
ErrorState
LoadingSkeleton
ConfirmDialog
FileUpload
CopilotDrawer
ModeSwitcher
CommandTopbar
DashboardSidebar
```

Avoid:

```txt
Card1
TestComponent
NewDashboard
FinalDashboard
Temp
Demo
Mock
```

---

# 20. File Organization

Recommended structure:

```txt
app/
  login/
  dashboard/
    page.tsx
    layout.tsx
    compliance/
    ai-systems/
    data-observability/
    evidence/
    risks/
    incidents/

components/
  layout/
  ui/
  charts/
  tables/
  forms/
  feedback/

features/
  command-center/
  compliance/
  ai-governance/
  evidence-risk/
  intelligence/
  data-observability/
  trust-center/
  assurance/
  reports/
  enterprise/
  security-privacy/
  integrations/
  settings/

lib/
  api/
  utils/
  formatters/
  constants/

store/
  auth-store.ts
  ui-store.ts
```

---

# 21. QA Checklist Before Reporting Done

Before Codex says a page is done, it must check:

```txt
Does npm run build pass?
Does the page load in browser?
Does the page use real API data?
Does it handle loading?
Does it handle empty state?
Does it handle API error?
Does it work on desktop?
Does it work on mobile?
Does it match the blue-purple glass style?
Does it avoid fake hardcoded metrics?
Does it keep layout consistent with other pages?
Are screenshots captured?
```

Codex must report:

```txt
Files changed
APIs connected
What works
What failed
Screenshots captured
Visual issues still remaining
Next recommended step
```

---

# 22. Non-Negotiable Rules

Do not violate these.

```txt
No fake data.
No hardcoded dashboard numbers.
No full-page crash for one failed section.
No spinners as primary loading state.
No random colors outside design tokens.
No dark cyberpunk UI.
No cluttered dashboards.
No broken mobile layout.
No deleting backend logic.
No changing API contracts without asking.
No assuming missing endpoint shapes.
No building all 40 pages at once.
```

---

# 23. Build Philosophy

Build CompliVibe in this order:

```txt
1. Make it work.
2. Make it beautiful.
3. Make it consistent.
4. Make it enterprise-grade.
5. Make it complete.
```

Every page should feel like part of one operating system.

CompliVibe should look like a product that can compete with Vanta, OneTrust, Datadog, Coralogix, Credo AI, and future AI governance infrastructure platforms.

The visual benchmark is not “functional dashboard.”

The benchmark is:

```txt
Premium AI Governance Command Center
```
