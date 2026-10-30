-- Account area: saved addresses, wishlist, support claims and notification preferences.
-- Every table is owner-only through RLS; support claims are answered by admins.
begin;

-- Saved addresses (replaces profiles.default_address, which no profile had filled in)
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  label text not null default 'home' check (label in ('home', 'work', 'other')),
  phone text check (phone ~ '^[6-9][0-9]{9}$'),
  house text not null check (length(house) between 1 and 200),
  street text not null check (length(street) between 1 and 200),
  landmark text check (length(landmark) <= 200),
  city text not null check (length(city) between 1 and 100),
  state text not null check (length(state) between 1 and 100),
  pincode text not null check (pincode ~ '^[0-9]{6}$'),
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists addresses_user_id on public.addresses (user_id);
create unique index if not exists addresses_one_default on public.addresses (user_id) where is_default;
alter table public.addresses enable row level security;
revoke all on public.addresses from anon, authenticated;
grant select, delete on public.addresses to authenticated;
grant insert (label, phone, house, street, landmark, city, state, pincode, is_default) on public.addresses to authenticated;
grant update (label, phone, house, street, landmark, city, state, pincode, is_default) on public.addresses to authenticated;

create policy "own addresses select" on public.addresses for select to authenticated using (user_id = (select auth.uid()));
create policy "own addresses insert" on public.addresses for insert to authenticated
  with check (user_id = (select auth.uid()) and (select count(*) from public.addresses a where a.user_id = (select auth.uid())) < 10);
create policy "own addresses update" on public.addresses for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own addresses delete" on public.addresses for delete to authenticated using (user_id = (select auth.uid()));

-- Two statements so the one-default index never sees two defaults at once.
-- Runs as the caller, so RLS still limits it to their own rows.
create or replace function public.set_default_address(address_id uuid)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  update public.addresses set is_default = false where user_id = auth.uid() and is_default and id <> address_id;
  update public.addresses set is_default = true where user_id = auth.uid() and id = address_id;
end;
$$;
revoke all on function public.set_default_address(uuid) from public, anon;
grant execute on function public.set_default_address(uuid) to authenticated;

-- Wishlist
create table if not exists public.wishlist (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);
alter table public.wishlist enable row level security;
revoke all on public.wishlist from anon, authenticated;
grant select, delete on public.wishlist to authenticated;
grant insert (product_id) on public.wishlist to authenticated;

create policy "own wishlist select" on public.wishlist for select to authenticated using (user_id = (select auth.uid()));
-- The products subquery runs under products RLS, so hidden products cannot be probed by slug
create policy "own wishlist insert" on public.wishlist for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.products p where p.id = wishlist.product_id)
    and (select count(*) from public.wishlist w where w.user_id = (select auth.uid())) < 100
  );
create policy "own wishlist delete" on public.wishlist for delete to authenticated using (user_id = (select auth.uid()));

-- Support claims: customers raise them, admins answer them.
-- Customers can insert only kind, message and an order of their own; status and replies are admin-only.
-- The per-user caps in these policies are soft limits: parallel inserts can overshoot them slightly.
create table if not exists public.support_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  -- Taken from the caller's verified token, so admins can reply without reading auth.users
  email text default (auth.jwt() ->> 'email'),
  kind text not null check (kind in ('return', 'alteration', 'damage', 'delivery', 'other')),
  message text not null check (length(message) between 10 and 2000),
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'cancelled')),
  admin_reply text check (length(admin_reply) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists support_claims_user_id on public.support_claims (user_id, created_at desc);
alter table public.support_claims enable row level security;
revoke all on public.support_claims from anon, authenticated;
grant select on public.support_claims to authenticated;
grant insert (order_id, kind, message) on public.support_claims to authenticated;
grant update (status, admin_reply) on public.support_claims to authenticated;

create policy "own or admin claims select" on public.support_claims for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
-- At most 5 unresolved claims per customer, so the form cannot be used to flood the admin queue
create policy "own claims insert" on public.support_claims for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (order_id is null or exists (select 1 from public.orders o where o.id = support_claims.order_id and o.user_id = (select auth.uid())))
    and (select count(*) from public.support_claims c where c.user_id = (select auth.uid()) and c.status in ('open', 'in_progress')) < 5
  );
create policy "admin claims update" on public.support_claims for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- updated_at comes from the database clock, not the admin's browser
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger support_claims_touch before update on public.support_claims
  for each row execute function public.touch_updated_at();

-- Notification preferences (recorded now; nothing sends marketing email yet)
alter table public.profiles add column if not exists notification_prefs jsonb not null
  default '{"order_updates": true, "promotions": false}'::jsonb
  check (jsonb_typeof(notification_prefs) = 'object' and pg_column_size(notification_prefs) < 1024);
grant update (notification_prefs) on public.profiles to authenticated;

-- Profiles are created by the server only; drop the platform's default write grants (R-02)
revoke insert, delete, truncate on public.profiles from anon, authenticated;

commit;
