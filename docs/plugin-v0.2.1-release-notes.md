# Hen Screenshots plugin v0.2.1

Render projects with custom background images, including designs saved from your personal templates in the web studio.

## What changed

- Imports the studio's schema 11 `.henscreenshots` projects and keeps support for earlier project versions.
- Preserves background images, their fit and opacity, and continuous backgrounds across linked panorama slides.
- Keeps the existing local workflow: PNG exports, contact-sheet previews, language folders, and editable project files.

To reuse a personal template, open it in the web studio, add your screenshots, and download the project. Ask the agent to render that `.henscreenshots` file. The plugin does not read the browser's personal-template library or import `.hentemplate` files directly.

## Install or update

Download the ZIP and checksum below, or update through the GitHub marketplace. Follow the [installation and update guide](https://screenshots.hensell.dev/agents/). A website deployment does not update an installed plugin; check that the plugin's doctor command reports **0.2.1**.

Requires Node.js 22.12+ and npm. For a ZIP installation, extract it into a new folder and run `node scripts/setup.mjs`. Setup downloads the locked dependencies; rendering then runs locally. Existing captures and project files can be reused.

## Verified package

This release contains the exact ZIP from [package-check run 34544076299](https://github.com/Hensell/hen-screenshots/actions/runs/34544076299), built at commit `6f800c633ae6c1dbb2d15ecbf1ce45c59603f793`. Installation and rendering passed on Linux x64, Windows x64, and macOS arm64 with Node.js 22.23.2.

Checks cover store exports, isometric panoramas, multiple-device mockups, language folders, project round trips, invalid inputs, and overwrite protection.

SHA-256: `7664c3af86170ff1d038b3733b013de75deeb18d402c98fce92167fdbe291c24`

## Limits

Native image inputs are PNG, JPEG, and still WebP, up to 50 MB and 24 megapixels per image and 120 MB combined. Other import formats and source-only Wear OS exports require the web studio. Native typography can differ from the browser; review exports before uploading them to a store. Translations come from you or your agent, not a bundled model.

MIT licensed. [Privacy](https://github.com/Hensell/hen-screenshots/blob/plugin-v0.2.1/plugins/hen-screenshots/PRIVACY.md) · [Feedback](https://github.com/Hensell/hen-screenshots/issues) · [Hen Screenshots](https://screenshots.hensell.dev/)
