import "konva/skia-backend";
import { describe, expect, it } from "vitest";
import { createProject } from "../core/model";
import { addEmptySlide } from "../core/slides";
import { applyTemplate } from "../core/templates";
import { createScene } from "./scene";

// Use the real rendering backend: empty device placeholders must never leak into exports.
describe("empty slide rendering", () => {
  it.each(["classic", "panorama", "ecosystem"] as const)(
    "renders %s before upload and omits empty device placeholders from artwork",
    (template) => {
      const project = createProject();
      const id = addEmptySlide(project)!;
      applyTemplate(project, id, template, false);
      const shot = project.shots[0];
      const editor = createScene(project, shot, undefined, {
        emptyDeviceLabel: "Add an image",
      });
      const artwork = createScene(project, shot, undefined);
      try {
        expect(editor.find(".scene-device").length).toBeGreaterThan(0);
        expect(artwork.find(".scene-device")).toHaveLength(0);
      } finally {
        editor.destroy();
        artwork.destroy();
      }
    },
  );
  it("still rejects a missing real screenshot instead of presenting it as an intentional blank", () => {
    const project = createProject();
    addEmptySlide(project);
    project.shots[0].assetId = "missing-file";
    expect(() => createScene(project, project.shots[0], undefined)).toThrow(
      "not finished loading",
    );
  });
});
