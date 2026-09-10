# Panorama collection QA — September 10, 2026

Six two-slide panorama templates extend the catalog from 51 to 57 designs and from five to eleven panorama families.

| Template | Composition |
| --- | --- |
| Atrium | Warm paper, sage cylindrical pedestal, architectural light, isometric device |
| Obsidian | Graphite platform, metallic device edges, opposite captions, isometric device |
| Offset | Lilac steps, lime platform, captions above the portrait scene, isometric device |
| Signal | Coral diagonal bands, angled device and bold captions |
| Mosaic | Rose tiles and rounded insets, device above portrait captions |
| Folio | Layered paper, fine rules, serif type and an upright asymmetric device |

Atrium, Obsidian and Offset use fixed orthographic yaw/pitch poses with an extruded shell. The screenshot, bezel and camera share the same transform. Placement and transformation controls remain on the outer device group, preserving the editor's existing coordinates, resize handles, rotation and undo history. These are editable isometric compositions, not a general-purpose 3D camera editor. Existing flat templates retain their rendering.

The gallery supports the new families through its existing composition, appearance, category, favorite and pagination filters. Search `3D` or `perspective`; Spanish and Portuguese `perspectiva` searches work too. Descriptions and decoration labels are translated. Public template counts were updated in English, Spanish, Portuguese and the README.

## Automated verification

- `npm test -- --maxWorkers=2 --testTimeout=30000`: **680 tests passed across 49 files**.
- Panorama geometry tests now cover every family, supported export profiles, extreme custom sizes, all seven device families, both frame orientations and frame visibility. They check bounds and that the device still crosses the seam. This caught and fixed asymmetric devices missing the seam on very wide custom canvases.
- Expanded pair lifecycle and backup tests cover preview/application consistency, preserved captions and colors, duplication, reordering, deletion, separation, validation and portable project round trips.
- Projection tests check transformed corner bounds, image/camera registration, identical transforms across the seam at 137° rotation, deterministic decoration and omission of intentionally empty devices from exports.
- Discovery tests cover 3D search, appearance, favorites and translated keywords; localized metadata is complete.
- Type checking, lint, formatting, build and whitespace checks passed. After the count correction, all nine i18n tests and `npm run seo:check` passed, including localized static pages and the packaged plugin.
- The scoped bundled autoreview found one stale landing-page count, which was corrected in all three languages. The second review returned **no actionable findings**. Reports: `/tmp/hen-panorama-review-2.txt` and `/tmp/hen-panorama-review-2.json`.

## Visual and interaction verification

Used the local app in the Codex in-app browser and actual FrogHappy and portfolio screenshots. The local fixture `exports/qa/panorama-collection.html` calls the production PNG renderer and validates decoded PNG dimensions and opaque RGB format for every output.

- Inspected all six families as phone pairs at **1080 × 1920**, iPad landscape pairs at **2752 × 2064**, laptop portfolio cards at **1600 × 1200**, and wide laptop pairs at **2560 × 640**: **48 distinct exported PNGs** across the four presets.
- Widened Folio's right caption column after visual inspection. Moved Signal's decorative circle clear of supporting copy in landscape, omitted small landscape hash marks and shortened Offset's landscape platform to leave captions clear.
- In the Spanish gallery, `perspectiva` plus the panorama filter returned Atrium, Obsidian and Offset with the user's screenshot and localized descriptions.
- Created the separate local project **Panorama collection · QA**, imported a FrogHappy PNG and applied Atrium. The original QA project and production projects were not edited.
- Dragged the circular rotation handle to **45°**, resized from a corner to **91%**, and dragged the device. Both slides and thumbnails updated together.
- One Undo restored the previous position. Reset rotation restored **−12°**, preserving the **91%** size and adjusted x/y coordinates. Reloading retained the template, image, pair, size and placement.

Evidence is saved locally under `exports/qa/panorama-collection-2026-09-10/`. Export fixture files and screenshots are ignored development artifacts.

During QA, the local Cloudflare dev runtime needed a restart after a build. A screenshot write also encountered a full disk; only the reproducible `/tmp/hen-translation-model-qa/Xenova` model cache was removed, freeing approximately 542 MB. No user project data was deleted.

The feature remains local. No push or deployment was performed for this request.
