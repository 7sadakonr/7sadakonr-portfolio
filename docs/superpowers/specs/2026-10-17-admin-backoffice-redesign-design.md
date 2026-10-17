# Admin backoffice redesign — Analytics first, then the rest

## Context
Admin backoffice (Vite + React 19 + HeroUI v3 + Tailwind v4 + recharts + Supabase, `src/features/admin/`) looks inconsistent and its Analytics page is hard to trust:
- Placeholder/meaningless numbers: External Clicks always 0 (`useAnalytics.ts:247`), GitHub/Demo/Click Rate always 0, per-project "Unique Visitors" = opens (SQL `analytics_project_performance`), visitor growth badge never shows (`visitors_prev` null).
- Time is wrong: rows are written with DB `current_date` (UTC) but read as local days; some RPCs take `p_tz`, others don't; Vercel day buckets are UTC; `analyticsTime.ts:29-33` parses dates as UTC midnight.
- Labels lie ("Daily Average" shows per-hour, "Peak Activity (N events)" for visitors); countries table mixes DB events with Vercel visits; UTM table mixes Vercel referrers with UTM rows; 1-day view shows DB series as 1–2 points.
- Whole admin: no shared components, colours defined 3 ways (`--admin-*`, raw hex, `bg-[#16161b]`), undefined `--admin-surface-muted`, no toasts, no unsaved-changes guard, contact delete without confirm, focus rings disabled, breakpoints split between CSS 768px and Tailwind `sm:`.
- `api/vercel-traffic.ts` has **no auth check**.

**Decisions (from user):** track GitHub/Demo clicks for real and drop unmeasurable metrics; all analytics time fixed to **Asia/Bangkok (GMT+7)**; English UI, dark only; 2 phases, one PR each.

---

## Phase 1 — Design foundation + Analytics (PR 1)

### 1.1 Design foundation (`src/features/admin/`)
- `admin.css`: one token set on `:root` — bg / surface / surface-raised / surface-muted / border / text / muted / accent / success / danger / warning + 4 chart series colours (pick via `dataviz` skill, validated for contrast on `#0d0d0f`). Replace raw hex and `bg-[#…]` arbitrary values with tokens; rename mismatched KPI classes; remove dead styles (`admin-button--quiet` if still unused, Live pulse).
- Restore visible focus: `:focus-visible` ring using accent within `.admin-shell` (override arc `--focus-ring: transparent`); drop `focus:outline-none` without replacement.
- Single breakpoint system: Tailwind `md` (768px) in JSX; remove the duplicated CSS media hides.
- New shared components in `src/features/admin/components/ui/`:
  - `PageHeader` (eyebrow, title, description, actions slot) — replaces per-page duplicated markup.
  - `Panel` (titled card: title, description, actions, body; loading/empty/error slots).
  - `StatCard` (label, value, delta vs previous period with ↑/↓ colour + sr-text, optional sparkline, info tooltip explaining the metric & source).
  - `DataTable` (columns config → table on ≥md, stacked cards on mobile; sortable header; empty state). Replaces `.analytics-table*` + `.analytics-mobile-card-list` variants.
  - `EmptyState`, `InlineSkeleton`.
  - `ToastProvider` + `useToast` (use HeroUI v3 toast if present in installed version, else a small portal-based one) — replaces setTimeout `Alert`s.
- `AdminLayout`: remove decorative "Live System" chip; add "View site ↗" link; styled loading fallback for Suspense and "Checking session…".

### 1.2 Tracking & data (new migration `supabase/migrations/2026101700000_analytics_bangkok_hourly.sql`)
- `analytics_daily`: add `hour smallint not null default 0` (0–23, Bangkok); `date` default → `(now() at time zone 'Asia/Bangkok')::date`; rebuild unique key to include `hour`; add index `(date, hour)`. Legacy rows keep their date with hour 0 (documented; affects only history before deploy).
- `analytics_record_events`: write Bangkok date + hour; accept metrics `github_click`, `demo_click`.
- RPCs: drop `p_tz`; all use Bangkok. Ranges = Bangkok calendar days:
  - `24h` → last 24 hourly buckets; `7d`/`30d` → last N calendar days including today.
  - `analytics_overview(p_from, p_to)` returns current **and previous-period** totals for page_view, project_open, resume_download, github_click, demo_click.
  - `analytics_timeseries(p_from, p_to, p_granularity 'hour'|'day')` zero-filled via `generate_series`.
  - `analytics_project_performance`: opens, github_clicks, demo_clicks, click-through = (github+demo)/opens; remove fake `visitors`.
  - `analytics_utm_campaigns`: events only (no Vercel merge).
  - Drop `analytics_top_interactions` and `analytics_top_countries` (replaced below). Keep `analytics_cleanup_old_data`.
- Update `supabase/tests/database/*` for new metrics, hour column, RLS still enforced.
- `src/lib/analytics/tracker.ts`: allow `github_click`/`demo_click`; fire them from `ProjectCard.tsx` GitHub/Demo handlers and the project page links (`ProjectPage.tsx`). Same for `api/analytics.ts` allow-list.
- `api/vercel-traffic.ts`:
  - **Require admin** (reuse the token check from `api/publish.ts`).
  - Request Bangkok-aligned buckets: use Vercel `tz=Asia/Bangkok` if the API accepts it (verify first); otherwise fetch hourly and re-bin into Bangkok days server-side.
  - Return current + previous-period visitors, series, referrers, countries (visitors only).

