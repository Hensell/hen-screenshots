# Device rotation QA — September 10, 2026

Devices now rotate through a full turn around their center. Selecting a frame exposes a round drag handle; the Device panel provides an angle slider and an angle-only reset. Canvas gestures snap near 45° increments and commit once on release. The rotation grip chooses a reachable side when a template places the frame near a canvas edge.

The existing rotation field is retained, with validation expanded to −180° through 180° for primary and companion devices. No project migration is needed. Panorama edits use the existing linked-slide history path. Extra image overlays keep their existing controls.

## Automated verification

- Full suite: `npm test -- --maxWorkers=2 --testTimeout=30000` — 620 tests passed across 47 files.
- Added one further regression for a rotation grip near the top canvas edge; `npm test -- src/rendering/device-resize.test.ts --maxWorkers=2 --testTimeout=30000` — all 12 tests passed.
- Focused placement, gesture and backup tests cover full-angle normalization, center preservation, panorama undo/redo, companion independence, portable backups and invalid values.
- `npm run lint`, `npm run format:check`, `npm run build`, and `git diff --check` passed.
- The scoped bundled `autoreview --mode local --no-web-search --prompt …` review returned **no actionable findings**. It covered rotation changes only; earlier UI work was already reviewed. No findings required acceptance or rejection. Review output: `/tmp/hen-rotation-review.txt` and `/tmp/hen-rotation-review.json`.

## Browser verification

Used the existing local QA project, not a production project, in the Codex in-app browser. Inspected the controls at 1280 × 720, 1440 × 1000, and 390 × 844. Reset the viewport override afterward.

- Dragged the round handle through 90°, −180°, −90°, and 0°. The original device width and x/y position remained unchanged within floating-point precision.
- Confirmed one Undo restores the previous angle.
- Resized a device from a corner at 45°. The angle stayed at 45° and proportions were preserved.
- Reset that device's angle to the template's 8° while retaining the customized 80% size and position.
- Saved a −135° angle and reloaded the page; the inspector and preview retained it.
- Checked mobile copy, controls, keyboard End (180°), reset and horizontal overflow. Reset is a 44px target; the canvas grip has a 44px hit area. The range follows the existing 38px input height.
- Dragged the phone in Sidekick to −90°; the laptop retained −2° and its original placement.
- Dragged from the right-hand panorama canvas to 45°. Both halves and thumbnails updated; selecting the left slide reported the same angle and placement.
- Prepared a panorama ZIP successfully: two PNG files at 1080 × 1920, 0.50 MB. The download link was clicked, but no new file appeared in Downloads in this browser session, so this pass verifies generation rather than filesystem delivery.
- No browser warning or error logs were recorded. Restored the QA project to its original Cabana composition and 8° angle.

Local screenshots are in `exports/qa/device-rotation-2026-09-10/`: `01-drag-90.jpg`, `02-reset-angle-only.jpg`, `03-mobile-controls.jpg`, `04-independent-device.jpg`, `05-panorama-rotation.jpg`, and `06-export-ready.jpg`.

The changes remain local; this task did not push or deploy.
