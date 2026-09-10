# Admin Mobile Responsive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all Admin pages usable at 320px–768px without regressing their desktop layouts.

**Architecture:** Keep the implementation CSS-first in the existing `admin.css` stylesheet, with only small markup changes when a component needs an explicit scroll wrapper or responsive class. Use the existing Admin components and semantic tables rather than creating parallel mobile views.

**Tech Stack:** React 19, TypeScript, CSS, Vitest, Vite.

## Global Constraints

- Cover phone widths 320–430px and tablet widths through 768px.
- Preserve desktop layouts and existing behavior.
- Keep essential controls and semantic table data visible; use contained horizontal scrolling for wide tables.
- Keep touch controls at least 44px where primary interaction occurs.
- Preserve accessibility semantics, labels, focus states, and ARIA behavior.

---

### Task 1: Establish the shared Admin mobile layout foundation

**Files:**
- Modify: `src/features/admin/admin.css`
- Create: `tests/adminResponsiveStyles.test.ts`

**Interfaces:**
- Produces shared media-query rules at `768px`, `580px`, and `430px` for `.admin-page`, page headings, forms, action groups, and primary controls.

- [ ] **Step 1: Write the failing stylesheet contract test**

```ts
expect(css).toContain('@media (max-width: 768px)')
expect(css).toContain('@media (max-width: 430px)')
expect(css).toContain('.admin-page { width: min(100% - 24px, 1120px)')
expect(css).toContain('min-height: 44px')
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/adminResponsiveStyles.test.ts`

- [ ] **Step 3: Implement the CSS foundation**

Add ordered 768px, 580px, and 430px media rules at the end of `admin.css`. At 768px reduce page gutters and stack headers/forms/actions that cannot fit. At 580px make page action controls full width when grouped. At 430px use 12px side gutters, preserve readable type, and set mobile primary controls to `min-height: 44px`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/adminResponsiveStyles.test.ts`

- [ ] **Step 5: Commit**

Run: `git add src/features/admin/admin.css tests/adminResponsiveStyles.test.ts; git commit -m "feat(admin): add responsive layout foundation"`

### Task 2: Make analytics and data-dense Admin panels mobile-safe

**Files:**
- Modify: `src/features/admin/admin.css`
- Modify: `src/features/admin/components/analytics/InteractionChart.tsx` only if an explicit chart wrapper/class is required
- Test: `tests/adminResponsiveStyles.test.ts`

**Interfaces:**
- Consumes the Task 1 breakpoints.
- Produces responsive analytics grids, controls, chart sizing, metric-tab overflow handling, contained table overflow, and mobile drawer layout.

- [ ] **Step 1: Extend the failing style test**

```ts
expect(css).toContain('.analytics-metric-segmented { overflow-x: auto')
expect(css).toContain('.analytics-chart-container { height: 260px; min-height: 260px; }')
expect(css).toContain('.analytics-drawer { width: 100%; }')
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/adminResponsiveStyles.test.ts`

- [ ] **Step 3: Implement analytics mobile rules**

At tablet widths stack analytics header controls and collapse supporting grids as needed. At phone widths make KPI and subtiles one column, lower chart height to 260px, make metric selectors horizontally scrollable without clipping buttons, use smaller chart tick density through existing props/CSS support, make table wrappers scroll within the panel, and set drawers to full viewport width with compact safe padding.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/adminResponsiveStyles.test.ts`

- [ ] **Step 5: Commit**

Run: `git add src/features/admin/admin.css src/features/admin/components/analytics/InteractionChart.tsx tests/adminResponsiveStyles.test.ts; git commit -m "feat(admin): optimize analytics for mobile"`

### Task 3: Adapt project, profile, contact, resume, and authentication flows

**Files:**
- Modify: `src/features/admin/admin.css`
- Modify: `src/features/admin/components/ProjectForm.tsx` only if controls lack a hook for responsive grouping
- Modify: `src/features/admin/pages/AdminProjectsPage.tsx` only if action/table overflow needs an explicit wrapper
- Test: `tests/adminResponsiveStyles.test.ts`

**Interfaces:**
- Uses the shared CSS breakpoints from Task 1.
- Produces single-column editors, safe project-row media/action wrapping, readable long-value handling, and mobile-safe forms/buttons.

- [ ] **Step 1: Extend the failing style test**

```ts
expect(css).toContain('.admin-project-row { grid-template-columns: 1fr; }')
expect(css).toContain('.admin-form-actions { width: 100%; }')
expect(css).toContain('overflow-wrap: anywhere')
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/adminResponsiveStyles.test.ts`

- [ ] **Step 3: Implement focused flow rules**

Collapse project rows and all Admin form grids on phones; make action rows wrap or stack with usable targets; give editable long labels, URLs, tag lists, and resume/contact values safe wrapping; and keep image fields within their container. Do not duplicate page markup or remove controls.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/adminResponsiveStyles.test.ts`

- [ ] **Step 5: Commit**

Run: `git add src/features/admin/admin.css src/features/admin/components/ProjectForm.tsx src/features/admin/pages/AdminProjectsPage.tsx tests/adminResponsiveStyles.test.ts; git commit -m "feat(admin): adapt management flows for mobile"`

### Task 4: Verify responsive behavior across Admin

**Files:**
- Verify only.

- [ ] **Step 1: Run focused responsive and Admin tests**

Run: `npm test -- tests/adminResponsiveStyles.test.ts tests/adminLogin.test.tsx tests/interactionChart.test.tsx`

- [ ] **Step 2: Run quality checks**

Run: `npm run typecheck; npm run lint; npm run build`

- [ ] **Step 3: Inspect viewports and diff**

Use the local Admin app to inspect 320px, 375px, 430px, 768px, and desktop widths. Confirm no page-level horizontal overflow, controls remain reachable, and tables scroll only inside their own wrapper. Then run: `git diff --check; git status --short`.
