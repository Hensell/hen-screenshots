# Import and export validation — September 9, 2026

The supported destinations use fixed pixel dimensions. Sources:

- [Apple screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/)
- [Google Play preview assets](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en)
- [SVG image restrictions](https://developer.mozilla.org/en-US/docs/Web/SVG/Guides/SVG_as_an_image)

## Boundaries

Input limits and final store assets are separate. Imports accept prepared images up to 50 MiB and 24 megapixels, with a 120 MiB project budget. Brand logo inputs are capped at 5 MiB. HEIC, AVIF, and self-contained SVG are converted to PNG before entering the existing project model. Original files remain unchanged.

Export renders an immutable project revision to an opaque sRGB canvas. PNG output is checked for its signature, pixel dimensions, eight-bit channels, and RGB color type (no alpha). JPEG output is checked for format and exact dimensions. JPEG quality can decrease from 94% to 72% to target smaller files; pixel dimensions never change. Each language folder retains the same format and resolution.

The export dialog lists the actual byte size of each rendered image before download. The 8 MB target is an application recommendation, not a universal store rule. Only a documented destination limit is a hard block: Android XR's 8 MB cap. Its oversized PNGs can be re-rendered as JPEG; individual files are checked even inside ZIPs.

Additional presets cover Apple Watch, Apple TV, Vision Pro, Wear OS, Android TV, Automotive, and XR. Wear OS uses only the original square, opaque app capture. Its preview and export exclude added design elements; switching destinations restores access to the saved design. Non-square captures and transparent masking are rejected before export. Automotive's two orientations intentionally have different aspect ratios.

Screenshot counts describe complete listing sets. Individual exports remain possible while assembling a set. Content guidance is separate from technical validation; store review also depends on actual app content and the listing. No automated or real upload to App Store Connect or Play Console is claimed.

## Verification

Regression coverage includes source signature detection, AVIF container limits, encoder fallback, JPEG quality and dimension preservation, file weight boundaries, destination mapping, panorama restoration, locale folders, project serialization, and English/Spanish/Portuguese UI coverage. Browser QA uses separate local fixtures and projects; production projects are not modified.

The final local check passed all 564 tests across 42 files, plus lint, formatting, TypeScript, and the production build. Browser verification covered:

- A 1320 × 2868 AVIF with a misleading `.jpg` extension, correctly detected and converted to PNG.
- A 512 × 512 static SVG, converted with transparent pixels preserved; active content, external resources, and animation rejected.
- The actual import dialog with both conversion previews and explicit import, followed by a saved project.
- Real PNG exports for iPhone, iPad, Apple Watch, Apple TV, Vision Pro, Wear OS, Automotive, XR, feature graphics, and TV banners, with output headers checked.
- JPEG ZIP entries in separate English and Spanish folders.
- An Android XR stress fixture: the resulting 25.00 MB PNG blocked both download entry points. Preparing JPEG reduced it to 6.46 MB, retained 3840 × 2400 pixels, and enabled download.
- The import and export interfaces in English, Spanish, and Portuguese, with desktop, tablet, phone, and short landscape viewports. This was viewport coverage in the same browser, not a cross-browser certification.

The code review identified a download link outside the dialog that could bypass the XR size block. That link now respects the same validation result; the browser stress test confirmed the fix. The follow-up review reported no actionable findings.
