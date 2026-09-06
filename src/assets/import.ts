import { LIMITS } from "../core/model";
import type { Asset } from "../core/model";

function dimensions(bytes: Uint8Array): {
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
    while (position + 3 < bytes.length) {
      if (bytes[position++] !== 255) break;
      while (bytes[position] === 255) position++;
      const marker = bytes[position++];
      if (marker === 217 || marker === 218 || position + 2 > bytes.length)
        break;
      if (marker === 1 || (marker >= 208 && marker <= 215)) continue;
      const length = view.getUint16(position);
      if (length < 2 || position + length > bytes.length) break;
      if (
        marker >= 192 &&
        marker <= 207 &&
        ![196, 200, 204].includes(marker) &&
        length >= 8
      ) {
        return {
          mime: "image/jpeg",
          width: view.getUint16(position + 5),
          height: view.getUint16(position + 3),
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
  throw new Error("Choose a valid PNG, JPEG, or still WebP image.");
}

function checkPixels(width: number, height: number): void {
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 1 ||
    height < 1 ||
    width * height > LIMITS.imagePixels
  ) {
    throw new Error("Each image must be no larger than 24 megapixels.");
  }
}

/** Decode an image and release its temporary URL even when decoding fails. */
export function loadImage(asset: Asset): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(
      asset.blob.slice(0, asset.blob.size, asset.mime),
    );
    const image = new Image();
    image.decoding = "async";
    const finish = () => {
      image.onload = null;
      image.onerror = null;
      URL.revokeObjectURL(url);
    };
    image.onload = () => {
      finish();
      try {
        checkPixels(image.naturalWidth, image.naturalHeight);
        resolve(image);
      } catch (error) {
        reject(error);
      }
    };
    image.onerror = () => {
      finish();
      reject(
        new Error(`Could not decode “${asset.name}”. Choose another image.`),
      );
    };
    image.src = url;
  });
}

/** Validate the whole batch before returning any assets; the caller owns persistence. */
export async function importImages(files: File[]): Promise<Asset[]> {
  if (files.length > LIMITS.shots)
    throw new Error("Choose up to 20 images at a time.");
  if (files.some((file) => !file.size || file.size > LIMITS.assetBytes))
    throw new Error("Each image must be between 1 byte and 20 MB.");
  if (files.reduce((total, file) => total + file.size, 0) > LIMITS.totalBytes)
    throw new Error("The selected images exceed 120 MB.");
  const assets: Asset[] = [];
  // Decode sequentially to keep peak memory bounded on mobile browsers.
  for (const file of files) {
    const header = dimensions(new Uint8Array(await file.arrayBuffer()));
    checkPixels(header.width, header.height);
    const asset: Asset = {
      id: crypto.randomUUID(),
      name: file.name.slice(0, 255),
      ...header,
      blob: file,
    };
    const image = await loadImage(asset);
    // Browsers apply JPEG orientation during decoding; use those display dimensions.
    assets.push({
      ...asset,
      width: image.naturalWidth,
      height: image.naturalHeight,
    });
  }
  return assets;
}
