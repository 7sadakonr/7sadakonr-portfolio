-- Make the admin dashboard day boundaries follow the viewer's timezone.
-- analytics_overview: "today"/"yesterday" start at local midnight in p_tz.
-- analytics_timeseries: daily buckets are grouped by local date in p_tz
-- (hourly buckets are UTC instants returned as ISO timestamps; the client
-- formats them locally).
-- p_tz defaults to 'UTC', so existing behavior is unchanged when omitted.

-- Replace (not overload) the old signatures so calls without p_tz stay unambiguous.
drop function if exists public.analytics_overview(timestamptz, timestamptz);
drop function if exists public.analytics_timeseries(timestamptz, timestamptz, text);

create or replace function public.analytics_overview(
  p_from timestamptz default now() - interval '30 days',
  p_to   timestamptz default now(),
  p_tz   text default 'UTC'
)
returns json
language plpgsql stable
security invoker
set search_path = ''
as $$
declare
  v_result json;
  v_period_length interval;
  v_prev_from timestamptz;
  v_prev_to timestamptz;
  v_today_start timestamptz;
  v_yesterday_start timestamptz;
begin
  if not exists (select 1 from public.portfolio_admins where user_id = (select auth.uid())) then
    raise exception 'Admin access required';
  end if;

  if not exists (select 1 from pg_catalog.pg_timezone_names where name = p_tz) then
    raise exception 'Unknown timezone: %', p_tz;
  end if;

  v_period_length := p_to - p_from;
  v_prev_to := p_from;
  v_prev_from := p_from - v_period_length;
  v_today_start := date_trunc('day', now() at time zone p_tz) at time zone p_tz;
  v_yesterday_start := v_today_start - interval '1 day';

  select json_build_object(
    'visitors', (
      select count(distinct visitor_id) from (
        select visitor_id from public.analytics_sessions
        where ((started_at between p_from and p_to) or (last_seen_at between p_from and p_to))
          and visitor_id not in (select visitor_id from public.analytics_admin_exclusions)
        union
        select visitor_id from public.analytics_events
        where (created_at between p_from and p_to)
          and visitor_id not in (select visitor_id from public.analytics_admin_exclusions)
      ) v
    ),
    'visitors_prev', (
      select count(distinct visitor_id) from (
        select visitor_id from public.analytics_sessions
        where ((started_at between v_prev_from and v_prev_to) or (last_seen_at between v_prev_from and v_prev_to))
          and visitor_id not in (select visitor_id from public.analytics_admin_exclusions)
        union
        select visitor_id from public.analytics_events
        where (created_at between v_prev_from and v_prev_to)
          and visitor_id not in (select visitor_id from public.analytics_admin_exclusions)
      ) vp
    ),
    'visitors_today', (
      select count(distinct visitor_id) from (
        select visitor_id from public.analytics_sessions
        where (started_at >= v_today_start or last_seen_at >= v_today_start)
          and visitor_id not in (select visitor_id from public.analytics_admin_exclusions)
        union
        select visitor_id from public.analytics_events
        where (created_at >= v_today_start)
          and visitor_id not in (select visitor_id from public.analytics_admin_exclusions)
      ) vt
    ),
    'visitors_yesterday', (
      select count(distinct visitor_id) from (
        select visitor_id from public.analytics_sessions
        where ((started_at >= v_yesterday_start and started_at < v_today_start) or (last_seen_at >= v_yesterday_start and last_seen_at < v_today_start))
          and visitor_id not in (select visitor_id from public.analytics_admin_exclusions)
        union
        select visitor_id from public.analytics_events
        where (created_at >= v_yesterday_start and created_at < v_today_start)
          and visitor_id not in (select visitor_id from public.analytics_admin_exclusions)
      ) vy
    ),
    'active_now', (
      select count(distinct visitor_id) from public.analytics_sessions
      where (last_seen_at >= now() - interval '5 minutes'
         or started_at >= now() - interval '5 minutes')
        and visitor_id not in (select visitor_id from public.analytics_admin_exclusions)
    ),
    'interactions', (select count(*) from public.analytics_events
                     where created_at between p_from and p_to
                     and event_name not in ('page_view', 'section_view', 'scroll_depth', 'heartbeat')
                     and visitor_id not in (select visitor_id from public.analytics_admin_exclusions)),
    'interactions_prev', (select count(*) from public.analytics_events
                          where created_at between v_prev_from and v_prev_to
                          and event_name not in ('page_view', 'section_view', 'scroll_depth', 'heartbeat')
                          and visitor_id not in (select visitor_id from public.analytics_admin_exclusions)),
    'interactions_today', (select count(*) from public.analytics_events
                           where created_at >= v_today_start
                           and event_name not in ('page_view', 'section_view', 'scroll_depth', 'heartbeat')
                           and visitor_id not in (select visitor_id from public.analytics_admin_exclusions)),
    'interactions_yesterday', (select count(*) from public.analytics_events
                               where created_at >= v_yesterday_start and created_at < v_today_start
                               and event_name not in ('page_view', 'section_view', 'scroll_depth', 'heartbeat')
                               and visitor_id not in (select visitor_id from public.analytics_admin_exclusions)),
    'project_opens', (select count(*) from public.analytics_events
                      where event_name = 'project_open'
                      and created_at between p_from and p_to
                      and visitor_id not in (select visitor_id from public.analytics_admin_exclusions)),
    'external_clicks', (select count(*) from public.analytics_events
                        where event_name in (
                          'project_github_click','project_demo_click',
                          'linkedin_click','github_profile_click',
                          'email_click','external_link_click'
                        ) and created_at between p_from and p_to
                        and visitor_id not in (select visitor_id from public.analytics_admin_exclusions)),
    'resume_downloads', (select count(*) from public.analytics_events
                         where event_name = 'resume_download'
                         and created_at between p_from and p_to
                         and visitor_id not in (select visitor_id from public.analytics_admin_exclusions)),
    'sessions', (select count(distinct session_id) from public.analytics_sessions
                 where ((started_at between p_from and p_to) or (last_seen_at between p_from and p_to))
                 and visitor_id not in (select visitor_id from public.analytics_admin_exclusions)),
    'avg_session_events', (
      select coalesce(round(avg(cnt), 1), 0)
      from (
        select count(*) as cnt
        from public.analytics_events
        where created_at between p_from and p_to
        and visitor_id not in (select visitor_id from public.analytics_admin_exclusions)
        group by session_id
      ) sub
    )
  ) into v_result;

  return v_result;
