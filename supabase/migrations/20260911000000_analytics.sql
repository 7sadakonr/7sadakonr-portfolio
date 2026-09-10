-- ===================================================================
-- analytics_sessions
-- ===================================================================

create table if not exists public.analytics_sessions (
  id           bigint generated always as identity primary key,
  session_id   uuid not null,
  visitor_id   uuid not null,
  started_at   timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  landing_path text,
  referrer_host text,
  utm_source   text,
  utm_medium   text,
  utm_campaign text,
  country      text,
  region       text,
  city         text,
  device_type  text,
  browser      text,
  os           text,
  created_at   timestamptz not null default now()
);

create unique index if not exists analytics_sessions_session_id_idx
  on public.analytics_sessions (session_id);
create index if not exists analytics_sessions_visitor_id_idx
  on public.analytics_sessions (visitor_id);
create index if not exists analytics_sessions_started_at_idx
  on public.analytics_sessions (started_at);

-- ===================================================================
-- analytics_events
-- ===================================================================

create table if not exists public.analytics_events (
  id               bigint generated always as identity primary key,
  event_id         uuid not null unique,
  session_id       uuid not null,
  visitor_id       uuid not null,
  event_name       text not null,
  page             text,
  section          text,
  target_type      text,
  target_id        text,
  target_label     text,
  project_slug     text,
  destination_host text,
  metadata         jsonb,
  created_at       timestamptz not null default now()
);

create index if not exists analytics_events_session_id_idx
  on public.analytics_events (session_id);
create index if not exists analytics_events_created_at_idx
  on public.analytics_events (created_at);
create index if not exists analytics_events_event_name_idx
  on public.analytics_events (event_name);
create index if not exists analytics_events_project_slug_idx
  on public.analytics_events (project_slug) where project_slug is not null;

-- ===================================================================
-- RLS: Lock down analytics tables from direct browser access
-- ===================================================================

alter table public.analytics_sessions enable row level security;
alter table public.analytics_events enable row level security;

-- Revoke all direct permissions from anon and authenticated roles
revoke all on public.analytics_sessions from anon, authenticated;
revoke all on public.analytics_events from anon, authenticated;

-- Allow authenticated users to SELECT (protected by policy checking portfolio_admins)
grant select on public.analytics_sessions to authenticated;
grant select on public.analytics_events to authenticated;

drop policy if exists "Admin can read analytics sessions" on public.analytics_sessions;
create policy "Admin can read analytics sessions"
  on public.analytics_sessions for select to authenticated
  using (exists (select 1 from public.portfolio_admins where user_id = (select auth.uid())));

drop policy if exists "Admin can read analytics events" on public.analytics_events;
create policy "Admin can read analytics events"
  on public.analytics_events for select to authenticated
  using (exists (select 1 from public.portfolio_admins where user_id = (select auth.uid())));

-- ===================================================================
-- analytics_admin_exclusions (Exclude portfolio admin/backoffice users)
-- ===================================================================

create table if not exists public.analytics_admin_exclusions (
  visitor_id uuid primary key,
  created_at timestamptz not null default now()
);

alter table public.analytics_admin_exclusions enable row level security;
revoke all on public.analytics_admin_exclusions from anon, authenticated;
grant all on public.analytics_admin_exclusions to authenticated;

drop policy if exists "Admin can manage exclusions" on public.analytics_admin_exclusions;
create policy "Admin can manage exclusions"
  on public.analytics_admin_exclusions for all to authenticated
  using (exists (select 1 from public.portfolio_admins where user_id = (select auth.uid())));

create or replace function public.analytics_exclude_admin_visitor(
  p_visitor_id uuid
)
returns void
language plpgsql volatile
security invoker
set search_path = ''
as $$
begin
  if not exists (select 1 from public.portfolio_admins where user_id = (select auth.uid())) then
    raise exception 'Admin access required';
  end if;

  if p_visitor_id is not null then
    insert into public.analytics_admin_exclusions (visitor_id)
    values (p_visitor_id)
    on conflict (visitor_id) do nothing;

    -- Purge previous test sessions and events created by this admin visitor
    delete from public.analytics_events where visitor_id = p_visitor_id;
    delete from public.analytics_sessions where visitor_id = p_visitor_id;
  end if;
end;
$$;

-- No insert, update, or delete policies are provided for anon or authenticated.
-- Ingestion is performed exclusively via the Vercel Function using service_role credentials.

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
  v_period_length interval;
  v_prev_from timestamptz;
  v_prev_to timestamptz;
  v_today_start timestamptz;
  v_yesterday_start timestamptz;
