# Hen Screenshots

**Your app. Beautifully presented.**

Turn raw screenshots into polished App Store images, Google Play listings, and portfolio mockups. Pick a template, make it yours, and export straight from your browser.

**Free forever. No account. No watermarks.** Every template, device frame, and full-resolution export is included.

[**Open the studio →**](https://screenshots.hensell.dev/studio/) · [Explore the website](https://screenshots.hensell.dev/) · [Share feedback](mailto:hensell@hensell.dev?subject=Hen%20Screenshots%20feedback)

<p align="center">
  <img src="public/examples/halo.webp" width="24%" alt="Halo: a bold headline and phone against a dark background with a warm circular accent." />
  <img src="public/examples/studio.webp" width="24%" alt="Studio: a clean, softly framed app screenshot with generous space." />
  <img src="public/examples/split.webp" width="24%" alt="Split: a playful app presentation with warm blocks of color." />
  <img src="public/examples/gallery.webp" width="24%" alt="Gallery: an oversized screenshot with an editorial caption." />
</p>

<p align="center"><em>Real exports made in Hen Screenshots, featuring FrogHappy.</em></p>

## Make something worth showing

- **A template for your story.** 13 designs, from quiet editorial layouts to bold posters, including three panoramas that connect two slides into one scene.
- **Find your look quickly.** Search by name, color, or visual idea. Filter by style, composition, and background, sort results, and browse 12, 24, or 48 templates per page. Previews use your own screenshots.
- **Choose the right frame.** iPhone, Android phone, iPad, Android tablet, monitor, laptop, or a simple screenshot card.
- **Make the composition yours.** Customize captions, colors, typography, and backgrounds. Drag devices and text independently, or use the keyboard. Reset positions whenever you want.
- **Line things up.** Smart guides snap devices and text to centers, edges, margins, and nearby objects, including across panoramas. Hold Alt/Option to move freely, or turn guides off.
- **Preview before publishing.** Review store screenshots in a swipeable carousel or portfolio cards in a website grid. Check compact, phone, and wide reading sizes, then jump back to any slide to edit it.
- **Edit a whole series.** Apply a template to one slide or the series. Replace an image while keeping its design, duplicate and reorder slides, and undo or redo changes.
- **Export for the destination.** Separate **App stores** and **Portfolio** workspaces keep store presets apart from cards, square formats, widescreen covers, and custom dimensions.
- **Keep your work.** Projects save automatically in your browser. Download an editable project file with its original images for backup or transfer.

### Two slides. One bigger story.

<p align="center">
  <img src="public/examples/panorama-left.webp" width="35%" alt="Left half of a Panorama: Small habits. A bigger story. A tilted phone crosses the slide boundary." />
  <img src="public/examples/panorama-right.webp" width="35%" alt="Right half: the phone and warm ribbon continue into the caption Every day, a little brighter." />
</p>

Design the pair together, keep a different caption on each slide, and export two separate PNGs in a ZIP. **Panorama**, **Daybreak**, and **Tidal** each offer a different take on the continuous scene.

## From capture to export

1. [Open the studio](https://screenshots.hensell.dev/studio/), create an **App stores** or **Portfolio** project, and add PNG, JPEG, or still WebP screenshots.
2. Choose a template and frame. Use **Design**, **Text**, **Device**, and **Canvas** to adjust the result. Drag text or devices on the canvas; their reset controls return them to the template position.
3. Click **Export** to download a PNG, a panorama pair, or the whole series as a ZIP. Use **Project file** to keep an editable backup too.

**Keyboard:** focus the preview and press **Enter** to select an object. Move it with the arrow keys; hold **Shift** for larger steps. Outside text fields, **⌘/Ctrl + Z** undoes changes and **⌘/Ctrl + Shift + Z** redoes them.

**Before exporting:** open **Preview** beside Export to check small-screen readability and the spacing between panorama slides. Use the carousel's arrow keys, Home/End, or swipe. This is a reading-size simulation; store layouts vary. Guides and preview controls never appear in exported images.

## Your screenshots stay with you

Image processing, preview rendering, project storage, and exports happen in your browser. There is no account, screenshot upload service, or cloud synchronization. Fonts are bundled locally.

Projects belong to the browser and site where you created them. Clearing site data removes those local projects. To move to another browser, computer, or domain, download **Project file** (`.henscreenshots`), then choose **Open project file** in the other studio. Importing a backup creates a new copy.

| Item                            | Current limit                                                |
| ------------------------------- | ------------------------------------------------------------ |
| Slides per project              | 20                                                           |
| Source image                    | 20 MB and 24 megapixels                                      |
| Source images used by a project | 120 MB combined                                              |
| Custom portfolio canvas         | 256–4096 px per side, up to a 4:1 aspect ratio               |
| Store series export             | 8 images for a Google Play device slot; 10 for an Apple slot |

Exports are opaque 24-bit RGB PNGs at the selected dimensions. Store presets include links to the requirements for their device slots; screenshots and content still need to be appropriate for your app and destination. See the [export profiles](src/core/export-profiles.ts).

## Run locally

Requires **Node.js 22.12+**. The project pins Node **22.21.1** in [`.node-version`](.node-version).

```sh
git clone https://github.com/Hensell/hen-screenshots.git
cd hen-screenshots
npm ci
npm run dev
```

Open [localhost:5174](http://127.0.0.1:5174/) for the landing page or [localhost:5174/studio/](http://127.0.0.1:5174/studio/) for the editor.

| Command                | What it does                                                  |
| ---------------------- | ------------------------------------------------------------- |
| `npm run dev`          | Start the local Vite server on port 5174                      |
| `npm test`             | Run the Vitest suite                                          |
| `npm run check`        | Run tests, TypeScript checks, and the production build        |
| `npm run build`        | Type-check and build production assets                        |
| `npm run preview`      | Serve the build locally; stop the dev server first            |
| `npm run deploy:check` | Build and validate a Cloudflare deployment without publishing |
| `npm run deploy`       | Build and publish using an authenticated Wrangler session     |

## How it is built

**React · TypeScript · Vite · Konva · Zustand · Dexie / IndexedDB · Cloudflare**

The landing page is static HTML and CSS. The React editor loads at `/studio/`. A shared Konva scene renders editor previews, template thumbnails, and full-resolution exports, so they use the same composition rules.

| Directory        | Responsibility                                                 |
| ---------------- | -------------------------------------------------------------- |
| `src/app/`       | Project library, editor shell, dialogs, and user actions       |
| `src/core/`      | Project schema, templates, catalog search, and export profiles |
| `src/editor/`    | Editing state, undo/redo, inspector, and template library      |
| `src/rendering/` | Shared scene, device frames, typography, and decorations       |
| `src/assets/`    | Image validation and decoding                                  |
| `src/storage/`   | IndexedDB persistence, migrations, and project backups         |
| `src/export/`    | PNG rendering and export validation                            |

The catalog is indexed locally. Only the current page's cards are mounted, and canvas previews render near the visible area. Search and pagination are tested with 10,000 synthetic entries; the actual catalog currently contains 13 templates.

Autosave checks revisions to prevent one tab from overwriting another tab's changes. Project files use schema 5 and support migration from versions 1–4. Tests cover image and archive validation, persistence conflicts, migrations, undo/redo, template behavior, text placement, geometry, and export profiles.

### Deployment

The public app runs on **Cloudflare Workers Static Assets**. **Workers Builds** is connected to this repository: each push to `main` runs `npm run check`, then deploys with `npx wrangler deploy` if the checks pass.

See [deployment instructions](docs/deployment.md) for build settings, custom domains, manual deployment, and rollback. There is no application backend or database service to provision.

## Feedback and contributing

Built by [Hensell](https://hensell.dev) for his own apps, and for the things you are building too.

If Hen Screenshots helps you showcase your apps, you can [support its development on Ko-fi](https://ko-fi.com/hensell). Donations are optional; the editor remains free forever.

Enjoying it? Found a bug? Have a template in mind? [Open an issue](https://github.com/Hensell/hen-screenshots/issues) or email [hensell@hensell.dev](mailto:hensell@hensell.dev?subject=Hen%20Screenshots%20feedback). For bugs, include your browser, the steps to reproduce, and what you expected. Only attach screenshots or project files you are comfortable sharing publicly.

For code contributions, keep changes focused and run `npm run check`. Check rendering changes in both the preview and a PNG export, and check UI changes on mobile. New templates need a catalog entry and search keywords in [`src/core/templates.ts`](src/core/templates.ts), with any new scene behavior in `src/rendering/`.

**License status:** the hosted editor is free to use forever. An open-source license for the application code has not been selected yet. Bundled fonts retain their [Manrope](brand/fonts/OFL.txt) and [Fraunces](brand/fonts/OFL-Fraunces.txt) licenses.

## Project notes

- [Architecture and original implementation plan](docs/architecture.md)
- [Brand identity](docs/brand-identity.md)
- [Device frame design](docs/device-frames.md)
- [Store export presets](docs/devices-and-exports-v0.3.md)
- [Portfolio formats](docs/portfolio-v0.4.md)
- [Panoramas and workspace separation](docs/panorama-and-workspaces-v0.6.md)

These notes record design decisions and earlier milestones; the sections above describe the current app.
