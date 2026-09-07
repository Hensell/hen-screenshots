# Public landing page

The public page lives at `/`; the editor and project library live at `/studio/`.
Both are HTML entries in the Vite build and are served by Cloudflare Workers Static Assets. The landing is static HTML/CSS and does not download React, the editor, or open IndexedDB.

Old `/?project=…` links redirect in the browser to `/studio/?project=…`, preserving the query string and fragment. The origin and database remain the same. The library logo links home; the editor logo still saves and returns to projects.

The public message is **Free forever. No account. No watermarks.** This applies to every existing template, device frame, and full-resolution export. The landing does not claim an open-source license, unlimited project sizes, or guaranteed store approval.

The page includes actual template exports, a linked Panorama pair, a portfolio card, the create/style/export workflow, local storage and backup details, and links to the studio and [Hensell's portfolio](https://hensell.dev).

## Example assets

`public/examples/` contains resized WebP previews of Hen Screenshots exports. The phone examples use FrogHappy captures made with sample data during the creator's capture session. The portfolio card uses the project's own brand identity showcase. These are promotional examples, not customer content or editable project backups. Full-resolution originals remain in the local, ignored `exports/` directory.

Image dimensions are declared in the HTML; images below the hero load lazily. The page uses the existing local Manrope font and brand tokens. FAQ items use native disclosure controls and work without JavaScript. The only production script on the landing preserves old project links.
