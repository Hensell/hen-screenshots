import Konva from "konva";
import {
  resolveExportProfile,
  validateDimensions,
  validateExportPng,
} from "../core/export-profiles";
import type { Project, Shot } from "../core/model";
import { ensureSceneFonts } from "../rendering/fonts";
import { createScene } from "../rendering/scene";
import { readImageHeader } from "../assets/image-header";
import { RECOMMENDED_IMAGE_BYTES, type ExportImageFormat } from "./review";

export async function encodeExportCanvas(
  canvas: HTMLCanvasElement,
  format: ExportImageFormat,
  signal?: AbortSignal,
): Promise<Blob> {
  const mime = format === "jpeg" ? "image/jpeg" : "image/png";
  const encode = (quality?: number) =>
    new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) =>
          blob?.size && blob.type === mime
            ? resolve(blob)
            : reject(
                new Error(
                  "The browser could not encode this image format. Try PNG or use another browser.",
                ),
              ),
        mime,
        quality,
      );
    });
  signal?.throwIfAborted();
  let blob = await encode(format === "jpeg" ? 0.94 : undefined);
  if (format === "jpeg")
    for (const quality of [0.88, 0.8, 0.72]) {
      signal?.throwIfAborted();
      if (blob.size <= RECOMMENDED_IMAGE_BYTES) break;
      blob = await encode(quality);
    }
  signal?.throwIfAborted();
  return blob;
}

/** Render the same scene as Artboard, at native size and without editor controls. */
export async function renderShot(
  project: Project,
  shot: Shot,
  image: HTMLImageElement,
  images?: ReadonlyMap<string, HTMLImageElement>,
  encoding: { format?: ExportImageFormat; signal?: AbortSignal } = {},
): Promise<Blob> {
  // Freeze the requested revision before font loading or PNG encoding can yield.
  const sources = new Map(images);
  const snapshot = structuredClone({ project, shot });
  const profile = resolveExportProfile(snapshot.project);
  const dimensions = { width: profile.width, height: profile.height };
  validateDimensions(profile, dimensions.width, dimensions.height);
  if (
    profile.sourceOnly &&
    image.naturalWidth * profile.height !== image.naturalHeight * profile.width
  )
    throw new Error(
      "Wear OS needs a square app capture. Replace this image with a square screenshot; it will not be cropped or stretched.",
    );
  if (profile.sourceOnly) {
    const check = document.createElement("canvas");
    check.width = dimensions.width;
    check.height = dimensions.height;
    try {
      const context = check.getContext("2d", { willReadFrequently: true });
      if (!context)
        throw new Error("The browser could not prepare the export canvas.");
      context.drawImage(image, 0, 0, check.width, check.height);
      const pixels = context.getImageData(0, 0, check.width, check.height).data;
      for (let i = 3; i < pixels.length; i += 4)
        if (pixels[i] !== 255)
          throw new Error(
            "Wear OS captures must be fully opaque. Replace this image with a square screenshot without transparent masking.",
          );
    } finally {
      check.width = 0;
      check.height = 0;
    }
  }
  await ensureSceneFonts(snapshot.project, snapshot.shot);
  const container = document.createElement("div");
  let stage: Konva.Stage | undefined;
  try {
    stage = new Konva.Stage({
      container,
      ...dimensions,
      scaleX: dimensions.width / 1080,
      scaleY: dimensions.width / 1080,
    });
    stage.add(
      createScene(snapshot.project, snapshot.shot, image, { images: sources }),
    );
    stage.draw();
    const canvas = stage.toCanvas({
      ...dimensions,
      pixelRatio: 1,
      imageSmoothingEnabled: true,
    });
    if (
      canvas.width !== dimensions.width ||
      canvas.height !== dimensions.height
    )
      throw new Error("The exported image has incorrect dimensions.");
    // Canvas PNG encoders otherwise retain an alpha channel even when all pixels
    // are opaque. Google Play expects a 24-bit PNG without that channel.
    const opaque = document.createElement("canvas");
    opaque.width = dimensions.width;
    opaque.height = dimensions.height;
    const context = opaque.getContext("2d", {
      alpha: false,
      colorSpace: "srgb",
    });
    if (!context)
      throw new Error("The browser could not prepare the export canvas.");
    context.drawImage(canvas, 0, 0);
    let blob: Blob;
    try {
      blob = await encodeExportCanvas(
        opaque,
        encoding.format ?? "png",
        encoding.signal,
      );
    } finally {
      opaque.width = 0;
      opaque.height = 0;
      canvas.width = 0;
      canvas.height = 0;
    }
    if (encoding.format === "jpeg") {
      const info = await readImageHeader(blob);
      if (info.mime !== "image/jpeg")
        throw new Error(
          "The browser could not encode this image format. Try PNG or use another browser.",
        );
      validateDimensions(profile, info.width, info.height);
    } else await validateExportPng(blob, profile);
    return blob;
  } catch (cause) {
    const detail = cause instanceof Error ? ` ${cause.message}` : "";
    throw new Error(`Screenshot export failed.${detail}`, { cause });
  } finally {
    stage?.destroy();
    container.remove();
  }
}
