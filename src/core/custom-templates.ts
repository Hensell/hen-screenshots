import {
  createProject,
  LIMITS,
  resolveStyle,
  validateProject,
  type Asset,
  type LoadedProject,
  type Project,
} from "./model";
import { referencedAssetIds } from "./localization";
import { linkedShots, panoramaPair, shotCapacity } from "./panorama";
import { resolveExportProfile } from "./export-profiles";
import { projectPurpose } from "./canvas-formats";

/** A template is one editable scene. Device captures and private project metadata
 * are deliberately omitted; artwork explicitly added as a background/logo stays. */
export function captureTemplate(
  source: Project,
  shotId: string,
  name: string,
  assets: Asset[],
): LoadedProject {
  if (!name.trim() || name.trim().length > 80)
    throw new Error("Give your template a name of up to 80 characters.");
  if (resolveExportProfile(source).sourceOnly)
    throw new Error("Choose a design canvas before saving a template.");
  const shots = linkedShots(source, shotId);
  if (!shots.length) throw new Error("Select a slide to save as a template.");
  const project = createProject(name.trim());
  project.exportProfile = source.exportProfile;
  project.customSize = { ...source.customSize };
  project.shots = shots.map((shot) => {
    const {
      translations: _translations,
      brand: _brand,
      ...copy
    } = structuredClone(shot);
    return {
      ...copy,
      id: crypto.randomUUID(),
      assetId: null,
      style: { ...resolveStyle(source, shot) },
      ...(copy.companions
        ? {
            companions: copy.companions.map((device) => ({
              ...device,
              assetId: null,
            })),
          }
        : {}),
    };
  });
  const ids = new Set(referencedAssetIds(project));
  const result = {
    project,
    assets: assets.filter((asset) => ids.has(asset.id)),
    revision: 0,
  };
  validateTemplate(result);
  return result;
}

export function validateTemplate(loaded: LoadedProject) {
  const { project, assets } = loaded;
  validateProject(project);
  if (
    resolveExportProfile(project).sourceOnly ||
    project.brand ||
    project.brands ||
    project.localization ||
    !(
      project.shots.length === 1 ||
      (project.shots.length === 2 && panoramaPair(project, project.shots[0].id))
    ) ||
    project.shots.some(
      (shot) =>
        shot.assetId !== null ||
        shot.brand ||
        shot.translations ||
        shot.companions?.some((device) => device.assetId !== null),
    )
  )
    throw new Error(
      "This file is not a reusable template. Export it from My templates.",
    );
  const references = new Set(referencedAssetIds(project));
  if (
    assets.length !== references.size ||
    new Set(assets.map((asset) => asset.id)).size !== assets.length ||
    assets.some(
      (asset) =>
        !references.has(asset.id) || asset.blob.size > LIMITS.assetBytes,
    ) ||
    assets.reduce((sum, asset) => sum + asset.blob.size, 0) > LIMITS.totalBytes
  )
    throw new Error(
      "The template artwork is missing or exceeds the image limit.",
    );
}

/** Give each use its own identities, including artwork, so later edits are independent. */
export function instantiateTemplate(source: LoadedProject): LoadedProject {
  validateTemplate(source);
  const project = structuredClone(source.project);
  const assets = source.assets.map((asset) => ({
    ...asset,
    id: crypto.randomUUID(),
  }));
  const ids = new Map(
    source.assets.map((asset, index) => [asset.id, assets[index].id]),
  );
  project.id = crypto.randomUUID();
  project.createdAt = project.updatedAt = Date.now();
  for (const shot of project.shots) {
    shot.id = crypto.randomUUID();
    if (shot.backgroundImage)
      shot.backgroundImage.assetId = ids.get(shot.backgroundImage.assetId)!;
    for (const overlay of shot.overlays ?? []) {
      overlay.id = crypto.randomUUID();
      overlay.assetId = ids.get(overlay.assetId)!;
    }
  }
  return { project, assets, revision: 0 };
}

/** Preserve the saved composition exactly. Other proportions open as a new project. */
export function templateAppendIssue(
  target: Project,
  source: Project,
): string | null {
  const a = resolveExportProfile(target),
    b = resolveExportProfile(source);
  if (
    a.sourceOnly ||
    projectPurpose(target) !== projectPurpose(source) ||
    a.width * b.height !== b.width * a.height
  )
    return "This template uses a different canvas. Open it as a new project to keep its layout.";
  if (target.shots.length + source.shots.length > shotCapacity(target))
    return "There is not enough room in this series. Open the template as a new project.";
  return null;
}

export function appendTemplate(
  target: Project,
  source: LoadedProject,
  targetAssets: Asset[],
) {
  validateTemplate(source);
  const issue = templateAppendIssue(target, source.project);
  if (issue) throw new Error(issue);
  const used = new Set(referencedAssetIds(target));
  const bytes =
    targetAssets
      .filter((asset) => used.has(asset.id))
      .reduce((sum, asset) => sum + asset.blob.size, 0) +
    source.assets.reduce((sum, asset) => sum + asset.blob.size, 0);
  if (bytes > LIMITS.totalBytes)
    throw new Error(
      "This template would exceed the project's 120 MB image limit. Open it as a new project.",
    );
  const copy = instantiateTemplate(source);
  target.shots.push(...copy.project.shots);
  return copy;
}
