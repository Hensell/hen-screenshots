import { createEmptyShot, LIMITS, type Project } from "./model";
import { resetComposition } from "./templates";

/** Create a draft without borrowing another slide's image or captions. */
export function addEmptySlide(project: Project) {
  if (project.shots.length >= LIMITS.shots) return null;
  const shot = createEmptyShot();
  resetComposition(project, shot);
  project.shots.push(shot);
  return shot.id;
}
