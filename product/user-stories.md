# User stories and acceptance criteria

Each story maps to exactly one requirement. Acceptance criteria are numbered `AC-<story>.<n>`, and each one is verified by the test case named in brackets. See [testing/test-cases.md](../testing/test-cases.md).

## FEAT-01 — Entry sequence

**US-001** (FR-001): As a first-time visitor, I want an entry moment before the store, so that I arrive inside the brand world. On later visits I want to skip it.
- AC-001.1: A visitor with no `gauddly_entered_at` value opens `/` and sees the entry sequence. Choosing to enter stores the timestamp and opens `/home`. [TC-001]
- AC-001.2: A visitor whose `gauddly_entered_at` is less than 30 days old is redirected from `/` to `/home` without seeing the sequence. [TC-002]

**US-002** (FR-002): As a visitor, I want to turn the ambient sound on or off and have that remembered.
- AC-002.1: Toggling "Sound: On" or "Sound: Off" stores `gauddly_sound_enabled`, and the label shows the stored value after a reload. [TC-003]

## FEAT-02 — Editorial homepage

**US-003** (FR-003): As a visitor, I want a complete, safe homepage even before the team publishes custom content.
- AC-003.1: With no published document, the homepage has all nine default sections, and editing a returned copy does not mutate the defaults. [TC-004]
- AC-003.2: A saved document keeps its order and hidden flags. Duplicate and unknown section IDs are dropped, and missing defaults are appended. [TC-005]
- AC-003.3: Media keys using `javascript:`, `data:`, protocol-relative or `http:` URLs become empty, and unsafe CTA links fall back to `/store`. [TC-006]
- AC-003.4: Featured and archive product lists follow the editorial ID order and skip missing products. With no IDs set, they fall back to the first 3 current pieces or the first 4 archive pieces. [TC-007]

**US-004** (FR-004): As a visitor on a flaky connection, I want to retry a partially failed homepage instead of seeing a broken page.
- AC-004.1: A failed or partially failed catalog load is never cached, so the next request fetches again. [TC-008]
- AC-004.2: When a catalog query fails, an alert reading "Some collections could not load." appears with a "Try again" button that reloads the catalog. [TC-009]

## FEAT-03 — Catalog and storefront

**US-005** (FR-005): As a shopper, I want to narrow the store by caste, size and price order, so that I find a garment that fits.
- AC-005.1: Only published products appear. Filtering by caste shows only that caste's products. Filtering by size shows only products where that size is in stock. [TC-010]
- AC-005.2: Sorting by price (ascending or descending) or by name reorders the list. Changing any filter or sort returns to page 1. [TC-011]

**US-006** (FR-006): As a shopper, I want each caste's room to show its story and garments.
- AC-006.1: `/the-nimbus` and `/nimbus` show the same caste's hero image, passage and published products. [TC-012]
- AC-006.2: A slug that matches no caste shows "Caste room not found in the Sanctum." [TC-013]

**US-007** (FR-007): As a shopper, I want the product page to stop me adding a garment without a size.
- AC-007.1: Activating the claim button with no size selected adds nothing to the cart, shows "Choose your size to continue." and moves focus to the first enabled size. [TC-014]
- AC-007.2: After an in-stock size is selected, claiming adds one item with that size and opens the cart drawer. Out-of-stock sizes are disabled. If no size is in stock, the button reads "Currently unavailable". [TC-015]

**US-008** (FR-008): As a collector, I want to browse the archive of the first collection.
- AC-008.1: `/old-world` lists only `old-world` products, and each links to `/the-old-world/<id>`. [TC-016]

## FEAT-04 — Cart, checkout and payments

**US-009** (FR-009): As a shopper, I want my cart to survive reloads and behave predictably.
- AC-009.1: Adding the same product and size twice gives one line with quantity 2. Adding another size gives a second line. Lines survive a reload, and removing a line deletes only that product and size. [TC-017]
- AC-009.2: The open drawer closes on Escape and keeps Tab focus inside itself. Focus returns to the element that opened it. [TC-018]