end;
$$;

create or replace function public.analytics_timeseries(
  p_from timestamptz default now() - interval '30 days',
  p_to   timestamptz default now(),
  p_metric text default 'visitors',
  p_tz text default 'UTC'
)
returns json
language plpgsql stable
security invoker
set search_path = ''
as $$
declare
  v_result json;
  v_is_hourly boolean;
begin
  if not exists (select 1 from public.portfolio_admins where user_id = (select auth.uid())) then
    raise exception 'Admin access required';
  end if;

  if not exists (select 1 from pg_catalog.pg_timezone_names where name = p_tz) then
    raise exception 'Unknown timezone: %', p_tz;
  end if;

  v_is_hourly := (p_to - p_from) <= interval '2 days';

  if v_is_hourly then
    select coalesce(json_agg(row_to_json(d) order by d.date), '[]'::json)
    into v_result
    from (
      select
        to_char(hr at time zone 'UTC', 'YYYY-MM-DD"T"HH24:00:00"Z"') as date,
        case p_metric
          when 'visitors' then
            (select count(distinct visitor_id) from public.analytics_sessions
             where date_trunc('hour', started_at) = hr
             and started_at between p_from and p_to
             and visitor_id not in (select visitor_id from public.analytics_admin_exclusions))
          when 'project_opens' then
            (select count(*) from public.analytics_events
             where event_name = 'project_open'
             and date_trunc('hour', created_at) = hr
             and created_at between p_from and p_to
             and visitor_id not in (select visitor_id from public.analytics_admin_exclusions))
          when 'external_clicks' then
            (select count(*) from public.analytics_events
             where event_name in (
               'project_github_click','project_demo_click',
               'linkedin_click','github_profile_click',
               'email_click','external_link_click'
             ) and date_trunc('hour', created_at) = hr
             and created_at between p_from and p_to
             and visitor_id not in (select visitor_id from public.analytics_admin_exclusions))
          when 'resume_downloads' then
            (select count(*) from public.analytics_events
             where event_name = 'resume_download'
             and date_trunc('hour', created_at) = hr
             and created_at between p_from and p_to
             and visitor_id not in (select visitor_id from public.analytics_admin_exclusions))
          else
            (select count(*) from public.analytics_events
             where date_trunc('hour', created_at) = hr
             and created_at between p_from and p_to
             and event_name not in ('page_view', 'section_view', 'scroll_depth', 'heartbeat')
             and visitor_id not in (select visitor_id from public.analytics_admin_exclusions))
        end as count
      from generate_series(date_trunc('hour', p_from), date_trunc('hour', p_to), '1 hour'::interval) as hr
    ) d;
  else
    select coalesce(json_agg(row_to_json(d) order by d.date), '[]'::json)
    into v_result
    from (
      select
        day::date as date,
        case p_metric
          when 'visitors' then
            (select count(distinct visitor_id) from public.analytics_sessions
             where (started_at at time zone p_tz)::date = day::date
             and started_at between p_from and p_to
             and visitor_id not in (select visitor_id from public.analytics_admin_exclusions))
          when 'project_opens' then
            (select count(*) from public.analytics_events
             where event_name = 'project_open'
             and (created_at at time zone p_tz)::date = day::date
             and created_at between p_from and p_to
             and visitor_id not in (select visitor_id from public.analytics_admin_exclusions))
          when 'external_clicks' then
            (select count(*) from public.analytics_events
             where event_name in (
               'project_github_click','project_demo_click',
               'linkedin_click','github_profile_click',
               'email_click','external_link_click'
             ) and (created_at at time zone p_tz)::date = day::date
             and created_at between p_from and p_to
             and visitor_id not in (select visitor_id from public.analytics_admin_exclusions))
          when 'resume_downloads' then
            (select count(*) from public.analytics_events
             where event_name = 'resume_download'
             and (created_at at time zone p_tz)::date = day::date
             and created_at between p_from and p_to
             and visitor_id not in (select visitor_id from public.analytics_admin_exclusions))
          else
            (select count(*) from public.analytics_events
             where (created_at at time zone p_tz)::date = day::date
             and created_at between p_from and p_to
             and event_name not in ('page_view', 'section_view', 'scroll_depth', 'heartbeat')
             and visitor_id not in (select visitor_id from public.analytics_admin_exclusions))
        end as count
      from generate_series((p_from at time zone p_tz)::date, (p_to at time zone p_tz)::date, '1 day'::interval) as day
    ) d;
  end if;

  return v_result;
end;
$$;

revoke execute on function public.analytics_overview(timestamptz, timestamptz, text) from public, anon;
grant execute on function public.analytics_overview(timestamptz, timestamptz, text) to authenticated;

revoke execute on function public.analytics_timeseries(timestamptz, timestamptz, text, text) from public, anon;
grant execute on function public.analytics_timeseries(timestamptz, timestamptz, text, text) to authenticated;
