import { LIMITS, errorMessage, type Asset } from "../core/model";
import { readImageHeader } from "./image-header";
import { importImages } from "./import";
import { isHeif } from "./heif-format";
import { extraImageFormat, formatGuidance } from "./extra-formats";

export const OPTIMIZE_LIMITS = {
  bytes: 80 * 1024 * 1024,
  pixels: 64_000_000,
  side: 32768,
};
export type ImageInfo = Awaited<ReturnType<typeof readImageHeader>>;
export interface ReviewedImage {
  file: File;
  info?: ImageInfo;
  asset?: Asset;
  error?: string;
  canOptimize: boolean;
  optimized?: boolean;
  canConvert?: boolean;
  converted?: boolean;
  conversion?: "heif" | "avif" | "svg";
  before?: { size: number; width: number; height: number };
}
export const megabytes = (bytes: number) => (bytes / 1024 / 1024).toFixed(1);

export async function reviewImage(
  file: File,
  maxBytes = LIMITS.assetBytes,
): Promise<ReviewedImage> {
  const result: ReviewedImage = { file, canOptimize: false };
  try {
    if (!file.size)
      throw new Error(
        "This file is empty (0 bytes). Choose the original image or download it again.",
      );
    if (file.size > OPTIMIZE_LIMITS.bytes)
      throw new Error(
        "This file exceeds the 80 MB limit for local compression. Resize or compress it outside the editor first.",
      );
    const prefix = new Uint8Array(await file.slice(0, 4096).arrayBuffer());
    if (isHeif(prefix)) {
      // Like compression, conversion may prepare an oversized source, never an
      // importable asset. convertHeif rechecks maxBytes (including 5 MB logos).
      return { ...result, canConvert: true, conversion: "heif" };
    }
    const extra = extraImageFormat(prefix);
    if (extra === "avif" || extra === "svg")
      return { ...result, canConvert: true, conversion: extra };
    if (extra) throw new Error(formatGuidance[extra]);
    result.info = await readImageHeader(file);
    const { width, height } = result.info;
    if (!width || !height)
      throw new Error(
        "The image dimensions are invalid. Save a new copy as JPEG or PNG.",
      );
    if (
      width * height > OPTIMIZE_LIMITS.pixels ||
      Math.max(width, height) > OPTIMIZE_LIMITS.side
    )
      throw new Error(
        "This image is too large for safe local compression (64 megapixels or 32,768 pixels per side). Resize it outside the editor first.",
      );
    result.canOptimize = true;
    if (file.size > maxBytes)
      throw new Error(
        `This image is ${megabytes(file.size)} MB; the limit is ${megabytes(maxBytes)} MB. Compress a copy to continue.`,
      );
    if (width * height > LIMITS.imagePixels)
      throw new Error(
        `This image is ${width} × ${height} pixels; the limit is 24 megapixels. Compress a copy to resize it.`,
      );
    [result.asset] = await importImages([file]);
  } catch (error) {
    result.error = errorMessage(error);
  }
  return result;
}

export async function reviewImages(
  files: File[],
  maxBytes = LIMITS.assetBytes,
  signal?: AbortSignal,
): Promise<ReviewedImage[]> {
  if (files.length > LIMITS.shots)
    throw new Error(
      `You selected ${files.length} files. Choose up to 20 images at a time.`,
    );
  const results: ReviewedImage[] = [];
  for (const file of files) {
    signal?.throwIfAborted();
    results.push(await reviewImage(file, maxBytes));
  }
  signal?.throwIfAborted();
  return results;
}

export function selectionBudget(
  rows: ReviewedImage[],
  selected: boolean[],
  available: number,
) {
  const chosen = rows.filter((_, index) => selected[index]);
  const bytes = chosen.reduce(
    (sum, row) => sum + (row.asset?.blob.size ?? row.file.size),
    0,
  );
  return {
    chosen,
    bytes,
    valid:
      chosen.length > 0 &&
      chosen.every((row) => !!row.asset) &&
      bytes <= available,
  };
}

/** Reserve unchanged selections first; valid small files should not take an equal share. */
export function compressionTarget(
  rows: ReviewedImage[],
  selected: boolean[],
  pending: number[],
  available: number,
  maxFile: number,
): number {
  const reserved = rows.reduce(
    (sum, row, index) =>
      sum +
      (selected[index] && !pending.includes(index)
        ? (row.asset?.blob.size ?? row.file.size)
        : 0),
    0,
  );
  const capacity = Math.max(0, available - reserved);
  const desired = pending.map((index) =>
    Math.min(maxFile, rows[index].asset?.blob.size ?? maxFile),
  );
  const total = desired.reduce((sum, bytes) => sum + bytes, 0);
  if (!total) return 0;
  // With several oversized files, share only the budget left after valid files.
  // Recalculate after each result so unused room benefits the next image.
  return Math.floor(
    Math.min(maxFile, capacity, (capacity * desired[0]) / total),
  );
}