**US-010** (FR-010): As a customer, I want to place an order for my cart and receive a claim number.
- AC-010.1: A signed-out visitor opening `/checkout` is sent to `/login?redirect=/checkout`. After signing in as a customer, they return to `/checkout`. [TC-019]
- AC-010.2: Submitting sends only `productId`, `size` and `quantity` per item, plus the shipping fields, to `create-order`. Success shows "Claim #" followed by the first 8 characters of the order ID and empties the cart. Failure shows the function's error in a `role="alert"` element and keeps the cart. [TC-020]

**US-011** (FR-011): As the business, I want orders marked paid only after a real payment, so that we never make garments for unpaid claims.
- AC-011.1: An order reaches `paid` only through a verified payment-provider confirmation, and a declined payment leaves it `failed`. [TC-021]

## FEAT-05 — Accounts and authentication

**US-012** (FR-012): As a visitor, I want to create an account to claim garments and track orders.
- AC-012.1: The browser blocks submission of a password shorter than 6 characters. When signup returns a session, the user goes to the redirect target. Without a session, the page shows "Check your email." [TC-022]

**US-013** (FR-013): As a returning customer, I want to sign in safely and land where I was going.
- AC-013.1: A wrong password shows "The email or password is incorrect. Please try again." [TC-023]
- AC-013.2: A `redirect` value of `//evil.example`, `https://evil.example` or `javascript:alert(1)` is ignored, and a customer lands on `/home`. [TC-024]

**US-014** (FR-014): As a customer who forgot my password, I want to reset it from my email.
- AC-014.1: Submitting an email on `/forgot-password` sends a recovery email. Opening its link lets the user save a new password. An invalid or expired link shows a "Request a new link" action. [TC-025]

**US-015** (FR-015): As a customer, I want to manage my details and see my past claims.
- AC-015.1: A signed-out visitor opening `/account` is redirected to `/login?redirect=/account`. [TC-026]
- AC-015.2: A saved name and address persist after reload. Orders are listed newest first with their items. "Sign out" ends the session and opens `/home`. [TC-027]

**US-016** (FR-016): As an administrator, I want sign-in to take me to the studio and the studio to be one click away from anywhere on the site.
- AC-016.1: An administrator who signs in with no redirect, or with a non-admin redirect such as `/home` or `/checkout`, lands on `/admin`. [TC-028]
- AC-016.2: An administrator who signs in with `redirect=/admin/orders` lands on `/admin/orders`. [TC-029]
- AC-016.3: A signed-in administrator sees "Admin" in the desktop navigation and the mobile menu, and "Admin dashboard →" on `/account`. A signed-in customer sees none of them. [TC-030]

## FEAT-06 — Story and engagement content

**US-017** (FR-017): As a reader, I want to unlock Codex chapters as I explore.
- AC-017.1: On a fresh browser only chapter 1 is open. Unlocking chapter 2 plays the unlock animation and keeps it open after a reload. [TC-031]

**US-018** (FR-018): As a viewer, I want to watch released films in the page.
- AC-018.1: Selecting a released episode with a video opens the player with play/pause and mute controls. Selecting an unreleased episode does not open a player. [TC-032]

**US-019** (FR-019): As an interested visitor, I want to be told when new garments and films arrive.
- AC-019.1: A new email is saved trimmed and lowercased. Submitting an already-registered email also shows success. Any other database error shows a retry message. `/await` opens `/home` 3 seconds after success. [TC-033]

**US-020** (FR-020): As a customer, I want clear shipping, returns, privacy, terms and size-care information.
- AC-020.1: Each of the five paths shows its own heading and content, and the page title matches the path. [TC-034]

## FEAT-07 — Admin studio

**US-021** (FR-021): As the business, I want the studio closed to everyone but administrators.
- AC-021.1: A signed-out visitor opening `/admin/products` is sent to `/login?redirect=%2Fadmin%2Fproducts`. [TC-035]
- AC-021.2: A signed-in non-admin sees "Not authorized." The studio is not rendered while the admin check is pending. [TC-036]

**US-022** (FR-022): As an administrator, I want a quick read of sales.
- AC-022.1: Switching between 7, 30 and 90 days recalculates paid revenue, order count, average order and the chart, counting only `paid` and `fulfilled` orders. "Awaiting dispatch" counts `paid` orders. [TC-037]
- AC-022.2: "Export CSV" downloads `top-products.csv` with one row per top product. [TC-038]

