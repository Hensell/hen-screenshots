import { sceneAssetIds } from "../core/overlays";
import { zip } from "fflate";
import { loadImage } from "../assets/import";
import type { Asset, Project } from "../core/model";
import { localizedProject } from "../core/localization";
import { linkedShots } from "../core/panorama";
import {
  exportProfileSuffix,
  resolveExportProfile,
} from "../core/export-profiles";
import { filename } from "../platform/download";
import { renderShot } from "./images";
import {
  reviewExportedImage,
  type ExportImageFormat,
  type ExportReview,
} from "./review";

export interface ScreenshotExport {
  blob: Blob;
  name: string;
  review: ExportReview;
}

function packageImages(
  files: Record<string, Uint8Array>,
  signal: AbortSignal,
): Promise<Uint8Array> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    let terminate: () => void = () => {};
    const abort = () => {
      terminate();
      reject(signal.reason);
    };
    signal.addEventListener("abort", abort, { once: true });
    terminate = zip(files, { level: 0 }, (error, result) => {
      signal.removeEventListener("abort", abort);
      if (signal.aborted) reject(signal.reason);
      else if (error) reject(error);
      else resolve(result);
    });
  });
}

/** Export one immutable revision. No editor state, notices, or downloads live here. */
export async function buildScreenshotExport({
  project,
  assets,
  images,
  shotId,
  all,
  locale,
  languageCodes,
  signal,
  onProgress,
  format = "png",
}: {
  project: Project;
  assets: Asset[];
  images: ReadonlyMap<string, HTMLImageElement>;
  shotId: string;
  all: boolean;
  locale: string | null;
  languageCodes?: string[];
  signal: AbortSignal;
  onProgress: (message: string) => void;
  format?: ExportImageFormat;
}): Promise<ScreenshotExport> {
  signal.throwIfAborted();
  const original = structuredClone(project);
  const sources = new Map(assets.map((asset) => [asset.id, asset]));
  const cache = new Map(images);
  const locales = languageCodes?.length
    ? [...languageCodes]
    : [locale ?? original.localization?.source ?? ""];
  const snapshot = localizedProject(original, locales[0]);
  const shots = all ? snapshot.shots : linkedShots(snapshot, shotId);
  if (!shots.length) throw new Error("Choose a screenshot to export.");
  const multiple = all || shots.length > 1 || locales.length > 1;
  const profile = resolveExportProfile(snapshot);
  if (all && shots.length > profile.maxCount)
    throw new Error(
      `This destination accepts at most ${profile.maxCount} screenshots per device slot. Export individual screenshots or reduce the series.`,
    );
  const files: Record<string, Uint8Array> = {};
  const review: ExportReview = { files: [], format, blocked: false };
  const extension = format === "jpeg" ? "jpg" : "png";
  let png: Blob | undefined;
  let exportedBytes = 0;
  for (const [languageIndex, code] of locales.entries()) {
    const version = localizedProject(original, code);
    const localizedShots = all ? version.shots : linkedShots(version, shotId);
    for (const [index, item] of localizedShots.entries()) {
      signal.throwIfAborted();
      onProgress(
        `Rendering ${languageIndex * shots.length + index + 1} of ${shots.length * locales.length}…`,
      );
      // Keep newly decoded language images scoped to one scene, not the entire export.
      const sceneImages = new Map<string, HTMLImageElement>();
      for (const id of sceneAssetIds(version, item)) {
        const asset = sources.get(id);
        if (!asset)
          throw new Error(
            `The original image for screenshot ${index + 1} is missing. Replace it and try again.`,
          );
        if (!sceneImages.has(id))
          sceneImages.set(id, cache.get(id) ?? (await loadImage(asset)));
        signal.throwIfAborted();
      }
      png = await renderShot(
        version,
        item,
        sceneImages.get(item.assetId)!,
        sceneImages,
        { format, signal },
      );
      signal.throwIfAborted();
      exportedBytes += png.size;
      if (exportedBytes > 250 * 1024 * 1024)
        throw new Error(
          "This export is too large to package safely. Select fewer languages or screenshots and export again.",
        );
      const number = String(
        snapshot.shots.findIndex((s) => s.id === item.id) + 1,
      ).padStart(2, "0");
      const name = `${original.localization ? `${code}/` : ""}${number}-${filename(item.title)}.${extension}`;
      review.files.push(reviewExportedImage(png, name, profile, format));
      if (multiple) {
        files[name] = new Uint8Array(await png.arrayBuffer());
      }
    }
  }
  signal.throwIfAborted();
  review.blocked = review.files.some((file) => file.overLimit);
  const prefix = `${filename(snapshot.name)}-${exportProfileSuffix(snapshot)}`;
  if (multiple) {
    onProgress("Packaging screenshots…");
    const archive = await packageImages(files, signal);
    signal.throwIfAborted();
    return {
      blob: new Blob([new Uint8Array(archive)], { type: "application/zip" }),
      name: `${prefix}${!all ? "-selection" : ""}${locales.length > 1 ? "-languages" : original.localization ? `-${locales[0]}` : ""}.zip`,
      review,
    };
  }
  return {
    blob: png!,
    name: `${prefix}${original.localization ? `-${locales[0]}` : ""}-${String(snapshot.shots.findIndex((s) => s.id === shotId) + 1).padStart(2, "0")}.${extension}`,
    review,
  };
}
