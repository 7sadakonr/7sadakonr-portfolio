-- Consolidated schema: projects backoffice, site settings, analytics (with timezone-aware RPCs).
-- Safe to re-run: tables/policies/functions are idempotent. No table data is dropped.

-- ===================================================================
-- Projects backoffice
-- ===================================================================

create table if not exists public.portfolio_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(btrim(title)) > 0),
  description text not null check (length(btrim(description)) > 0),
  image_url text,
  image_storage_path text,
  live_url text check (live_url is null or live_url ~ '^https?://'),
  github_url text check (github_url is null or github_url ~ '^https?://'),
  tech text[] not null default '{}',
  is_in_progress boolean not null default false,
  is_visible boolean not null default true,
  sort_order integer not null default 0 check (sort_order >= 0),
  fallback_gradient text,
  legacy_source_id integer unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((image_url is null) = (image_storage_path is null))
);

create index if not exists projects_visible_order_idx
  on public.projects (sort_order, id) where is_visible;

create or replace function public.set_project_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_project_updated_at();

alter table public.projects enable row level security;
alter table public.portfolio_admins enable row level security;

revoke all on public.projects from anon, authenticated;
revoke all on public.portfolio_admins from anon, authenticated;
grant select on public.projects to anon;
grant select, insert, update, delete on public.projects to authenticated;
grant select on public.portfolio_admins to authenticated;

drop policy if exists "Public can read visible projects" on public.projects;
create policy "Public can read visible projects"
  on public.projects for select to anon, authenticated
  using (is_visible = true);

drop policy if exists "Admin can read all projects" on public.projects;
create policy "Admin can read all projects"
  on public.projects for select to authenticated
  using (exists (select 1 from public.portfolio_admins where user_id = (select auth.uid())));

drop policy if exists "Admin can insert projects" on public.projects;
create policy "Admin can insert projects"
  on public.projects for insert to authenticated
  with check (exists (select 1 from public.portfolio_admins where user_id = (select auth.uid())));

drop policy if exists "Admin can update projects" on public.projects;
create policy "Admin can update projects"
  on public.projects for update to authenticated
  using (exists (select 1 from public.portfolio_admins where user_id = (select auth.uid())))
  with check (exists (select 1 from public.portfolio_admins where user_id = (select auth.uid())));

drop policy if exists "Admin can delete projects" on public.projects;
create policy "Admin can delete projects"
  on public.projects for delete to authenticated
  using (exists (select 1 from public.portfolio_admins where user_id = (select auth.uid())));

drop policy if exists "Users can read their own admin membership" on public.portfolio_admins;
create policy "Users can read their own admin membership"
  on public.portfolio_admins for select to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.move_project(p_project_id uuid, p_direction text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_position integer;
  target_position integer;
begin
  if p_direction not in ('up', 'down') then
    raise exception 'Invalid project direction';
  end if;

  if not exists (select 1 from public.portfolio_admins where user_id = (select auth.uid())) then
    raise exception 'Admin access required';
  end if;

  perform 1 from public.projects for update;

  with ordered as (
    select id, row_number() over (order by sort_order, created_at, id) - 1 as position
    from public.projects
  )
  select position into current_position from ordered where id = p_project_id;

  if current_position is null then
    raise exception 'Project not found';
  end if;

  target_position := current_position + case when p_direction = 'up' then -1 else 1 end;
  if target_position < 0 or target_position >= (select count(*) from public.projects) then
    return;
  end if;

  with ordered as (
    select id, row_number() over (order by sort_order, created_at, id) - 1 as position
    from public.projects
  )
  update public.projects
  set sort_order = case
    when ordered.position = current_position then target_position
    when ordered.position = target_position then current_position
    else ordered.position
  end
  from ordered
  where public.projects.id = ordered.id;
end;
$$;

revoke execute on function public.move_project(uuid, text) from public, anon;
grant execute on function public.move_project(uuid, text) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-images',
  'project-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admin can read project images" on storage.objects;
create policy "Admin can read project images"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'project-images'
    and exists (select 1 from public.portfolio_admins where user_id = (select auth.uid()))
  );