**US-023** (FR-023): As an administrator, I want to manage the catalog without a developer.
- AC-023.1: Creating a product creates sizes S, M, L and XL, all in stock. The product appears on `/store` only while "Published" is checked. [TC-039]
- AC-023.2: After Save, a size switched to sold out is disabled on the product page, an uploaded photo appears, and a removed photo is gone from the page and from storage. [TC-040]
- AC-023.3: Craft notes are edited as headed lines and saved as the text the product page already splits, so existing garments display unchanged. [TC-071]

**US-024** (FR-024): As an administrator, I want caste deletion to protect existing products.
- AC-024.1: Deleting a caste that has products is refused with "This caste has N product(s). Reassign or delete them first." An empty caste is deleted after confirmation. [TC-041]

**US-025** (FR-025): As an administrator, I want to schedule and release films.
- AC-025.1: A new episode defaults to `awaiting`. A status change asks for confirmation first. A video upload shows a progress bar and reports success or failure in a toast. [TC-042]

**US-026** (FR-026): As an administrator, I want to find and progress orders.
- AC-026.1: The status filter and search narrow the list. Search waits 300 ms after typing stops. Lists show 10 orders per page. [TC-043]
- AC-026.2: Changing an order's status asks "Mark order #GDLY-XXXX as "<status>"?", and the change persists after reload. [TC-044]

**US-027** (FR-027): As an administrator, I want to stage homepage changes safely.
- AC-027.1: Only administrators can save. A draft save does not change public content, publishing does, and a save with a stale revision is rejected. [TC-045]
- AC-027.2: The preview shows the draft with links paused and the email sign-up disabled, while `/home` keeps the published version. [TC-046]

**US-028** (FR-028): As an administrator, I want uploads that don't fail on awkward filenames and can't be abused by others.
- AC-028.1: Uploading `My Photo (1).jpg` stores a key ending in `My-Photo-1-.jpg`. A non-admin call to `admin-upload-url` is rejected. [TC-047]

**US-035** (FR-029): As an administrator, I want to see exactly how my edits will look on the real homepage while I make them.
- AC-035.1: Typing in a field updates the preview, and the edited element is outlined with an "Editing: <field>" tag. [TC-058]
- AC-035.2: Clicking an element in the preview opens its tab and focuses its field, and does not follow the link. [TC-059]
- AC-035.3: The Phone switch shows the homepage in a 390 px window with the site's phone layout. [TC-060]

**US-036** (FR-030): As an administrator, I want to know what I am about to publish and what might be wrong with it.
- AC-036.1: The review lists hidden sections, text changes, media changes and order changes since the last publication. [TC-061]
- AC-036.2: An unsafe button link or media address blocks saving and points to the field. Other problems are listed as worth checking without blocking. [TC-062]
- AC-036.3: "Publish now" makes the draft live and shows "Published. The homepage is now live." If another admin saved first, a banner offers "Load their version" or "Replace theirs with mine". [TC-063]

**US-037** (FR-031): As an administrator, I want arranging and fixing the page to be quick and reversible.
- AC-037.1: Dragging a section, or pressing Alt + ↑/↓ on it, moves it, without changing the other sections. [TC-064]
- AC-037.2: Undo steps back through edits; a run of typing in one field undoes in one step. [TC-065]
- AC-037.3: Moving the focus point changes which part of the image a phone shows, and the outline marks that area. [TC-066]

**US-038** (FR-032): As an administrator, I want to find garments and see at a glance which ones have problems.
- AC-038.1: Search and the filters narrow the list, and "Needs attention" counts and lists every garment with a missing photo, no price or nothing in stock. [TC-067]
- AC-038.2: Bulk publish publishes only garments that meet the requirements and says how many were skipped. [TC-068]
- AC-038.3: The list reports "No photo", "Photo missing", "No price" and "Nothing in stock" correctly. [TC-075]

**US-039** (FR-033): As an administrator, I want to see the real product page while I edit, and never lose or half-save work by accident.
- AC-039.1: Unsaved edits appear in the preview, and its links and Claim do nothing. [TC-069]
- AC-039.2: An untouched garment reads "All changes saved"; edits read "Unsaved changes"; Discard restores the saved version and removes unsaved uploads. [TC-070]
- AC-039.3: The preview and the store draw the same data the same way. [TC-076]
- AC-039.4: A new garment's page address is generated from its name. [TC-077]
- AC-039.5: When a later write fails while creating a garment, the garment stays a draft and the editor reopens it at its own address. [TC-088]

