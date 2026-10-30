-- Lets customers remove orders from their own order list without deleting them.
-- Orders are payment and business records, so "remove" only hides them from the customer;
-- admins still see every order. Customers have no UPDATE policy on orders (only admins do),
-- so hiding goes through a security-definer function that can set this one flag on the
-- caller's own orders and nothing else.
begin;

alter table public.orders add column if not exists hidden_by_customer boolean not null default false;

create or replace function public.hide_my_orders(order_ids uuid[])
returns integer language plpgsql security definer set search_path = '' as $$
declare
  hidden integer;
begin
  update public.orders
     set hidden_by_customer = true
   where id = any(order_ids)
     and user_id = auth.uid();
  get diagnostics hidden = row_count;
  return hidden;
end;
$$;

revoke all on function public.hide_my_orders(uuid[]) from public, anon;
grant execute on function public.hide_my_orders(uuid[]) to authenticated;

commit;
