# Gauddly product detail redesign

Date: 15 October 2026. Route: `/the-faithful/dust-robe`.

## Direction

Keep the dark editorial identity, cathedral imagery, bone-white palette and expressive serif headings. Make product understanding, fit confidence and purchasing the first visual priorities. Follow them with the brand story.

Deliverables: [desktop concept](desktop-concept.png), [mobile concept](mobile-concept.png), and [generation prompts](prompts.md). These are AI-generated visual proposals, not implemented screens. No application code or catalog data was changed. Photography was supplied as reference; generated garment details must not replace accurate catalog photos. The desktop image has a generated text error: “Wade to order” should read “Made to order”. The specification here is authoritative.

## Evidence and limitations

Reviewed `src/pages/PieceDetail.jsx`, global styles, navigation, customer-care pages and the read-only catalog entry. A live browser connection was unavailable, so this is a source-and-assets review, not a rendered-page usability test.

- The route resolves to **Boner Flared Denim**, priced at **₹12,000**, with six images and S, M, L, XL sizes. It is not currently a robe.
- Price and the underlined “Claim garment” action follow the passage, full craft description and size selector. The same passage and craft text appear again in large subsequent sections.
- The first available size is selected automatically; the returned ordering was L, XL, M, S.
- Images all have `sort_order: 0`, making the intended sequence ambiguous. Their alt text still says `dust-robe`.
- Supporting images are far below the buying area and resize rows and columns on hover. There is no product-image zoom in this component.
- Mobile places a 50vh image before all product details and has no persistent purchase action.
- Customer-care links exist, but the size guide is generic and lacks garment-specific measurements.
- The product says “Delivered in 14–21 days”, while the assurance and shipping page say dispatch after 14–21 days. Product craft text says no returns/replacements/exchange, while the returns page describes exceptions. These need one approved source of truth.

## Priority 1 — Product and purchase panel

Desktop: use approximately 58% gallery and 42% information, with 48–64px outer margins on large screens and a 40–56px gutter. Keep purchase information within about 480px width. Reflow by content fit on tablets rather than squeezing the columns. Keep the header clear of content.

Order the information: collection and piece number → name → price → one-line description → colour → size selector and guide → primary action → dispatch and returns information → detail accordions.

Use a high-contrast, full-width, 52–56px-tall bone button labeled “Add to bag”. If retaining “Claim garment” is essential to brand voice, retain the wording but use the same unmistakable button treatment. Make the global cart label consistent with the chosen action.

Sort sizes S, M, L, XL. Start with none selected; the M selection in the concepts illustrates a user-selected state. Present unavailable sizes disabled and labeled, rather than hiding them. When a user activates the action without choosing a size, focus the selector and show a short inline instruction. After adding, preserve the existing cart drawer confirmation and announce the update accessibly.

Move the size guide beside the selector. Open it in an accessible dialog or mobile sheet without losing page position. Add verified garment waist, hip, rise, inseam and outseam measurements, cm/in conversion and measurement instructions. Do not invent dimensions or model measurements.

## Priority 2 — Gallery and mobile

Put front, back, construction detail and fit images directly beside the buying panel. Assign a unique deliberate image order. Use a stable main frame, thumbnail buttons, image counter and zoom with keyboard navigation, Escape and focus restoration. Avoid animated grid resizing while shoppers inspect details.

Retain the cinematic photo as the lead but show the garment at a useful scale. Use actual detail photographs for stitching, appliqué and hardware. Protect the full silhouette and hems when cropping. Keep any product video optional, provide a poster and pause control, and respect reduced-motion preferences.

Mobile: use a swipeable gallery with visible navigation and approximately 4:5 imagery where the real crop permits it. Follow with title, price, short description and buying controls. Keep a bottom action bar: “Select size” before selection, then price/size and “Add to bag”. Selecting size from the bar reveals and focuses the selector. Account for safe-area insets and reserve bottom padding so the bar covers no content. Hide it while a cart or modal is open.

## Priority 3 — Content and visual system

Replace the duplicated full-height passage with one concise editorial section after the commerce area. Suggested order: product and purchase → construction details → one brand-story moment → return to The Faithful collection.

Split the craft blob into Details & construction, Fit & measurements, and Care & delivery. Preserve verified information: unisex, wide-leg baggy fit, white denim, branded rivets/buttons, dry clean only, steam ironing, made in India. Link the approved returns policy near the action.

Use the existing Cormorant-style display typography for titles, with approximately 52–64px desktop and 34–40px mobile headings. Use readable 15–16px body text and 13–14px controls; a restrained sans-serif for commerce controls is proposed in the concepts. Keep muted text legible against black, visible focus rings, and touch targets at least 44px. Reserve motion for subtle feedback.

Resolve the old slug and alt text deliberately. If changing the URL to the product name, preserve the old link with a redirect and update canonical metadata and internal links. Do not silently rename the catalog primary key, which may be referenced elsewhere.

## Implementation order and acceptance

1. Confirm product identity, image order, sizing data and consistent policy wording.
2. Build the responsive gallery and purchase hierarchy, including explicit size selection.
3. Add the size guide, mobile action bar and concise supporting content.
4. Verify 360px, 390px, 768px, 1024px and 1440px layouts, keyboard operation, zoom/dialog focus, reduced motion, sold-out and loading/error states, and correct product/size/price in the cart. Check a short desktop viewport as well as a large one.

Success means a shopper can identify the garment and price, inspect front/back/detail, understand sizing and dispatch, and add the intended size without searching through repeated editorial sections. Any conversion improvement remains a hypothesis until measured.

Research support: Baymard's [apparel UX research](https://baymard.com/industries/apparel-ux) supports model imagery and clear size-selection controls. Its [sizing guidance](https://baymard.com/research-articles/apparel-size-information) supports relevant measurement information and a discoverable size guide. The layout and brand treatment above are design recommendations for this project.
