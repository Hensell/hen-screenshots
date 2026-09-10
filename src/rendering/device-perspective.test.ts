import "konva/skia-backend";
import Konva from "konva";
import { describe, expect, it } from "vitest";
import { createProject, type DeviceFamily } from "../core/model";
import { addEmptySlide } from "../core/slides";
import { applyTemplate } from "../core/templates";
import { panoramaPoses } from "../core/panorama-collection";
import { deviceGeometry } from "./geometry";
import { deviceProjection } from "./device-perspective";
import { createScene } from "./scene";

describe("isometric panorama devices", () => {
  it.each(Object.entries(panoramaPoses))(
    "keeps the %s projection and its depth inside the editable footprint",
    (_, pose) => {
      for (const family of [
        "ios",
        "android",
        "ipad",
        "android-tablet",
        "monitor",
        "laptop",
        "card",
      ] as DeviceFamily[])
        for (const orientation of ["portrait", "landscape"] as const)
          for (const frame of [true, false]) {
            const device = deviceGeometry(family, 800, frame, orientation);
            const { dx, dy, ...attrs } = deviceProjection(device, pose);
            const node = new Konva.Group(attrs);
            try {
              for (const x of [0, device.width])
                for (const y of [0, device.height])
                  for (const depth of [0, 1]) {
                    const point = node.getTransform().point({ x, y });
                    expect(point.x + dx * depth).toBeGreaterThanOrEqual(
                      -0.0001,
                    );
                    expect(point.x + dx * depth).toBeLessThanOrEqual(
                      device.width + 0.0001,
                    );
                    expect(point.y + dy * depth).toBeGreaterThanOrEqual(
                      -0.0001,
                    );
                    expect(point.y + dy * depth).toBeLessThanOrEqual(
                      device.height + 0.0001,
                    );
                  }
              if (!frame) expect([Math.abs(dx), Math.abs(dy)]).toEqual([0, 0]);
            } finally {
              node.destroy();
            }
          }
    },
  );

  it.each(["atrium", "obsidian", "offset"] as const)(
    "keeps %s hardware, image and rotation registered across the seam",
    (template) => {
      const project = createProject();
      const id = addEmptySlide(project)!;
      project.style.device = "ios";
      project.style.camera = true;
      applyTemplate(project, id, template);
      project.shots.forEach((shot) => {
        shot.phone.rotation = 137;
      });
      // No drawing occurs here; the same image node used by PNG export must live inside the projected face.
      const image = {
        complete: true,
        naturalWidth: 1080,
        naturalHeight: 1920,
      } as HTMLImageElement;
      project.shots.forEach((shot) => {
        shot.assetId = "screenshot";
      });
      const layers = project.shots.map((shot) =>
        createScene(project, shot, image),
      );
      try {
        const faces = layers.map((layer) =>
          layer.findOne<Konva.Group>(".projected-device-face")!,
        );
        for (const face of faces) {
          expect(face).toBeDefined();
          expect(face.find("Image")).toHaveLength(1);
          expect(face.find("Circle").length).toBeGreaterThan(0); // Camera lenses share the screenshot transform.
          expect(face.getParent()!.rotation()).toBe(137);
        }
        const transforms = faces.map((face) =>
          face.getAbsoluteTransform().getMatrix(),
        );
        expect(transforms[1].slice(0, 4)).toEqual(transforms[0].slice(0, 4));
        expect(transforms[1][4]).toBeCloseTo(transforms[0][4] - 1080, 8);
        expect(transforms[1][5]).toBeCloseTo(transforms[0][5], 8);
        const decoration = layers.map((layer) =>
          layer.findOne<Konva.Group>(".panorama-collection-decoration")!,
        );
        expect(decoration[1].x()).toBe(decoration[0].x() - 1080);
        expect(
          decoration[1].getChildren().map((node) => node.toObject()),
        ).toEqual(decoration[0].getChildren().map((node) => node.toObject()));
      } finally {
        layers.forEach((layer) => layer.destroy());
      }
    },
  );

  it("leaves existing flat templates unchanged and excludes empty devices from exports", () => {
    const project = createProject();
    const id = addEmptySlide(project)!;
    for (const template of [
      "panorama",
      "signal",
      "mosaic",
      "folio",
      "atrium",
    ] as const) {
      applyTemplate(project, id, template);
      const editor = createScene(project, project.shots[0], undefined, {
        emptyDeviceLabel: "Add an image",
      });
      const output = createScene(project, project.shots[0], undefined);
      try {
        expect(editor.find(".projected-device-face")).toHaveLength(
          template === "atrium" ? 1 : 0,
        );
        expect(output.find(".scene-device")).toHaveLength(0);
      } finally {
        editor.destroy();
        output.destroy();
      }
    }
  });
});
