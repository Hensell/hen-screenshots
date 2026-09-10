import Konva from "konva";
import type { Project } from "../core/model";
import { sceneAssetIds } from "../core/overlays";
import { canonicalCanvas } from "../core/export-profiles";
import { previewDimensions } from "../rendering/geometry";
import { loadSceneAssets } from "../storage/repository";
import { loadReferencedImages } from "../assets/project-images";
import { ensureSceneFonts } from "../rendering/fonts";
import { createScene } from "../rendering/scene";

export async function renderProjectCover(
  project: Project,
  signal: AbortSignal,
): Promise<Blob> {
  const shot = project.shots[0];
  const ids = sceneAssetIds(project, shot);
  const assets = await loadSceneAssets(project.id, ids);
  const images = await loadReferencedImages(assets, ids, new Map(), signal);
  await ensureSceneFonts(project, shot);
  signal.throwIfAborted();
  const dimensions = previewDimensions(360, canonicalCanvas(project));
  const stage = new Konva.Stage({
    container: document.createElement("div"),
    width: dimensions.width,
    height: dimensions.height,
    scaleX: dimensions.scale,
    scaleY: dimensions.scale,
  });
  try {
    stage.add(
      createScene(project, shot, images.get(shot.assetId ?? ""), { images }),
    );
    const canvas = stage.toCanvas({ pixelRatio: 1 });
    try {
      return await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (blob) =>
            blob ? resolve(blob) : reject(new Error("Preview unavailable")),
          "image/webp",
          0.85,
        ),
      );
    } finally {
      canvas.width = 0;
      canvas.height = 0;
    }
  } finally {
    stage.destroy();
  }
}
