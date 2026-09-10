import { describe, expect, it, vi } from "vitest";
import Konva from "konva";
import { attachDeviceResize } from "./device-resize";

function setup(rotation: number, cropOffset: number, rotationEnabled = false) {
  const layer = Object.assign(new Konva.Group(), {
    batchDraw: vi.fn(),
  }) as unknown as Konva.Layer;
  const phone = new Konva.Group({
    x: 900 - cropOffset,
    y: 750,
    offsetX: 300,
    offsetY: 600,
    width: 600,
    height: 1200,
    rotation,
  });
  phone.add(
    new Konva.Rect({
      x: -500,
      y: -400,
      width: 2000,
      height: 3000,
      fill: "red",
    }),
  );
  layer.add(phone);
  const commit = vi.fn(),
    select = vi.fn();
  const handles = attachDeviceResize(
    layer,
    phone,
    { width: 600, height: 1200 },
    cropOffset,
    commit,
    select,
    rotationEnabled,
  );
  return { layer, phone, handles, commit, select };
}

describe("device transform commits", () => {
  it.each([0, -12, 20, 90, -145, 180])(
    "maps a %s degree device from either panorama crop into shared document coordinates",
    (rotation) => {
      for (const cropOffset of [0, 1080]) {
        const { layer, phone, handles, commit, select } = setup(
          rotation,
          cropOffset,
        );
        expect(handles.visible()).toBe(false);
        expect(phone.getClientRect({ skipTransform: true })).toMatchObject({
          x: 0,
          y: 0,
          width: 600,
          height: 1200,
        });
        phone.fire("transformstart");
        expect(select).toHaveBeenCalledOnce();
        phone.scale({ x: 1.5, y: 1.5 });
        phone.position({ x: 950 - cropOffset, y: 900 });
        phone.fire("transform");
        expect(commit).not.toHaveBeenCalled();
        phone.fire("transformend");
        expect(commit).toHaveBeenCalledExactlyOnceWith({
          x: 500,
          y: 0,
          width: 900,
        });
        expect(phone.rotation()).toBe(rotation);
        layer.destroy();
      }
    },
  );
  it.each([0, 1080])(
    "rotates about the same center in crop %s with one commit",
    (cropOffset) => {
      for (const [angle, expected] of [
        [90, 90],
        [225, -135],
        [-270, 90],
        [540, -180],
      ]) {
        const { layer, phone, handles, commit } = setup(17, cropOffset, true);
        expect(handles.rotateEnabled()).toBe(true);
        phone.fire("transformstart");
        phone.rotation(angle);
        phone.fire("transform");
        expect(commit).not.toHaveBeenCalled();
        phone.fire("transformend");
        expect(commit).toHaveBeenCalledExactlyOnceWith({
          x: 600,
          y: 150,
          width: 600,
          rotation: expected,
        });
        layer.destroy();
      }
    },
  );
  it("leaves resize-only overlays unchanged and ignores a complete turn to the original angle", () => {
    const overlay = setup(0, 0);
    expect(overlay.handles.rotateEnabled()).toBe(false);
    overlay.layer.destroy();
    const { layer, phone, commit } = setup(12.5, 0, true);
    phone.fire("transformstart");
    phone.rotation(372.5);
    phone.fire("transformend");
    expect(commit).not.toHaveBeenCalled();
    layer.destroy();
  });
  it("does not create a history entry when an anchor is clicked without resizing", () => {
    const { layer, phone, commit } = setup(0, 0);
    phone.fire("transformstart");
    phone.fire("transformend");
    expect(commit).not.toHaveBeenCalled();
    layer.destroy();
  });
  it("keeps the rotation grip reachable when a template places the device near the top edge", () => {
    const { layer, phone, handles } = setup(0, 0, true);
    layer.scale({ x: 0.2, y: 0.2 });
    phone.position({ x: 900, y: 620 });
    const spy = vi.spyOn(phone, "getStage").mockReturnValue({
      width: () => 400,
      height: () => 400,
    } as Konva.Stage);
    handles.visible(true);
    expect(handles.rotateAnchorAngle()).toBe(90);
    const grip = handles.findOne(".rotater")!;
    const point = grip.getAbsolutePosition();
    expect(point.x).toBeGreaterThanOrEqual(22);
    expect(point.y).toBeGreaterThanOrEqual(22);
    expect(point.x).toBeLessThanOrEqual(378);
    expect(point.y).toBeLessThanOrEqual(378);
    expect(grip.getAttr("hitStrokeWidth")).toBe(30);
    spy.mockRestore();
    layer.destroy();
  });
  it("bounds size in document units at any preview zoom and prevents flips", () => {
    const { layer, phone, handles } = setup(0, 0);
    for (const scale of [0.15, 0.5, 1]) {
      const spy = vi
        .spyOn(phone, "getStage")
        .mockReturnValue({ scaleX: () => scale } as Konva.Stage);
      const old = {
        x: 0,
        y: 0,
        width: 600 * scale,
        height: 1200 * scale,
        rotation: 0,
      };
      const good = { ...old, width: 1000 * scale, height: 2000 * scale };
      expect(handles.boundBoxFunc()(old, good)).toBe(good);
      expect(
        handles.boundBoxFunc()(old, { ...good, width: 2161 * scale }),
      ).toBe(old);
      expect(handles.boundBoxFunc()(old, { ...good, width: 31 * scale })).toBe(
        old,
      );
      expect(handles.boundBoxFunc()(old, { ...good, height: -500 })).toBe(old);
      spy.mockRestore();
    }
    layer.destroy();
  });
});
