-- Runs entirely inside a rolled-back transaction; no real content is changed.
-- Run with: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/homepage-permissions.sql
-- (ON_ERROR_STOP makes a failed assertion exit non-zero instead of carrying on.)
begin;
do $$
declare admin_id uuid; rev bigint; next_rev bigint; old_published jsonb;
  sample jsonb := '{"sections":[{"id":"hero","title":"Homepage permission test"}]}'::jsonb;
begin
  perform set_config('request.jwt.claim.sub', '', true);
  begin
    perform public.save_homepage(sample, 0, false);
    raise exception 'TEST FAILED: anonymous save was allowed';
  exception when raise_exception then
    if sqlerrm <> 'Administrator access required' then raise; end if;
  end;
  select id into admin_id from public.profiles where is_admin = true limit 1;
  if admin_id is null then raise exception 'An existing administrator is required for this test'; end if;
  perform set_config('request.jwt.claim.sub', admin_id::text, true);
  select revision, published into rev, old_published from public.homepage_content where id='homepage';
  next_rev := public.save_homepage(sample, rev, false);
  if public.get_homepage() is distinct from old_published then raise exception 'TEST FAILED: draft leaked'; end if;
  begin
    perform public.save_homepage(sample, rev, true);
    raise exception 'TEST FAILED: stale revision was accepted';
  exception when raise_exception then
    if sqlerrm <> 'Another editor saved changes. Reload before saving.' then raise; end if;
  end;
  perform public.save_homepage(sample, next_rev, true);
  if public.get_homepage() is distinct from sample then raise exception 'TEST FAILED: publish did not update content'; end if;
end;
$$;
set local role anon;
do $$
begin
  perform public.get_homepage();
  begin
    perform draft from public.homepage_content;
    raise exception 'TEST FAILED: anonymous user read draft';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;
-- Only reached when every assertion above passed (a failure aborts the transaction)
select 'PASS: admin save/publish, draft isolation, anonymous access and stale revision protection' as result;
rollback;
