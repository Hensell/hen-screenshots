# Panoramas and separate workspaces v0.6

## Two slides, one scene

**Panorama** is the ninth catalog composition. A single device crosses the boundary between two consecutive slides, over an original continuous ribbon background. It adapts to every existing frame and canvas format.

1. Select a screenshot and open **Templates → Panorama**.
2. **Create 2-slide panorama** adds a right-hand slide using the same source image. The original slide keeps its words; the new caption starts with “A closer look.”
3. The editor displays both halves together. **Edit left slide** and **Edit right slide** choose which caption to change. The image, frame, colors, typography and device placement are shared.
4. **Export this panorama** downloads a ZIP containing two PNGs, each at the selected export dimensions. Whole-series export includes the halves in order. The editor's dashed join is not exported.

Duplicating, moving and removing a panorama operates on both slides as one undoable edit. Applying another template to the pair makes both slides independent; **Separate slides** returns both to Studio while retaining their colors and words. Reapplying Panorama updates the pair without adding another slide.

Creating or duplicating a pair respects the selected destination's screenshot count. A two-slide panorama counts as two screenshots. It cannot be applied to an entire series at once.

## Separate project purposes

**New project** asks where the work will live:

- **App stores:** Apple App Store or Google Play, a store device slot, then **Portrait** or **Landscape** with exact pixel dimensions. Mac and Chromebook expose landscape only.
- **Portfolio:** Card, Square, Editorial, Wide or Custom, with independent canvas orientation. Portrait/landscape counterparts preserve the same shape family. Custom orientation exchanges the committed width and height in one undo step.

The library groups projects into **App stores** and **Portfolio**. A project's inspector only contains formats for that purpose. Existing projects retain their purpose based on their saved export profile. Create another project for another purpose.

Canvas orientation is separate from **Frame orientation**, which controls the depicted phone, tablet or card. Export dimensions remain properties of the canvas, regardless of the mockup device shown inside it.

## Document and renderer

Documents remain schema 4. A panorama is an adjacent `panorama` / `panorama-end` pair with one shared asset, equal effective style except the template role, and equal global device coordinates. Validation rejects disconnected pairs, mismatched sources, styles or placements, and panorama roles inherited as project defaults. Normal editing operations preserve these invariants. Backup import remaps both slides and their single shared asset normally.

The renderer uses a 2160-unit scene for shared backgrounds and the device. Each PNG crops a 1080-unit half; captions use their own slide coordinates. The same scene builder serves gallery previews, editing and export. The original eight templates retain their rendering paths. There are no new runtime dependencies or server requirements.

The three new portfolio-only orientation counterparts bring the catalog to 22 export profiles. Existing store dimensions and PNG validation rules remain unchanged. Older app builds cannot open documents containing unrecognized template/profile IDs.

## Validation

Unit coverage includes preview/application parity, pair validation, editing from either half, atomic operations, count limits, reflow and undo, and portable backup round trips. A geometry matrix covers all export profiles and custom size extremes with all seven frame types, both frame orientations, and framed/unframed devices. Production TypeScript and Vite build checks are included in `npm run check`.
