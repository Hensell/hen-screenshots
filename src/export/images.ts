import Konva from "konva";
import {
  resolveExportProfile,
  validateDimensions,
  validateExportPng,
} from "../core/export-profiles";
import type { Project, Shot } from "../core/model";
import { ensureSceneFonts } from "../rendering/fonts";
import { createScene } from "../rendering/scene";

/** Render the same scene as Artboard, at native size and without editor controls. */
export async function renderShot(
  project: Project,
  shot: Shot,
  image: HTMLImageElement,
): Promise<Blob> {
  // Freeze the requested revision before font loading or PNG encoding can yield.
  const snapshot = structuredClone({ project, shot });
  const profile = resolveExportProfile(snapshot.project);
  const dimensions = { width: profile.width, height: profile.height };
  validateDimensions(profile, dimensions.width, dimensions.height);
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
    stage.add(createScene(snapshot.project, snapshot.shot, image));
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
    const context = opaque.getContext("2d", { alpha: false });
    if (!context)
      throw new Error("The browser could not prepare the export canvas.");
    context.drawImage(canvas, 0, 0);
    const blob = await new Promise<Blob>((resolve, reject) => {
      opaque.toBlob((result) => {
        if (!result || result.size === 0 || result.type !== "image/png")
          reject(
            new Error(
              "The browser could not create a PNG. Try exporting again.",
            ),
          );
        else resolve(result);
      }, "image/png");
    });
    await validateExportPng(blob, profile);
    return blob;
  } catch (cause) {
    const detail = cause instanceof Error ? ` ${cause.message}` : "";
    throw new Error(`Screenshot export failed.${detail}`, { cause });
  } finally {
    stage?.destroy();
    container.remove();
  }
}
