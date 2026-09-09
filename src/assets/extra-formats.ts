/** Identify source containers by content, including files with a wrong extension. */
export function extraImageFormat(bytes: Uint8Array) {
  const text = String.fromCharCode(...bytes);
  if (text.slice(4, 8) === "ftyp") {
    const size = new DataView(
      bytes.buffer,
      bytes.byteOffset,
      bytes.byteLength,
    ).getUint32(0);
    const brands = [text.slice(8, 12)];
    for (let at = 16; at + 4 <= Math.min(size, bytes.length); at += 4)
      brands.push(String.fromCharCode(...bytes.subarray(at, at + 4)));
    if (brands.includes("avis")) return "animated-avif";
    if (brands.includes("avif")) return "avif";
    if (brands.some((brand) => ["jxl ", "jxlc"].includes(brand))) return "jxl";
  }
  if (
    /^\s*(?:<\?xml[^>]*>\s*)?(?:<!--[\s\S]*?-->\s*)*(?:<!DOCTYPE\s+svg[\s\S]*?>\s*)?<svg[\s>]/i.test(
      text,
    )
  )
    return "svg";
  if (text.startsWith("%PDF-")) return "pdf";
  if (text.startsWith("BM")) return "bmp";
  if (
    (bytes[0] === 73 && bytes[1] === 73 && [42, 43].includes(bytes[2])) ||
    (bytes[0] === 77 && bytes[1] === 77 && [42, 43].includes(bytes[3]))
  )
    return "tiff";
  if ((bytes[0] === 255 && bytes[1] === 10) || text.slice(4, 8) === "JXL ")
    return "jxl";
  if (text.startsWith("8BPS")) return "psd";
  return undefined;
}

export const formatGuidance = {
  "animated-avif":
    "Animated AVIF is not supported. Export one frame as PNG or JPEG.",
  pdf: "This is a PDF document, not a screenshot image. Export the page you want as PNG or JPEG, then import it.",
  bmp: "This is a BMP image. Save a copy as PNG to preserve its quality, then import that copy.",
  tiff: "This is a TIFF image. Export a flattened RGB PNG or JPEG from your image editor, then import that copy.",
  jxl: "This is a JPEG XL image. Export it as PNG or JPEG from an editor that supports JPEG XL.",
  psd: "This is a Photoshop document. Export the visible artwork as PNG or JPEG, then import that image.",
} as const;

/** Inspect AVIF dimensions before letting a browser allocate decoded pixels.
 * All spatial properties are bounded, including auxiliary images and tiles.
 */
export function validateAvif(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let properties = 0,
    count = 0;
  function scan(start: number, end: number, depth: number) {
    if (depth > 5)
      throw new Error("Invalid AVIF metadata. Export a new PNG or JPEG copy.");
    for (let at = start; at < end;) {
      if (++count > 8192 || at + 8 > end)
        throw new Error(
          "Invalid AVIF metadata. Export a new PNG or JPEG copy.",
        );
      let size = view.getUint32(at),
        header = 8;
      if (size === 1) {
        if (at + 16 > end)
          throw new Error(
            "Invalid AVIF metadata. Export a new PNG or JPEG copy.",
          );
        size = Number(view.getBigUint64(at + 8));
        header = 16;
      } else if (!size) size = end - at;
      if (!Number.isSafeInteger(size) || size < header || at + size > end)
        throw new Error(
          "Invalid AVIF metadata. Export a new PNG or JPEG copy.",
        );
      const type = String.fromCharCode(...bytes.subarray(at + 4, at + 8));
      if (type === "moov") throw new Error(formatGuidance["animated-avif"]);
      if (type === "ispe") {
        if (size < header + 12)
          throw new Error(
            "Invalid AVIF metadata. Export a new PNG or JPEG copy.",
          );
        checkConversionSize(
          view.getUint32(at + header + 4),
          view.getUint32(at + header + 8),
        );
        properties++;
      } else if (["meta", "iprp", "ipco"].includes(type))
        scan(at + header + (type === "meta" ? 4 : 0), at + size, depth + 1);
      at += size;
    }
  }
  scan(0, bytes.length, 0);
  if (!properties)
    throw new Error("Invalid AVIF metadata. Export a new PNG or JPEG copy.");
}

export function checkConversionSize(width: number, height: number) {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width < 1 ||
    height < 1 ||
    width * height > 24_000_000 ||
    Math.max(width, height) > 32768
  )
    throw new Error(
      "Conversion supports images up to 24 megapixels and 32,768 pixels per side. Export a smaller PNG or JPEG copy first.",
    );
}
