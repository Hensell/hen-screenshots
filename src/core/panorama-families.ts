import type { TemplateId } from "./model";

/** Explicit pairs keep imported documents from linking unrelated designs. */
export const panoramaFamilies = {
  panorama: "panorama-end",
  daybreak: "daybreak-end",
  tidal: "tidal-end",
} as const;
export type PanoramaId = keyof typeof panoramaFamilies;

export function panoramaStart(id: TemplateId): PanoramaId | undefined {
  return (Object.keys(panoramaFamilies) as PanoramaId[]).find(
    (start) => id === start || id === panoramaFamilies[start],
  );
}
export function isPanoramaEnd(id: TemplateId): boolean {
  const start = panoramaStart(id);
  return start !== undefined && id === panoramaFamilies[start];
}
export function isPanoramaTemplate(id: TemplateId): boolean {
  return panoramaStart(id) !== undefined;
}