drop policy if exists "Admin can upload project images" on storage.objects;
create policy "Admin can upload project images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'project-images'
    and (storage.foldername(name))[1] in ('projects', 'legacy')
    and exists (select 1 from public.portfolio_admins where user_id = (select auth.uid()))
  );

drop policy if exists "Admin can delete project images" on storage.objects;
create policy "Admin can delete project images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'project-images'
    and (storage.foldername(name))[1] in ('projects', 'legacy')
    and exists (select 1 from public.portfolio_admins where user_id = (select auth.uid()))
  );

-- ===================================================================
-- Site settings
-- ===================================================================

create table if not exists public.site_settings (
  id smallint primary key default 1 check (id = 1),
  display_name text not null check (length(btrim(display_name)) > 0),
  hero_subtitle text not null check (length(btrim(hero_subtitle)) > 0),
  bio_paragraph_1 text not null check (length(btrim(bio_paragraph_1)) > 0),
  bio_paragraph_2 text not null check (length(btrim(bio_paragraph_2)) > 0),
  current_focus text not null check (length(btrim(current_focus)) > 0),
  contact_heading text not null check (length(btrim(contact_heading)) > 0),
  contact_description text not null check (length(btrim(contact_description)) > 0),
  contact_links jsonb not null default '[]'::jsonb check (jsonb_typeof(contact_links) = 'array'),
  resume_en_url text not null check (resume_en_url ~ '^(https?://|/)'),
  resume_en_storage_path text,
  resume_th_url text not null check (resume_th_url ~ '^(https?://|/)'),
  resume_th_storage_path text,
  updated_at timestamptz not null default now(),
  check (resume_en_storage_path is null or resume_en_storage_path ~ '^en/[0-9a-f-]+\.pdf$'),
  check (resume_th_storage_path is null or resume_th_storage_path ~ '^th/[0-9a-f-]+\.pdf$')
);

create or replace function public.set_site_settings_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
before update on public.site_settings
for each row execute function public.set_site_settings_updated_at();

insert into public.site_settings (
  id, display_name, hero_subtitle, bio_paragraph_1, bio_paragraph_2, current_focus,
  contact_heading, contact_description, contact_links, resume_en_url, resume_th_url
) values (
  1,
  'Jetsadakorn',
  'A passionate Computer Science Student exploring the intersection of technology and creativity. Currently focused on web development, UI/UX design, and building meaningful digital experiences.',
  'I''m a Computer Science student with a deep passion for creating elegant solutions to complex problems. My journey in tech started with curiosity about how things work, and has evolved into a commitment to building innovative digital experiences.',
  'When I''m not coding, you can find me exploring new design trends, learning about emerging technologies, or working on personal projects that challenge me to grow. I believe in the power of continuous learning and pushing boundaries.',
  'Currently focused on full-stack web development and creating user-centric interfaces that are both beautiful and functional.',
  'Let''s Connect',
  'Have a project in mind, a question, or just want to say hi? Feel free to reach out!',
  '[{"id":"email-main","type":"email","label":"7sadakonr@gmail.com","value":"7sadakonr@gmail.com","url":"mailto:7sadakonr@gmail.com","isVisible":true},{"id":"github-main","type":"github","label":"GitHub","value":"7sadakonr","url":"https://github.com/7sadakonr","isVisible":true}]'::jsonb,
  '/resume/Jetsadakorn_Muangwichit_Resume_EN.pdf',
  '/resume/Jetsadakorn_Muangwichit_Resume_TH.pdf'
) on conflict (id) do nothing;

alter table public.site_settings enable row level security;
revoke all on public.site_settings from anon, authenticated;
grant select on public.site_settings to anon, authenticated;
grant update on public.site_settings to authenticated;

drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings"
  on public.site_settings for select to anon, authenticated
  using (id = 1);

