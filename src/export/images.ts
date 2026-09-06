import Konva from "konva";
import { CANVAS } from "../core/model";
import type { Project, Shot } from "../core/model";
import { ensureManrope } from "../rendering/fonts";
import { createScene } from "../rendering/scene";

/** Render the same scene as Artboard, at native size and without editor controls. */
export async function renderShot(
  project: Project,
  shot: Shot,
  image: HTMLImageElement,
): Promise<Blob> {
  // Freeze the requested revision before font loading or PNG encoding can yield.
  const snapshot = structuredClone({ project, shot });
  await ensureManrope();
  const container = document.createElement("div");
  let stage: Konva.Stage | undefined;
  try {
    stage = new Konva.Stage({ container, ...CANVAS });
    stage.add(createScene(snapshot.project, snapshot.shot, image));
    stage.draw();
    const canvas = stage.toCanvas({
      ...CANVAS,
      pixelRatio: 1,
      imageSmoothingEnabled: true,
    });
    if (canvas.width !== CANVAS.width || canvas.height !== CANVAS.height)
      throw new Error("The exported image has incorrect dimensions.");
    // Canvas PNG encoders otherwise retain an alpha channel even when all pixels
    // are opaque. Google Play expects a 24-bit PNG without that channel.
    const opaque = document.createElement("canvas");
    opaque.width = CANVAS.width;
    opaque.height = CANVAS.height;
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
    return blob;
  } catch (cause) {
    const detail = cause instanceof Error ? ` ${cause.message}` : "";
    throw new Error(`Screenshot export failed.${detail}`, { cause });
  } finally {
    stage?.destroy();
    container.remove();
  }
}
