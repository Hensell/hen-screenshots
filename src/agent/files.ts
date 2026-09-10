import { open, realpath } from "node:fs/promises";
import { basename, resolve } from "node:path";
import sharp from "sharp";
import { LIMITS, type Asset } from "../core/model";
import { readImageHeader } from "../assets/image-header";

export function localPath(path: string, directory: string) {
  if (/^[a-z][a-z\d+.-]*:/i.test(path) && !/^[a-z]:[\\/]/i.test(path))
    throw new Error("Use local image files, not URLs or data URIs.");
  return resolve(directory, path);
}
/** Bound reads on the opened descriptor, including files changed during a read. */
export async function readLocalFile(
  path: string,
  limit: number,
): Promise<File> {
  const handle = await open(path, "r");
  try {
    const info = await handle.stat();
    if (!info.isFile() || !info.size)
      throw new Error(`“${basename(path)}” is not a non-empty file.`);
    if (info.size > limit)
      throw new Error(
        `“${basename(path)}” exceeds the ${Math.round(limit / 1024 / 1024)} MB limit.`,
      );
    const data = Buffer.alloc(info.size);
    let offset = 0;
    while (offset < data.length) {
      const { bytesRead } = await handle.read(
        data,
        offset,
        data.length - offset,
        offset,
      );
      if (!bytesRead)
        throw new Error(
          `“${basename(path)}” changed while being read. Try again.`,
        );
      offset += bytesRead;
    }
    if ((await handle.stat()).size !== info.size)
      throw new Error(
        `“${basename(path)}” changed while being read. Try again.`,
      );
    return new File([new Uint8Array(data)], basename(path));
  } finally {
    await handle.close();
  }
}
export async function decodeNativeImages(files: File[]): Promise<Asset[]> {
  if (files.reduce((total, f) => total + f.size, 0) > LIMITS.totalBytes)
    throw new Error("The selected images exceed 120 MB.");
  const assets: Asset[] = [];
  for (const file of files) {
    if (!file.size || file.size > LIMITS.assetBytes)
      throw new Error(
        `“${file.name}” must be non-empty and no larger than 50 MB.`,
      );
    try {
      const header = await readImageHeader(file);
      const data = Buffer.from(await file.arrayBuffer());
      // Header validation rejects unsupported or animated formats before native decoding.
      const { info } = await sharp(data, {
        limitInputPixels: LIMITS.imagePixels,
        failOn: "warning",
      })
        .rotate()
        .png()
        .toBuffer({ resolveWithObject: true });
      assets.push({
        id: crypto.randomUUID(),
        name: file.name.slice(0, 255),
        mime: header.mime,
        width: info.width,
        height: info.height,
        blob: file,
      });
    } catch (cause) {
      throw new Error(
        `Could not read “${file.name}”: ${cause instanceof Error ? cause.message : "invalid image"}. Plugin v0.1 accepts PNG, JPEG and still WebP up to 24 megapixels. Use the web studio to convert other formats.`,
        { cause },
      );
    }
  }
  return assets;
}
export async function readAssets(paths: string[], directory: string) {
  const assets = new Map<string, Asset>();
  const byPath = new Map<string, Asset>();
  let total = 0;
  for (const path of paths) {
    const absolute = await realpath(localPath(path, directory));
    let asset = byPath.get(absolute);
    if (!asset) {
      const file = await readLocalFile(absolute, LIMITS.assetBytes);
      total += file.size;
      if (total > LIMITS.totalBytes)
        throw new Error("The selected images exceed 120 MB.");
      [asset] = await decodeNativeImages([file]);
      byPath.set(absolute, asset);
    }
    assets.set(path, asset);
  }
  return assets;
}
