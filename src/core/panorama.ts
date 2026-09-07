import {
  LIMITS,
  resolveStyle,
  type Project,
  type Shot,
  type Style,
} from "./model";
import { canonicalCanvas, resolveExportProfile } from "./export-profiles";
import { deviceGeometry } from "../rendering/geometry";

import {
  panoramaStart,
  isPanoramaEnd,
  panoramaFamilies,
  type PanoramaId,
} from "./panorama-families";
export { isPanoramaTemplate } from "./panorama-families";

/** A panorama is an adjacent left/right unit. Roles travel with the slides. */
export function panoramaPair(
  project: Project,
  shotId: string,
): [Shot, Shot] | null {
  let index = project.shots.findIndex((shot) => shot.id === shotId);
  if (index < 0) return null;
  if (isPanoramaEnd(resolveStyle(project, project.shots[index]).template))
    index--;
  const left = project.shots[index],
    right = project.shots[index + 1];
  const start = left && panoramaStart(resolveStyle(project, left).template);
  return start &&
    left &&
    right &&
    resolveStyle(project, left).template === start &&
    resolveStyle(project, right).template === panoramaFamilies[start]
    ? [left, right]
    : null;
}
export function linkedShots(project: Project, shotId: string): Shot[] {
  return (
    panoramaPair(project, shotId) ??
    project.shots.filter((shot) => shot.id === shotId)
  );
}
export function editLinkedShots(
  project: Project,
  shotId: string,
  recipe: (shot: Shot) => void,
): void {
  linkedShots(project, shotId).forEach(recipe);
}
export function shotCapacity(project: Project): number {
  return Math.min(LIMITS.shots, resolveExportProfile(project).maxCount);
}

export const panoramaStyle = {
  template: "panorama",
  background: "#F3E9DC",
  backgroundEnd: "#D8AF91",
  backgroundMode: "solid",
  textColor: "#382F29",
  accentColor: "#94563D",
  texture: "none",
  accentTitle: false,
  align: "left",
  titleSize: 104,
} satisfies Partial<Style>;

export const panoramaStyles = {
  panorama: panoramaStyle,
  daybreak: {
    ...panoramaStyle,
    template: "daybreak",
    background: "#FFF3DF",
    backgroundEnd: "#F5B650",
    accentColor: "#C47AA0",
    textColor: "#322723",
    titleSize: 118,
  },
  tidal: {
    ...panoramaStyle,
    template: "tidal",
    background: "#113E52",
    backgroundEnd: "#32677B",
    accentColor: "#91C6C8",
    textColor: "#F1F5E9",
    titleSize: 116,
  },
} satisfies Record<PanoramaId, Partial<Style>>;

/** Phone placement lives in one 2160-wide scene; each export crops one half. */
export function panoramaLayout(project: Project, style: Style) {
  const { height: h } = canonicalCanvas(project);
  const right = isPanoramaEnd(style.template);
  const family = panoramaStart(style.template);
  const expressive = family !== "panorama";
  const wide = h <= 1080;
  const rotation = family === "daybreak" ? 16 : family === "tidal" ? -10 : -8;
  const unit = deviceGeometry(
    style.device,
    1000,
    style.frame,
    style.deviceOrientation,
  );
  const radians = (Math.abs(rotation) * Math.PI) / 180;
  const boundW =
    Math.cos(radians) * unit.width + Math.sin(radians) * unit.height;
  const boundH =
    Math.sin(radians) * unit.width + Math.cos(radians) * unit.height;
  const scale = Math.min(
    (expressive ? 1100 : 980) / boundW,
    (h * 0.85) / boundH,
  );
  const width = Math.floor(unit.width * scale);
  const height = deviceGeometry(
    style.device,
    width,
    style.frame,
    style.deviceOrientation,
  ).height;
  if (expressive)
    return {
      phone: {
        x: Math.round(1080 - width / 2),
        y: Math.round((h - height) / 2),
        width,
        rotation,
      },
      title: {
        x: right ? (wide ? 650 : 620) : 80,
        y: h * (wide ? 0.1 : right ? 0.65 : 0.065),
        width: wide ? 420 : right ? 390 : 520,
        height: h * (wide ? 0.4 : 0.25),
      },
      subtitle: {
        x: right ? (wide ? 654 : 624) : 84,
        y: h * (wide ? 0.66 : right ? 0.915 : 0.33),
        width: wide ? 412 : right ? 386 : 490,
        height: h * (wide ? 0.16 : 0.065),
      },
      panel: { x: 0, y: 0, width: 2160, height: h },
      fontScale: wide ? 0.62 : 1,
      subtitleSize: wide ? 22 : 30,
    };
  return {
    phone: {
      x: Math.round(1080 - width / 2),
      y: Math.round((h - height) / 2),
      width,
      rotation,
    },
    title: {
      x: right ? 560 : 70,
      y: h * (right ? 0.6 : 0.085),
      width: 450,
      height: h * 0.24,
    },
    subtitle: {
      x: right ? 560 : 74,
      y: h * (right ? 0.865 : 0.35),
      width: 446,
      height: h * 0.085,
    },
    panel: { x: 0, y: 0, width: 2160, height: h },
    fontScale: wide ? 0.6 : 0.98,
    subtitleSize: wide ? 23 : 31,
  };
}

