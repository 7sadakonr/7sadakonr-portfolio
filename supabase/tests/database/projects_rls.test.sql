begin;
select plan(8);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@example.test', 'not-used', now(), '{}', '{}', now(), now()),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'visitor@example.test', 'not-used', now(), '{}', '{}', now(), now());

insert into public.portfolio_admins (user_id) values ('11111111-1111-1111-1111-111111111111');
insert into public.projects (id, title, description, tech, is_visible, sort_order)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Visible', 'Visible project', array['React'], true, 0),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Hidden', 'Hidden project', array['TypeScript'], false, 1);

set local role anon;
select is((select count(*) from public.projects), 1::bigint, 'anon reads visible projects only');
select throws_ok($$insert into public.projects (title, description) values ('Blocked', 'Blocked')$$, '42501', 'anon cannot insert projects');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
select is((select count(*) from public.projects), 1::bigint, 'non-admin reads visible projects only');
select throws_ok($$update public.projects set title = 'Blocked' where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$, '42501', 'non-admin cannot update projects');

select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
select is((select count(*) from public.projects), 2::bigint, 'admin reads hidden projects');
select lives_ok($$update public.projects set title = 'Updated' where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$, 'admin updates projects');
select lives_ok($$select public.move_project('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'up')$$, 'admin can move a project');
select is((select id from public.projects order by sort_order limit 1), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'move_project swaps ordered positions');

select * from finish();
rollback;
