# Homepage content studio

Open `/admin/homepage` while signed in as an administrator. Choose a section, edit copy or media, select featured products and a released film, and move sections with the arrow buttons. The visibility checkbox hides a section without removing its configuration.

**Save draft** persists changes without affecting visitors. **Preview** renders the same homepage components with the current draft; navigation and email signup are disabled in preview. **Publish** saves and publishes the entire document atomically. Concurrent edits are protected by a revision check: reload if another administrator saved first.

Images support a desktop source, optional mobile replacement, alt text and horizontal/vertical crop. The hero also supports desktop/mobile videos and a poster. Other video playback requires a click. Reduced-motion and data-saving visitors receive still imagery. Image uploads accept JPEG, PNG, WebP or AVIF up to 15 MB; video uploads accept MP4 or WebM up to 100 MB. Replacements use new R2 keys; clearing an asset does not delete the original file.

Existing catalog imagery provides fallbacks. Supply genuine workshop photography for the craft section; the initial fallback is catalog photography. Product names, prices and destinations come from published products. The existing global footer remains shared across the site.

## Database

Apply `supabase/migrations/202610150001_homepage.sql` to the same project used by `VITE_SUPABASE_URL`. The implementation uses one `homepage_content` document instead of separate media/section tables so copy, ordering and media publish together in one transaction.

The table is readable only by administrators. `get_homepage()` exposes only published content; `save_homepage()` checks `profiles.is_admin` and the expected revision. The public page uses the default layout until the first publication. The editor reports setup errors and never claims a failed save succeeded.

R2 uploads reuse `admin-upload-url`, which must allow authorized administrators to upload keys under `homepage/`. No R2 secret belongs in the frontend. Frontend code deployment and content publication are separate operations.

## Verification

Run `node --test tests/homepage.test.js`, `npm run lint`, and `npm run build`. For a manual smoke test, check `/home` at desktop and mobile widths, confirm product links and film playback, then save a draft and verify public content stays unchanged until publishing.
