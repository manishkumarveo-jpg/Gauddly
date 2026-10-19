# Data model

**Provenance.** `homepage_content`, `get_homepage` and `save_homepage` are defined in `supabase/migrations/202610150001_homepage.sql`. `waitlist_attempts` and the rate-limit and cache-clearing triggers are defined in `supabase/migrations/202610190001_rate_limits_and_catalog_cache.sql`. Every other object below is **inferred** from the columns the frontend selects, inserts or updates ([ADR-010](architecture-decisions.md#adr-010--most-of-the-schema-and-both-edge-functions-live-outside-the-repository)). Types marked "inferred" have not been confirmed against the live database. Constraints not visible from the client are stated only when the code depends on them.

ER diagram: [diagrams/data-model.md](../diagrams/data-model.md).

## Versioned objects

### `homepage_content` (table)

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `text` PK | Default `'homepage'`, with `check (id = 'homepage')`, so there is exactly one row |
| `draft` | `jsonb not null` | Default `{"sections":[]}` |
| `published` | `jsonb` | `null` until the first publish |
| `revision` | `bigint not null` | Incremented on every save, used for optimistic locking |
| `updated_at` | `timestamptz not null` | Set on save |

RLS is enabled. All privileges are revoked from `anon` and `authenticated`. `select` is granted to `authenticated`, but the policy limits it to rows where the caller's profile has `is_admin = true`.

### `get_homepage() → jsonb`

`security definer`, `stable`. Returns `published` and is executable by `anon` and `authenticated`.

### `save_homepage(content jsonb, expected_revision bigint, publish boolean default false) → bigint`

`security definer`. It raises an error in three cases:
- `Administrator access required` if the caller is not an admin.
- `Invalid homepage content` if `content.sections` is not an array or the document exceeds 262,144 bytes.
- `Another editor saved changes. Reload before saving.` on a revision mismatch.

Otherwise it writes `draft` (and `published` when `publish` is true), increments `revision` and returns the new value.

### `waitlist_attempts` (table)

| Column | Type | Notes |
| --- | --- | --- |
| `ip` | `text not null` | First `x-forwarded-for` entry, or `unknown` (ASSUMPTION-021) |
| `created_at` | `timestamptz not null` | Default `now()`; rows older than one hour are deleted on each signup |

RLS is enabled with no policies, and all privileges are revoked from `anon` and `authenticated`. Indexed on `(ip, created_at)`.

### Triggers and constraints on inferred tables

| Object | On | Behaviour |
| --- | --- | --- |
| `limit_waitlist_signups()` | `waitlist_signups`, before insert, per row; `security definer` | Raises "Too many sign-ups. Please try again later." after 5 signups from the caller's IP, or 200 overall, in the last hour; otherwise records the attempt |
| `waitlist_signups_email_format` | `waitlist_signups` check, `not valid` (existing rows unchecked) | `char_length(email) <= 254` and `email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'` |
| `limit_pending_orders()` | `orders`, before insert, per row | Raises "Too many orders in a short time. Please wait a few minutes and try again." when `user_id` already has 5 `pending` orders created in the last 10 minutes. Supported by index `orders_user_id_created_at`. |
| `clear_catalog_cache()` | `products`, `product_images`, `product_sizes`, `castes`, `episodes`, `homepage_content`; after any write or truncate, per statement; `security definer` | Returns early unless the writer is an admin or a server role (`auth.role()` not `anon`/`authenticated`), because zero-row statements still fire it. Then reads `upstash_redis_rest_url` and `upstash_redis_rest_token` from Vault and sends `INCR catalog:version` through `pg_net`. Missing secrets and errors become a warning and never block the write. |

`truncate`, `references` and `trigger` are revoked from `anon` and `authenticated` on `orders` and `waitlist_signups`. On `products`, `product_images`, `product_sizes`, `castes` and `episodes`, `insert`, `update`, `delete` and `truncate` are revoked from `anon`, and `truncate` from `authenticated`.

## Inferred objects (not in the repository)

### `profiles`

| Column | Type (inferred) | Used by |
| --- | --- | --- |
| `id` | `uuid` PK, equal to `auth.users.id` | All profile reads |
| `is_admin` | `boolean` | `AppContext`, `Login`, homepage RLS and RPC |
| `full_name` | `text` | `Account` (also passed as signup metadata `full_name`) |
| `default_address` | `jsonb` with keys `address`, `city`, `state`, `pincode`, `phone` | `Account` |

A row presumably exists for each auth user, created by a trigger on signup, because `Account` calls `.single()`.

### `castes`

| Column | Type (inferred) | Notes |
| --- | --- | --- |
| `id` | `text` PK | URL slug, for example `nimbus` or `old-world` |
| `name` | `text` | |
| `hero_r2_key` | `text` | R2 key or URL |
| `passage` | `text` | |
| `sort_order` | `integer` | |

### `products`

| Column | Type (inferred) | Notes |
| --- | --- | --- |
| `id` | `text` PK | Slug entered by the admin |
| `caste_id` | `text` FK → `castes.id` | `old-world` marks archive pieces |
| `name`, `num`, `sku`, `passage`, `craft` | `text` | |
| `price` | `numeric` or `integer` | INR, whole rupees displayed |
| `sort_order` | `integer` | |
| `is_published` | `boolean` | Storefront queries filter on `true` |
| `video_r2_key` | `text` nullable | |

### `product_images`

| Column | Type (inferred) | Notes |
| --- | --- | --- |
| `id` | PK | Used when deleting |
| `product_id` | FK → `products.id` | |
| `r2_key` | `text` | |
| `sort_order` | `integer` | Admin uploads always insert `0` (R-11) |
| `alt` | `text` | Admin uploads set it to the product ID |

### `product_sizes`

| Column | Type (inferred) | Notes |
| --- | --- | --- |
| `product_id` | FK → `products.id` | |
| `size` | `text` | The admin creates `S`, `M`, `L`, `XL`; the storefront sorts a wider set, from XXS to ONE SIZE |
| `in_stock` | `boolean` | |

Presumably unique on `(product_id, size)`, since updates target that pair.

### `episodes`

| Column | Type (inferred) | Notes |
| --- | --- | --- |
| `id` | `text` PK | |
| `num`, `title`, `description`, `director_note` | `text` | |
| `status` | `text` | `released`, `awaiting` or `sealed` |
| `still_r2_key`, `video_r2_key` | `text` nullable | |
| `release_date` | `date` nullable | |
| `sort_order` | `integer` | |

### `orders`

| Column | Type (inferred) | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | Displayed as `#GDLY-XXXX` (admin) or `Claim #xxxxxxxx` (customer) |
| `email`, `name`, `phone` | `text` | `phone` is shown in the admin view but not collected by checkout (R-12) |
| `status` | `text` | `pending`, `paid`, `failed`, `cancelled` or `fulfilled` |
| `subtotal`, `total` | numeric | |
| `created_at` | `timestamptz` | |
| `user_id` | `uuid` | Confirmed in the live schema on 2026-10-19; used by RLS and the pending-order limit |
| shipping address | unknown | Sent by checkout but never displayed in admin (R-12) |

### `order_items`

| Column | Type (inferred) | Notes |
| --- | --- | --- |
| `order_id` | FK → `orders.id` | |
| `product_name`, `size` | `text` | Snapshot taken at order time |
| `unit_price` | numeric | Snapshot |
| `quantity` | `integer` | |

### `waitlist_signups`

| Column | Type (inferred) | Notes |
| --- | --- | --- |
| `email` | `text`, unique | The client relies on unique violation `23505` |

### `top_products` (view, ASSUMPTION-009)

Columns: `product_id`, `product_name`, `sku`, `units_sold`, `revenue`.
