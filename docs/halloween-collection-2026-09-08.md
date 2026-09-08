# Halloween collection — September 8, 2026

Six original templates join the catalog, bringing the total to 35. They remain available year-round and use the existing editable colors, device frames, text placement, and export formats.

| Template | Direction | Composition |
| --- | --- | --- |
| Jack O’ Lantern | Cream, warm orange, carved pumpkins | Device tilted toward the lower right |
| Cobweb | Charcoal, silver webs, hanging spider | Raised device on the left, serif headline below |
| Boo | Lavender, friendly ghosts | Raised device on the right |
| Witching Hour | Dark plum, gold stars, crescent and witch hat | Device tilted inside a celestial circle |
| Candy Club | Warm cream, pink ribbons, wrapped sweets | Centered device with captions below |
| Moonlight | Navy, moon, bats, rolling night hills | One device across two linked slides |

Search **Halloween** or **October** in Templates. Seasonal descriptions, decoration labels, and search terms are localized into Spanish and Brazilian Portuguese; **calabaza**, **abóbora**, **octubre**, and **outubro** are supported in their respective interface languages. Existing appearance and composition filters apply to the collection.

Artwork is drawn with deterministic Konva vectors and exported through the existing PNG renderer. No external illustration assets, network requests, or dependencies are required. New template IDs preserve existing layouts; the device inset only applies to the new single-slide designs. Moonlight uses the shared panorama coordinates so its artwork continues across the exported seam.

## Verification

- Visual review in the in-app browser with real screenshots for all six designs.
- 28 actual PNGs decoded and validated: seven slides per format at 1080 × 1920, 2752 × 2064, 1600 × 1200, and 2560 × 640. Dimensions and opaque RGB encoding passed.
- Editor checks in a dedicated QA project: Portuguese and Spanish search, individual template application, linked panorama application, preserved captions, undo, and redo.
- Geometry coverage includes all seven frame families, both device orientations, all store presets for the panorama, and extreme custom aspect ratios. Moonlight captions stay outside the default rotated device bounds.
- Existing backup round-trip coverage includes Moonlight, preserving paired roles, captions, and original image bytes.

The collection adds no new store sizes or upload requirements. It uses the same validated export profiles as the rest of the catalog.
