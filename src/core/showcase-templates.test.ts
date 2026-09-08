import { describe, expect, it } from "vitest";
import {
  createProject,
  createShot,
  resolveStyle,
  validateProject,
} from "./model";
import { applyTemplate, templateLayout } from "./templates";
import { showcaseTemplates } from "./showcase-templates";
import { patternTemplates } from "./pattern-templates";
import { canonicalCanvas, type ExportProfileId } from "./export-profiles";
import { deviceGeometry, type Rect } from "../rendering/geometry";
import { isPanoramaTemplate } from "./panorama-families";

const intersects = (a: Rect, b: Rect) =>
  a.x < b.x + b.width &&
  a.x + a.width > b.x &&
  a.y < b.y + b.height &&
  a.y + a.height > b.y;

describe("showcase collection geometry", () => {
  it.each(
    [...showcaseTemplates, ...patternTemplates].filter(
      (t) => !isPanoramaTemplate(t.id),
    ),
  )(
    "keeps $name captions separate from every fitted device and survives save validation",
    (template) => {
      for (const profile of [
        "play-phone-portrait",
        "apple-ipad13-landscape",
        "portfolio-card",
        "portfolio-custom",
      ] as ExportProfileId[]) {
        for (const device of [
          "ios",
          "android",
          "ipad",
          "android-tablet",
          "monitor",
          "laptop",
          "card",
        ] as const) {
          for (const orientation of ["portrait", "landscape"] as const) {
            const project = createProject("A real app");
            project.exportProfile = profile;
            project.customSize = { width: 2560, height: 640 };
            project.style.device = device;
            project.style.deviceOrientation = orientation;
            project.shots = [createShot("capture", 0)];
            applyTemplate(project, project.shots[0].id, template.id);
            const shot = project.shots[0];
            const style = resolveStyle(project, shot);
            const layout = templateLayout(project, style);
            const geometry = deviceGeometry(
              device,
              shot.phone.width,
              style.frame,
              orientation,
            );
            const angle = (Math.abs(shot.phone.rotation) * Math.PI) / 180;
            const width =
              Math.cos(angle) * geometry.width +
              Math.sin(angle) * geometry.height;
            const height =
              Math.sin(angle) * geometry.width +
              Math.cos(angle) * geometry.height;
            const bounds = {
              x: shot.phone.x + (geometry.width - width) / 2,
              y: shot.phone.y + (geometry.height - height) / 2,
              width,
              height,
            };
            expect(bounds.x).toBeGreaterThanOrEqual(0);
            expect(bounds.y).toBeGreaterThanOrEqual(0);
            expect(bounds.x + width).toBeLessThanOrEqual(1080);
            expect(bounds.y + height).toBeLessThanOrEqual(
              canonicalCanvas(project).height,
            );
            expect(intersects(bounds, layout.title)).toBe(false);
            expect(intersects(bounds, layout.subtitle)).toBe(false);
            expect(intersects(layout.title, layout.subtitle)).toBe(false);
            expect(() =>
              validateProject(JSON.parse(JSON.stringify(project))),
            ).not.toThrow();
          }
        }
      }
    },
  );
});
