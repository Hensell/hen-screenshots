import { resolveExportProfile } from "./export-profiles";
import { canonicalCanvas } from "./export-profiles";
import {
  LIMITS,
  PLACEMENT_LIMITS,
  type Asset,
  type CanvasElement,
  type ImageOverlay,
  type OverlayElement,
  type Project,
  type Shot,
} from "./model";
import { linkedShots } from "./panorama";
import { referencedAssetIds } from "./localization";
export const MAX_OVERLAYS = LIMITS.overlays;
export const isOverlayElement = (
  element: CanvasElement | null,
): element is OverlayElement => !!element?.startsWith("overlay:");
export function overlayFor(shot: Shot, element: CanvasElement | null) {
  return isOverlayElement(element)
    ? shot.overlays?.find((item) => `overlay:${item.id}` === element)
    : undefined;
}
export function overlayPlacement(project: Project, ratio: number) {
  const h = canonicalCanvas(project).height;
  const width = Math.min(240, h * 0.28 * ratio);
  return {
    x: 1080 - width - 72,
    y: 72,
    width,
    height: width / ratio,
    rotation: 0,
  };
}
export function addOverlay(
  project: Project,
  shot: Shot,
  asset: Asset,
): ImageOverlay {
  if ((shot.overlays?.length ?? 0) >= MAX_OVERLAYS)
    throw new Error("A slide supports up to 8 extra images.");
  const overlay = {
    id: crypto.randomUUID(),
    assetId: asset.id,
    name: asset.name,
    ...overlayPlacement(project, asset.width / asset.height),
  };
  (shot.overlays ??= []).push(overlay);
  return overlay;
}
export type OverlayPlacement = Pick<
  ImageOverlay,
  "x" | "y" | "width" | "height" | "rotation"
>;
export type OverlayChange = (
  id: string,
  patch: Partial<OverlayPlacement>,
  shotId: string,
) => void;
export function setOverlayPlacement(
  overlay: ImageOverlay,
  patch: Partial<OverlayPlacement>,
) {
  if (patch.width && patch.height) {
    const scale = Math.min(1, 8640 / patch.width, 8640 / patch.height);
    patch = {
      ...patch,
      width: patch.width * scale,
      height: patch.height * scale,
    };
  }
  for (const [key, value] of Object.entries(patch)) {
    if (!Number.isFinite(value)) continue;
    if (key === "x" || key === "y")
      overlay[key] = Math.max(
        PLACEMENT_LIMITS[key].min,
        Math.min(PLACEMENT_LIMITS[key].max, value),
      );
    else if (key === "rotation")
      overlay.rotation = Math.max(-180, Math.min(180, value));
    else if (key === "width" || key === "height")
      overlay[key] = Math.max(1e-9, Math.min(8640, value));
  }
}
export function resizeOverlay(
  overlay: ImageOverlay,
  requested: number,
): OverlayPlacement {
  const ratio = overlay.width / overlay.height;
  const width = Math.max(32, Math.min(2160, 8640 * ratio, requested));
  const height = width / ratio;
  return {
    ...overlay,
    x: overlay.x + (overlay.width - width) / 2,
    y: overlay.y + (overlay.height - height) / 2,
    width,
    height,
  };
}
export function removeOverlay(shot: Shot, id: string) {
  shot.overlays = shot.overlays?.filter((item) => item.id !== id);
  if (!shot.overlays?.length) delete shot.overlays;
}
/** Use the stored source project, including every language. A replaced asset
 * still counts if another slide, device or layer references it. */
export function overlayUploadBytes(
  source: Project,
  assets: Asset[],
  incoming: Pick<File, "size">[],
  target: { shotId: string; replaceId?: string },
) {
  const retained = structuredClone(source);
  if (target.replaceId) {
    const shot = retained.shots.find((item) => item.id === target.shotId);
    if (shot) removeOverlay(shot, target.replaceId);
  }
  const used = new Set(referencedAssetIds(retained));
  return (
    assets
      .filter((asset) => used.has(asset.id))
      .reduce((sum, asset) => sum + asset.blob.size, 0) +
    incoming.reduce((sum, file) => sum + file.size, 0)
  );
}
export function reorderOverlay(shot: Shot, id: string, direction: number) {
  const items = shot.overlays;
  if (!items) return;
  const from = items.findIndex((item) => item.id === id),
    to = from + direction;
  if (from < 0 || to < 0 || to >= items.length) return;
  items.splice(to, 0, ...items.splice(from, 1));
}
/** Both panorama crops render the same extra images across the seam. */
export function sceneAssetIds(project: Project, shot: Shot) {
  if (resolveExportProfile(project).sourceOnly) return [shot.assetId];
  return [
    ...new Set([
      shot.assetId,
      ...(shot.companions ?? []).map((item) => item.assetId),
      ...linkedShots(project, shot.id).flatMap((owner) =>
        (owner.overlays ?? []).map((item) => item.assetId),
      ),
      ...(shot.overlays ?? []).map((item) => item.assetId),
    ]),
  ];
}
