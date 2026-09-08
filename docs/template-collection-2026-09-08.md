# Light and dark collection — September 8, 2026

Eight original templates extend the catalog from 13 to 21 designs, including four new dark templates and a fourth panorama family. The reference pass revisited [Screenshot Otter's gallery](https://screenshototter.com/templates), including its Dark filter, in the Henselldev Chrome session. The visual cues were prominent devices, editorial type, restrained dark surfaces, and continuous panoramic compositions. The new artwork is written with Konva vector primitives; no reference images, premium assets, or template source code were copied.

| Template | Appearance | Composition |
| --- | --- | --- |
| Prism | Colorful | Folded translucent planes and a gently tilted device. |
| Nocturne | Dark | Plum panel, fine rules and a serif caption; reverses the text/product arrangement in landscape. |
| Orbit | Dark | A shared device crosses two slides over midnight blue ellipses and orbital arcs. |
| Paper | Light | Warm paper, serif masthead, product mat and separate supporting caption. |
| Carbon | Dark | Graphite, precise corner marks and a restrained green accent. |
| Workbench | Light | A broad product area on a drafting grid, with text above and below for portfolio and desktop work. |
| Ember | Dark | Espresso, copper planes and an elliptical product stage. |
| Confetti | Colorful | Cut-paper shapes, peach and sage colors, and a gentle device tilt. |

## Integration

- All frames remain available. Applying a template preserves device choice, screenshots, captions, brand font overrides, and the project's App stores or Portfolio destination. New geometry fits phones, tablets, monitors, laptops and plain cards in portrait and landscape.
- New template IDs preserve historical compositions. Orbit uses the existing adjacent panorama pair, shared layout, translated content, history, and backup mechanisms. The document remains schema 7.
- The Appearance filter combines Light, Dark, or Colorful with category, search, composition and background. It uses the preset's appearance, independently of custom colors. Dark currently contains seven templates. Filtering resets pagination; clearing filters restores the curated catalog.
- Appearance appears first in the filter panel, including the collapsible mobile panel. Existing pagination and lazy preview mounting remain in use.
- Vector decoration goes through the same scene as the editor, gallery, publication preview, and PNG export. No additional fonts, image downloads or dependencies are needed.

## Verification

`npm run check` covers lint, formatting, tests, type checking and the production build. The suite includes 378 tests across 27 files. New geometry checks exercise 392 combinations of single-slide template, device family, orientation, and export profile, including a 4:1 custom portfolio size. They check caption/device separation, canvas bounds, and validation after serialization. The existing exhaustive export-fit check is parameterized by device so catalog growth does not concentrate every combination into one timeout. Existing panorama preview/application and portable archive tests now include Orbit. Discovery tests exercise the appearance filter, combined filters, counts, and pagination.

Actual browser rendering used local QA fixtures in the in-app browser: a FrogHappy capture for phone/tablet and a portfolio image for laptop compositions. The full collection rendered at 1080 × 1920, 2752 × 2064 and 1600 × 1200: nine PNGs per format, including Orbit's two halves. Each PNG passed the production dimension and RGB/no-alpha validation and decoded into an image for visual inspection. This validates generated PNG contents; it does not claim delivery through the browser's Downloads UI.

The real editor pass restored a separate QA project, filtered by Dark, applied Orbit, used undo/redo, and switched to Spanish. Captions and localized images remained present. The gallery and filter panel were visually checked on desktop and at 390 × 844 and 844 × 390. The in-app browser was used for app QA; Chrome was used only to inspect the reference gallery. No production documents were modified for testing.

The local export contact sheet is an ignored QA artifact under `exports/qa/`, not a shipped route. To repeat a check without it, import a capture into a QA project, apply each new template from the gallery, and export the selected slide or panorama in the three formats above. Check the default palette first, then a branded project and a translated version.
