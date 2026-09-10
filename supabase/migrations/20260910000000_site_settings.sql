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
