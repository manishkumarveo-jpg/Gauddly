# API contracts

The SPA has one read-only API of its own, `/api/*`, for public catalog reads. Its other interfaces are Supabase table access (PostgREST through `supabase-js`), two RPCs and two Edge Functions. Contracts below are taken from the calling code. Edge Function responses are inferred from how the client reads them.

## Conventions

- Client: `src/lib/supabase.js` creates one client from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Edge Function errors: functions return a JSON body `{ "error": "<message>" }` with a non-2xx status. `edgeFunctionErrorMessage()` reads that body, falling back to the generic message.
- Media keys: `mediaUrl(key)` passes `http(s)://` and `/`-prefixed values through unchanged. A bare key gets `VITE_R2_PUBLIC_URL/` prefixed.

## Public read API (`/api/*`)

Served by the Cloudflare Worker `worker/index.js` (and by Vite middleware in `npm run dev`) through `handlePublicRead` in `src/lib/public-api.js`. Called from the SPA with `publicRead(path)`, which falls back to running the same queries against Supabase from the browser when `/api` is missing, answers with something other than JSON, or fails. `GET` only; other methods get 405 from the Worker.

| Route | Supabase queries (anon key), in response order | Used by |
| --- | --- | --- |
| `home` | `rpc/get_homepage` | `Home.jsx` |
| `home-catalog` | published products; castes except `old-world`; released episodes | `Home.jsx` |
| `store` | castes; published products with images and sizes | `Store.jsx` |
| `archive` | published products in `old-world` | `Archive.jsx` |
| `episodes` | all episodes visible to anon | `Episodes.jsx` |
| `caste/:id` | the caste; its published products | `CastePage.jsx` |
| `piece/:id` | the published product with caste name, ordered images and sizes | `PieceDetail.jsx` |

| Item | Value |
| --- | --- |
| Success | `200`, a JSON array with one PostgREST result per query, in the order above. `X-Cache: HIT` or `MISS` when Redis is configured. `Cache-Control: no-cache`. |
| Errors | `404 { "error": "Not found" }` for an unknown route, a missing or extra segment, a malformed ID or an ID over 100 characters. `502 { "error": "The catalog could not be loaded." }` when any Supabase query fails. |
| Caching | Key `catalog:<catalog:version>:<route>[/<id>]`, 10-minute expiry. Failed reads and keyed routes with no matching row are never cached. |
| Invalidation | `clear_catalog_cache()` triggers send `INCR catalog:version` to Upstash after any write to `products`, `product_images`, `product_sizes`, `castes`, `episodes` or `homepage_content`. |

## RPC

### `get_homepage`

| Item | Value |
| --- | --- |
| Call | `supabase.rpc('get_homepage')` |
| Auth | anon or authenticated |
| Returns | The published document `{ sections: Section[] }`, or `null` |
| Client handling | `normalizeHome()`; `null` keeps the defaults |

### `save_homepage`

| Item | Value |
| --- | --- |
| Call | `supabase.rpc('save_homepage', { content, expected_revision, publish })` |
| Auth | authenticated admin |
| Returns | New `revision` (bigint) |
| Errors | `Administrator access required`, `Invalid homepage content`, `Another editor saved changes. Reload before saving.` |

## Edge Functions (source not in repository)

### `create-order`

Request body:

```json
{
  "items": [{ "productId": "dust-robe", "size": "M", "quantity": 1 }],
  "shipping": { "name": "A. Customer", "email": "a@example.com", "address": "12 Example Road", "city": "New Delhi, Delhi, 110001" }
}
```

| Item | Value |
| --- | --- |
| Auth | The caller's session JWT, sent automatically by `supabase.functions.invoke` |
| Success | `{ "orderId": "<uuid>" }` |
| Failure | Non-2xx with `{ "error": "<message shown to customer>" }`. The `orders` insert raises "Too many orders in a short time. Please wait a few minutes and try again." after 5 `pending` orders in 10 minutes (NFR-007); how the function words that to the customer is unknown. |
| Server duties (ASSUMPTION-007) | Look up current prices, reject unpublished or out-of-stock sizes, write `orders` and `order_items`, set status `pending` |

### `admin-upload-url`

Request body: `{ "key": "<r2 object key>", "method": "PUT" | "DELETE" }`

| Item | Value |
| --- | --- |
| Auth | Session JWT; the function must check `profiles.is_admin` |
| Success | `{ "url": "<presigned R2 URL>" }` |
| Client use | `PUT` through `XMLHttpRequest` with `Content-Type` set to the file type (progress events); `DELETE` through `fetch` (404 treated as success) |
| Key rules | The client sanitizes keys with `safeFileName`. Homepage keys are under `homepage/` ([docs/homepage.md](../docs/homepage.md)). |

## Table access by screen

| Screen | Reads | Writes |
| --- | --- | --- |
| Home | `/api/home`, `/api/home-catalog` | `waitlist_signups` insert (rate limited, NFR-007) |
| Store | `/api/store` | none |
| CastePage | `/api/caste/:id` | none |
| PieceDetail | `/api/piece/:id` | none |
| Archive | `/api/archive` | none |
| Episodes | `/api/episodes` | none |
| Await | none | `waitlist_signups` insert (rate limited, NFR-007) |
| Account | `profiles`, `orders` with `order_items` | `profiles` update |
| Login | `profiles.is_admin` | none |
| AdminDashboard | `orders`, `top_products`, `products` | none |
| AdminProducts | `products`, `castes`, images, sizes | `products`, `product_sizes`, `product_images` |
| AdminCastes | `castes`, `products` count | `castes` |
| AdminEpisodes | `episodes` | `episodes` |
| AdminOrders | `orders` with `order_items` (paged, `count: exact`) | `orders.status` |
| AdminHomepage | `homepage_content` (`draft`, `published`, `revision`, `updated_at`); catalog as Home | `save_homepage` RPC |
