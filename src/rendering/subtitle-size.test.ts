import "konva/skia-backend";
import type { Group } from "konva/lib/Group";
import { describe, expect, it } from "vitest";
import { createProject, resolveStyle, validateProject } from "../core/model";
import { addEmptySlide } from "../core/slides";
import {
  applyTemplate,
  templateLayout,
  templatePreview,
  supportingTextSize,
} from "../core/templates";
import {
  addLanguage,
  localContent,
  localizedProject,
} from "../core/localization";
import { createScene } from "./scene";

function fixture() {
  const project = createProject();
  addEmptySlide(project);
  project.shots[0].subtitle = "Short subtitle";
  return project;
}
function renderedSize(project: ReturnType<typeof createProject>) {
  const scene = createScene(project, project.shots[0], undefined);
  try {
    return scene
      .findOne<Group>(".caption-subtitle")!
      .findOne("Text")!
      .getAttr("fontSize");
  } finally {
    scene.destroy();
  }
}
describe("supporting text size", () => {
  it.each(["classic", "studio", "panorama", "tidal"] as const)(
    "preserves the untouched %s layout default",
    (id) => {
      const project = fixture();
      applyTemplate(project, project.shots[0].id, id);
      const style = resolveStyle(project, project.shots[0]);
      expect(style.subtitleSize).toBeUndefined();
      expect(renderedSize(project)).toBe(
        templateLayout(project, style).subtitleSize,
      );
    },
  );
  it("renders explicit and translated overrides and returns to the shared size", () => {
    const project = fixture();
    const shot = project.shots[0];
    shot.style.subtitleSize = 48;
    addLanguage(project, "en", "es");
    localContent(shot, "es").subtitleSize = 24;
    expect(renderedSize(project)).toBe(48);
    expect(renderedSize(localizedProject(project, "es"))).toBe(24);
    delete localContent(shot, "es").subtitleSize;
    expect(renderedSize(localizedProject(project, "es"))).toBe(48);
  });
  it.each([false, true])(
    "resets local and inherited sizes when applying a template (all=%s)",
    (all) => {
      const project = fixture();
      project.style.subtitleSize = 60;
      const shot = project.shots[0];
      shot.style.subtitleSize = 64;
      const preview = templatePreview(project, shot, "studio", false);
      applyTemplate(project, shot.id, "studio", all);
      expect(renderedSize(project)).toBe(32);
      expect(supportingTextSize(project, resolveStyle(project, shot))).toBe(32);
      expect(supportingTextSize(project, resolveStyle(project, preview))).toBe(
        32,
      );
      validateProject(project);
    },
  );
  it("resets inherited size for both panorama halves", () => {
    const project = fixture();
    project.style.subtitleSize = 60;
    project.shots[0].style.subtitleSize = 64;
    applyTemplate(project, project.shots[0].id, "panorama");
    const expected = templateLayout(
      project,
      resolveStyle(project, project.shots[0]),
    ).subtitleSize;
    expect(renderedSize(project)).toBe(expected);
    expect(project.shots[1].style.subtitleSize).toBe(expected);
    validateProject(project);
  });
  it("keeps landscape defaults and scales explicit slider values", () => {
    const project = fixture();
    project.exportProfile = "play-phone-landscape";
    expect(renderedSize(project)).toBe(23);
    expect(
      supportingTextSize(project, resolveStyle(project, project.shots[0])),
    ).toBe(32);
    project.shots[0].style.subtitleSize = 50;
    expect(renderedSize(project)).toBe(36);
  });
});