**US-040** (FR-034): As the business, I want no garment published without a photo, a price or a size.
- AC-040.1: The requirements block publishing; stock and description only warn. [TC-072]
- AC-040.2: Turning on Published is refused with a list of what is missing. [TC-073]

**US-041** (FR-035): As an administrator, I want deleting to be deliberate and complete.
- AC-041.1: Deleting needs the exact name and removes the garment, its rows and its files; past orders still show the item's name and price. [TC-074]

## FEAT-08 — Platform quality

**US-029** (NFR-001): As the business, I want correct search and share metadata, with private pages hidden from search engines.
- AC-029.1: The title on `/store` is "Store — GAUDDLY". The robots meta tag is `noindex, nofollow` on `/login`, `/forgot-password`, `/reset-password` and `/admin`, and `index, follow` on `/store`. [TC-048]

**US-030** (NFR-002): As the business, I want secrets and customer data protected.
- AC-030.1: The production bundle contains no R2 access key, R2 secret or Supabase service-role key. [TC-049]
- AC-030.2: A customer reading `orders` through the anon key receives only their own orders. [TC-050]

**US-031** (NFR-003): As a keyboard or reduced-motion user, I want to use the site comfortably.
- AC-031.1: The mobile menu and cart close on Escape, every checkout field has a label, and the custom cursor is absent when reduced motion is preferred. [TC-051]

**US-032** (NFR-004): As a visitor, I want pages to load without redundant work.
- AC-032.1: Concurrent calls to the same cached request run the fetcher once, and the result is reused until its TTL expires. [TC-052]
- AC-032.2: An expired cached result is fetched again. [TC-053]
- AC-032.3: Files under `/assets/` are served with `Cache-Control: public, max-age=31536000, immutable`. [TC-054]

**US-033** (NFR-005): As a developer, I want to build a working backend from the repository alone.
- AC-033.1: Applying the repository's migrations and deploying its functions to an empty Supabase project creates every object listed in [docs/repo-inventory.md](../docs/repo-inventory.md#4-data-access-used-by-the-frontend). [TC-055]

**US-034** (NFR-006): As a developer, I want automated gates that stop broken changes.
- AC-034.1: `npm run lint`, `node --test tests/*.test.js` and `npm run build` all pass on the current tree. [TC-056]
- AC-034.2: A CI workflow runs those three commands on every push and pull request and blocks merging on failure. [TC-057]

**US-042** (NFR-007): As the business, I want public sign-up and order endpoints protected from scripted abuse.
- AC-042.1: A sixth waitlist signup from the same IP within an hour is refused with "Too many sign-ups. Please try again later.", while a signup from another IP still succeeds. [TC-078]
- AC-042.2: A waitlist email that is not of the form `name@domain.tld`, or is longer than 254 characters, is refused. [TC-079]
- AC-042.3: A sixth `pending` order for the same customer within 10 minutes is refused with "Too many orders in a short time. Please wait a few minutes and try again." [TC-080]
- AC-042.4: The `anon` role cannot read `waitlist_attempts` and cannot truncate `waitlist_signups`. [TC-081]
- AC-042.5: The Supabase Auth rate limits for the production project match the values in [operations/deployment.md](../operations/deployment.md#supabase-auth-configuration). [TC-082]

**US-043** (NFR-008): As a visitor, I want the storefront to load from a shared cache yet always show the current catalog.
- AC-043.1: A second request for the same `/api/*` route is served from Redis (`X-Cache: HIT`) without querying Supabase. [TC-083]
- AC-043.2: After `catalog:version` is incremented, the next request for a cached route is a miss and reads Supabase again. [TC-084]
- AC-043.3: After an administrator saves a garment, the change is visible on its public product page on the next load. [TC-085]
- AC-043.4: Routes outside the allow-list, malformed IDs and IDs over 100 characters return 404 without querying Supabase, and IDs with no matching row are not cached. [TC-086]
- AC-043.5: When Redis is unreachable or not configured, `/api/*` still returns the Supabase result; a Supabase failure returns 502 and is not cached. [TC-087]
