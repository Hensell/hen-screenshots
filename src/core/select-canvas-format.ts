import { storeSlotForProfile } from "./canvas-formats";
import { getExportProfile, type ExportProfileId } from "./export-profiles";
import type { Project, DeviceFamily } from "./model";
import { changeExportProfile, resetComposition } from "./templates";

/** One history edit applies the canvas and its main device; companions keep their roles. */
export function selectCanvasFormat(
  project: Project,
  id: ExportProfileId,
): void {
  const profile = getExportProfile(id);
  const slot = storeSlotForProfile(id);
  const family: DeviceFamily | undefined =
    slot?.category === "phone"
      ? profile.store === "apple"
        ? "ios"
        : "android"
      : slot?.category === "tablet"
        ? profile.store === "apple"
          ? "ipad"
          : "android-tablet"
        : slot?.category === "desktop"
          ? "monitor"
          : slot
            ? "card"
            : undefined;
  if (family) {
    project.style.device = family;
    project.style.frame = family !== "card";
    project.style.deviceOrientation =
      profile.width > profile.height ? "landscape" : "portrait";
  }
  if (slot) {
    for (const shot of project.shots) {
      if (family) {
        shot.style.device = family;
        shot.style.frame = family !== "card";
        shot.style.deviceOrientation =
          profile.width > profile.height ? "landscape" : "portrait";
      } else shot.style.frame = false;
    }
  }
  const unchanged = project.exportProfile === id;
  changeExportProfile(project, id);
  if (unchanged)
    for (const shot of project.shots) resetComposition(project, shot);
}