### 1.3 Analytics page information architecture
Rewrite `AdminAnalyticsPage.tsx` + `useAnalytics.ts`; one question per section, one unit per table.

1. **Header** — `PageHeader` "Analytics"; range segmented control `24h · 7 days · 30 days`; "Updated 12s ago" + Refresh; caption "All times in Bangkok (GMT+7)". Remove "Live Sync"/"Unified with Vercel" badges.
2. **KPI row (4 StatCards)** — Visitors (Vercel), Page views, Project opens, Resume downloads. Each: value, % change vs previous period, sparkline, tooltip with definition + source. Visitors card shows "Vercel unavailable" state instead of `--` when the API fails.
3. **Traffic trend** (`Panel`) — area chart of Visitors with Page views as second line; dashed previous-period overlay; hourly for 24h, daily otherwise; tooltip with full date/time; correct summary line ("Peak: Tue 14 Oct — 42 visitors · Avg 18/day"). Engagement tab: Project opens / Resume downloads / Outbound clicks (GitHub+Demo) stacked bars. Drop External Clicks tab.
4. **Projects** (`DataTable`) — Project | Opens | GitHub | Demo | Click-through | share bar. Row click → `ProjectDrawer` with daily opens chart + the same numbers (remove "Opens per Unique Visitor").
5. **Acquisition** — two side-by-side panels (stack on mobile): **Referrers** (Vercel visitors, with `ChannelIcon`) and **Campaigns (UTM)** (events from DB). Empty state explains how to add `?utm_source=`.
6. **Countries** — Vercel visitors only, `CountryFlag` + share bar, mobile cards.
- Remove `TopInteractions.tsx`, `VercelTrafficBridge.tsx` (unused).
- Data fetching: stale-while-revalidate — keep previous data visible during refresh (subtle progress bar), skeletons only on first load; poll every 60s while visible (was 15s); per-panel error states instead of one global alert.
- `analyticsTime.ts`: Bangkok helpers only (`Intl.DateTimeFormat` with `timeZone: 'Asia/Bangkok'`), remove unused `hourBucket`/`formatUtcHourLabel`.

### 1.4 Tests (Vitest, `tests/`)
Update/replace: `useAnalytics`, `analyticsTime` (Bangkok bucketing incl. 00:00–07:00 boundary), `interactionChart`, `overviewCards` → `statCard`, `utmTable`, `projectPerformanceTable`, `vercelTraffic` (auth required → 401; Bangkok rebinning), `darkDashboardStyles`/`adminResponsiveStyles`, tracker allow-list. New: `DataTable` mobile/desktop render, `ToastProvider`.

---

## Phase 2 — Other admin pages (PR 2, on top of Phase 1 foundation)
Apply `PageHeader` / `Panel` / `DataTable` / toasts / tokens everywhere:
- **Projects** (`AdminProjectsPage.tsx`): rows as real links/buttons (no `role="button"` on `<tr>`), drag-free reorder kept as up/down with icons (replace `↑ ↓` glyphs), status chips (Visible / Hidden / In progress), consistent delete `AlertDialog`, toast feedback.
- **Project form** (`ProjectForm.tsx`, `AdminProjectFormPage.tsx`): sectioned layout (Basics, Links, Media, Visibility), inline field errors, sticky save bar, error title reflects real cause, unsaved-changes guard (`useBlocker` if router is a data router, else `beforeunload` + confirm on in-app nav).
- **Profile**: single sticky save bar (remove duplicate buttons), dirty indicator, unsaved guard, toast.
- **Contact**: empty state, delete confirmation, unsaved guard, consistent modal styling (fix `purple-*` focus).
- **Resume**: fix invalid `bg-zinc-850`/`hover:bg-zinc-750`, show file name/size/last updated, upload progress & toast.
- **Login**: focus-visible states, error copy, loading button.
- Remove remaining arbitrary hex classes; update affected tests (`adminLayout`, `adminLogin`, `projectImageField`, etc.).

---

## Execution notes
- First step of implementation: save this design as `docs/superpowers/specs/2026-10-17-admin-backoffice-redesign-design.md`.
- Branch from `main`: `feat/admin-analytics-redesign` (Phase 1), then `feat/admin-pages-polish` (Phase 2). No Claude attribution in commits/PRs.
- Use `dataviz` skill when building charts/StatCards.

## Verification
- `npm run lint && npm run typecheck && npm test && npm run build` pass for each phase.
- DB: apply migration on local Supabase (`supabase db reset` if available) and run `supabase/tests/database` pgTAP tests; seed events at 23:30 UTC and 01:00 UTC to confirm they land on the correct Bangkok day/hour.
- `curl /api/vercel-traffic` without token → 401.
- Run dev server, log in, check `/admin/analytics` at 24h/7d/30d: KPI deltas show, chart labels in Bangkok time, no zero-only tabs, project table shows GitHub/Demo clicks after clicking those links on the public site; check at 375px width (no horizontal scroll) and keyboard navigation shows focus rings.
- Phase 2: walk every admin page — save/delete flows show toasts, leaving a dirty form prompts, contact delete asks for confirmation.
