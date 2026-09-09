import { LIMITS } from "../core/model";
import { loadImage } from "./import";
import { megabytes, reviewImage, type ReviewedImage } from "./image-review";

const MAX_OUTPUT_PIXELS = 12_000_000;
function canvasBlob(canvas: HTMLCanvasElement, mime: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(
              new Error(
                "This browser could not compress the image. Try a smaller JPEG or PNG.",
              ),
            ),
      mime,
      quality,
    ),
  );
}
/** User-requested copies only. Preserve aspect ratio, JPEG orientation and alpha. */
export async function compressImage(
  row: ReviewedImage,
  targetBytes: number,
  signal: AbortSignal,
): Promise<ReviewedImage> {
  if (!row.canOptimize || !row.info)
    throw new Error(
      "This image cannot be compressed here. Save a new copy as JPEG or PNG.",
    );
  if (targetBytes < 1024)
    throw new Error(
      "There is not enough room in this project. Remove an image or start another project.",
    );
  const { width, height, mime } = row.info;
  const scale = Math.min(
    1,
    4096 / Math.max(width, height),
    Math.sqrt(MAX_OUTPUT_PIXELS / (width * height)),
  );
  let w = Math.max(1, Math.floor(width * scale)),
    h = Math.max(1, Math.floor(height * scale));
  const sourceBlob = row.file.slice(0, row.file.size, mime);
  let source: ImageBitmap | HTMLImageElement | undefined;
  const canvas = document.createElement("canvas");
  try {
    signal.throwIfAborted();
    if (typeof createImageBitmap === "function") {
      try {
        source = await createImageBitmap(sourceBlob, {
          imageOrientation: "from-image",
          resizeWidth: w,
          resizeHeight: h,
          resizeQuality: "high",
        });
      } catch {
        signal.throwIfAborted();
      }
    }
    if (!source) {
      // Avoid falling back to a full-size HTML decoder for oversized pixel data.
      if (width * height > LIMITS.imagePixels)
        throw new Error(
          "This browser could not resize the large image. Resize it outside the editor or try your browser.",
        );
      source = await loadImage({
        id: "compression",
        name: row.file.name,
        mime,
        width,
        height,
        blob: sourceBlob,
      });
    }
    signal.throwIfAborted();
    // Use the decoder's displayed axes, including EXIF orientation.
    const sw = "naturalWidth" in source ? source.naturalWidth : source.width;
    const sh = "naturalHeight" in source ? source.naturalHeight : source.height;
    const fit = Math.min(
      1,
      4096 / Math.max(sw, sh),
      Math.sqrt(MAX_OUTPUT_PIXELS / (sw * sh)),
    );
    w = Math.max(1, Math.floor(sw * fit));
    h = Math.max(1, Math.floor(sh * fit));
    for (let attempt = 0; attempt < 5; attempt++) {
      signal.throwIfAborted();
      canvas.width = w;
      canvas.height = h;
      const context = canvas.getContext("2d");
      if (!context)
        throw new Error(
          "This browser could not compress the image. Try a smaller JPEG or PNG.",
        );
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(source, 0, 0, w, h);
      // WebP keeps transparent artwork; PNG is the fallback if its encoder is unavailable.
      const blob = await canvasBlob(
        canvas,
        mime === "image/jpeg" ? "image/jpeg" : "image/webp",
        0.9 - attempt * 0.04,
      );
      signal.throwIfAborted();
      if (blob.size <= Math.min(targetBytes, LIMITS.assetBytes)) {
        const extension =
          blob.type === "image/jpeg"
            ? "jpg"
            : blob.type === "image/webp"
              ? "webp"
              : "png";
        const file = new File(
          [blob],
          row.file.name.replace(/\.[^.]*$/, "").slice(0, 225) +
            ".optimized." +
            extension,
          { type: blob.type },
        );
        const reviewed = await reviewImage(
          file,
          Math.min(targetBytes, LIMITS.assetBytes),
        );
        signal.throwIfAborted();
        if (!reviewed.asset) throw new Error(reviewed.error);
        // Keep a valid original if recompression would only make it larger.
        if (
          row.asset &&
          blob.size >= row.asset.blob.size &&
          row.asset.blob.size <= targetBytes
        )
          return row;
        return {
          ...reviewed,
          converted: row.converted,
          optimized: true,
          before: { size: row.file.size, width, height },
        };
      }
      const ratio = Math.max(
        0.35,
        Math.min(0.8, Math.sqrt(targetBytes / blob.size) * 0.9),
      );
      w = Math.max(1, Math.floor(w * ratio));
      h = Math.max(1, Math.floor(h * ratio));
    }
    throw new Error(
      `Compression could not fit this image into ${megabytes(targetBytes)} MB. Free up space in the project or choose a smaller image.`,
    );
  } finally {
    if (source && "close" in source) source.close();
    canvas.width = canvas.height = 0;
  }
}
