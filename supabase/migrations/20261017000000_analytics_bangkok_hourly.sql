-- Analytics: bucket events by Asia/Bangkok (GMT+7) day + hour, track outbound
-- GitHub/Demo clicks, and give every dashboard RPC one consistent time model.
-- Rows written before this migration keep their (UTC) date with hour = 0.

alter table public.analytics_daily
  add column if not exists hour smallint not null default 0 check (hour between 0 and 23);

alter table public.analytics_daily
  alter column date set default (timezone('Asia/Bangkok', now()))::date;

alter table public.analytics_daily drop constraint if exists analytics_daily_dimensions_key;
alter table public.analytics_daily add constraint analytics_daily_dimensions_key unique (
  date, hour, metric, country, referrer_host, utm_source, utm_medium, utm_campaign, page, project_slug
);

create index if not exists analytics_daily_date_hour_idx on public.analytics_daily (date, hour);

-- ===================================================================
-- Ingestion: write Bangkok date + hour; accept github_click / demo_click
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
  v_now timestamp := timezone('Asia/Bangkok', now());
  v_date date := v_now::date;
  v_hour smallint := extract(hour from v_now)::smallint;
begin
  v_country := coalesce(upper(left(trim(p_country), 8)), '');

  for elem in select * from jsonb_array_elements(p_events)
  loop
    v_metric := coalesce(elem->>'event_name', '');
    if v_metric in ('page_view', 'project_open', 'resume_download', 'github_click', 'demo_click') then
      v_page := coalesce(left(trim(elem->>'page'), 256), '');
      v_project_slug := coalesce(left(trim(elem->>'project_slug'), 128), '');
      v_ref_host := coalesce(lower(left(trim(elem->>'referrer_host'), 128)), '');
      v_utm_src := coalesce(left(trim(elem->>'utm_source'), 128), '');
      v_utm_med := coalesce(left(trim(elem->>'utm_medium'), 128), '');
      v_utm_camp := coalesce(left(trim(elem->>'utm_campaign'), 128), '');

      insert into public.analytics_daily (
        date, hour, metric, country, referrer_host, utm_source, utm_medium, utm_campaign, page, project_slug, count
      ) values (
        v_date, v_hour, v_metric, v_country, v_ref_host, v_utm_src, v_utm_med, v_utm_camp, v_page, v_project_slug, 1
      )
      on conflict (date, hour, metric, country, referrer_host, utm_source, utm_medium, utm_campaign, page, project_slug)
      do update set count = public.analytics_daily.count + 1;
    end if;
  end loop;
end;
$$;

revoke execute on function public.analytics_record_events(jsonb, text) from public, anon, authenticated;
grant execute on function public.analytics_record_events(jsonb, text) to service_role;

-- ===================================================================
-- Dashboard RPCs. Every range is a [p_from, p_to] timestamptz window that is
-- interpreted in Asia/Bangkok and bucketed by hour (date + hour).
-- ===================================================================
do $drop$
declare
  fn record;
begin
  for fn in
    select p.oid::regprocedure as signature
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'analytics_overview', 'analytics_timeseries', 'analytics_utm_campaigns',
        'analytics_project_performance', 'analytics_top_interactions', 'analytics_top_countries'
      )
  loop
    execute format('drop function %s', fn.signature);
  end loop;
end
$drop$;

-- 1. Overview: current + previous period totals
create function public.analytics_overview(
  p_from timestamptz,
  p_to timestamptz,
  p_prev_from timestamptz,
  p_prev_to timestamptz
)
returns json
language plpgsql stable
security invoker
set search_path = ''
as $$
declare
  v_from timestamp := date_trunc('hour', timezone('Asia/Bangkok', p_from));
  v_to timestamp := timezone('Asia/Bangkok', p_to);
  v_pfrom timestamp := date_trunc('hour', timezone('Asia/Bangkok', p_prev_from));
  v_pto timestamp := timezone('Asia/Bangkok', p_prev_to);
  v_result json;
