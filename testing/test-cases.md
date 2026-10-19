# Test cases

Format: [test-strategy.md §4](test-strategy.md#4-test-case-format). Test data assumptions: [test-strategy.md §5](test-strategy.md#5-test-environments-and-data). Automated statuses were recorded on 2026-10-19 with Node 26.5.0.

## PH-1 — Foundation and design system

### TC-001 — First visit shows the entry sequence and entering opens /home

- **Traces:** FR-001 · US-001 · AC-001.1 · PH-1
- **Type:** Manual browser
- **Priority:** P2
- **Preconditions:** `localStorage` key `gauddly_entered_at` is absent (fresh profile or cleared storage).
- **Test data:** None.
- **Steps:**
  1. Open `/`.
  2. Wait for the entry prompt to appear, then choose to enter.
- **Expected result:** The entry sequence renders with no site navigation or footer. After entering, the URL is `/home`, and `localStorage.gauddly_entered_at` holds a millisecond timestamp within a few seconds of now.
- **Automation:** None
- **Status:** Not run

### TC-002 — Returning visitor within 30 days skips the entry sequence

- **Traces:** FR-001 · US-001 · AC-001.2 · PH-1
- **Type:** Manual browser
- **Priority:** P3
- **Preconditions:** None.
- **Test data:** `gauddly_entered_at` = `Date.now() - 29 * 86400000`, and separately `Date.now() - 31 * 86400000`.
- **Steps:**
  1. Set `gauddly_entered_at` to the 29-day value and open `/`.
  2. Set it to the 31-day value and open `/`.
- **Expected result:** Step 1 lands on `/home` immediately, without showing the sequence. Step 2 shows the entry sequence.
- **Automation:** None
- **Status:** Not run

### TC-003 — Sound preference persists across reloads

- **Traces:** FR-002 · US-002 · AC-002.1 · PH-1
- **Type:** Manual browser
- **Priority:** P3
- **Preconditions:** `gauddly_entered_at` is absent. `gauddly_sound_enabled` is absent or `false`.
- **Test data:** None.
- **Steps:**
  1. Open `/`; the toggle reads "Sound: Off".
  2. Activate the toggle.
  3. Reload `/`.
- **Expected result:** After step 2 the toggle reads "Sound: On" and `localStorage.gauddly_sound_enabled` is `"true"`. After reload it still reads "Sound: On".
- **Automation:** None
- **Status:** Not run

### TC-048 — Route titles and robots directives

- **Traces:** NFR-001 · US-029 · AC-029.1 · PH-1
- **Type:** Manual browser
- **Priority:** P2
- **Preconditions:** App running.
- **Test data:** Paths `/store`, `/login`, `/forgot-password`, `/reset-password`, `/admin`.
- **Steps:**
  1. Open each path and read `document.title` and `meta[name="robots"]`.
- **Expected result:** `/store` has the title "Store — GAUDDLY" and robots `index, follow`. The three auth paths and `/admin` have robots `noindex, nofollow`. `/admin` has the title "Administration — GAUDDLY".
- **Automation:** None
- **Status:** Not run

### TC-051 — Keyboard and reduced-motion support

- **Traces:** NFR-003 · US-031 · AC-031.1 · PH-1
- **Type:** Manual browser
- **Priority:** P2
- **Preconditions:** App running at a viewport of 1100 px or narrower for the menu step.
- **Test data:** None.
- **Steps:**
  1. Open `/store` and activate "Menu", then press Escape.
  2. Open the cart ("Claims"), then press Escape.
  3. Open `/checkout` while signed in and inspect each input's accessible name.
  4. Enable the OS "reduce motion" setting and reload `/store` at desktop width.
- **Expected result:** Steps 1 and 2 close the overlay, and focus returns to its trigger. In step 3 every input has an accessible name: "Full name", "Email address", "Shipping address", "City, state, and postal code". In step 4 the native cursor is visible and no custom cursor element is rendered.
- **Automation:** None
- **Status:** Not run

### TC-052 — Concurrent cached requests run the fetcher once

- **Traces:** NFR-004 · US-032 · AC-032.1 · PH-1
- **Type:** Automated unit
- **Priority:** P2
- **Preconditions:** Node 20+.
- **Test data:** A fetcher that increments a counter.
- **Steps:**
  1. Call the cached loader twice concurrently, then once more.
- **Expected result:** All three calls resolve to `1`, and the fetcher ran once.
- **Automation:** `tests/request-cache.test.js` › "coalesces concurrent requests and caches successful results"
- **Status:** Passing (2026-10-19)

### TC-053 — Expired cache entries are fetched again

- **Traces:** NFR-004 · US-032 · AC-032.2 · PH-1
- **Type:** Automated unit
- **Priority:** P3
- **Preconditions:** Node 20+.
- **Test data:** TTL `0`.
- **Steps:**
  1. Call the loader twice in sequence.
- **Expected result:** The second call returns `2`.
- **Automation:** `tests/request-cache.test.js` › "expired results are fetched again"
- **Status:** Passing (2026-10-19)

### TC-054 — Hashed assets carry an immutable cache header

- **Traces:** NFR-004 · US-032 · AC-032.3 · PH-1
- **Type:** Manual inspection
- **Priority:** P3
- **Preconditions:** A Vercel deployment (preview or production).
- **Test data:** Any file name from `dist/assets/` of that build.
- **Steps:**
  1. Run `curl -sI https://<deployment>/assets/<file>`.
- **Expected result:** The response includes `cache-control: public, max-age=31536000, immutable`.
- **Automation:** None
- **Status:** Not run

## PH-2 — Accounts and authentication

### TC-022 — Signup validation and confirmation path

- **Traces:** FR-012 · US-012 · AC-012.1 · PH-2
- **Type:** Manual browser
- **Priority:** P1
- **Preconditions:** A non-production Supabase project with email confirmation enabled.
- **Test data:** Name "Test Customer". A new unique email. Passwords `12345` and `correct-horse`.
- **Steps:**
  1. Open `/signup?redirect=/store` and submit with password `12345`.
  2. Submit again with `correct-horse`.
- **Expected result:** In step 1 the browser blocks submission (minimum length 6) and no request is sent. In step 2 the page shows "Check your email." and "Confirm your address, then sign in." If confirmation is disabled in the project, the browser opens `/store` instead.
- **Automation:** None
- **Status:** Not run

### TC-023 — Wrong password shows the credential error

- **Traces:** FR-013 · US-013 · AC-013.1 · PH-2
- **Type:** Manual browser
- **Priority:** P1
- **Preconditions:** The test customer exists.
- **Test data:** The test customer's email with the password `wrong-password`.
- **Steps:**
  1. Open `/login`, enter the data and submit.
- **Expected result:** An alert reads "The email or password is incorrect. Please try again." The URL stays `/login`.
- **Automation:** None
- **Status:** Not run

### TC-024 — External redirect targets are ignored

- **Traces:** FR-013 · US-013 · AC-013.2 · PH-2
- **Type:** Manual browser
- **Priority:** P1
- **Preconditions:** The test customer exists and is signed out.
- **Test data:** `redirect` values `//evil.example`, `https://evil.example`, `javascript:alert(1)`.
- **Steps:**
  1. For each value, open `/login?redirect=<url-encoded value>` and sign in as the customer, then sign out.
- **Expected result:** Every sign-in lands on `/home` on the same origin.
- **Automation:** None (unit test planned in PH-8)
- **Status:** Not run

### TC-025 — Password recovery round trip

- **Traces:** FR-014 · US-014 · AC-014.1 · PH-2
- **Type:** Manual browser
- **Priority:** P2
- **Preconditions:** SMTP and redirect allowlist configured ([docs/authentication.md](../docs/authentication.md)). A designated test account.
- **Test data:** The test account email. New password `another-horse-2`.
- **Steps:**
  1. Open `/forgot-password`, submit the email.
  2. Open the emailed link, set the new password.
  3. Open `/reset-password` directly in a fresh private window.
- **Expected result:** Step 2 shows "Your new password is saved. Use it next time you sign in." Step 3 shows "Open the link in your reset email to continue…" with a "Request a new link →" action.
- **Automation:** None
- **Status:** Not run

### TC-026 — Account requires a session

- **Traces:** FR-015 · US-015 · AC-015.1 · PH-2
- **Type:** Manual browser
- **Priority:** P1
- **Preconditions:** Signed out.
- **Test data:** None.
- **Steps:**
  1. Open `/account`.
- **Expected result:** The URL becomes `/login?redirect=/account`.
- **Automation:** None
- **Status:** Not run

### TC-027 — Profile save, order history and sign-out

- **Traces:** FR-015 · US-015 · AC-015.2 · PH-2
- **Type:** Manual browser
- **Priority:** P2
- **Preconditions:** Signed in as a customer with at least two orders.
- **Test data:** Name "Test Customer Two", address "1 Test Lane", city "Delhi, DL, 110001", phone "9999999999".
- **Steps:**
  1. On `/account`, enter the data, choose "Save →" and reload.
  2. Compare order dates.
  3. Choose "Sign out →".
- **Expected result:** The button shows "Saved ✓", and the values persist after reload. Orders are listed newest first, each with its items. Signing out opens `/home`, and the navigation shows "Sign In".
- **Automation:** None
- **Status:** Not run

### TC-028 — Administrator lands on the dashboard after sign-in

- **Traces:** FR-016 · US-016 · AC-016.1 · PH-2
- **Type:** Manual browser
- **Priority:** P1
- **Preconditions:** A test administrator exists and is signed out.
- **Test data:** Login URLs `/login`, `/login?redirect=%2Fhome`, `/login?redirect=%2Fcheckout`.
- **Steps:**
  1. For each URL, sign in as the administrator, then sign out.
- **Expected result:** Every sign-in lands on `/admin` and shows the dashboard.
- **Automation:** None
- **Status:** Not run

### TC-029 — Administrator returns to the admin page that requested sign-in

- **Traces:** FR-016 · US-016 · AC-016.2 · PH-2
- **Type:** Manual browser
- **Priority:** P2
- **Preconditions:** The test administrator is signed out.
- **Test data:** `/admin/orders`.
- **Steps:**
  1. Open `/admin/orders`. This redirects to `/login?redirect=%2Fadmin%2Forders`.
  2. Sign in as the administrator.
- **Expected result:** The URL is `/admin/orders`, and the Orders screen is shown.
- **Automation:** None
- **Status:** Not run

### TC-030 — Admin entry points are visible to administrators only

- **Traces:** FR-016 · US-016 · AC-016.3 · PH-2
- **Type:** Manual browser
- **Priority:** P2
- **Preconditions:** Test administrator and test customer accounts exist.
- **Test data:** None.
- **Steps:**
  1. Sign in as the administrator and open `/store` at desktop width. Then open the mobile menu at 375 px width. Then open `/account`.
  2. Repeat as the customer.
- **Expected result:** For the administrator, "Admin" appears in the desktop nav and in the mobile menu, and "Admin dashboard →" appears on `/account`. Each one opens `/admin`. The customer sees none of them.
- **Automation:** None
- **Status:** Not run

## PH-3 — Catalog and storefront

### TC-010 — Store shows published products and filters by caste and size

- **Traces:** FR-005 · US-005 · AC-005.1 · PH-3
- **Type:** Manual browser
- **Priority:** P1
- **Preconditions:** Catalog test data as in the strategy §5.
- **Test data:** One caste; size `XL` out of stock on one product.
- **Steps:**
  1. Open `/store` and look for the unpublished product.
  2. Filter by the caste.
  3. Filter by size `XL`.
- **Expected result:** The unpublished product never appears. Step 2 shows only that caste's products. Step 3 hides the product whose `XL` is out of stock.
- **Automation:** None
- **Status:** Not run

### TC-011 — Store sorting and page reset

- **Traces:** FR-005 · US-005 · AC-005.2 · PH-3
- **Type:** Manual browser
- **Priority:** P2
- **Preconditions:** Enough published products for at least two pages.
- **Test data:** None.
- **Steps:**
  1. Go to page 2.
  2. Sort by price ascending, then price descending, then name.
- **Expected result:** Each sort reorders the grid correctly. The first sort change returns to page 1.
- **Automation:** None
- **Status:** Not run

### TC-012 — Caste room resolves with or without the "the-" prefix

- **Traces:** FR-006 · US-006 · AC-006.1 · PH-3
- **Type:** Manual browser
- **Priority:** P2
- **Preconditions:** A caste with ID `nimbus` and at least one published product.
- **Test data:** `/the-nimbus`, `/nimbus`.
- **Steps:**
  1. Open both paths.
- **Expected result:** Both show the same caste name in upper case, its hero image and passage, and only its published products.
- **Automation:** None
- **Status:** Not run

### TC-013 — Unknown caste slug shows the caste not-found message

- **Traces:** FR-006 · US-006 · AC-006.2 · PH-3
- **Type:** Manual browser
- **Priority:** P3
- **Preconditions:** None.
- **Test data:** `/no-such-caste`.
- **Steps:**
  1. Open the path.
- **Expected result:** The page shows "Caste room not found in the Sanctum."
- **Automation:** None
- **Status:** Not run

### TC-014 — Claim without a size is blocked

- **Traces:** FR-007 · US-007 · AC-007.1 · PH-3
- **Type:** Manual browser
- **Priority:** P1
- **Preconditions:** A published product with at least one size in stock. Cart empty.
- **Test data:** That product's URL.
- **Steps:**
  1. Open the product page and activate "Select a size to claim →".
- **Expected result:** "Choose your size to continue." appears. Focus moves to the first enabled size button. The cart stays empty.
- **Automation:** None
- **Status:** Not run

### TC-015 — Valid claim adds to cart; unavailable states

- **Traces:** FR-007 · US-007 · AC-007.2 · PH-3
- **Type:** Manual browser
- **Priority:** P1
- **Preconditions:** Product A has size `M` in stock and `L` out of stock. Product B has every size out of stock.
- **Test data:** Size `M`.
- **Steps:**
  1. On product A, select `M` and activate "Claim garment — M →".
  2. Try to select `L`.
  3. Open product B.
- **Expected result:** In step 1 the cart drawer opens with one line for product A, size M, quantity 1. In step 2 the `L` button is disabled. In step 3 the button reads "Currently unavailable".
- **Automation:** None
- **Status:** Not run

### TC-016 — Archive lists old-world pieces with archive links

- **Traces:** FR-008 · US-008 · AC-008.1 · PH-3
- **Type:** Manual browser
- **Priority:** P2
- **Preconditions:** At least one `old-world` product and one product of another caste.
- **Test data:** None.
- **Steps:**
  1. Open `/old-world` and inspect each piece link.
- **Expected result:** Only `old-world` products are listed. Every link has the form `/the-old-world/<id>`.
- **Automation:** None
- **Status:** Not run

## PH-4 — Cart, checkout and payments

### TC-017 — Cart merges, separates sizes, persists and removes

- **Traces:** FR-009 · US-009 · AC-009.1 · PH-4
- **Type:** Manual browser
- **Priority:** P1
- **Preconditions:** Product A with sizes `M` and `L` in stock. Cart empty.
- **Test data:** A/M twice, A/L once.
- **Steps:**
  1. Add A/M twice and A/L once.
  2. Reload the page and open the cart.
  3. Remove the A/L line.
- **Expected result:** After step 1 there are two lines: A/M with quantity 2, and A/L with quantity 1. Both survive the reload. Step 3 leaves only A/M with quantity 2.
- **Automation:** None
- **Status:** Not run

### TC-018 — Cart drawer keyboard behaviour

- **Traces:** FR-009 · US-009 · AC-009.2 · PH-4
- **Type:** Manual browser
- **Priority:** P2
- **Preconditions:** Cart has one item.
- **Test data:** None.
- **Steps:**
  1. Focus "Claims" and press Enter.
  2. Press Tab repeatedly past the last control, then Shift+Tab past the first.
  3. Press Escape.
- **Expected result:** Focus starts on the close button and cycles within the drawer. Escape closes the drawer, and focus returns to "Claims".
- **Automation:** None
- **Status:** Not run

### TC-019 — Checkout requires sign-in and returns afterwards

- **Traces:** FR-010 · US-010 · AC-010.1 · PH-4
- **Type:** Manual browser
- **Priority:** P1
- **Preconditions:** Signed out. The test customer exists and is not an admin.
- **Test data:** None.
- **Steps:**
  1. Open `/checkout`.
  2. Sign in as the customer.
- **Expected result:** Step 1 redirects to `/login?redirect=/checkout`. Step 2 returns to `/checkout`.
- **Automation:** None
- **Status:** Not run

### TC-020 — Order placement success and failure

- **Traces:** FR-010 · US-010 · AC-010.2 · PH-4
- **Type:** Manual browser
- **Priority:** P1
- **Preconditions:** Non-production project with `create-order` deployed. Signed in as the customer. Cart holds one in-stock item.
- **Test data:** Name "Test Customer", address "1 Test Lane", city "Delhi, DL, 110001".
- **Steps:**
  1. In DevTools, watch the `create-order` request. Submit "Confirm claim →".
  2. Add the item again. Make the function fail, for example by unpublishing the product. Submit again.
- **Expected result:** In step 1 the request body holds only `productId`, `size` and `quantity` per item, plus `shipping`. The page shows "Your claim has been received." and "Claim #" followed by 8 characters, and the cart is empty. In step 2 the function's error appears in a `role="alert"` element, and the cart still holds the item.
- **Automation:** None
- **Status:** Not run

### TC-021 — Orders become paid only on verified payment

- **Traces:** FR-011 · US-011 · AC-011.1 · PH-4
- **Type:** Manual browser
- **Priority:** P1
- **Preconditions:** A payment provider is integrated in its sandbox mode. Not implemented yet.
- **Test data:** The provider's sandbox success card and sandbox decline card.
- **Steps:**
  1. Check out and pay with the success card.
  2. Check out and pay with the decline card.
- **Expected result:** Order 1 is `paid` after the provider's confirmation, and no client-side call can set it. Order 2 is `failed`, and no dispatch alert counts it.
- **Automation:** None
- **Status:** Not implemented (expected to fail until PH-4)

## PH-5 — Story and engagement content

### TC-004 — Defaults have nine sections and are not mutated

- **Traces:** FR-003 · US-003 · AC-003.1 · PH-5
- **Type:** Automated unit
- **Priority:** P1
- **Preconditions:** Node 20+.
- **Test data:** `normalizeHome(null)`, and a mutated `freshHome()` copy.
- **Steps:**
  1. Run the unit test.
- **Expected result:** The result has 9 sections. A fresh copy still has the hero title "The Old World".
- **Automation:** `tests/homepage.test.js` › "missing configuration preserves all nine visible default sections"
- **Status:** Passing (2026-10-19)

### TC-005 — Saved order and hidden flags survive normalization

- **Traces:** FR-003 · US-003 · AC-003.2 · PH-5
- **Type:** Automated unit
- **Priority:** P1
- **Preconditions:** Node 20+.
- **Test data:** Sections `craft` (disabled), `hero` (titled "New"), a duplicate `craft`, and `unknown`.
- **Steps:**
  1. Run the unit test.
- **Expected result:** 9 sections. The first is `craft` with `enabled: false`, and the second is the hero titled "New".
- **Automation:** `tests/homepage.test.js` › "saved order and hidden sections survive normalization without duplicate sections"
- **Status:** Passing (2026-10-19)

### TC-006 — Unsafe media keys and links are rejected

- **Traces:** FR-003 · US-003 · AC-003.3 · PH-5
- **Type:** Automated unit
- **Priority:** P1
- **Preconditions:** Node 20+.
- **Test data:** `javascript:alert(1)`, `data:text/html,test`, `//outside.test/a`, `http://outside.test/a`, `homepage/a.webp`, `https://cdn.example/a.webp`, link `//outside.test`, link `/episodes`.
- **Steps:**
  1. Run the unit test.
- **Expected result:** The first four keys become `''`. The R2 key and the HTTPS URL pass unchanged. Link `//outside.test` becomes `/store`, and `/episodes` is kept.
- **Automation:** `tests/homepage.test.js` › "media keys and CTA destinations reject unsafe protocols"
- **Status:** Passing (2026-10-19)

### TC-007 — Featured and archive selection follows editorial order

- **Traces:** FR-003 · US-003 · AC-003.4 · PH-5
- **Type:** Automated unit
- **Priority:** P2
- **Preconditions:** Node 20+.
- **Test data:** Products `a` (nimbus) and `b` (old-world). IDs `['b', 'missing', 'a']`.
- **Steps:**
  1. Run the unit test.
- **Expected result:** The ordered selection is `['b', 'a']`. With no IDs and the archive flag set, the result is `['b']`.
- **Automation:** `tests/homepage.test.js` › "product selection preserves editorial order and excludes missing products"
- **Status:** Passing (2026-10-19)

### TC-008 — Failed catalog loads are not cached

- **Traces:** FR-004 · US-004 · AC-004.1 · PH-5
- **Type:** Automated unit
- **Priority:** P1
- **Preconditions:** Node 20+.
- **Test data:** A fetcher that rejects first, then returns `{ failed: true }`, then `{ failed: false }`.
- **Steps:**
  1. Run the unit test.
- **Expected result:** The first call rejects. The second returns `failed: true`, and the third returns `failed: false`. The fetcher ran three times.
- **Automation:** `tests/request-cache.test.js` › "does not cache partial failures or rejected requests"
- **Status:** Passing (2026-10-19)

### TC-009 — Homepage shows a retry alert when a catalog query fails

- **Traces:** FR-004 · US-004 · AC-004.2 · PH-5
- **Type:** Manual browser
- **Priority:** P2
- **Preconditions:** App running.
- **Test data:** DevTools request blocking on `*/rest/v1/products*`.
- **Steps:**
  1. Block the pattern and open `/home`.
  2. Unblock it and choose "Try again".
- **Expected result:** Step 1 shows an alert: "Some collections could not load." with a "Try again" button. Step 2 removes the alert and fills the product sections.
- **Automation:** None
- **Status:** Not run

### TC-031 — Codex chapter unlock persists

- **Traces:** FR-017 · US-017 · AC-017.1 · PH-5
- **Type:** Manual browser
- **Priority:** P3
- **Preconditions:** `gauddly_unlocked_chapters` is absent.
- **Test data:** None.
- **Steps:**
  1. Open `/codex` and note which chapters are sealed.
  2. Activate the unlock control for chapter 2 and wait for the animation to finish.
  3. Reload.
- **Expected result:** Initially only chapter 1 is readable. After the animation chapter 2 is readable, and `localStorage.gauddly_unlocked_chapters` contains `[1,2]`. Chapter 2 stays unlocked after reload.
- **Automation:** None
- **Status:** Not run

### TC-032 — Released episodes play; others do not

- **Traces:** FR-018 · US-018 · AC-018.1 · PH-5
- **Type:** Manual browser
- **Priority:** P2
- **Preconditions:** Episode test data as in strategy §5.
- **Test data:** None.
- **Steps:**
  1. Open `/episodes` and select the released episode.
  2. Use the play/pause and mute controls, then close.
  3. Select the awaiting episode.
- **Expected result:** Step 1 opens a player with the episode video. The controls toggle playback and sound. Step 3 opens no player.
- **Automation:** None
- **Status:** Not run

### TC-033 — Waitlist signup, duplicate and redirect

- **Traces:** FR-019 · US-019 · AC-019.1 · PH-5
- **Type:** Manual browser
- **Priority:** P2
- **Preconditions:** Non-production project. `existing@example.com` is already registered.
- **Test data:** `  New.Person@Example.com  `, then `existing@example.com`.
- **Steps:**
  1. Submit the first email on `/await` and wait 3 seconds.
  2. Submit the second email in the homepage waitlist section.
- **Expected result:** Step 1 stores `new.person@example.com`, shows the success state and opens `/home` after about 3 seconds. Step 2 shows "You are on the list. You will be told." and adds no new row.
- **Automation:** None
- **Status:** Not run

### TC-034 — Customer-care pages render their own content

- **Traces:** FR-020 · US-020 · AC-020.1 · PH-5
- **Type:** Manual browser
- **Priority:** P3
- **Preconditions:** App running.
- **Test data:** `/shipping`, `/returns`, `/privacy`, `/terms`, `/size-care`.
- **Steps:**
  1. Open each path.
- **Expected result:** Each shows distinct content. Titles are "Shipping — GAUDDLY", "Returns — GAUDDLY", "Privacy — GAUDDLY", "Terms — GAUDDLY" and "Size & Care — GAUDDLY". `/returns` includes "Made-to-order pieces".
- **Automation:** None
- **Status:** Not run

## PH-6 — Admin studio

### TC-035 — Signed-out admin access redirects with the path preserved

- **Traces:** FR-021 · US-021 · AC-021.1 · PH-6
- **Type:** Manual browser
- **Priority:** P1
- **Preconditions:** Signed out.
- **Test data:** `/admin/products`.
- **Steps:**
  1. Open the path.
- **Expected result:** The URL becomes `/login?redirect=%2Fadmin%2Fproducts`.
- **Automation:** None
- **Status:** Not run

### TC-036 — Non-admins are refused

- **Traces:** FR-021 · US-021 · AC-021.2 · PH-6
- **Type:** Manual browser
- **Priority:** P1
- **Preconditions:** Signed in as the customer.
- **Test data:** `/admin`.
- **Steps:**
  1. Open the path with network throttling set to "Slow 3G".
- **Expected result:** A blank page is shown while the check runs, then "Not authorized." The admin sidebar never appears.
- **Automation:** None
- **Status:** Not run

### TC-037 — Dashboard metrics follow the selected range

- **Traces:** FR-022 · US-022 · AC-022.1 · PH-6
- **Type:** Manual browser
- **Priority:** P2
- **Preconditions:** Signed in as admin. Non-production orders exist: one `paid` from 3 days ago, one `fulfilled` from 20 days ago, one `pending` from 3 days ago.
- **Test data:** Ranges 7, 30 and 90 days.
- **Steps:**
  1. Select each range and read "Paid revenue", "Average order" and "Awaiting dispatch".
- **Expected result:** The 7-day range counts only the `paid` order. The 30- and 90-day ranges count `paid` and `fulfilled`. The `pending` order is never counted. "Awaiting dispatch" is 1 for every range.
- **Automation:** None
- **Status:** Not run

### TC-038 — Top products CSV export

- **Traces:** FR-022 · US-022 · AC-022.2 · PH-6
- **Type:** Manual browser
- **Priority:** P3
- **Preconditions:** Signed in as admin. `top_products` returns at least one row.
- **Test data:** None.
- **Steps:**
  1. Choose "Export CSV".
- **Expected result:** `top-products.csv` downloads. It has a header row and one row per listed product in the form `"<name>",<sku>,<units>,<revenue>`.
- **Automation:** None
- **Status:** Not run

### TC-039 — New product gets four sizes; publish flag controls visibility

- **Traces:** FR-023 · US-023 · AC-023.1 · PH-6
- **Type:** Manual browser
- **Priority:** P1
- **Preconditions:** Non-production project. Signed in as admin.
- **Test data:** ID `test-piece`, name "Test Piece", price 1000, any caste.
- **Steps:**
  1. Create the product with "Published" unchecked and look for it on `/store`.
  2. Check "Published", save, and look again.
- **Expected result:** The product has sizes S, M, L and XL, all in stock. In step 1 it is absent from `/store`; after step 2 it appears.
- **Automation:** None
- **Status:** Not run

### TC-040 — Size stock toggle and image upload/removal

- **Traces:** FR-023 · US-023 · AC-023.2 · PH-6
- **Type:** Manual browser
- **Priority:** P2
- **Preconditions:** `test-piece` exists and is published. `admin-upload-url` is deployed.
- **Test data:** A small JPEG.
- **Steps:**
  1. Toggle size `L` out of stock and open the product page.
  2. Upload the JPEG, then remove it.
  3. Request the removed image URL.
- **Expected result:** In step 1 the `L` button is disabled on the product page. In step 2 the image appears, then disappears. Step 3 returns 404 from R2.
- **Automation:** None
- **Status:** Not run

### TC-041 — Caste deletion is blocked while products exist

- **Traces:** FR-024 · US-024 · AC-024.1 · PH-6
- **Type:** Manual browser
- **Priority:** P2
- **Preconditions:** Non-production project. A caste with one product and an empty caste.
- **Test data:** None.
- **Steps:**
  1. Delete the caste that has a product.
  2. Delete the empty caste and confirm.
- **Expected result:** Step 1 shows "This caste has 1 product(s). Reassign or delete them first." and deletes nothing. Step 2 removes the empty caste.
- **Automation:** None
- **Status:** Not run

### TC-042 — Episode defaults, status confirmation and upload feedback

- **Traces:** FR-025 · US-025 · AC-025.1 · PH-6
- **Type:** Manual browser
- **Priority:** P2
- **Preconditions:** Non-production project. Signed in as admin.
- **Test data:** ID `test-episode`, title "Test Episode", a short MP4.
- **Steps:**
  1. Choose new episode and read the status field.
  2. Save, then change the status to `released`.
  3. Upload the MP4 as the video.
- **Expected result:** The status defaults to `awaiting`. Step 2 asks 'Change "Test Episode" release state to "released"?' before saving. Step 3 shows a progress bar, then the toast "Video uploaded."
- **Automation:** None
- **Status:** Not run

### TC-043 — Order filtering, debounced search and paging

- **Traces:** FR-026 · US-026 · AC-026.1 · PH-6
- **Type:** Manual browser
- **Priority:** P2
- **Preconditions:** Signed in as admin. More than 10 orders exist.
- **Test data:** Status `paid`. The search term is part of a known customer's email.
- **Steps:**
  1. Watch the network tab, filter by `paid`, then type the search term quickly.
  2. Clear the filters and page through.
- **Expected result:** Only matching orders are shown. One orders request fires about 300 ms after typing stops, not one per keystroke. Each page shows at most 10 orders.
- **Automation:** None
- **Status:** Not run

### TC-044 — Order status change requires confirmation and persists

- **Traces:** FR-026 · US-026 · AC-026.2 · PH-6
- **Type:** Manual browser
- **Priority:** P1
- **Preconditions:** Non-production project. A `pending` order.
- **Test data:** New status `cancelled`.
- **Steps:**
  1. Change the order's status to `cancelled`, confirm, and reload.
- **Expected result:** The prompt reads 'Mark order #GDLY-XXXX as "cancelled"?', where XXXX is the first 4 characters of the ID in upper case. After reload the status is `cancelled`.
- **Automation:** None
- **Status:** Not run

### TC-045 — Homepage save/publish permissions and revision check

- **Traces:** FR-027 · US-027 · AC-027.1 · PH-6
- **Type:** Automated SQL
- **Priority:** P1
- **Preconditions:** A database URL for a project with the homepage migration applied and at least one admin profile.
- **Test data:** The sample document inside the script.
- **Steps:**
  1. Run `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/homepage-permissions.sql`.
- **Expected result:** It prints "PASS: admin save/publish, draft isolation, anonymous access and stale revision protection" and rolls back without changing data.
- **Automation:** `tests/homepage-permissions.sql`
- **Status:** Not run

### TC-046 — Homepage preview disables navigation and signup

- **Traces:** FR-027 · US-027 · AC-027.2 · PH-6
- **Type:** Manual browser
- **Priority:** P2
- **Preconditions:** Signed in as admin.
- **Test data:** Change the hero title to "Preview Check".
- **Steps:**
  1. On `/admin/homepage`, edit the title and choose "Preview".
  2. Try the waitlist button and any section link.
- **Expected result:** The preview shows "Preview Check". The waitlist area reads "Preview — signup is disabled.", and links do not navigate. `/home` in another tab still shows the published title.
- **Automation:** None
- **Status:** Not run

### TC-047 — Upload keys are sanitized; non-admins cannot get upload URLs

- **Traces:** FR-028 · US-028 · AC-028.1 · PH-6
- **Type:** Manual browser
- **Priority:** P1
- **Preconditions:** `admin-upload-url` deployed. Admin and customer accounts exist.
- **Test data:** File `My Photo (1).jpg`.
- **Steps:**
  1. As admin, upload the file as a product image and inspect the stored `r2_key`.
  2. As the customer, run `supabase.functions.invoke('admin-upload-url', { body: { key: 'x.jpg', method: 'PUT' } })` in the console.
- **Expected result:** In step 1 the key ends in `My-Photo-1-.jpg`. Step 2 returns an error and no URL.
- **Automation:** None
- **Status:** Not run

## PH-7 — Data layer reproducibility and security hardening

### TC-049 — Built bundle contains no server secrets

- **Traces:** NFR-002 · US-030 · AC-030.1 · PH-7
- **Type:** Manual inspection
- **Priority:** P1
- **Preconditions:** `npm run build` completed with production environment variables.
- **Test data:** The values of `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` and the Supabase service-role key, held locally and not written to any file.
- **Steps:**
  1. Run `grep -rF "<value>" dist/` for each value.
  2. Run `grep -rE "R2_SECRET|service_role" src/ dist/`.
- **Expected result:** No matches.
- **Automation:** None
- **Status:** Not run

### TC-050 — Customers read only their own orders

- **Traces:** NFR-002 · US-030 · AC-030.2 · PH-7
- **Type:** Manual browser
- **Priority:** P1
- **Preconditions:** Two customer accounts, each with at least one order.
- **Test data:** None.
- **Steps:**
  1. Sign in as customer A and run `await supabase.from('orders').select('id')` in the console.
  2. Try `await supabase.from('orders').update({ status: 'paid' }).eq('id', '<A order id>')`.
  3. Try `await supabase.from('profiles').update({ is_admin: true }).eq('id', '<A user id>')`.
- **Expected result:** Step 1 returns only A's orders. Steps 2 and 3 change no rows (an error, or zero rows affected).
- **Automation:** None
- **Status:** Not run

### TC-055 — Backend reproducible from the repository

- **Traces:** NFR-005 · US-033 · AC-033.1 · PH-7
- **Type:** Manual inspection
- **Priority:** P1
- **Preconditions:** An empty Supabase project or branch. All migrations and functions committed. Not implemented yet.
- **Test data:** None.
- **Steps:**
  1. Run `supabase db push` and `supabase functions deploy` from the repo.
  2. Compare the created objects with the inventory table.
- **Expected result:** Every table, view, RPC and Edge Function in the inventory exists, with RLS enabled on every table.
- **Automation:** None
- **Status:** Not implemented (expected to fail until PH-7)

## PH-8 — Quality gates, CI and launch readiness

### TC-056 — Lint, unit tests and build pass

- **Traces:** NFR-006 · US-034 · AC-034.1 · PH-8
- **Type:** Automated unit
- **Priority:** P1
- **Preconditions:** `npm ci` completed. Node 20+.
- **Test data:** None.
- **Steps:**
  1. Run `npm run lint`.
  2. Run `node --test tests/*.test.js`.
  3. Run `npm run build`.
- **Expected result:** All three exit with code 0. The unit tests report 7 passed and 0 failed.
- **Automation:** The commands themselves
- **Status:** Passing (2026-10-19)

### TC-057 — CI enforces the quality gates

- **Traces:** NFR-006 · US-034 · AC-034.2 · PH-8
- **Type:** Manual inspection
- **Priority:** P2
- **Preconditions:** A CI workflow exists. Not implemented yet.
- **Test data:** A branch with a deliberate lint error.
- **Steps:**
  1. Push the branch and open a pull request.
- **Expected result:** CI runs lint, unit tests and build, fails on the lint step, and blocks the merge.
- **Automation:** None
- **Status:** Not implemented (expected to fail until PH-8)
