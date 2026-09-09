import { readImageHeader } from "./image-header";
import { LIMITS } from "../core/model";
import type { Asset } from "../core/model";

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
    const timer = setTimeout(() => {
      finish();
      image.src = "";
      reject(
        new Error(
          `Reading “${asset.name}” took too long. Try a smaller copy or save it again as JPEG or PNG.`,
        ),
      );
    }, 25000);
    const finish = () => {
      clearTimeout(timer);
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
        new Error(
          `Could not decode “${asset.name}”. The file may be damaged or use an encoding this browser cannot read. Try an optimized copy, save it again as JPEG or PNG, or open the editor in your browser.`,
        ),
      );
    };
    image.src = url;
  });
}

/** Validate the whole batch before returning any assets; the caller owns persistence. */
export async function importImages(files: File[]): Promise<Asset[]> {
  if (files.length > LIMITS.shots)
    throw new Error("Choose up to 20 images at a time.");
  for (const file of files) {
    if (!file.size)
      throw new Error(
        `“${file.name}” is empty (0 bytes). Choose the original image or download it again.`,
      );
    if (file.size > LIMITS.assetBytes)
      throw new Error(
        `“${file.name}” is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 50 MB per image. Compress a copy or choose a smaller image.`,
      );
  }
  if (files.reduce((total, file) => total + file.size, 0) > LIMITS.totalBytes)
    throw new Error("The selected images exceed 120 MB.");
  const assets: Asset[] = [];
  // Decode sequentially to keep peak memory bounded on mobile browsers.
  for (const file of files) {
    const header = await readImageHeader(file);
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
