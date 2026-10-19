# Homepage content studio

Open `/admin/homepage` while signed in as an administrator. The editor has three columns: the page's sections, the form for the chosen section, and a live preview. On narrower screens the form and preview are switched with **Edit** and **Preview** tabs.

- **Sections.** Each row shows a one-line summary, or its first problem in amber. Drag a row, or press Alt + ↑/↓ on it, to reorder. The eye button hides a section without removing its configuration.
- **Form.** Fields are grouped into tabs (Words, Images & film, Garments, Caste rooms, Film, Button), and only the tabs a section uses are shown. Counters show suggested lengths. "Button opens" picks a page from the site, or "Another page…" for a custom address. Problems for the section are listed under its name and link to the field.
- **Preview.** The draft is drawn by the real homepage at a 1440 px desktop or 390 px phone window, scaled to fit. The field being edited is outlined; clicking anything in the preview opens its field; links and sign-up are paused. The button beside Desktop/Phone opens the preview full size in a new tab. The preview page, `/admin/homepage/preview`, only shows content sent to it by an open editor.
- **Undo** steps back through this session's edits; typing in one field undoes in one step. **Discard changes** returns to the last saved draft.

**Save draft** persists changes without affecting visitors. **Review & publish** lists every change since the last publication and anything worth checking, then **Publish now** saves and publishes the entire document atomically. Unsafe links or media addresses block saving. Concurrent edits are protected by a revision check: if another administrator saved first, choose **Load their version** or **Replace theirs with mine**.

Images support a desktop source, optional phone replacement, alt text and a focus point: click the image to choose what stays in view when it is cropped, or move the marker with the arrow keys. For the hero and featured image, an outline shows what a phone will show. The hero also supports desktop/mobile videos and a poster. Other video playback requires a click. Reduced-motion and data-saving visitors receive still imagery. Image uploads accept JPEG, PNG, WebP or AVIF up to 15 MB; video uploads accept MP4 or WebM up to 100 MB. Replacements use new R2 keys; clearing an asset does not delete the original file.

Existing catalog imagery provides fallbacks. Supply genuine workshop photography for the craft section; the initial fallback is catalog photography. Product names, prices and destinations come from published products. The existing global footer remains shared across the site.

## Database

Apply `supabase/migrations/202610150001_homepage.sql` to the same project used by `VITE_SUPABASE_URL`. The implementation uses one `homepage_content` document instead of separate media/section tables so copy, ordering and media publish together in one transaction.

The table is readable only by administrators. `get_homepage()` exposes only published content; `save_homepage()` checks `profiles.is_admin` and the expected revision. The public page uses the default layout until the first publication. The editor reports setup errors and never claims a failed save succeeded.

R2 uploads reuse `admin-upload-url`, which must allow authorized administrators to upload keys under `homepage/`. No R2 secret belongs in the frontend. Frontend code deployment and content publication are separate operations.

## Verification

Run `node --test tests/homepage.test.js`, `npm run lint`, and `npm run build`. For a manual smoke test, check `/home` at desktop and mobile widths, confirm product links and film playback, then save a draft and verify public content stays unchanged until publishing.