begin
  if not exists (select 1 from public.portfolio_admins where user_id = (select auth.uid())) then
    raise exception 'Admin access required';
  end if;

  with rows as (
    select metric, count, (date::timestamp + make_interval(hours => hour)) as bucket
    from public.analytics_daily
    where date between v_pfrom::date and v_to::date
  )
  select json_build_object(
    'current', json_build_object(
      'page_views', coalesce(sum(count) filter (where metric = 'page_view' and bucket between v_from and v_to), 0)::int,
      'project_opens', coalesce(sum(count) filter (where metric = 'project_open' and bucket between v_from and v_to), 0)::int,
      'resume_downloads', coalesce(sum(count) filter (where metric = 'resume_download' and bucket between v_from and v_to), 0)::int,
      'github_clicks', coalesce(sum(count) filter (where metric = 'github_click' and bucket between v_from and v_to), 0)::int,
      'demo_clicks', coalesce(sum(count) filter (where metric = 'demo_click' and bucket between v_from and v_to), 0)::int
    ),
    'previous', json_build_object(
      'page_views', coalesce(sum(count) filter (where metric = 'page_view' and bucket between v_pfrom and v_pto), 0)::int,
      'project_opens', coalesce(sum(count) filter (where metric = 'project_open' and bucket between v_pfrom and v_pto), 0)::int,
      'resume_downloads', coalesce(sum(count) filter (where metric = 'resume_download' and bucket between v_pfrom and v_pto), 0)::int,
      'github_clicks', coalesce(sum(count) filter (where metric = 'github_click' and bucket between v_pfrom and v_pto), 0)::int,
      'demo_clicks', coalesce(sum(count) filter (where metric = 'demo_click' and bucket between v_pfrom and v_pto), 0)::int
    )
  ) into v_result
  from rows;

  return v_result;
end;
$$;

-- 2. Zero-filled time series; keys are Bangkok local ('YYYY-MM-DD' or 'YYYY-MM-DDTHH:00')
create function public.analytics_timeseries(
  p_from timestamptz,
  p_to timestamptz,
  p_granularity text default 'day'
)
returns json
language plpgsql stable
security invoker
set search_path = ''
as $$
declare
  v_from timestamp := timezone('Asia/Bangkok', p_from);
  v_to timestamp := timezone('Asia/Bangkok', p_to);
  v_hourly boolean := p_granularity = 'hour';
  v_result json;
begin
  if not exists (select 1 from public.portfolio_admins where user_id = (select auth.uid())) then
    raise exception 'Admin access required';
  end if;

  if p_granularity not in ('hour', 'day') then
    raise exception 'Unknown granularity: %', p_granularity;
  end if;

  select coalesce(json_agg(row_to_json(d) order by d.date), '[]'::json)
  into v_result
  from (
    select
      case when v_hourly then to_char(s.bucket, 'YYYY-MM-DD"T"HH24":00"') else to_char(s.bucket, 'YYYY-MM-DD') end as date,
      coalesce(sum(a.count) filter (where a.metric = 'page_view'), 0)::int as page_views,
      coalesce(sum(a.count) filter (where a.metric = 'project_open'), 0)::int as project_opens,
      coalesce(sum(a.count) filter (where a.metric = 'resume_download'), 0)::int as resume_downloads,
      coalesce(sum(a.count) filter (where a.metric = 'github_click'), 0)::int as github_clicks,
      coalesce(sum(a.count) filter (where a.metric = 'demo_click'), 0)::int as demo_clicks
    from generate_series(
      date_trunc(case when v_hourly then 'hour' else 'day' end, v_from),
      date_trunc(case when v_hourly then 'hour' else 'day' end, v_to),
      case when v_hourly then interval '1 hour' else interval '1 day' end
    ) as s(bucket)
    left join public.analytics_daily a
      on a.date between v_from::date and v_to::date
     and date_trunc(case when v_hourly then 'hour' else 'day' end, a.date::timestamp + make_interval(hours => a.hour)) = s.bucket
    group by s.bucket
  ) d;

  return v_result;
