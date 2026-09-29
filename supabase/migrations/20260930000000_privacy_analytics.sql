-- ===================================================================
-- Migration: 20260930000000_privacy_analytics.sql
-- Refactor analytics to privacy-first aggregate analytics.
-- Purges all individual session/visitor tracking tables and RPCs.
-- ===================================================================

-- 1. Drop old tracking tables and their dependencies
drop table if exists public.analytics_admin_exclusions cascade;
drop table if exists public.analytics_events cascade;
drop table if exists public.analytics_sessions cascade;

-- 2. Drop obsolete functions that tracked individual sessions
drop function if exists public.analytics_exclude_admin_visitor(uuid);
drop function if exists public.analytics_recent_sessions(int);
drop function if exists public.analytics_session_detail(uuid);
drop function if exists public.analytics_funnel(timestamptz, timestamptz);

-- ===================================================================
-- Aggregate daily analytics table
-- Contains ZERO visitor IDs, session IDs, IPs, or fingerprints.
-- ===================================================================

create table if not exists public.analytics_daily (
  id bigint generated always as identity primary key,
  date date not null default current_date,
  metric text not null, -- 'page_view', 'project_open', 'resume_download'
  country text not null default '',
  referrer_host text not null default '',
  utm_source text not null default '',
  utm_medium text not null default '',
  utm_campaign text not null default '',
  page text not null default '',
  project_slug text not null default '',
  count int not null default 1,
  constraint analytics_daily_dimensions_key unique (
    date, metric, country, referrer_host, utm_source, utm_medium, utm_campaign, page, project_slug
  )
);

create index if not exists analytics_daily_date_idx on public.analytics_daily (date);
create index if not exists analytics_daily_metric_idx on public.analytics_daily (metric);
create index if not exists analytics_daily_project_slug_idx on public.analytics_daily (project_slug) where project_slug <> '';
create index if not exists analytics_daily_country_idx on public.analytics_daily (country) where country <> '';
create index if not exists analytics_daily_referrer_idx on public.analytics_daily (referrer_host) where referrer_host <> '';

-- ===================================================================
-- RLS: Strictly protect analytics_daily
-- ===================================================================

alter table public.analytics_daily enable row level security;

-- Revoke direct permissions from public/anon
revoke all on public.analytics_daily from public, anon;
grant select on public.analytics_daily to authenticated;

drop policy if exists "Admin can read analytics daily" on public.analytics_daily;
create policy "Admin can read analytics daily"
  on public.analytics_daily for select to authenticated
  using (exists (select 1 from public.portfolio_admins where user_id = (select auth.uid())));

-- ===================================================================
-- Atomic Ingestion RPC (Used by backend API via service_role)
-- ===================================================================