export function panoramaPreview(
  project: Project,
  shot: Shot,
  keepColors = false,
  family: PanoramaId = "panorama",
): [Shot, Shot] {
  const existing = panoramaPair(project, shot.id);
  const left = existing?.[0] ?? shot;
  const right = existing?.[1] ?? {
    ...shot,
    id: `${shot.id}-panorama-preview`,
    title: "A closer look.",
    subtitle: "",
  };
  const patch: Partial<Style> = { ...panoramaStyles[family] };
  if (keepColors)
    for (const key of [
      "background",
      "backgroundEnd",
      "textColor",
      "accentColor",
    ] as const)
      delete patch[key];
  const shared = { ...resolveStyle(project, left), ...patch };
  const phone = panoramaLayout(project, shared).phone;
  return [left, right].map((source, index) => {
    const { textOffsets: _offsets, ...content } = source;
    return {
      ...content,
      assetId: left.assetId,
      style: {
        ...shared,
        template: index === 0 ? family : panoramaFamilies[family],
      },
      phone: { ...phone },
    };
  }) as [Shot, Shot];
}
export function applyPanorama(
  project: Project,
  shotId: string,
  keepColors = false,
  family: PanoramaId = "panorama",
): void {
  const selected = project.shots.find((shot) => shot.id === shotId);
  if (!selected) return;
  const existing = panoramaPair(project, shotId);
  if (!existing && project.shots.length + 1 > shotCapacity(project))
    throw new Error(
      `Panorama needs two slides. This format allows ${shotCapacity(project)}; remove a slide first.`,
    );
  const previews = panoramaPreview(project, selected, keepColors, family);
  if (!existing) previews[1].id = crypto.randomUUID();
  const index = project.shots.findIndex((shot) => shot.id === previews[0].id);
  project.shots.splice(index, existing ? 2 : 1, ...previews);
}
export function duplicateUnit(
  project: Project,
  shotId: string,
): string | undefined {
  const originals = linkedShots(project, shotId);
  if (
    !originals.length ||
    project.shots.length + originals.length > shotCapacity(project)
  )
    return;
  const copies = originals.map((shot) => ({
    ...structuredClone(shot),
    id: crypto.randomUUID(),
  }));
  const index = project.shots.findIndex(
    (shot) => shot.id === originals.at(-1)!.id,
  );
  project.shots.splice(index + 1, 0, ...copies);
  return copies[0].id;
}
export function removeUnit(project: Project, shotId: string): void {
  const ids = new Set(linkedShots(project, shotId).map((shot) => shot.id));
  project.shots = project.shots.filter((shot) => !ids.has(shot.id));
}
export function moveUnit(
  project: Project,
  shotId: string,
  direction: number,
): void {
  const units: Shot[][] = [];
  for (let i = 0; i < project.shots.length;) {
    const unit = linkedShots(project, project.shots[i].id);
    units.push(unit);
    i += unit.length;
  }
  const index = units.findIndex((unit) =>
    unit.some((shot) => shot.id === shotId),
  );
  const next = index + direction;
  if (index < 0 || next < 0 || next >= units.length) return;
  [units[index], units[next]] = [units[next], units[index]];
  project.shots = units.flat();
}
