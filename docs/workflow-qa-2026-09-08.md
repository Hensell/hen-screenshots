# Workflow QA and loading improvements — September 8, 2026

Baseline: `9c670a2` on `main`. Scope: exercise the main workflows, reduce initial loading cost, and extract responsibilities from `App.tsx`. The user explicitly excluded testing in different browsers.

## Implementation

- `ProjectLibrary.tsx` owns the library presentation; `useProjectLibrary.ts` owns listing, creation, opening, and returning after a successful save.
- `ExportDialog.tsx` owns export options and results. `export/screenshots.ts` renders a snapshot, selects original or localized images, preserves series numbering, packages language folders, enforces the existing limits, and accepts an `AbortSignal`.
- Optional dialogs, backup code, export code, and the canvas renderer load on demand. The small brand badge has its own module and CSS so the inspector does not load the entire brand-kit dialog.
- Loading and error boundaries keep the editor mounted if an optional module cannot load. Dismiss the message to continue editing; after saving, reload to retry. React caches rejected lazy imports, so closing and reopening alone is not presented as a retry.

No storage schema, export profiles, dependencies, or Cloudflare settings changed. The shared scene remains the renderer for previews and PNGs.

## Build comparison

| Measurement | Baseline | After |
| --- | ---: | ---: |
| Initial studio JavaScript | 658.12 kB | 398.78 kB |
| Initial studio JavaScript, gzip | 205.18 kB | 125.44 kB |
| Initial studio stylesheet | 78.65 kB | 53.58 kB |
| `App.tsx` lines | 1,828 | 1,424 |

The initial JavaScript is about 39% smaller. This measures the **library entry chunk**, not all code needed to edit a project: the scene and tools download as they become necessary. The 650 kB warning threshold was not raised. These are build sizes, not network timing or field performance measurements.

## Automated regression coverage

`npm run check` passes lint, formatting, 355 tests across 26 files, TypeScript, and the production build.

Eight new export tests cover a selected PNG's name and series position, a bilingual panorama with different image sources, a stable snapshot during later edits, cancellation during decoding and rendering, store count limits, missing images, and the 250 MB packaging budget. They use real ZIP packaging with simulated rendering. Existing tests cover RGB PNG encoding, geometry, backup round trips including 40 localized images, brand portability, persistence conflicts, and undo/redo.

## Browser workflow pass

Used the built app at `http://127.0.0.1:5175/studio/` in the Codex in-app browser with a separate local library and QA projects. No production documents were changed. Real FrogHappy PNGs and a portfolio WebP were selected through the file chooser.

| Journey | Observed result |
| --- | --- |
| Create → import → edit | Created an App stores project, imported captures, edited captions and frame, applied Daybreak, and created a linked two-slide panorama. |
| Placement and history | Moved a headline with the keyboard, reset its position, replaced the panorama image, and used undo/redo. |
| Languages | Added Spanish manually, edited and reviewed captions, and replaced only the Spanish panorama image. Switching to English retained the original captions and capture. |
| Save and reopen | Returned to the library and reopened the project; English and Spanish content remained intact. |
| Brand kit | Created a kit from the slide, saved it, and applied it to the pair without changing the Spanish captions. |
| Restore an existing backup | Imported `Brand-restore-QA.henscreenshots` as a new project ID; three slides, linked panorama, English/Spanish/French versions, Spanish image override, and the embedded FrogHappy brand were present. |
| Duplicate and delete | Duplicated a slide through its context menu, canceled deletion, confirmed deletion, undid it, then redid it. The series count followed each action. |
| Publication preview | Inspected the panorama carousel, changed reading width, navigated to the last slide with End, and returned using Edit slide 03. Portfolio projects showed the card grid. |
| Export rendering | A bilingual three-slide ZIP reached the ready state without warnings. Individual PNGs displayed as fully decoded images at 1080 × 1920 for Google Play and 1600 × 1200 for a portfolio card; the exported image previews matched the edited compositions. |
| Workspace separation | Created a Portfolio project with Card format and a laptop frame. Returning to the library kept the Portfolio filter, separate from App stores. |
| Invalid files | A damaged PNG was rejected without replacing the active image. An invalid project archive showed an error and left the two existing store projects available. |
| Failed optional module | Temporarily removed the built publication-preview chunk, reloaded, and opened Preview. Its error dialog appeared while the editor remained mounted. Dismissed it, renamed and saved the project, restored the chunk, reloaded, and successfully opened Preview with the new name. |

A subsequent production check found a CSS ownership regression: the inspector's brand selector depended on styles from the deferred brand-kit dialog. A warm QA session had already loaded that stylesheet and masked the issue. Those selector rules now live in the always-loaded studio stylesheet. Rechecked a saved branded project from a fresh load before opening any optional dialogs: the selector has its border, 12 px gap, aligned label and logo, while the brand-kit chunk remains unloaded. Future loading checks should begin with both an empty library and a direct link to a saved branded project.

Visual checks covered the normal desktop viewport, 320 × 740 (export result), 390 × 844 (library), 768 × 1024 (editor), 1024 × 768 (publication preview), and 844 × 390 (module error). The inspected controls and dialogs remained reachable; screenshots and DOM measurements showed no horizontal page overflow in the narrow export/library cases. The viewport override was reset afterward.

## Validation limits

- The browser automation did **not confirm delivery to the Downloads folder** for newly generated PNG, ZIP, or `.henscreenshots` files. The app created ready links and displayed the real PNG, but download events timed out and the expected files were absent. This does not establish whether the browser integration or the app prevented delivery. The download helper is unchanged. New backup generation and restoration of an existing backup were exercised separately; a fresh disk-to-disk round trip is still unverified.
- This is a recorded manual browser pass plus automated unit/integration tests, not an installed end-to-end browser test runner. New ZIP contents are covered by the export tests, not inspection of a downloaded browser ZIP.
- Cancellation is covered by the automated export tests. No additional translation-model download was needed for the manual-language workflows.
- No cross-browser pass was performed, as requested. No claim of universal browser compatibility or a “100% bug-free” app is made.

The earlier [technical review](technical-review-2026-09-08.md) remains a record of its original baseline. This follow-up addresses its App ownership and initial loading recommendations and adds workflow evidence; the retained-assets/history optimization remains separate work.
