import type { Asset } from "../core/model";
import { loadImage } from "./import";

/** Keep undo assets stored, but decode only the images in the current document. */
export async function loadReferencedImages(
  assets: Asset[],
  references: string[],
  cache: ReadonlyMap<string, HTMLImageElement>,
  signal: AbortSignal,
): Promise<Map<string, HTMLImageElement>> {
  const sources = new Map(assets.map((asset) => [asset.id, asset]));
  const images = new Map<string, HTMLImageElement>();
  // Decode sequentially so reopening a large project does not start every
  // full-resolution image decoder at once. A stale pass stops after its decode.
  for (const id of new Set(references)) {
    signal.throwIfAborted();
    const asset = sources.get(id);
    if (!asset)
      throw new Error(
        "A screenshot image is missing. Replace it and try again.",
      );
    images.set(id, cache.get(id) ?? (await loadImage(asset)));
  }
  signal.throwIfAborted();
  return images;
}