end;
$$;

-- 3. UTM campaigns (events recorded with utm_source)
create function public.analytics_utm_campaigns(
  p_from timestamptz,
  p_to timestamptz
)
returns json
language plpgsql stable
security invoker
set search_path = ''
as $$
declare
  v_from timestamp := date_trunc('hour', timezone('Asia/Bangkok', p_from));
  v_to timestamp := timezone('Asia/Bangkok', p_to);
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
      case when utm_campaign = '' then '(none)' else utm_campaign end as campaign,
      coalesce(sum(count) filter (where metric = 'page_view'), 0)::int as visits,
      coalesce(sum(count) filter (where metric <> 'page_view'), 0)::int as actions
    from public.analytics_daily
    where utm_source <> ''
      and date between v_from::date and v_to::date
      and (date::timestamp + make_interval(hours => hour)) between v_from and v_to
    group by utm_source, utm_campaign
    order by visits desc, actions desc
    limit 50
  ) c;

  return v_result;
end;
$$;

-- 4. Project performance: opens, outbound clicks
create function public.analytics_project_performance(
  p_from timestamptz,
  p_to timestamptz
)
returns json
language plpgsql stable
security invoker
set search_path = ''
as $$
declare
  v_from timestamp := date_trunc('hour', timezone('Asia/Bangkok', p_from));
  v_to timestamp := timezone('Asia/Bangkok', p_to);
  v_result json;
begin
  if not exists (select 1 from public.portfolio_admins where user_id = (select auth.uid())) then
    raise exception 'Admin access required';
  end if;

  select coalesce(json_agg(row_to_json(p) order by p.opens desc, p.github_clicks + p.demo_clicks desc), '[]'::json)
  into v_result
  from (
    select
      a.project_slug as slug,
      coalesce(pr.title, a.project_slug) as title,
      coalesce(sum(a.count) filter (where a.metric = 'project_open'), 0)::int as opens,
      coalesce(sum(a.count) filter (where a.metric = 'github_click'), 0)::int as github_clicks,
      coalesce(sum(a.count) filter (where a.metric = 'demo_click'), 0)::int as demo_clicks
    from public.analytics_daily a
    left join public.projects pr on pr.id::text = a.project_slug
    where a.metric in ('project_open', 'github_click', 'demo_click')
      and a.project_slug <> ''
      and a.date between v_from::date and v_to::date
      and (a.date::timestamp + make_interval(hours => a.hour)) between v_from and v_to
    group by a.project_slug, pr.title
  ) p;

  return v_result;
end;
$$;

-- 5. Retention cleanup (Bangkok date)
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

  v_cutoff := timezone('Asia/Bangkok', now())::date - p_retention_days;

  delete from public.analytics_daily
  where date < v_cutoff;
  get diagnostics v_deleted_rows = row_count;

  return json_build_object('cutoff_date', v_cutoff, 'deleted_rows', v_deleted_rows);
end;
$$;

revoke execute on function public.analytics_overview(timestamptz, timestamptz, timestamptz, timestamptz) from public, anon;
grant execute on function public.analytics_overview(timestamptz, timestamptz, timestamptz, timestamptz) to authenticated;

revoke execute on function public.analytics_timeseries(timestamptz, timestamptz, text) from public, anon;
grant execute on function public.analytics_timeseries(timestamptz, timestamptz, text) to authenticated;

revoke execute on function public.analytics_utm_campaigns(timestamptz, timestamptz) from public, anon;
grant execute on function public.analytics_utm_campaigns(timestamptz, timestamptz) to authenticated;

revoke execute on function public.analytics_project_performance(timestamptz, timestamptz) from public, anon;
grant execute on function public.analytics_project_performance(timestamptz, timestamptz) to authenticated;

revoke execute on function public.analytics_cleanup_old_data(int) from public, anon;
grant execute on function public.analytics_cleanup_old_data(int) to authenticated;
