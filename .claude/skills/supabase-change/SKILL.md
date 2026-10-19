---
name: supabase-change
description: Use when adding or changing a Supabase table, column, RLS policy, view, RPC function or Edge Function in the Gauddly project. Covers migration format, RLS requirements, permission tests and the doc updates each change needs.
---

# Changing the Supabase backend

## Before you start

- Read [architecture/data-model.md](../../../architecture/data-model.md). Objects marked "inferred" are **not** defined in the repo (ADR-010). If you change one, first ask the user whether its real definition can be pulled (`supabase db pull`). Do not write DDL that assumes columns you cannot see.
- Read [architecture/security.md](../../../architecture/security.md) for the policies the frontend relies on.

## Migrations

1. Create `supabase/migrations/<YYYYMMDDHHMM>_<snake_name>.sql`, with a timestamp later than every existing file.
2. Wrap the whole file in `begin; … commit;`. Start with a one-line comment explaining why.
3. Use `create … if not exists` or `create or replace` where safe.
4. For every new table:
   - `alter table … enable row level security;`
   - `revoke all on <table> from anon, authenticated;`
   - Grant only what is needed, and write explicit policies.
5. Security-definer functions: `set search_path = ''`, schema-qualify every name, `revoke all on function … from public`, then `grant execute` to the specific roles. Raise clear exception messages, because the UI shows them.
6. Admin checks use `exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)`.

Reference implementation: `supabase/migrations/202610150001_homepage.sql`.

## Edge Functions

- Source belongs in `supabase/functions/<name>/index.ts` (Deno). Today `create-order` and `admin-upload-url` exist only in the live project. Bring them into the repo before modifying them.
- Return errors as JSON `{ "error": "<user-facing message>" }` with a non-2xx status. The client reads this with `edgeFunctionErrorMessage`.
- Read secrets with `Deno.env.get`. Set them with `supabase secrets set`, never in the repo.
- Verify the caller from the JWT. Admin functions must check `profiles.is_admin` server-side.

## Tests

Add or extend a `tests/<area>-permissions.sql` script following `tests/homepage-permissions.sql`:
- Run everything inside a transaction that rolls back.
- Assert that anonymous users and non-admins are refused.
- Assert that admins succeed.
- End with a `PASS:` select.

Add a matching test case with `/add-test-case`.

## Docs to update

- `architecture/data-model.md`: move the object from "inferred" to "versioned" once its DDL is in a migration.
- `architecture/api-contracts.md` for RPC or Edge Function changes.
- `architecture/security.md`: move controls from "cannot be verified" to "verified".
- `docs/repo-inventory.md` §4: set "Defined in repo?" to Yes.
- `operations/deployment.md` for new secrets or release steps.
- `implementation/phase-test-matrix.md` (PH-7 progress).

## Release order

Apply migrations, then deploy functions, then deploy the frontend. Never deploy frontend code that depends on a migration before the migration has been applied.
