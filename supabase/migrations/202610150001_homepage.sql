-- A single atomic document keeps section ordering, copy and media in sync.
begin;
create table if not exists public.homepage_content (
  id text primary key default 'homepage' check (id = 'homepage'),
  draft jsonb not null default '{"sections":[]}'::jsonb,
  published jsonb,
  revision bigint not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.homepage_content enable row level security;
revoke all on public.homepage_content from anon, authenticated;
grant select on public.homepage_content to authenticated;
create policy "Administrators read homepage drafts" on public.homepage_content for select to authenticated
using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));
insert into public.homepage_content (id) values ('homepage') on conflict do nothing;

create or replace function public.get_homepage() returns jsonb
language sql stable security definer set search_path = '' as $$
  select published from public.homepage_content where id = 'homepage';
$$;
revoke all on function public.get_homepage() from public;
grant execute on function public.get_homepage() to anon, authenticated;

create or replace function public.save_homepage(content jsonb, expected_revision bigint, publish boolean default false)
returns bigint language plpgsql security definer set search_path = '' as $$
declare new_revision bigint;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_admin = true) then
    raise exception 'Administrator access required';
  end if;
  if content is null or jsonb_typeof(content->'sections') is distinct from 'array' or pg_column_size(content) > 262144 then
    raise exception 'Invalid homepage content';
  end if;
  update public.homepage_content set draft = content,
    published = case when publish then content else published end,
    revision = revision + 1, updated_at = now()
    where id = 'homepage' and revision = expected_revision returning revision into new_revision;
  if new_revision is null then raise exception 'Another editor saved changes. Reload before saving.'; end if;
  return new_revision;
end;
$$;
revoke all on function public.save_homepage(jsonb,bigint,boolean) from public;
grant execute on function public.save_homepage(jsonb,bigint,boolean) to authenticated;
commit;
