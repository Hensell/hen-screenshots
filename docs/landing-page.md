# Public landing page

The public page lives at `/`; the editor and project library live at `/studio/`.
Both are HTML entries in the Vite build and are served by Cloudflare Workers Static Assets. The landing is static HTML/CSS and does not download React, the editor, or open IndexedDB.

Old `/?project=…` links redirect in the browser to `/studio/?project=…`, preserving the query string and fragment. The origin and database remain the same. The library logo links home; the editor logo still saves and returns to projects.

The public message is **Free forever. No account. No watermarks.** This applies to every existing template, device frame, and full-resolution export. The landing does not claim an open-source license, unlimited project sizes, or guaranteed store approval.

The page includes actual template exports, a linked Panorama pair, a portfolio card, the create/style/export workflow, local storage and backup details, and links to the studio and [Hensell's portfolio](https://hensell.dev). The public [GitHub repository](https://github.com/Hensell/hen-screenshots) is linked beneath the hero, in the free section's contribution invitation, and in the footer. The copy is available in English, Spanish, and Portuguese; repository links stay available on mobile.

## Example assets

The translation section describes the implemented OPUS-MT models by Helsinki-NLP, hosted on Hugging Face. It covers the optional local download, currently supported automatic languages (English, Spanish, French, German), manual editing, linked layouts, and language folders. Gemma is not integrated and is not presented as the translation engine. The section only contains static copy and a link to the studio; visiting the landing does not download models.

The Hugging Face logo in `public/icons/hugging-face.svg` comes from the [official brand assets](https://huggingface.co/brand), [original SVG](https://huggingface.co/datasets/huggingface/brand-assets/resolve/main/hf-logo.svg). It identifies the model hosting platform, not an endorsement or partnership.

`public/examples/` contains resized WebP previews of Hen Screenshots exports. The phone examples use FrogHappy captures made with sample data during the creator's capture session. The portfolio card uses the project's own brand identity showcase. These are promotional examples, not customer content or editable project backups. Full-resolution originals remain in the local, ignored `exports/` directory.

Image dimensions are declared in the HTML; images below the hero load lazily. The page uses the existing local Manrope font and brand tokens. FAQ items use native disclosure controls and work without JavaScript. The landing scripts preserve old project links and apply the selected interface language.

Selected content below the initial viewport fades and rises into view once, with a short stagger across the template examples. Scroll reveals use IntersectionObserver and CSS opacity/transform animations, with no scrolling listeners or animation dependencies. Content is visible by default, keyboard focus bypasses the reveal, and enabling reduced motion cancels active animations. These effects and smooth anchor navigation are limited to the landing entry; the studio stays unchanged.

The FAQ and translation download disclosure animate their content height and opacity in both directions, with a plus-to-minus indicator. They retain native `details`/`summary` semantics and work without JavaScript. The [native CSS technique](https://developer.chrome.com/blog/styling-details) is feature-detected: browsers without intrinsic-size transitions keep instant, fully functional disclosures. Reduced-motion users also get immediate expansion and collapse.