begin
  if not exists (select 1 from public.portfolio_admins where user_id = (select auth.uid())) then
    raise exception 'Admin access required';
  end if;

  v_period_length := p_to - p_from;
  v_prev_to := p_from;
  v_prev_from := p_from - v_period_length;
  v_today_start := date_trunc('day', now());
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

-- 2. Activity time series
create or replace function public.analytics_timeseries(
  p_from timestamptz default now() - interval '30 days',
  p_to   timestamptz default now(),
  p_metric text default 'visitors'
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

  v_is_hourly := (p_to - p_from) <= interval '2 days';

  if v_is_hourly then
    select coalesce(json_agg(row_to_json(d) order by d.date), '[]'::json)
    into v_result
    from (
      select
        to_char(hr, 'HH24:00') as date,
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
             where started_at::date = day::date
             and started_at between p_from and p_to
             and visitor_id not in (select visitor_id from public.analytics_admin_exclusions))
          when 'project_opens' then
            (select count(*) from public.analytics_events
             where event_name = 'project_open'
             and created_at::date = day::date
             and created_at between p_from and p_to
             and visitor_id not in (select visitor_id from public.analytics_admin_exclusions))
          when 'external_clicks' then
            (select count(*) from public.analytics_events
             where event_name in (
               'project_github_click','project_demo_click',
               'linkedin_click','github_profile_click',
               'email_click','external_link_click'
             ) and created_at::date = day::date
             and created_at between p_from and p_to
             and visitor_id not in (select visitor_id from public.analytics_admin_exclusions))
          when 'resume_downloads' then
            (select count(*) from public.analytics_events
             where event_name = 'resume_download'
             and created_at::date = day::date
             and created_at between p_from and p_to
             and visitor_id not in (select visitor_id from public.analytics_admin_exclusions))
          else
            (select count(*) from public.analytics_events
             where created_at::date = day::date
             and created_at between p_from and p_to
             and event_name not in ('page_view', 'section_view', 'scroll_depth', 'heartbeat')
             and visitor_id not in (select visitor_id from public.analytics_admin_exclusions))
        end as count
      from generate_series(p_from::date, p_to::date, '1 day'::interval) as day
    ) d;
  end if;

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
      s.utm_source as source,
      coalesce(s.utm_campaign, '(direct / none)') as campaign,
      count(distinct s.session_id) as sessions,
      count(e.id) as interactions,
      count(distinct case when e.event_name in ('project_github_click','project_demo_click','resume_download','contact_click','email_click','linkedin_click','github_profile_click') then e.session_id end) as conversions
    from public.analytics_sessions s
    left join public.analytics_events e on e.session_id = s.session_id and e.created_at between p_from and p_to
    where s.utm_source is not null
    and s.started_at between p_from and p_to
    group by s.utm_source, coalesce(s.utm_campaign, '(direct / none)')
    order by sessions desc
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
      e.project_slug as slug,
      max(e.target_label) as title,
      count(*) filter (where e.event_name = 'project_open') as opens,
      count(distinct e.visitor_id) filter (where e.event_name = 'project_open') as visitors,
      count(*) filter (where e.event_name = 'project_github_click') as github_clicks,
      count(*) filter (where e.event_name = 'project_demo_click') as demo_clicks
    from public.analytics_events e
    where e.project_slug is not null
    and e.created_at between p_from and p_to
    group by e.project_slug
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
      event_name,
      coalesce(target_label, event_name) as target_label,
      project_slug,
      count(*) as total
    from public.analytics_events
    where created_at between p_from and p_to
    and event_name not in ('page_view', 'section_view', 'scroll_depth')
    group by event_name, coalesce(target_label, event_name), project_slug
    order by total desc
    limit 20
  ) t;

  return v_result;
end;
$$;

