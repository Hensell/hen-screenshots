# Patterns and positions — September 8, 2026

Eight new templates expand the catalog from 21 to 29 designs. This collection explores new device positions alongside distinct palettes and original vector patterns.

| Template | Palette and pattern | Portrait composition |
| --- | --- | --- |
| Zest | Citrus yellow and green diagonal stripes | Device tilted toward the lower right; headline above and supporting text on the left. |
| Cabana | Aqua and cream awning stripes | Raised device on the left, with a headline in the lower right. |
| Contour | Dark petrol with topographic curves | Device on the left; serif headline above and supporting text to the right. |
| Cherry | Pink and cherry checkerboard | High, right-aligned device with a generous caption below. |
| Terracotta | Warm clay fan shapes | Device tilted 20 degrees between the headline and lower caption. |
| Blueprint | Cobalt drafting grid and dimension marks | Device in the lower left, balanced by a supporting caption toward the right. |
| Stitch | Lilac woven zigzag borders | Raised device above a lower headline and a separate side caption. |
| Parade | Burgundy and rose scalloped bands | A diagonal device between a top headline and lower-right caption. |

Landscape canvases rearrange these regions to suit the available width. Frames, screenshots, captions, language versions and brand font overrides keep their existing behavior. Devices and text remain movable, with the existing reset and history controls.

## Discovery and implementation

Search metadata includes colors, patterns and positions. For example, `checker pink` finds Cherry, `stripes` finds Zest and Cabana, and `pattern` finds this collection. Existing category, appearance and composition filters still combine with the query. There are now ten dark templates and three pages at the default page size of 12.

The collection adds new IDs without changing historical template geometry or the document schema. Pattern artwork uses bounded Konva primitives in the shared scene for editor previews, gallery cards and PNG exports. Pattern padding scales down for very short canvases. Colors are editable through the current inspector; no remote assets, fonts, dependencies or services were added.

## Verification

- `npm run check`: lint, formatting, 395 tests across 27 files, type checking and production build.
- The geometry suite adds 448 combinations across the new single-slide templates, seven device families, both orientations and four export profiles. It verifies canvas bounds, caption/device separation and serialization validation. The existing exhaustive export-profile and extreme-ratio checks also include every new template.
- Template application tests compare previews with the applied result, preserve original screenshots and text, and cover both template palettes and keeping existing colors. Catalog tests cover search metadata, combined filters and all three pages without repeats or omissions.
- Generated PNGs were decoded and validated through the production RGB/no-alpha and dimension checks at 1080 × 1920, 2752 × 2064, 1600 × 1200 and 2560 × 640. Browser visual QA inspected all eight templates at each ratio. This checks PNG contents, not delivery through the browser's Downloads UI.
- The default supporting text colors, including the renderer's 0.88 opacity, have contrast ratios from 5.68:1 to 8.81:1 against their caption backgrounds. Custom user palettes remain editable.
- In a separate local QA project, `checker pink` found Cherry. Applying it, undoing, redoing and switching to an existing Spanish version preserved content. The gallery showed all eight `pattern` results at desktop size and 390 × 844 without clipping the application controls. The app was tested in the in-app browser only; no production project was edited during QA.

The export contact sheet under `exports/qa/` is an ignored local fixture, not a published page.
