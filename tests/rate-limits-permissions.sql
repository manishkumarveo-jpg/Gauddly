-- Runs entirely inside a rolled-back transaction; no real content is changed.
-- Run with: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/rate-limits-permissions.sql
begin;
do $$
declare buyer uuid; i int;
begin
  -- Waitlist: the sixth signup from one IP within an hour is refused.
  perform set_config('request.headers', '{"x-forwarded-for":"203.0.113.9, 10.0.0.1"}', true);
  for i in 1..5 loop
    insert into public.waitlist_signups (email) values (format('rate-test-%s@example.com', i));
  end loop;
  begin
    insert into public.waitlist_signups (email) values ('rate-test-6@example.com');
    raise exception 'TEST FAILED: sixth waitlist signup from one IP was allowed';
  exception when raise_exception then
    if sqlerrm <> 'Too many sign-ups. Please try again later.' then raise; end if;
  end;
  perform set_config('request.headers', '{"x-forwarded-for":"198.51.100.7"}', true);
  insert into public.waitlist_signups (email) values ('rate-test-other-ip@example.com');
  begin
    insert into public.waitlist_signups (email) values ('not-an-email');
    raise exception 'TEST FAILED: malformed email was accepted';
  exception when check_violation then null;
  end;

  -- Orders: at most 5 pending orders per user in 10 minutes.
  select id into buyer from public.profiles limit 1;
  if buyer is null then raise exception 'An existing profile is required for this test'; end if;
  begin
    for i in 1..6 loop
      insert into public.orders (user_id, email, name, status, subtotal, total)
      values (buyer, 'rate-test@example.com', 'Rate Test', 'pending', 0, 0);
    end loop;
    raise exception 'TEST FAILED: sixth pending order in ten minutes was allowed';
  exception when raise_exception then
    if sqlerrm <> 'Too many orders in a short time. Please wait a few minutes and try again.' then raise; end if;
  end;

  -- Catalog edits fire the cache trigger without failing the edit.
  update public.products set name = name where false;
end;
$$;

-- Browser roles can neither read the attempt log nor truncate the rate-limited tables.
set local role anon;
do $$
begin
  begin
    perform 1 from public.waitlist_attempts;
    raise exception 'TEST FAILED: anon can read waitlist_attempts';
  exception when insufficient_privilege then null;
  end;
  begin
    truncate public.waitlist_signups;
    raise exception 'TEST FAILED: anon can truncate waitlist_signups';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;
select 'PASS: rate limits' as result;
rollback;