-- 6. Recruiter Intent Goals & Section Retention
create or replace function public.analytics_funnel(
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
  v_total_visitors bigint;
  v_total_sessions bigint;
  v_resume_sessions bigint;
  v_resume_events bigint;
  v_project_sessions bigint;
  v_project_events bigint;
  v_demo_sessions bigint;
  v_demo_events bigint;
  v_github_sessions bigint;
  v_github_events bigint;
  v_contact_sessions bigint;
  v_contact_events bigint;
  v_hero_sessions bigint;
  v_about_sessions bigint;
  v_projects_sessions bigint;
  v_contact_section_sessions bigint;
begin
  if not exists (select 1 from public.portfolio_admins where user_id = (select auth.uid())) then
    raise exception 'Admin access required';
  end if;

  select count(distinct visitor_id)
  into v_total_visitors
  from (
    select visitor_id from public.analytics_sessions where (started_at between p_from and p_to) or (last_seen_at between p_from and p_to)
    union
    select visitor_id from public.analytics_events where created_at between p_from and p_to
  ) v;

  if v_total_visitors is null or v_total_visitors = 0 then
    v_total_visitors := 0;
  end if;

  select count(distinct session_id)
  into v_total_sessions
  from (
    select session_id from public.analytics_sessions where (started_at between p_from and p_to) or (last_seen_at between p_from and p_to)
    union
    select session_id from public.analytics_events where created_at between p_from and p_to
  ) s;

  if v_total_sessions is null or v_total_sessions = 0 then
    v_total_sessions := 0;
  end if;

  -- Resume Downloads
  select count(distinct session_id), count(*)
  into v_resume_sessions, v_resume_events
  from public.analytics_events
  where event_name = 'resume_download' and created_at between p_from and p_to;

  -- Project Exploration (Opens)
  select count(distinct session_id), count(*)
  into v_project_sessions, v_project_events
  from public.analytics_events
  where event_name = 'project_open' and created_at between p_from and p_to;

  -- Demo Clicks
  select count(distinct session_id), count(*)
  into v_demo_sessions, v_demo_events
  from public.analytics_events
  where event_name = 'project_demo_click' and created_at between p_from and p_to;

  -- GitHub Inspects
  select count(distinct session_id), count(*)
  into v_github_sessions, v_github_events
  from public.analytics_events
  where event_name in ('project_github_click', 'github_profile_click') and created_at between p_from and p_to;

  -- Contact / Inquiries
  select count(distinct session_id), count(*)
  into v_contact_sessions, v_contact_events
  from public.analytics_events
  where event_name in ('contact_click', 'email_click', 'linkedin_click') and created_at between p_from and p_to;

  -- Section Retention
  select count(distinct session_id) into v_hero_sessions
  from public.analytics_events
  where event_name in ('page_view', 'section_view') and (section = 'home' or page = '/') and created_at between p_from and p_to;

  select count(distinct session_id) into v_about_sessions
  from public.analytics_events
  where event_name = 'section_view' and section = 'about' and created_at between p_from and p_to;

  select count(distinct session_id) into v_projects_sessions
  from public.analytics_events
  where event_name = 'section_view' and section = 'projects' and created_at between p_from and p_to;

  select count(distinct session_id) into v_contact_section_sessions
  from public.analytics_events
  where event_name = 'section_view' and section = 'contact' and created_at between p_from and p_to;

  if v_hero_sessions = 0 and v_total_sessions > 0 then
    v_hero_sessions := v_total_sessions;
  end if;

  select json_build_object(
    'sessions', v_total_sessions,
    'visitors', v_total_visitors,
    'viewed_projects', v_projects_sessions,
    'opened_project', v_project_sessions,
    'clicked_link', (select count(distinct session_id) from public.analytics_events where event_name in ('project_github_click','project_demo_click') and created_at between p_from and p_to),
    'converted', (select count(distinct session_id) from public.analytics_events where event_name in ('resume_download','contact_click','email_click','linkedin_click') and created_at between p_from and p_to),
    'goals', json_build_object(
      'resume_downloads', json_build_object(
        'sessions', v_resume_sessions,
        'events', v_resume_events,
        'rate', case when v_total_sessions > 0 then round((v_resume_sessions::numeric / v_total_sessions::numeric) * 100, 1) else 0 end
      ),
      'project_engagement', json_build_object(
        'sessions', v_project_sessions,
        'events', v_project_events,
        'rate', case when v_total_sessions > 0 then round((v_project_sessions::numeric / v_total_sessions::numeric) * 100, 1) else 0 end
      ),
      'demo_views', json_build_object(
        'sessions', v_demo_sessions,
        'events', v_demo_events,
        'rate', case when v_total_sessions > 0 then round((v_demo_sessions::numeric / v_total_sessions::numeric) * 100, 1) else 0 end
      ),
      'github_inspects', json_build_object(
        'sessions', v_github_sessions,
        'events', v_github_events,
        'rate', case when v_total_sessions > 0 then round((v_github_sessions::numeric / v_total_sessions::numeric) * 100, 1) else 0 end
      ),
      'contact_intents', json_build_object(
        'sessions', v_contact_sessions,
        'events', v_contact_events,
        'rate', case when v_total_sessions > 0 then round((v_contact_sessions::numeric / v_total_sessions::numeric) * 100, 1) else 0 end
      )
    ),
    'section_retention', json_build_array(
      json_build_object('section', 'home', 'label', 'Hero / Landed', 'sessions', v_hero_sessions, 'rate', case when v_total_sessions > 0 then round((v_hero_sessions::numeric / v_total_sessions::numeric) * 100, 1) else 100.0 end),
      json_build_object('section', 'about', 'label', 'About Me & Skills', 'sessions', v_about_sessions, 'rate', case when v_total_sessions > 0 then round((v_about_sessions::numeric / v_total_sessions::numeric) * 100, 1) else 0 end),
      json_build_object('section', 'projects', 'label', 'Projects Showcase', 'sessions', v_projects_sessions, 'rate', case when v_total_sessions > 0 then round((v_projects_sessions::numeric / v_total_sessions::numeric) * 100, 1) else 0 end),
      json_build_object('section', 'contact', 'label', 'Contact & Footer', 'sessions', v_contact_section_sessions, 'rate', case when v_total_sessions > 0 then round((v_contact_section_sessions::numeric / v_total_sessions::numeric) * 100, 1) else 0 end)
    )
  ) into v_result;

  return v_result;
end;
$$;

-- 7. Recent sessions
create or replace function public.analytics_recent_sessions(
  p_limit int default 20
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

  select coalesce(json_agg(row_to_json(s)), '[]'::json)
  into v_result
  from (
    select
      s.session_id,
      left(s.visitor_id::text, 8) as visitor_short,
      s.started_at,
      s.last_seen_at,
      s.landing_path,
      s.utm_source,
      s.utm_campaign,
      s.country,
      s.device_type,
      (select count(*) from public.analytics_events e
       where e.session_id = s.session_id) as event_count,
      greatest(0, extract(epoch from (s.last_seen_at - s.started_at))::int) as duration_seconds
    from public.analytics_sessions s
    where s.visitor_id not in (select visitor_id from public.analytics_admin_exclusions)
    order by s.started_at desc
    limit p_limit
  ) s;

  return v_result;
end;
$$;

-- 8. Single session detail
create or replace function public.analytics_session_detail(
  p_session_id uuid
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

  select json_build_object(
    'session', (
      select row_to_json(s) from (
        select session_id, left(visitor_id::text, 8) as visitor_short,
          started_at, last_seen_at, landing_path, referrer_host,
          utm_source, utm_medium, utm_campaign,
          country, region, city, device_type, browser, os
        from public.analytics_sessions
        where session_id = p_session_id
      ) s
    ),
    'events', (
      select coalesce(json_agg(row_to_json(e) order by e.created_at), '[]'::json)
      from (
        select event_name, page, section, target_label, project_slug,
               destination_host, metadata, created_at
        from public.analytics_events
        where session_id = p_session_id
      ) e
    )
  ) into v_result;

  return v_result;
end;
$$;

-- Revoke and grant execute on RPCs
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

revoke execute on function public.analytics_funnel(timestamptz, timestamptz) from public, anon;
grant execute on function public.analytics_funnel(timestamptz, timestamptz) to authenticated;

revoke execute on function public.analytics_recent_sessions(int) from public, anon;
grant execute on function public.analytics_recent_sessions(int) to authenticated;

revoke execute on function public.analytics_session_detail(uuid) from public, anon;
grant execute on function public.analytics_session_detail(uuid) to authenticated;

-- 9. Retention cleanup (Deletes events & sessions older than p_days, default 90 days)
create or replace function public.analytics_cleanup_old_data(
  p_retention_days int default 90
)
returns json
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_deleted_events bigint;
  v_deleted_sessions bigint;
  v_cutoff timestamptz;
begin
  if not exists (select 1 from public.portfolio_admins where user_id = (select auth.uid())) then
    raise exception 'Admin access required';
  end if;

  v_cutoff := now() - (p_retention_days || ' days')::interval;

  delete from public.analytics_events
  where created_at < v_cutoff;
  get diagnostics v_deleted_events = row_count;

  delete from public.analytics_sessions
  where last_seen_at < v_cutoff;
  get diagnostics v_deleted_sessions = row_count;

  return json_build_object(
    'cutoff_date', v_cutoff,
    'deleted_events', v_deleted_events,
    'deleted_sessions', v_deleted_sessions
  );
end;
$$;

revoke execute on function public.analytics_cleanup_old_data(int) from public, anon;
grant execute on function public.analytics_cleanup_old_data(int) to authenticated;