drop policy if exists "Admin can update site settings" on public.site_settings;
create policy "Admin can update site settings"
  on public.site_settings for update to authenticated
  using (exists (select 1 from public.portfolio_admins where user_id = (select auth.uid())))
  with check (id = 1 and exists (select 1 from public.portfolio_admins where user_id = (select auth.uid())));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('resume-files', 'resume-files', true, 10485760, array['application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admin can upload resumes" on storage.objects;
create policy "Admin can upload resumes"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'resume-files'
    and (storage.foldername(name))[1] in ('en', 'th')
    and array_length(storage.foldername(name), 1) = 1
    and name ~ '^(en|th)/[0-9a-f-]+\.pdf$'
    and exists (select 1 from public.portfolio_admins where user_id = (select auth.uid()))
  );

drop policy if exists "Admin can delete resumes" on storage.objects;
create policy "Admin can delete resumes"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'resume-files'
    and (storage.foldername(name))[1] in ('en', 'th')
    and array_length(storage.foldername(name), 1) = 1
    and name ~ '^(en|th)/[0-9a-f-]+\.pdf$'
    and exists (select 1 from public.portfolio_admins where user_id = (select auth.uid()))
  );

-- ===================================================================
-- Analytics (privacy-first aggregate model: analytics_daily)
-- ===================================================================


-- 1. Drop old tracking tables and their dependencies (legacy session/event
--    data is discarded; only aggregate counts in analytics_daily are kept)
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
  date date not null default (timezone('Asia/Bangkok', now()))::date, -- Asia/Bangkok (GMT+7) day
  hour smallint not null default 0 check (hour between 0 and 23),     -- Asia/Bangkok hour of day
  metric text not null, -- 'page_view', 'project_open', 'resume_download', 'github_click', 'demo_click'
  country text not null default '',
  referrer_host text not null default '',
  utm_source text not null default '',
  utm_medium text not null default '',
  utm_campaign text not null default '',
  page text not null default '',
  project_slug text not null default '',
  count int not null default 1,
  constraint analytics_daily_dimensions_key unique (
    date, hour, metric, country, referrer_host, utm_source, utm_medium, utm_campaign, page, project_slug
  )
);

-- Upgrade path: the table may already exist from an earlier run without the hour column.
alter table public.analytics_daily
  add column if not exists hour smallint not null default 0 check (hour between 0 and 23);
alter table public.analytics_daily
  alter column date set default (timezone('Asia/Bangkok', now()))::date;
alter table public.analytics_daily drop constraint if exists analytics_daily_dimensions_key;
alter table public.analytics_daily add constraint analytics_daily_dimensions_key unique (
  date, hour, metric, country, referrer_host, utm_source, utm_medium, utm_campaign, page, project_slug
);

create index if not exists analytics_daily_date_idx on public.analytics_daily (date);
create index if not exists analytics_daily_date_hour_idx on public.analytics_daily (date, hour);
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

-- 5. Hourly activity feed: which projects were opened / resumes downloaded / links clicked, per Bangkok hour
create or replace function public.analytics_activity_hourly(
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

  select coalesce(json_agg(row_to_json(r) order by r.date desc, r.metric), '[]'::json)
  into v_result
  from (
    select
      to_char(a.date::timestamp + make_interval(hours => a.hour), 'YYYY-MM-DD"T"HH24":00"') as date,
      a.metric,
      a.project_slug,
      coalesce(pr.title, nullif(a.project_slug, '')) as title,
      sum(a.count)::int as count
    from public.analytics_daily a
    left join public.projects pr on pr.id::text = a.project_slug
    where a.metric in ('project_open', 'resume_download', 'github_click', 'demo_click')
      and a.date between v_from::date and v_to::date
      and (a.date::timestamp + make_interval(hours => a.hour)) between v_from and v_to
    group by a.date, a.hour, a.metric, a.project_slug, pr.title
    order by a.date desc, a.hour desc
    limit 500
  ) r;

  return v_result;
end;
$$;

-- 6. Retention cleanup (Bangkok date)
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

revoke execute on function public.analytics_activity_hourly(timestamptz, timestamptz) from public, anon;
grant execute on function public.analytics_activity_hourly(timestamptz, timestamptz) to authenticated;

revoke execute on function public.analytics_cleanup_old_data(int) from public, anon;
grant execute on function public.analytics_cleanup_old_data(int) to authenticated;
