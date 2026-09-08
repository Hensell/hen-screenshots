import {
  brandSnapshotKey,
  newBrandKit,
  validateBrandKit,
  type BrandKit,
} from "./brand-kit";
import { resolveStyle, type Project, type Shot, type Style } from "./model";
import { linkedShots } from "./panorama";
import { getTemplate } from "./templates";

export function brandStyle(kit: BrandKit): Partial<Style> {
  return {
    background: kit.colors.background,
    textColor: kit.colors.text,
    accentColor: kit.colors.accent,
    backgroundEnd: kit.colors.secondary,
    titleFont: kit.fonts.title,
    bodyFont: kit.fonts.body,
  };
}

export function brandFromSlide(project: Project, shot?: Shot): BrandKit {
  const style = shot ? resolveStyle(project, shot) : project.style;
  const previous = appliedBrand(project, shot);
  return {
    ...newBrandKit(project.name.trim() || "My app"),
    ...(previous?.logo ? { logo: previous.logo } : {}),
    colors: {
      background: style.background,
      text: style.textColor,
      accent: style.accentColor,
      secondary: style.backgroundEnd,
    },
    fonts: {
      title:
        style.titleFont ?? getTemplate(style.template).titleFont ?? "Manrope",
      body: style.bodyFont ?? "Manrope",
    },
  };
}

export function appliedBrand(
  project: Project,
  shot?: Shot,
): BrandKit | undefined {
  const key = shot?.brand ?? project.brand;
  return key && project.brands && Object.hasOwn(project.brands, key)
    ? project.brands[key]
    : undefined;
}

/** Apply only visual identity. Geometry, words, templates and export settings remain authored. */
export function applyBrandKit(
  project: Project,
  kit: BrandKit,
  shotId?: string,
  all = false,
): void {
  validateBrandKit(kit);
  if (!all && !project.shots.some((shot) => shot.id === shotId)) return;
  const key = brandSnapshotKey(kit);
  project.brands ??= {};
  project.brands[key] = structuredClone(kit);
  const patch = brandStyle(kit);
  if (all) {
    Object.assign(project.style, patch);
    project.brand = key;
  }
  const targets = all ? project.shots : linkedShots(project, shotId!);
  for (const shot of targets) {
    Object.assign(shot.style, patch);
    shot.brand = key;
  }
  const used = new Set([
    project.brand,
    ...project.shots.map((shot) => shot.brand),
  ]);
  for (const existing of Object.keys(project.brands))
    if (!used.has(existing)) delete project.brands[existing];
}
