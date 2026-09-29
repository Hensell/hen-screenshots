import { describe, expect, it } from "vitest";
import {
  createProject,
  createShot,
  resolveStyle,
  validateProject,
} from "./model";
import {
  applyTemplate,
  templatePreview,
  changeExportProfile,
} from "./templates";
import { portfolioTemplates } from "./portfolio-templates";

describe("portfolio hardware presets", () => {
  it.each(portfolioTemplates)(
    "sets up $name consistently and keeps hardware editable",
    (template) => {
      const project = createProject("Website");
      project.exportProfile = "portfolio-card";
      project.shots = [createShot("source", 0), createShot("other", 1)];
      project.shots[0].style = {
        device: "ios",
        frame: false,
        deviceOrientation: "portrait",
        background: "#123456",
      };
      const before = structuredClone(project);
      const preview = templatePreview(
        project,
        project.shots[0],
        template.id,
        true,
      );
      expect(project).toEqual(before);
      applyTemplate(project, project.shots[0].id, template.id, false, true);
      const shot = project.shots[0];
      expect(resolveStyle(project, shot)).toEqual(
        resolveStyle(before, preview),
      );
      expect(resolveStyle(project, shot)).toMatchObject({
        device: template.style.device,
        frame: true,
        deviceOrientation: "landscape",
        fit: "contain",
        background: "#123456",
      });
      expect(shot.phone).toEqual(preview.phone);
      expect(shot.assetId).toBe(before.shots[0].assetId);
      expect(shot.title).toBe(before.shots[0].title);
      expect(project.shots[1]).toEqual(before.shots[1]);
      shot.style.device = "card";
      changeExportProfile(project, "portfolio-square");
      expect(resolveStyle(project, shot).device).toBe("card");
      expect(() =>
        validateProject(JSON.parse(JSON.stringify(project))),
      ).not.toThrow();
    },
  );
});
