# Vercel Visitor Analytics Design

## Goal

Make the Admin Analytics visitor metrics and timeline match Vercel Web Analytics. Avoid injecting a synthetic visitor value into an hourly or daily chart when the custom analytics source has no matching bucket.

## Current behavior

The Admin dashboard combines Vercel and Supabase visitor figures with `Math.max`. Its client-side fallbacks can place the aggregate "Visitors Today" value into the current hour (or total range value into the final day) when the custom time series is empty. This can leave a chart point at `1` after the admin user has been excluded from custom analytics.

## Design

- Vercel Web Analytics is the sole source for the `Visitors` metric and visitor chart.
- The one-day chart uses Vercel hourly visitor buckets; the seven- and thirty-day charts use Vercel daily visitor buckets.
- The UI identifies the metric as Vercel-provided.
- If Vercel is unavailable, missing credentials, or returns no applicable time-series data, the visitor chart remains empty/zero and displays an explanatory unavailable state. It must not derive or inject visitor data from Supabase.
- Supabase remains the source for engagement metrics: interactions, project opens, external clicks, resume downloads, funnel, sessions, and recent sessions.
- Admin opt-out continues to exclude the admin's custom analytics events. Vercel’s inclusion/exclusion behavior remains governed by its own project configuration.

## Files likely to change

- `api/vercel-traffic.ts` — expose correctly bucketed Vercel visitor time series, including hourly data for a one-day range.
- `src/features/admin/hooks/useAnalytics.ts` — make visitor overview and series consume Vercel only; remove visitor fallback injection and cross-source max merging.
- `src/features/admin/components/analytics/InteractionChart.tsx` — clarify visitor source and render the unavailable/empty state.
- Relevant API/hook/component tests, if existing patterns cover these paths.

## Edge cases

- Vercel data may arrive delayed or be unavailable: show no invented visitors and retain engagement data.
- Time buckets must be normalized to the dashboard’s displayed timezone and ordered chronologically.
- Vercel can contain traffic that custom analytics excludes (such as admin routes), so the dashboard must not claim that Vercel visitors inherit Supabase exclusions.

## Verification

- Test visitor-series mapping for hourly and daily Vercel responses.
- Confirm an empty Vercel response never yields a synthetic `1` or aggregate point.
- Run the project’s relevant test, typecheck, lint, and build commands.
