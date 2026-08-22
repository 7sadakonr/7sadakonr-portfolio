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
