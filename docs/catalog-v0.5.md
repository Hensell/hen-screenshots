# Template collection v0.5

Implemented September 6, 2026.

## Reference and direction

The [Screenshot Otter template gallery](https://screenshototter.com/templates) was reviewed in the Henselldev Chrome session. The useful patterns were style filtering, previews using real screenshots, and seeing several slides together before choosing a design. Its panoramic examples also show how neighboring slides can tell a continuous story.

Hen adopts the browsing and comparison ideas with original vector compositions and the existing Manrope typography and warm palette. No reference images, template code, stock photos, or assets are copied into the app. This iteration previews independent slides as a series; it does not split a device or image across multiple exports.

## New compositions

| Template | Style | Composition |
| --- | --- | --- |
| Studio | Minimal | Fine border, quiet stage, full device, generous margins |
| Split | Bold | Two color fields with an angled boundary and a strong headline |
| Halo | Bold | A circular stage and thin orbit against deep ink |
| Gallery | Editorial | Product first, a fine rule, then an editorial caption |

These bring the catalog to eight templates. The original Classic, Spotlight, Tilt, and Editorial layouts retain their geometry. All new designs adapt to phones, tablets, monitors, laptops, and screenshot cards, using the project's store preset or portfolio dimensions.

The secondary surface color remains editable in the inspector, labeled Stage, Color block, Halo, or Mat. Keep my colors also works for these templates.

New templates also fit long caption words together with punctuation before wrapping, avoiding split words in narrow text columns. Natural word boundaries are retained for scripts without spaces. The original four templates keep their existing typography for export compatibility.

## Gallery workflow

- Search names and descriptions, then filter by Minimal, Bold, or Editorial. Search and category filters combine.
- Choose This screenshot or Whole series. This choice controls both the preview and the actual application scope.
- Whole series shows up to three real screenshots per template. Previous/next controls cover every screenshot, including the last partial group. Applying still affects the entire series.
- Previews retain each screenshot's text, image, frame, orientation, and effective colors when requested. Nothing changes until Apply is pressed.
- A selection excluded by the current filters cannot be applied accidentally. An empty result offers Clear filters.
- Offscreen canvas previews are released and recreated near the visible area. Decoded source images are shared; there is no new rendering dependency.
- Closing the dialog restores focus to its opener. Applying a series remains one undo step.

## Compatibility and validation

The document shape remains schema 4. The catalog adds four recognized IDs; schema 1–3 retain their historical template sets. Existing projects need no structural migration. New IDs are included in backups and restored with their exact styles and coordinates. Earlier app builds cannot open projects containing templates they do not recognize.

Validation includes the full frame/orientation/template/export matrix and custom aspect-ratio extremes, preview/application parity, filtered search, backup round trips, and production build checks. Browser checks cover search, empty results, filtering, series pagination, one-step undo, responsive layouts, and actual PNG/ZIP dimensions and opaque RGB encoding. All five legacy FrogHappy PNGs were byte-identical to the v0.2 exports.

Local test exports and portable demo projects are kept under the ignored `exports/catalog-v0.5/` directory. They are not part of the deployed app.
