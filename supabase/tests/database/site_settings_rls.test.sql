begin;
select plan(9);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'settings-admin@example.test', 'not-used', now(), '{}', '{}', now(), now()),
  ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'settings-visitor@example.test', 'not-used', now(), '{}', '{}', now(), now());
insert into public.portfolio_admins (user_id) values ('33333333-3333-3333-3333-333333333333');

select throws_ok($$insert into public.site_settings (id, display_name, hero_subtitle, bio_paragraph_1, bio_paragraph_2, current_focus, contact_heading, contact_description, resume_en_url, resume_th_url) values (2, 'x', 'x', 'x', 'x', 'x', 'x', 'x', '/x.pdf', '/x.pdf')$$, '23514', 'singleton check rejects another settings row');

set local role anon;
select is((select count(*) from public.site_settings), 1::bigint, 'anon reads the singleton settings row');
select throws_ok($$update public.site_settings set display_name = 'Blocked' where id = 1$$, '42501', 'anon cannot update settings');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}', true);
select throws_ok($$update public.site_settings set display_name = 'Blocked' where id = 1$$, '42501', 'non-admin cannot update settings');
select throws_ok($$insert into storage.objects (bucket_id, name) values ('resume-files', 'en/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.pdf')$$, '42501', 'non-admin cannot upload resumes');
select throws_ok($$delete from storage.objects where bucket_id = 'resume-files' and name = 'en/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.pdf'$$, '42501', 'non-admin cannot delete resumes');

select set_config('request.jwt.claims', '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
select lives_ok($$update public.site_settings set display_name = 'Updated' where id = 1$$, 'admin updates settings');
select lives_ok($$insert into storage.objects (bucket_id, name) values ('resume-files', 'en/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.pdf')$$, 'admin uploads a versioned resume path');
select throws_ok($$insert into storage.objects (bucket_id, name) values ('resume-files', 'legacy/resume.pdf')$$, '42501', 'admin cannot upload outside resume folders');

select * from finish();
rollback;
