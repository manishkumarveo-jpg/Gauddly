# API contracts

The SPA has no REST API of its own. Its interfaces are Supabase table access (PostgREST through `supabase-js`), two RPCs and two Edge Functions. Contracts below are taken from the calling code. Edge Function responses are inferred from how the client reads them.

## Conventions

- Client: `src/lib/supabase.js` creates one client from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Edge Function errors: functions return a JSON body `{ "error": "<message>" }` with a non-2xx status. `edgeFunctionErrorMessage()` reads that body, falling back to the generic message.
- Media keys: `mediaUrl(key)` passes `http(s)://` and `/`-prefixed values through unchanged. A bare key gets `VITE_R2_PUBLIC_URL/` prefixed.

## RPC

### `get_homepage`

| Item | Value |
|---|---|
| Call | `supabase.rpc('get_homepage')` |
| Auth | anon or authenticated |
| Returns | The published document `{ sections: Section[] }`, or `null` |
| Client handling | `normalizeHome()`; `null` keeps the defaults |

### `save_homepage`

| Item | Value |
|---|---|
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
|---|---|
| Auth | The caller's session JWT, sent automatically by `supabase.functions.invoke` |
| Success | `{ "orderId": "<uuid>" }` |
| Failure | Non-2xx with `{ "error": "<message shown to customer>" }` |
| Server duties (ASSUMPTION-007) | Look up current prices, reject unpublished or out-of-stock sizes, write `orders` and `order_items`, set status `pending` |

### `admin-upload-url`

Request body: `{ "key": "<r2 object key>", "method": "PUT" | "DELETE" }`

| Item | Value |
|---|---|
| Auth | Session JWT; the function must check `profiles.is_admin` |
| Success | `{ "url": "<presigned R2 URL>" }` |
| Client use | `PUT` through `XMLHttpRequest` with `Content-Type` set to the file type (progress events); `DELETE` through `fetch` (404 treated as success) |
| Key rules | The client sanitizes keys with `safeFileName`. Homepage keys are under `homepage/` ([docs/homepage.md](../docs/homepage.md)). |

## Table access by screen

| Screen | Reads | Writes |
|---|---|---|
| Home | `products` (published), `castes` (not `old-world`), `episodes` (released) | `waitlist_signups` insert |
| Store | `castes`, `products` (published) with images and sizes | none |
| CastePage | `castes` by ID, `products` by caste (published) | none |
| PieceDetail | `products` with `castes(name)`, images and sizes | none |
| Archive | `products` where `caste_id = 'old-world'` | none |
| Episodes | `episodes` | none |
| Await | none | `waitlist_signups` insert |
| Account | `profiles`, `orders` with `order_items` | `profiles` update |
| Login | `profiles.is_admin` | none |
| AdminDashboard | `orders`, `top_products`, `products` | none |
| AdminProducts | `products`, `castes`, images, sizes | `products`, `product_sizes`, `product_images` |
| AdminCastes | `castes`, `products` count | `castes` |
| AdminEpisodes | `episodes` | `episodes` |
| AdminOrders | `orders` with `order_items` (paged, `count: exact`) | `orders.status` |
| AdminHomepage | `homepage_content` (`draft`, `revision`) | `save_homepage` RPC |
