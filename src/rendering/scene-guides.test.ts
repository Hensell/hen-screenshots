import { describe, expect, it, vi } from "vitest";
import Konva from "konva";
import { attachSceneGuides } from "./scene-guides";

// Real Konva nodes/transforms/event handlers; only the canvas drawing surface is absent.
function setup(rotation = 0, scale = 1) {
  const root = new Konva.Group();
  const layer = Object.assign(root, {
    batchDraw: vi.fn(),
  }) as unknown as Konva.Layer;
  vi.spyOn(layer, "getStage").mockReturnValue({
    scaleX: () => scale,
    batchDraw: vi.fn(),
  } as unknown as Konva.Stage);
  const object = new Konva.Group({
    x: 543,
    y: 500,
    offsetX: 100,
    offsetY: 200,
    rotation,
    guideBounds: { x: 0, y: 0, width: 200, height: 400 },
  });
  root.add(object);
  attachSceneGuides(layer, { width: 1080, height: 1920 }, 1, 0);
  return { root, object, overlay: root.findOne<Konva.Group>(".smart-guides")! };
}

describe("interactive scene guides", () => {
  it.each([0, -12, 90])(
    "measures a %s° rotated device around its offset center",
    (rotation) => {
      const { root, object, overlay } = setup(rotation);
      object.fire("dragmove", { evt: { altKey: false } });
      expect(object.x()).toBeCloseTo(540);
      expect(overlay.getChildren().length).toBeGreaterThan(0);
      expect(overlay.listening()).toBe(false);
      for (const line of overlay.getChildren()) {
        expect((line as Konva.Line).strokeScaleEnabled()).toBe(false);
      }
      object.fire("dragend", { evt: {} });
      expect(overlay.getChildren()).toHaveLength(0);
      root.destroy();
    },
  );

  it("supports Alt/Option free movement and clears an existing guide", () => {
    const { root, object, overlay } = setup();
    object.fire("dragmove", { evt: {} });
    expect(overlay.getChildren().length).toBeGreaterThan(0);
    object.x(543);
    object.fire("dragmove", { evt: { altKey: true } });
    expect(object.x()).toBe(543);
    expect(overlay.getChildren()).toHaveLength(0);
    root.destroy();
  });

  it("uses the stage scale for pointer snapping", () => {
    const { root, object } = setup(0, 0.25);
    object.x(560);
    object.fire("dragmove", { evt: {} });
    expect(object.x()).toBe(540);
    root.destroy();
  });
});
