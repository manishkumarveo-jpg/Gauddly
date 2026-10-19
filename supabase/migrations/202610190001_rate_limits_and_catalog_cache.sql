-- Throttles the two public write paths and tells the Redis catalog cache when catalog rows change.
begin;

-- Waitlist: at most 5 new signups per IP and 200 overall per hour. The global cap backs up the
-- per-IP check in case a client can influence x-forwarded-for.
create table if not exists public.waitlist_attempts (
  ip text not null,
  created_at timestamptz not null default now()
);
create index if not exists waitlist_attempts_ip_created_at on public.waitlist_attempts (ip, created_at);
alter table public.waitlist_attempts enable row level security;
revoke all on public.waitlist_attempts from anon, authenticated;

create or replace function public.limit_waitlist_signups() returns trigger
language plpgsql security definer set search_path = '' as $$
-- A custom setting reads as '' (not null) once a transaction that set it has ended, and ''::json fails.
declare caller_ip text := coalesce(nullif(trim(split_part(
  nullif(current_setting('request.headers', true), '')::json->>'x-forwarded-for', ',', 1)), ''), 'unknown');
begin
  -- ponytail: per-row count with no lock, so concurrent bursts can pass slightly over the cap
  delete from public.waitlist_attempts where created_at < now() - interval '1 hour';
  if (select count(*) from public.waitlist_attempts where ip = caller_ip) >= 5
    or (select count(*) from public.waitlist_attempts) >= 200 then
    raise exception 'Too many sign-ups. Please try again later.';
  end if;
  insert into public.waitlist_attempts (ip) values (caller_ip);
  return new;
end;
$$;
revoke all on function public.limit_waitlist_signups() from public;
create or replace trigger limit_waitlist_signups before insert on public.waitlist_signups
for each row execute function public.limit_waitlist_signups();

alter table public.waitlist_signups drop constraint if exists waitlist_signups_email_format;
alter table public.waitlist_signups add constraint waitlist_signups_email_format
  check (char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') not valid;

-- Orders: create-order inserts with the service role, so a trigger is the only place that sees every order.
create index if not exists orders_user_id_created_at on public.orders (user_id, created_at);

create or replace function public.limit_pending_orders() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.user_id is not null and (
    select count(*) from public.orders
    where user_id = new.user_id and status = 'pending' and created_at > now() - interval '10 minutes'
  ) >= 5 then
    raise exception 'Too many orders in a short time. Please wait a few minutes and try again.';
  end if;
  return new;
end;
$$;
revoke all on function public.limit_pending_orders() from public;
create or replace trigger limit_pending_orders before insert on public.orders
for each row execute function public.limit_pending_orders();

-- PostgREST cannot issue these, but TRUNCATE ignores RLS, so browser roles should not hold them.
revoke truncate, references, trigger on public.orders, public.waitlist_signups from anon, authenticated;
-- Catalog writes come only from signed-in admins; anon never needs them.
revoke insert, update, delete, truncate on public.products, public.product_images, public.product_sizes,
  public.castes, public.episodes from anon;
revoke truncate on public.products, public.product_images, public.product_sizes, public.castes, public.episodes
  from authenticated;

-- Catalog cache: any change to a public catalog table bumps catalog:version in Upstash Redis,
-- which retires every cached entry (src/lib/public-api.js). pg_net sends after commit.
create extension if not exists pg_net;

create or replace function public.clear_catalog_cache() returns trigger
language plpgsql security definer set search_path = '' as $$
declare redis_url text; redis_token text;
begin
  -- Statement triggers fire even when RLS lets a statement touch zero rows, so only admins and
  -- server-side writes may clear the cache; otherwise any account could keep it permanently empty.
  if coalesce(auth.role(), '') in ('anon', 'authenticated')
    and not exists (select 1 from public.profiles where id = auth.uid() and is_admin = true) then
    return null;
  end if;
  select decrypted_secret into redis_url from vault.decrypted_secrets where name = 'upstash_redis_rest_url';
  select decrypted_secret into redis_token from vault.decrypted_secrets where name = 'upstash_redis_rest_token';
  if redis_url is not null and redis_token is not null then
    perform net.http_post(
      url := redis_url,
      body := '["INCR","catalog:version"]'::jsonb,
      headers := jsonb_build_object('Authorization', 'Bearer ' || redis_token, 'Content-Type', 'application/json')
    );
  else
    raise warning 'Catalog cache was not cleared: Vault secrets upstash_redis_rest_url / upstash_redis_rest_token are missing';
  end if;
  return null;
exception when others then
  -- A cache that cannot be cleared must never block a catalog edit; entries still expire in 10 minutes.
  raise warning 'Catalog cache was not cleared: %', sqlerrm;
  return null;
end;
$$;
revoke all on function public.clear_catalog_cache() from public;

create or replace trigger clear_catalog_cache after insert or update or delete or truncate on public.products
for each statement execute function public.clear_catalog_cache();
create or replace trigger clear_catalog_cache after insert or update or delete or truncate on public.product_images
for each statement execute function public.clear_catalog_cache();
create or replace trigger clear_catalog_cache after insert or update or delete or truncate on public.product_sizes
for each statement execute function public.clear_catalog_cache();
create or replace trigger clear_catalog_cache after insert or update or delete or truncate on public.castes
for each statement execute function public.clear_catalog_cache();
create or replace trigger clear_catalog_cache after insert or update or delete or truncate on public.episodes
for each statement execute function public.clear_catalog_cache();
create or replace trigger clear_catalog_cache after insert or update or delete or truncate on public.homepage_content
for each statement execute function public.clear_catalog_cache();

commit;
