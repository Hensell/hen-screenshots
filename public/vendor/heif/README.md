# HEIF decoder

`libheif-1.22.2.mjs` is an **unmodified** Emscripten build of libheif 1.22.2 with libde265 1.0.16, distributed in heic-to v1.5.2:

- Exact module: https://github.com/hoppergee/heic-to/blob/v1.5.2/src/lib/libheif.js
- Corresponding source and build instructions: https://github.com/hoppergee/heic-to/tree/v1.5.2
- libheif source: https://github.com/strukturag/libheif/tree/v1.22.2
- libde265 source: https://github.com/strukturag/libde265/tree/v1.0.16
- JavaScript binding source: https://github.com/catdad-experiments/libheif-js

The decoder and its embedded WebAssembly are licensed under LGPL-3.0 (see COPYING for LGPL and GPL terms). Copyright belongs to the upstream authors. Hen Screenshots' MIT license does not replace the decoder's license. This module is served separately, loaded only on request, and can be replaced with a compatible rebuild at the same path. No decoder source modifications were made.

This build was selected after comparing an iPadOS 26 HDR HEIC against native libheif output. The initial libheif-js 1.23.2 build produced corrupted pixels with that 10-bit 4:4:4 sample. Keep that regression check when updating.

Refresh the module from the exact tagged URL above, retain the license and provenance, and rerun real-browser HEIC conversion checks before shipping an update.
fb0d14aadb0c6059aafda4cfa258d10029833e9dcfc0cd14e25b9b065d372a8b  public/vendor/heif/libheif-1.22.2.mjs
