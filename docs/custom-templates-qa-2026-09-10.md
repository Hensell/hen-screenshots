# Personal templates and background images

## Behavior

- `Design → Background image` adds an image behind the devices, captions, and extra images. Cover/contain and opacity are editable. A panorama shares one continuous background across its two export crops.
- `Design → Save as template` captures one slide or a complete linked panorama, including current-language text, resolved styles, device geometry, background, and decorative overlays. Device screenshots, other languages, and brand-kit metadata are excluded.
- `My templates` is available from the project library, built-in template gallery, and Design inspector. It supports local saving, search, pagination, preview, import, export, and confirmed deletion.
- Applying a template appends independent slides and assets. Different canvas proportions/workspaces or a full series require opening a new project. Each existing project remains independent of later template deletion.
- `.hentemplate` uses the bounded, validated archive reader with a distinct format identifier. Regular project backups retain their own format. Schema 11 adds optional background images and migrates versions 1–10.
- The repository/downloadable plugin is patched to 0.2.1 for schema 11 rendering. The OpenAI directory entry remains the previously approved 0.2.0; this change does not submit a directory update.

## Automated verification

- `npm run check`: lint, formatting, 690 tests in 52 files, TypeScript, and production build passed.
- New regression tests cover capture removal, editable geometry, fresh identities, independent template/project persistence, background asset pruning, archive type validation, image remapping, byte/count/proportion limits, older-schema migration, and disconnected panorama rejection.
- A real native canvas test verifies both panorama background crops pixel by pixel, with no seam or alpha channel.
- `npm run plugin:smoke`: isolated package setup, doctor/catalog, store exports, three isometric panoramas, multi-device portfolio, language folders, project round trip, and error paths passed on this Mac.
- `autoreview --mode local --no-web-search`: clean; no actionable findings.

## Visual and interaction verification

Chrome, local editor, English/Spanish/Portuguese. No cross-browser or physical-device claims.

1. Created a project, added a slide, uploaded a 2160 × 1920 background and a FrogHappy capture, and edited both text fields.
2. Saved a portrait template. Its preview retained the artwork and text and displayed an empty device slot. Reopening the library retained the saved entry.
3. Exported `.hentemplate`, imported it again, appended it to a project, and exercised undo/redo.
4. Converted the original design to a panorama and saved the linked pair. Its two adjacent previews displayed the background continuously.
5. Opened the portrait template as a new project, supplied a different capture, and exported a PNG. Verified the actual downloaded file: 1080 × 1920, sRGB, no alpha.
6. Rendered a browser-created project backup through the patched native plugin, including its custom background.
7. Imported a project backup through the template importer and confirmed the translated, descriptive error.
8. Inspected layouts at CSS viewport sizes 360 × 800, 800 × 400, 768 × 1024, 1024 × 768, and 1440 × 900. Checked modal scrolling and reachable actions; no horizontal page/dialog overflow. The sticky heading keeps the close action available.
9. Escape dismissed the dialog and returned focus to its opener. The browser reported no console errors. Temporary viewport overrides were reset.

## Limits

Templates stay in the current browser's IndexedDB. A `.hentemplate` file is the portable backup; there is no public template-upload service. Image backgrounds and logos remain embedded when sharing. Uploaded flattened image text is not converted into editable text. Local browser storage quotas still apply, with a dedicated full-storage message.