create or replace function public.analytics_record_events(
  p_events jsonb,
  p_country text default ''
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  elem jsonb;
  v_metric text;
  v_page text;
  v_project_slug text;
  v_ref_host text;
  v_utm_src text;
  v_utm_med text;
  v_utm_camp text;
  v_country text;
begin
  v_country := coalesce(upper(left(trim(p_country), 8)), '');

  for elem in select * from jsonb_array_elements(p_events)
  loop
    v_metric := coalesce(elem->>'event_name', '');
    if v_metric in ('page_view', 'project_open', 'resume_download') then
      v_page := coalesce(left(trim(elem->>'page'), 256), '');
      v_project_slug := coalesce(left(trim(elem->>'project_slug'), 128), '');
      v_ref_host := coalesce(lower(left(trim(elem->>'referrer_host'), 128)), '');
      v_utm_src := coalesce(left(trim(elem->>'utm_source'), 128), '');
      v_utm_med := coalesce(left(trim(elem->>'utm_medium'), 128), '');
      v_utm_camp := coalesce(left(trim(elem->>'utm_campaign'), 128), '');

      insert into public.analytics_daily (
        date, metric, country, referrer_host, utm_source, utm_medium, utm_campaign, page, project_slug, count
      ) values (
        current_date, v_metric, v_country, v_ref_host, v_utm_src, v_utm_med, v_utm_camp, v_page, v_project_slug, 1
      )
      on conflict (date, metric, country, referrer_host, utm_source, utm_medium, utm_campaign, page, project_slug)
      do update set count = public.analytics_daily.count + 1;
    end if;
  end loop;
end;
$$;

revoke execute on function public.analytics_record_events(jsonb, text) from public, anon, authenticated;
grant execute on function public.analytics_record_events(jsonb, text) to service_role;

-- ===================================================================
-- Dashboard RPCs (Security Invoker, restricted to portfolio admins)
-- ===================================================================

-- 1. Overview stats
create or replace function public.analytics_overview(
  p_from timestamptz default now() - interval '30 days',
  p_to   timestamptz default now()
)
returns json
language plpgsql stable
security invoker
set search_path = ''
as $$
declare
  v_result json;
  v_from_date date;
  v_to_date date;
  v_prev_from_date date;
  v_prev_to_date date;
  v_today date;
  v_yesterday date;
  v_period_days int;
begin
  if not exists (select 1 from public.portfolio_admins where user_id = (select auth.uid())) then
    raise exception 'Admin access required';
  end if;

  v_from_date := p_from::date;
  v_to_date := p_to::date;
  v_period_days := greatest(1, (v_to_date - v_from_date));
  v_prev_to_date := v_from_date - 1;
  v_prev_from_date := v_prev_to_date - v_period_days;
  v_today := current_date;
  v_yesterday := current_date - 1;

  select json_build_object(
    'visitors', 0,
    'visitors_prev', null,
    'visitors_today', null,
    'visitors_yesterday', null,
    'active_now', 0,
    'page_views', coalesce((select sum(count) from public.analytics_daily where metric = 'page_view' and date between v_from_date and v_to_date), 0),
    'interactions', coalesce((select sum(count) from public.analytics_daily where metric in ('project_open', 'resume_download') and date between v_from_date and v_to_date), 0),
    'interactions_prev', coalesce((select sum(count) from public.analytics_daily where metric in ('project_open', 'resume_download') and date between v_prev_from_date and v_prev_to_date), 0),
    'interactions_today', coalesce((select sum(count) from public.analytics_daily where metric in ('project_open', 'resume_download') and date = v_today), 0),
    'interactions_yesterday', coalesce((select sum(count) from public.analytics_daily where metric in ('project_open', 'resume_download') and date = v_yesterday), 0),
    'project_opens', coalesce((select sum(count) from public.analytics_daily where metric = 'project_open' and date between v_from_date and v_to_date), 0),
    'external_clicks', 0,
    'resume_downloads', coalesce((select sum(count) from public.analytics_daily where metric = 'resume_download' and date between v_from_date and v_to_date), 0),
    'sessions', coalesce((select sum(count) from public.analytics_daily where metric = 'page_view' and date between v_from_date and v_to_date), 0),
    'avg_session_events', 0
  ) into v_result;

  return v_result;
end;
$$;

-- 2. Activity time series
create or replace function public.analytics_timeseries(
  p_from timestamptz default now() - interval '30 days',
  p_to   timestamptz default now(),
  p_metric text default 'interactions'
)
returns json
language plpgsql stable
security invoker
set search_path = ''
as $$
declare
  v_result json;
  v_from_date date;
  v_to_date date;
begin
  if not exists (select 1 from public.portfolio_admins where user_id = (select auth.uid())) then
    raise exception 'Admin access required';
  end if;

  v_from_date := p_from::date;
  v_to_date := p_to::date;

  select coalesce(json_agg(row_to_json(d) order by d.date), '[]'::json)
  into v_result
  from (
    select
      series_day::date as date,
      coalesce(sum(a.count), 0)::int as count
    from generate_series(v_from_date, v_to_date, '1 day'::interval) as series_day
    left join public.analytics_daily a on a.date = series_day::date and (
      case p_metric
        when 'page_views' then a.metric = 'page_view'
        when 'project_opens' then a.metric = 'project_open'
        when 'resume_downloads' then a.metric = 'resume_download'
        when 'interactions' then a.metric in ('project_open', 'resume_download')
        else a.metric in ('project_open', 'resume_download')
      end
    )
    group by series_day::date
  ) d;

  return v_result;
end;
$$;

-- 3. UTM Campaigns
create or replace function public.analytics_utm_campaigns(
  p_from timestamptz default now() - interval '30 days',
  p_to   timestamptz default now()
)
returns json
language plpgsql stable
security invoker
set search_path = ''
as $$
declare
  v_result json;
begin
  if not exists (select 1 from public.portfolio_admins where user_id = (select auth.uid())) then
    raise exception 'Admin access required';
  end if;

  select coalesce(json_agg(row_to_json(c)), '[]'::json)
  into v_result
  from (
    select
      utm_source as source,
      case when utm_campaign = '' then '(direct / none)' else utm_campaign end as campaign,
      sum(count) filter (where metric = 'page_view')::int as sessions,
      sum(count)::int as interactions,
      sum(count) filter (where metric in ('project_open', 'resume_download'))::int as conversions
    from public.analytics_daily
    where utm_source <> ''
      and date between p_from::date and p_to::date
    group by utm_source, utm_campaign
    order by interactions desc
    limit 50
  ) c;

  return v_result;
end;
$$;

-- 4. Project performance
create or replace function public.analytics_project_performance(
  p_from timestamptz default now() - interval '30 days',
  p_to   timestamptz default now()
)
returns json
language plpgsql stable
security invoker
set search_path = ''
as $$
declare
  v_result json;
begin
  if not exists (select 1 from public.portfolio_admins where user_id = (select auth.uid())) then
    raise exception 'Admin access required';
  end if;

  select coalesce(json_agg(row_to_json(p) order by p.opens desc), '[]'::json)
  into v_result
  from (
    select
      project_slug as slug,
      project_slug as title,
      sum(count)::int as opens,
      sum(count)::int as visitors,
      0::int as github_clicks,
      0::int as demo_clicks
    from public.analytics_daily
    where metric = 'project_open'
      and project_slug <> ''
      and date between p_from::date and p_to::date
    group by project_slug
  ) p;

  return v_result;
end;
$$;

-- 5. Top interactions
create or replace function public.analytics_top_interactions(
  p_from timestamptz default now() - interval '30 days',
  p_to   timestamptz default now()
)
returns json
language plpgsql stable
security invoker
set search_path = ''
as $$
declare
  v_result json;
begin
  if not exists (select 1 from public.portfolio_admins where user_id = (select auth.uid())) then
    raise exception 'Admin access required';
  end if;

  select coalesce(json_agg(row_to_json(t)), '[]'::json)
  into v_result
  from (
    select
      metric as event_name,
      case
        when metric = 'project_open' and project_slug <> '' then 'Open ' || project_slug
        when metric = 'project_open' then 'Project Opened'
        when metric = 'resume_download' then 'Resume Download'
        else metric
      end as target_label,
      nullif(project_slug, '') as project_slug,
      sum(count)::int as total
    from public.analytics_daily
    where date between p_from::date and p_to::date
      and metric in ('project_open', 'resume_download')
    group by metric, project_slug
    order by total desc
    limit 20
  ) t;

  return v_result;
end;
$$;

-- 6. Top Countries (Geographic breakdown)
create or replace function public.analytics_top_countries(
  p_from timestamptz default now() - interval '30 days',
  p_to   timestamptz default now()
)
returns json
language plpgsql stable
security invoker
set search_path = ''
as $$
declare
  v_result json;
begin
  if not exists (select 1 from public.portfolio_admins where user_id = (select auth.uid())) then
    raise exception 'Admin access required';
  end if;

  select coalesce(json_agg(row_to_json(c)), '[]'::json)
  into v_result
  from (
    select
      country,
      sum(count)::int as count
    from public.analytics_daily
    where country <> ''
      and date between p_from::date and p_to::date
    group by country
    order by count desc
    limit 20
  ) c;

  return v_result;
end;
$$;

-- 7. Retention cleanup for aggregate daily table (default 365 days)
create or replace function public.analytics_cleanup_old_data(
  p_retention_days int default 365
)
returns json
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_deleted_rows bigint;
  v_cutoff date;
begin
  if not exists (select 1 from public.portfolio_admins where user_id = (select auth.uid())) then
    raise exception 'Admin access required';
  end if;

  v_cutoff := current_date - p_retention_days;

  delete from public.analytics_daily
  where date < v_cutoff;
  get diagnostics v_deleted_rows = row_count;

  return json_build_object(
    'cutoff_date', v_cutoff,
    'deleted_rows', v_deleted_rows
  );
end;
$$;

-- Permissions on RPCs
revoke execute on function public.analytics_overview(timestamptz, timestamptz) from public, anon;
grant execute on function public.analytics_overview(timestamptz, timestamptz) to authenticated;

revoke execute on function public.analytics_timeseries(timestamptz, timestamptz, text) from public, anon;
grant execute on function public.analytics_timeseries(timestamptz, timestamptz, text) to authenticated;

revoke execute on function public.analytics_utm_campaigns(timestamptz, timestamptz) from public, anon;
grant execute on function public.analytics_utm_campaigns(timestamptz, timestamptz) to authenticated;

revoke execute on function public.analytics_project_performance(timestamptz, timestamptz) from public, anon;
grant execute on function public.analytics_project_performance(timestamptz, timestamptz) to authenticated;

revoke execute on function public.analytics_top_interactions(timestamptz, timestamptz) from public, anon;
grant execute on function public.analytics_top_interactions(timestamptz, timestamptz) to authenticated;

revoke execute on function public.analytics_top_countries(timestamptz, timestamptz) from public, anon;
grant execute on function public.analytics_top_countries(timestamptz, timestamptz) to authenticated;

revoke execute on function public.analytics_cleanup_old_data(int) from public, anon;
grant execute on function public.analytics_cleanup_old_data(int) to authenticated;
