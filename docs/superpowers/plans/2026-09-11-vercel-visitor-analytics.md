# Vercel Visitor Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render visitor totals and the visitor timeline in Admin Analytics directly from Vercel Web Analytics, without synthetic Supabase fallback points.

**Architecture:** The Vercel proxy requests and normalizes visitor aggregates at the requested bucket granularity. The analytics hook consumes this series only for visitors; Supabase continues to serve engagement metrics. The chart labels visitor data as Vercel-provided and identifies an unavailable source.

**Tech Stack:** TypeScript, Vercel serverless API, React 19, Recharts 3, Vitest.

## Global Constraints

- Do not merge or maximize Vercel visitor values with Supabase visitor values.
- Do not inject totals into empty visitor time buckets.
- Keep Supabase as the source for interactions, project opens, clicks, downloads, funnel, sessions, and recent sessions.
- Vercel-only visitor data may include traffic that Supabase admin opt-out excludes.

---

### Task 1: Normalize Vercel visitor time-series data

**Files:**
- Modify: `api/vercel-traffic.ts`
- Create: `tests/vercelTraffic.test.ts`

**Interfaces:**
- Produces `visitorTimeSeries: Array<{ date: string; visitors: number }>` and `visitorDataAvailable: boolean`.
- Uses `granularity=hour` for `days === 1`; uses `granularity=day` otherwise.

- [ ] **Step 1: Write the failing test**

```ts
expect(normalizeVisitorSeries([{ key: '2026-09-11T06:00:00.000Z', visitors: 2 }], 'hour')).toEqual([
  { date: '06:00', visitors: 2 },
])
expect(normalizeVisitorSeries([], 'day')).toEqual([])
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/vercelTraffic.test.ts`

- [ ] **Step 3: Write minimal implementation**

Export a pure `normalizeVisitorSeries(rows, granularity)` helper. Request a dedicated visits aggregate using `granularity=hour` for a one-day request, otherwise `day`; normalize date keys to `HH:00` or `YYYY-MM-DD`, combine duplicates, sort them, and return an empty array for no valid rows. Add `visitorDataAvailable: seriesResponse.ok` to the response while preserving totals, referrers, and countries.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/vercelTraffic.test.ts`

- [ ] **Step 5: Commit**

Run: `git add api/vercel-traffic.ts tests/vercelTraffic.test.ts; git commit -m "feat(analytics): expose Vercel visitor series"`

### Task 2: Use Vercel as the exclusive visitor source

**Files:**
- Modify: `src/features/admin/hooks/useAnalytics.ts`
- Create: `tests/useAnalytics.test.tsx`

**Interfaces:**
- Consumes `configured`, `totalVisitors`, `visitorDataAvailable`, and `visitorTimeSeries` from `/api/vercel-traffic`.
- Produces visitor overview and `timeseries.visitors` only from those fields.

- [ ] **Step 1: Write the failing test**

```tsx
expect(result.current.overview?.visitors).toBe(3)
expect(result.current.timeseries).toEqual([{ date: '06:00', count: 0 }, { date: '07:00', count: 3 }])
expect(result.current.timeseries.every((point) => point.count === 0)).toBe(true)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/useAnalytics.test.tsx`

- [ ] **Step 3: Write minimal implementation**

Extend `VercelPayload` with the new fields. Map Vercel buckets over the established 24-hour/daily axes using zero for absent buckets. Remove Supabase fallback injection into the current or final visitor bucket, and remove cross-source maximum merging for visitor totals. Keep existing Supabase processing for non-visitor metrics.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/useAnalytics.test.tsx`

- [ ] **Step 5: Commit**

Run: `git add src/features/admin/hooks/useAnalytics.ts tests/useAnalytics.test.tsx; git commit -m "fix(analytics): source visitors from Vercel only"`

### Task 3: Clarify visitor source and unavailable state

**Files:**
- Modify: `src/features/admin/components/analytics/InteractionChart.tsx`
- Modify: `src/features/admin/pages/AdminAnalyticsPage.tsx`
- Create: `tests/interactionChart.test.tsx`

**Interfaces:**
- Adds `isVisitorDataAvailable?: boolean` to `InteractionChartProps`.

- [ ] **Step 1: Write the failing test**

```tsx
render(<InteractionChart metric="visitors" data={[]} isLoading={false} isVisitorDataAvailable={false} />)
expect(screen.getByText(/Vercel visitor data is unavailable/i)).toBeInTheDocument()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/interactionChart.test.tsx`

- [ ] **Step 3: Write minimal implementation**

For visitors, identify the total and subtitle as Vercel data. When Vercel is unavailable, render an inline non-error message instead of a fabricated data point. Keep zero-valued chart rendering when Vercel responded successfully but has no buckets. Pass the availability prop from the hook through the existing Admin Analytics page.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/interactionChart.test.tsx`

- [ ] **Step 5: Commit**

Run: `git add src/features/admin/components/analytics/InteractionChart.tsx src/features/admin/pages/AdminAnalyticsPage.tsx tests/interactionChart.test.tsx; git commit -m "feat(analytics): identify Vercel visitor data"`

### Task 4: Verify integration

**Files:** Verify only.

- [ ] **Step 1: Run focused tests**

Run: `npm test -- tests/vercelTraffic.test.ts tests/useAnalytics.test.tsx tests/interactionChart.test.tsx`

- [ ] **Step 2: Run repository checks**

Run: `npm run typecheck; npm run lint; npm run build`

- [ ] **Step 3: Inspect diff**

Run: `git diff --check; git status --short`
