import {
  LIMITS,
  resolveStyle,
  type Project,
  type Shot,
  type Style,
  type TemplateId,
} from "./model";
import { canonicalCanvas, resolveExportProfile } from "./export-profiles";
import { deviceGeometry } from "../rendering/geometry";

export function isPanoramaTemplate(id: TemplateId): boolean {
  return id === "panorama" || id === "panorama-end";
}

/** A panorama is an adjacent left/right unit. Roles travel with the slides. */
export function panoramaPair(
  project: Project,
  shotId: string,
): [Shot, Shot] | null {
  let index = project.shots.findIndex((shot) => shot.id === shotId);
  if (index < 0) return null;
  if (resolveStyle(project, project.shots[index]).template === "panorama-end")
    index--;
  const left = project.shots[index],
    right = project.shots[index + 1];
  return left &&
    right &&
    resolveStyle(project, left).template === "panorama" &&
    resolveStyle(project, right).template === "panorama-end"
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

/** Phone placement lives in one 2160-wide scene; each export crops one half. */
export function panoramaLayout(project: Project, style: Style) {
  const { height: h } = canonicalCanvas(project);
  const right = style.template === "panorama-end";
  const wide = h <= 1080;
  const rotation = -8;
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
  const scale = Math.min(980 / boundW, (h * 0.85) / boundH);
  const width = Math.floor(unit.width * scale);
  const height = deviceGeometry(
    style.device,
    width,
    style.frame,
    style.deviceOrientation,
  ).height;
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
): [Shot, Shot] {
  const existing = panoramaPair(project, shot.id);
  const left = existing?.[0] ?? shot;
  const right = existing?.[1] ?? {
    ...shot,
    id: `${shot.id}-panorama-preview`,
    title: "A closer look.",
    subtitle: "",
  };
  const patch: Partial<Style> = { ...panoramaStyle };
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
  return [left, right].map((source, index) => ({
    ...source,
    assetId: left.assetId,
    style: { ...shared, template: index === 0 ? "panorama" : "panorama-end" },
    phone: { ...phone },
  })) as [Shot, Shot];
}
export function applyPanorama(
  project: Project,
  shotId: string,
  keepColors = false,
): void {
  const selected = project.shots.find((shot) => shot.id === shotId);
  if (!selected) return;
  const existing = panoramaPair(project, shotId);
  if (!existing && project.shots.length + 1 > shotCapacity(project))
    throw new Error(
      `Panorama needs two slides. This format allows ${shotCapacity(project)}; remove a slide first.`,
    );
  const previews = panoramaPreview(project, selected, keepColors);
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
