# Hen Screenshots

A web app for creating polished screenshots for app stores, portfolios, and websites. Includes simple cards and frames for phones, tablets, monitors, and laptops.

**Free forever. No account. No watermarks.** Every template, frame, and full-resolution export is included.

Public name: **Hen Screenshots**.

Repository: [Hensell/hen-screenshots](https://github.com/Hensell/hen-screenshots).

**App screenshot studio** — _Your app. Beautifully presented._

See the [brand identity](docs/brand-identity.md), [visual showcase](brand/index.html), and [initial name research](docs/name-check.md).

The [proposed architecture](docs/architecture.md) defines the editor model, persistence, export pipeline, and implementation sequence.

The editor includes **iPhone, Android phone, iPad, Android tablet, monitor, and laptop** frames. The [device specification](docs/device-frames.md) defines the iOS and Android families and the direction of the catalog. The [v0.1 scope](docs/editor-v0.1.md) separates implemented features from later iterations.

The [v0.2 template iteration](docs/templates-v0.2.md) adds **Classic, Spotlight, Tilt, and Editorial**, with previews using your screenshots, individual or series-wide application, gradients, texture, accent typography, and rotation. Earlier projects and backups remain compatible.

The [v0.3 iteration](docs/devices-and-exports-v0.3.md) adapts all four templates to desktop and tablet devices and adds **15 export presets** for the App Store, Google Play, and web presentations. It verifies the dimensions and opaque RGB format of each generated PNG.

The [v0.4 portfolio iteration](docs/portfolio-v0.4.md) adds **4:3, square, and portrait cards**, custom dimensions, and a simple frame with rounded corners. Create a **Portfolio** project to choose a format for a project cover or website card.

The [v0.5 template collection](docs/catalog-v0.5.md) adds **Studio, Split, Halo, and Gallery**, plus search, style filters, and previews of the whole series using your own screenshots.

The [v0.6 panorama iteration](docs/panorama-and-workspaces-v0.6.md) adds a continuous **two-slide Panorama** and separate **App stores / Portfolio** project workflows, each with its own format and orientation controls.

## Run the editor

Requires Node.js 22.12 or later.

```sh
npm ci
npm run dev
```

Open the [landing page](http://127.0.0.1:5174/) or go straight to the [local studio](http://127.0.0.1:5174/studio/). Create an **App stores** or **Portfolio** project and import PNG, JPEG, or WebP images. Each screenshot gets its own canvas; original images are kept in the browser.

The landing page introduces the editor with real examples, templates, Panorama, portfolio formats, the free-forever commitment, and an FAQ. It is static HTML and CSS; the React editor loads only at `/studio/`. Existing `/?project=…` bookmarks redirect to `/studio/?project=…` on the same origin, preserving saved projects.

```sh
npm run check         # Run tests, TypeScript checks, and the production build
npm run preview       # Serve the build locally with the dev server stopped
npm run deploy:check  # Build and validate with Wrangler without deploying
npm run deploy        # Deploy to Cloudflare using an authenticated Wrangler session
```

The official plugin generates `dist/wrangler.json` and prepares the frontend for **Cloudflare Workers Static Assets**, without backend Worker logic or bindings. The app has not been deployed yet. `dist/` contains only application assets; local screenshots, databases, and FrogHappy tools are excluded.

Projects are stored per browser and origin. Use **Project file** to download a `.henscreenshots` file and **Open project file** to restore it as a copy in another browser, domain, or computer. Clearing site data also deletes its local projects.

## Audience and product direction

- The project's creator is its first user, preparing screenshots for his own apps.
- The first version will be validated through that real-world use and polished before being shared with others.
- The web editor is free forever. An open-source release is still being considered; licensing has not been decided yet.

## Project decisions

- Deployment target: **Cloudflare**.
- Implemented foundation: **React + TypeScript + Vite** as a single-page application (SPA).
- Implemented editor: **Konva** with a React component and a shared scene for browser preview and export.
- Two device families supported from the start: **iOS and Android**, each with its own composition presets. The frame family is selected independently of the export destination and dimensions.
- Local storage through IndexedDB in the first version.
- A possible desktop version using Tauri later, reusing the web editor.

## Proposed first version

Goal: create, save, reopen, and export a consistent series of promotional images for your own app.

1. Choose an App stores or Portfolio project, select its canvas size and orientation, and import multiple screenshots.
2. Choose a template and its iOS or Android variant, then customize colors, typography, background, and phone frame for the whole series.
3. Edit each image's text and composition, with options to duplicate, reorder, and undo changes.
4. Save automatically in the browser, with project download and import—including source images—for backup and transfer.
5. Export a single image as PNG, a linked panorama as two PNGs in a ZIP, or the series as ZIP at the selected dimensions.

Accounts, synchronization, collaboration, AI generation, and 3D scenes are outside the current scope.

Initial validation: use real screenshots from one of the creator's apps, prepare a series, close and reopen the project, restore it from a backup, and visually verify the export and its dimensions. Check both frame families without distorting screenshots or duplicating status bars, navigation bars, or camera cutouts.

The core workflow and series editing are implemented. Future iterations will expand the composition catalog and size profiles based on real-world use with FrogHappy.

## Planned deployment

The planned setup uses Cloudflare Workers with Static Assets and the official Cloudflare Vite plugin. This foundation serves the frontend and allows an API to be added when the product needs one. Cloudflare Pages also supports React + Vite.

Screenshot processing and editor export are designed to run in the browser. Local storage does not provide synchronization across devices.

Official references:

- [React + Vite on Cloudflare Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/react/)
- [Cloudflare Vite plugin](https://developers.cloudflare.com/workers/vite-plugin/)
- [React on Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/deploy-a-react-site/)

## Status

A working editor for personal use: local projects, up to 20 screenshots, 13 adaptive templates, including three two-slide panoramas, six device frames and simple cards, orientation, colors, text, editable composition, undo/redo, backup/restore, and PNG/ZIP export using the selected preset. The app has not been deployed yet.

v0.6 saves documents using schema 4 and migrates v1/v2/v3 projects and backups. The gallery, editor, and export share the same scene. Store limits are 8 images per device type on Google Play and 10 per Apple screenshot slot; the app prevents ZIP exports that exceed the destination's limit.

The [first FrogHappy capture session](docs/capture-session.md) provides five Android images with sample data and a reproducible workflow for validating the editor.

### Expressive collection

**Daybreak** joins two slides with warm color waves and a tilted device. **Tidal** combines a deep blue panorama, flowing contour lines, and serif headlines. **Bloom** uses botanical silhouettes and a soft arch; **Punch** brings coral poster typography and a contrasting device stage. All four use editable colors and vector decorations rendered by the same scene in previews and PNG exports. Applying a template preserves your screenshots, captions, and device settings.

Panorama pairs share one image and composition while keeping independent captions. Switching between panorama styles preserves the pair; applying a single-slide template separates both slides. Existing templates and version 4 project files remain supported.

The editor bundles a static Fraunces 600 headline face (optical size 48, generated from the upstream variable font) from [Fraunces](https://github.com/google/fonts/tree/main/ofl/fraunces) for editorial headlines under the [SIL Open Font License](brand/fonts/OFL-Fraunces.txt), alongside Manrope. Fonts load locally before measuring captions or exporting; no external font service is required.

### Move text on the canvas

The editor keeps templates, image replacement, duplication, canvas size, and undo/redo in a top toolbar. The inspector has four tabs: **Design** for templates and colors, **Text** for captions and typography, **Device** for frames and placement, and **Canvas** for export sizes and orientation. Selecting an object on the canvas opens its tools. Canvas and frame orientation remain together, with their slide/series scope labeled. On smaller screens, **Edit slide** and **Preview** move between the canvas and tools.

Drag a headline or supporting text to position it independently of the device. In a panorama, text can also cross the slide boundary while retaining its own reset control. The **Text** tab has a **Reset position** button below each text field; each returns only that text to its template position. Undo and redo include text movement and resets.

For keyboard editing, focus the canvas, press **Enter** to choose an object, and move it with the arrow keys (**Shift** moves it farther). Positions persist locally, in project backups, and in PNG exports. Applying a template or changing the canvas format restores the template's text placement; replacing an image preserves it. Version 5 project files store text offsets and automatically upgrade earlier documents without changing their saved composition.
