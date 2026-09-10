import Konva from "konva";
import "konva/skia-backend";
import { FontLibrary, Image, type Canvas } from "skia-canvas";
import sharp, { type OverlayOptions } from "sharp";
import { join } from "node:path";
import { writeFile } from "node:fs/promises";
import { zipSync } from "fflate";
import type { Asset, Project, Shot } from "../core/model";
import { LIMITS, validateProject, resolveStyle } from "../core/model";
import {
  resolveExportProfile,
  validateExportPng,
} from "../core/export-profiles";
import {
  languages,
  localizedProject,
  localeStatus,
} from "../core/localization";
import { sceneAssetIds } from "../core/overlays";
import { deviceGeometry, fitImage } from "../rendering/geometry";
import { deviceShot } from "../core/device-composition";
import { linkedShots } from "../core/panorama";
import { createScene } from "../rendering/scene";
import { publicationAdvice, reviewExportedImage } from "../export/review";
import { exportProject } from "../storage/backup";

const registerFonts = FontLibrary.use.bind(FontLibrary);
export function loadNativeFonts(directory: string) {
  registerFonts("Manrope", join(directory, "Manrope.ttf"));
  registerFonts("Fraunces", join(directory, "Fraunces-Semibold.ttf"));
  Konva.pixelRatio = 1;
  Konva.autoDrawEnabled = false;
}
async function imageFor(asset: Asset, project: Project, shot: Shot) {
  // Prefilter to the largest rendered use of this image. Native canvas sampling
  // alone aliases small screenshot text, especially on tilted tablet/phone frames.
  const scales: number[] = [];
  for (const slot of [
    shot,
    ...(shot.companions ?? []).map((d) => deviceShot(shot, `device:${d.id}`)),
  ]) {
    if (slot.assetId !== asset.id) continue;
    const style = resolveStyle(project, slot);
    const screen = deviceGeometry(
      style.device,
      slot.phone.width,
      style.frame,
      style.deviceOrientation,
    ).screen;
    scales.push(
      fitImage(asset.width, asset.height, screen, style.fit).width /
        asset.width,
    );
  }
  for (const owner of linkedShots(project, shot.id)) {
    for (const overlay of owner.overlays ?? []) {
      if (overlay.assetId === asset.id)
        scales.push(
          Math.max(overlay.width / asset.width, overlay.height / asset.height),
        );
    }
  }
  const scale = Math.min(
    1,
    (Math.max(...scales, 0) * resolveExportProfile(project).width) / 1080,
  );
  if (!(scale > 0))
    throw new Error("An image has no valid placement in this scene.");
  const bytes = await sharp(Buffer.from(await asset.blob.arrayBuffer()), {
    limitInputPixels: LIMITS.imagePixels,
    failOn: "warning",
  })
    .rotate()
    .resize({
      width: Math.max(1, Math.ceil(asset.width * scale)),
      height: Math.max(1, Math.ceil(asset.height * scale)),
      fit: "fill",
      kernel: "lanczos3",
    })
    .png()
    .toBuffer();
  const image = new Image(bytes);
  await image.decode();
  // The shared scene uses browser image dimension names; retain the native drawable.
  Object.defineProperties(image, {
    naturalWidth: { get: () => asset.width },
    naturalHeight: { get: () => asset.height },
  });
  return image as unknown as HTMLImageElement;
}
export async function renderNativeShot(
  project: Project,
  shot: Shot,
  assets: ReadonlyMap<string, Asset>,
) {
  const profile = resolveExportProfile(project);
  if (profile.sourceOnly)
    throw new Error("Use the web studio for source-only Wear OS exports.");
  const images = new Map<string, HTMLImageElement>();
  for (const id of sceneAssetIds(project, shot)) {
    const asset = assets.get(id);
    if (!asset)
      throw new Error("A screenshot image is missing from this project.");
    images.set(id, await imageFor(asset, project, shot));
  }
  const stage = new Konva.Stage({
    width: profile.width,
    height: profile.height,
    scaleX: profile.width / 1080,
    scaleY: profile.width / 1080,
  });
  try {
    stage.add(
      createScene(project, shot, images.get(shot.assetId)!, { images }),
    );
    stage.draw();
    const canvas = stage.toCanvas({
      width: profile.width,
      height: profile.height,
      pixelRatio: 1,
    }) as unknown as Canvas;
    const buffer = await sharp(await canvas.toBuffer("png"))
      .flatten({ background: "#F4F1E9" })
      .toColourspace("srgb")
      .removeAlpha()
      .png()
      .toBuffer();
    await validateExportPng(
      new Blob([new Uint8Array(buffer)], { type: "image/png" }),
      profile,
    );
    return buffer;
  } finally {
    stage.destroy();
  }
}
/** Called only inside a newly reserved output directory. Never overwrites user work. */
export async function writeDesign(
  project: Project,
  assets: Asset[],
  directory: string,
  fonts: string,
) {
  validateProject(project);
  if (!project.shots.length)
    throw new Error("The project has no slides to render.");
  const profile = resolveExportProfile(project);
  if (project.shots.length > profile.maxCount)
    throw new Error(
      `This export profile allows ${profile.maxCount} slides per language.`,
    );
  loadNativeFonts(fonts);
  const byId = new Map(assets.map((asset) => [asset.id, asset]));
  const source = project.localization?.source ?? "en";
  const locales = [source, ...(project.localization?.targets ?? [])];
  const packed: Record<string, Uint8Array> = {};
  const files = [];
  const previews: Buffer[] = [];
  const warnings = publicationAdvice(profile, project.shots.length);
  let total = 0;
  for (const locale of locales) {
    if (
      locale !== source &&
      project.shots.some(
        (shot) =>
          localeStatus(shot, locale) === "untranslated" ||
          localeStatus(shot, locale) === "outdated",
      )
    )
      throw new Error(
        `The ${locale} captions are missing or outdated. Review them in the web studio before exporting.`,
      );
    const localized = localizedProject(project, locale);
    for (const [index, shot] of localized.shots.entries()) {
      const name = `${locale}/${String(index + 1).padStart(2, "0")}.png`;
      const png = await renderNativeShot(localized, shot, byId);
      total += png.length;
      if (total > 256 * 1024 * 1024)
        throw new Error(
          "This export exceeds 256 MB. Export fewer slides or languages together.",
        );
      const review = reviewExportedImage(
        new Blob([new Uint8Array(png)], { type: "image/png" }),
        name,
        profile,
        "png",
      );
      if (review.overLimit)
        throw new Error(`${name} exceeds this store slot's file-size limit.`);
      files.push(review);
      packed[name] = png;
      if (locale === source)
        previews.push(
          await sharp(png)
            .resize({ width: 280, height: 380, fit: "inside" })
            .toBuffer(),
        );
    }
  }
  // Make a compact contact sheet for the agent's visual check; exports retain native size.
  const columns = Math.min(4, previews.length),
    cellWidth = 304,
    cellHeight = 432;
  const composite: OverlayOptions[] = [];
  for (const [i, input] of previews.entries()) {
    const meta = await sharp(input).metadata();
    const x = (i % columns) * cellWidth,
      y = Math.floor(i / columns) * cellHeight;
    composite.push({
      input,
      left: x + Math.round((cellWidth - meta.width!) / 2),
      top: y + 12,
    });
    const label = Buffer.from(
      `<svg width="304" height="40"><text x="152" y="25" text-anchor="middle" font-size="16" fill="#202725">${String(i + 1).padStart(2, "0")}</text></svg>`,
    );
    composite.push({ input: label, left: x, top: y + 386 });
  }
  await sharp({
    create: {
      width: columns * cellWidth,
      height: Math.ceil(previews.length / columns) * cellHeight,
      channels: 3,
      background: "#E3E8DE",
    },
  })
    .composite(composite)
    .png()
    .toFile(join(directory, "preview.png"));
  const { mkdir } = await import("node:fs/promises");
  for (const locale of locales) await mkdir(join(directory, locale));
  for (const [name, data] of Object.entries(packed))
    await writeFile(join(directory, name), data, { flag: "wx" });
  await writeFile(
    join(directory, "screenshots.zip"),
    zipSync(packed, { level: 0 }),
    { flag: "wx" },
  );
  await writeFile(
    join(directory, "project.henscreenshots"),
    new Uint8Array(await (await exportProject(project, assets)).arrayBuffer()),
    { flag: "wx" },
  );
  const report = {
    version: 1,
    project: project.name,
    profile: profile.id,
    width: profile.width,
    height: profile.height,
    languages: locales,
    files,
    warnings,
    preview: "preview.png",
    editableProject: "project.henscreenshots",
    archive: "screenshots.zip",
    captionReview: "Review every language and the preview before publishing.",
    supportedLanguages: languages.map(([code]) => code),
  };
  await writeFile(
    join(directory, "report.json"),
    JSON.stringify(report, null, 2) + "\n",
    { flag: "wx" },
  );
  return report;
}
