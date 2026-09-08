import type { Asset } from "../core/model";
/** EXIF orientations 5–8 swap the displayed axes. Ignore invalid optional metadata. */
function jpegOrientation(bytes: Uint8Array): number {
  try {
    if (String.fromCharCode(...bytes.subarray(0, 6)) !== "Exif\0\0") return 1;
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const little = view.getUint16(6) === 0x4949;
    if (view.getUint16(8, little) !== 42) return 1;
    const offset = 6 + view.getUint32(10, little),
      count = view.getUint16(offset, little);
    for (let i = 0; i < count; i++) {
      const at = offset + 2 + i * 12;
      if (
        view.getUint16(at, little) === 0x112 &&
        view.getUint16(at + 2, little) === 3 &&
        view.getUint32(at + 4, little) === 1
      ) {
        const value = view.getUint16(at + 8, little);
        return value >= 1 && value <= 8 ? value : 1;
      }
    }
  } catch {
    /* Invalid EXIF cannot make an otherwise valid JPEG unreadable. */
  }
  return 1;
}
export function imageHeader(bytes: Uint8Array): {
  mime: Asset["mime"];
  width: number;
  height: number;
} {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const text = (start: number, end: number) =>
    String.fromCharCode(...bytes.subarray(start, end));
  if (
    bytes.length >= 24 &&
    bytes[0] === 137 &&
    text(1, 8) === "PNG\r\n\x1a\n" &&
    text(12, 16) === "IHDR"
  ) {
    for (let at = 8; at + 12 <= bytes.length;) {
      const length = view.getUint32(at);
      const chunk = text(at + 4, at + 8);
      if (chunk === "acTL")
        throw new Error(
          "Animated PNG is not supported. Export a still PNG, JPEG, or WebP.",
        );
      if (chunk === "IDAT") break;
      at += length + 12;
    }
    return {
      mime: "image/png",
      width: view.getUint32(16),
      height: view.getUint32(20),
    };
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 255 &&
    bytes[1] === 216 &&
    bytes[2] === 255
  ) {
    let position = 2;
    let orientation = 1;
    while (position + 3 < bytes.length) {
      if (bytes[position++] !== 255) break;
      while (bytes[position] === 255) position++;
      const marker = bytes[position++];
      if (marker === 217 || marker === 218 || position + 2 > bytes.length)
        break;
      if (marker === 1 || (marker >= 208 && marker <= 215)) continue;
      const length = view.getUint16(position);
      if (length < 2 || position + length > bytes.length) break;
      if (marker === 225 && text(position + 2, position + 8) === "Exif\0\0")
        orientation = jpegOrientation(
          bytes.subarray(position + 2, position + length),
        );
      if (
        marker >= 192 &&
        marker <= 207 &&
        ![196, 200, 204].includes(marker) &&
        length >= 8
      ) {
        return {
          mime: "image/jpeg",
          width: view.getUint16(position + (orientation >= 5 ? 3 : 5)),
          height: view.getUint16(position + (orientation >= 5 ? 5 : 3)),
        };
      }
      position += length;
    }
  }
  if (bytes.length >= 25 && text(0, 4) === "RIFF" && text(8, 12) === "WEBP") {
    const kind = text(12, 16);
    const uint24 = (at: number) =>
      bytes[at] | (bytes[at + 1] << 8) | (bytes[at + 2] << 16);
    if (kind === "VP8X" && bytes.length >= 30) {
      if (bytes[20] & 2)
        throw new Error(
          "Animated WebP is not supported. Choose a still screenshot.",
        );
      return {
        mime: "image/webp",
        width: uint24(24) + 1,
        height: uint24(27) + 1,
      };
    }
    if (kind === "VP8L" && bytes[20] === 47) {
      return {
        mime: "image/webp",
        width: 1 + (bytes[21] | ((bytes[22] & 63) << 8)),
        height:
          1 + ((bytes[22] >> 6) | (bytes[23] << 2) | ((bytes[24] & 15) << 10)),
      };
    }
    if (
      kind === "VP8 " &&
      bytes.length >= 30 &&
      bytes[23] === 157 &&
      bytes[24] === 1 &&
      bytes[25] === 42
    ) {
      return {
        mime: "image/webp",
        width: view.getUint16(26, true) & 16383,
        height: view.getUint16(28, true) & 16383,
      };
    }
  }
  if (text(4, 8) === "ftyp") {
    const brands = text(8, Math.min(bytes.length, 64));
    if (/avif|avis/.test(brands))
      throw new Error(
        "AVIF is not supported. Export this image as JPEG, PNG, or still WebP.",
      );
    if (/heic|heix|hevc|hevx|mif1/.test(brands))
      throw new Error(
        "This is a HEIC/HEIF image. Export it as JPEG or PNG; renaming the file is not enough.",
      );
  }
  if (text(0, 3) === "GIF")
    throw new Error("GIF is not supported. Export a still PNG, JPEG, or WebP.");
  throw new Error(
    "Choose a valid PNG, JPEG, or still WebP image. The file signature or image metadata is missing or invalid.",
  );
}

/** Read common headers cheaply; bounded JPEG metadata may put SOF beyond the prefix. */
export async function readImageHeader(file: Blob) {
  const prefix = new Uint8Array(await file.slice(0, 1024 * 1024).arrayBuffer());
  try {
    const header = imageHeader(prefix);
    if (header.mime === "image/png") {
      // APNG control chunks must precede IDAT. Ancillary metadata can exceed
      // the initial prefix, so continue through cached byte windows, not pixels.
      let window = prefix,
        start = 0;
      for (let at = 8; at + 8 <= file.size;) {
        if (at + 8 > start + window.length) {
          start = at;
          window = new Uint8Array(
            await file.slice(at, at + 1024 * 1024).arrayBuffer(),
          );
        }
        const local = at - start;
        const length = new DataView(
          window.buffer,
          window.byteOffset + local,
          4,
        ).getUint32(0);
        const chunk = String.fromCharCode(
          ...window.subarray(local + 4, local + 8),
        );
        if (chunk === "acTL")
          throw new Error(
            "Animated PNG is not supported. Export a still PNG, JPEG, or WebP.",
          );
        if (chunk === "IDAT" || chunk === "IEND") break;
        at += length + 12;
      }
    }
    return header;
  } catch (error) {
    if (
      prefix[0] === 255 &&
      prefix[1] === 216 &&
      prefix[2] === 255 &&
      file.size > prefix.length &&
      file.size <= 80 * 1024 * 1024
    ) {
      // Both callers check their byte cap first. Only uncommon metadata-heavy
      // JPEGs need the full bounded file; no pixel decode occurs during parsing.
      return imageHeader(new Uint8Array(await file.arrayBuffer()));
    }
    throw error;
  }
}
