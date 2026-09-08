import { describe, expect, it, vi } from "vitest";
import Konva from "konva";
import { attachDeviceResize } from "./device-resize";

function setup(rotation: number, cropOffset: number) {
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
  );
  return { layer, phone, handles, commit, select };
}

describe("device transform commits", () => {
  it.each([0, -12, 20])(
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
  it("does not create a history entry when an anchor is clicked without resizing", () => {
    const { layer, phone, commit } = setup(0, 0);
    phone.fire("transformstart");
    phone.fire("transformend");
    expect(commit).not.toHaveBeenCalled();
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
