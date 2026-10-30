-- Stops customers from making themselves admins (R-02).
-- The "own profile update" policy limits which row a user can update but not which columns, and
-- authenticated held UPDATE on every column, so `update profiles set is_admin = true` on your own
-- row succeeded. Column grants close that: users may edit only their name and default address.
-- is_admin stays writable by the service role (bootstrap-admin) and the table owner.
begin;

revoke update on public.profiles from anon, authenticated;
grant update (full_name, default_address) on public.profiles to authenticated;

commit;
