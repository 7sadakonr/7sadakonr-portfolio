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
-- ===================================================================
-- Dashboard RPCs (Security Invoker, restricted to portfolio admins)
-- ===================================================================

-- Drop every existing overload of overview/timeseries so the timezone-aware
-- signatures are the only ones (no ambiguous calls). No table data is touched.
do $drop$
declare
  fn record;
begin
  for fn in
    select p.oid::regprocedure as signature
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('analytics_overview', 'analytics_timeseries')
  loop
    execute format('drop function %s', fn.signature);
  end loop;
end
$drop$;

-- 1. Overview stats (today/yesterday follow the viewer's timezone p_tz)
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

  if not exists (select 1 from pg_catalog.pg_timezone_names where name = p_tz) then
    raise exception 'Unknown timezone: %', p_tz;
  end if;

  v_from_date := (p_from at time zone p_tz)::date;
  v_to_date := (p_to at time zone p_tz)::date;
  v_period_days := greatest(1, (v_to_date - v_from_date));
  v_prev_to_date := v_from_date - 1;
  v_prev_from_date := v_prev_to_date - v_period_days;
  v_today := (now() at time zone p_tz)::date;
  v_yesterday := v_today - 1;

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

-- 2. Activity time series (daily buckets; p_tz picks the local date range)
create or replace function public.analytics_timeseries(
  p_from timestamptz default now() - interval '30 days',
  p_to   timestamptz default now(),
  p_metric text default 'interactions',
  p_tz text default 'UTC'
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

  if not exists (select 1 from pg_catalog.pg_timezone_names where name = p_tz) then
    raise exception 'Unknown timezone: %', p_tz;
  end if;

  v_from_date := (p_from at time zone p_tz)::date;
  v_to_date := (p_to at time zone p_tz)::date;

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
      a.project_slug as slug,
      coalesce(pr.title, a.project_slug) as title,
      sum(a.count)::int as opens,
      sum(a.count)::int as visitors,
      0::int as github_clicks,
      0::int as demo_clicks
    from public.analytics_daily a
    left join public.projects pr on pr.id::text = a.project_slug
    where a.metric = 'project_open'
      and a.project_slug <> ''
      and a.date between p_from::date and p_to::date
    group by a.project_slug, pr.title
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
      a.metric as event_name,
      case
        when a.metric = 'project_open' and a.project_slug <> '' then 'Open ' || coalesce(pr.title, a.project_slug)
        when a.metric = 'project_open' then 'Project Opened'
        when a.metric = 'resume_download' then 'Resume Download'
        else a.metric
      end as target_label,
      nullif(a.project_slug, '') as project_slug,
      sum(a.count)::int as total
    from public.analytics_daily a
    left join public.projects pr on pr.id::text = a.project_slug
    where a.date between p_from::date and p_to::date
      and a.metric in ('project_open', 'resume_download')
    group by a.metric, a.project_slug, pr.title
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
revoke execute on function public.analytics_overview(timestamptz, timestamptz, text) from public, anon;
grant execute on function public.analytics_overview(timestamptz, timestamptz, text) to authenticated;

revoke execute on function public.analytics_timeseries(timestamptz, timestamptz, text, text) from public, anon;
grant execute on function public.analytics_timeseries(timestamptz, timestamptz, text, text) to authenticated;


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

-- Make PostgREST pick up the new signatures immediately.
notify pgrst, 'reload schema';
