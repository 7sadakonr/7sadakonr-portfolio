# Admin Mobile Responsive Design

## Goal

Make every Admin interface usable from 320px to 768px wide while preserving its current desktop layout and behavior.

## Scope

- Apply the responsive system to all existing Admin pages, including dashboard/analytics, project management, settings, contact/resume controls, authentication, tables, cards, filters, forms, drawers, and dialogs.
- Treat 320–430px as phone layouts and 431–768px as tablet/small-laptop layouts.
- Leave desktop layouts unchanged except where shared responsive rules improve flexible wrapping without visual regression.

## Responsive system

- Standardize responsive breakpoints in `src/features/admin/admin.css` at 768px, 580px, and 430px.
- At phone widths, use a single content column; stack page headers, filter controls, and multi-action toolbars vertically where they cannot fit.
- Retain two-column grids only when their cards remain readable; otherwise collapse to one column.
- Maintain a minimum 44px interactive target for primary controls on touch devices.
- Preserve long data tables as horizontally scrollable regions rather than hiding columns or destroying tabular semantics. Give tables a practical minimum width and visible overflow affordance.

## Component behavior

- Analytics: compact chart height and labels, horizontally scrollable metric tabs when necessary, one-column KPI cards, and stacked date/refresh controls.
- Forms and editors: single-column fields, full-width primary actions when controls would otherwise wrap poorly, and safe text wrapping for long values.
- Tables and session lists: contain overflow within the component, retain row actions, and avoid clipping labels.
- Drawers and dialogs: use the available viewport width on mobile, maintain internal scrolling, and keep the dismiss button reachable.
- Navigation and utility controls: avoid horizontal page overflow and preserve keyboard/accessibility behavior.

## Accessibility and resilience

- Do not use responsive CSS to remove essential controls or information.
- Preserve focus states, button labels/accessible names, semantic tables, and existing ARIA attributes.
- Respect viewport safe areas where the UI is fixed or edge-aligned.
- Test layouts at 320px, 375px, 430px, and 768px, plus an existing desktop width.

## Verification

- Add focused rendering/style tests only where the existing test setup can assert responsive structure or overflow classes reliably.
- Run typecheck, lint, build, existing tests, and inspect mobile viewports in a browser before handoff.
