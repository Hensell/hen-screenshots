import { describe, expect, it } from "vitest";
import { deviceGeometry, fitImage, previewDimensions } from "./geometry";
import type { DeviceFamily } from "../core/model";

describe("capture geometry", () => {
  it("contains the whole source with equal scale on both axes", () => {
    const target = { x: 20, y: 30, width: 500, height: 1000 };
    const image = fitImage(1200, 2000, target, "contain");
    expect(image.width / 1200).toBeCloseTo(image.height / 2000);
    expect(image.width).toBeCloseTo(target.width);
    expect(image.height).toBeLessThan(target.height);
    expect(image.x + image.width / 2).toBeCloseTo(target.x + target.width / 2);
    expect(image.y + image.height / 2).toBeCloseTo(
      target.y + target.height / 2,
    );
  });

  it("covers the complete screen without stretching and crops equally on both sides", () => {
    const target = { x: 15, y: 15, width: 540, height: 1200 };
    const image = fitImage(1920, 1080, target, "cover");
    expect(image.width / 1920).toBeCloseTo(image.height / 1080);
    expect(image.height).toBeCloseTo(target.height);
    expect(image.x).toBeLessThan(target.x);
    expect(target.x - image.x).toBeCloseTo(
      image.x + image.width - target.x - target.width,
    );
  });

  it.each(["android", "ios"] as const)(
    "keeps %s screen and camera inside the phone at multiple scales",
    (family) => {
      const large = deviceGeometry(family, 620, true);
      const small = deviceGeometry(family, 310, true);
      expect(large.version).toBe(1);
      expect(large.width).toBe(620);
      expect(large.height).toBeCloseTo(small.height * 2);
      expect(large.screen.x).toBeGreaterThan(0);
      expect(large.screen.x + large.screen.width).toBeLessThan(large.width);
      expect(large.screen.y + large.screen.height).toBeLessThan(large.height);
      expect(large.camera.x).toBeGreaterThan(large.screen.x);
      expect(large.camera.x + large.camera.width).toBeLessThan(
        large.screen.x + large.screen.width,
      );
      expect(large.camera.y + large.camera.height).toBeLessThan(
        large.screen.y + large.screen.height,
      );
      expect(large.screen.radius).toBeGreaterThan(0);
    },
  );

  it("removes the bezel without changing the requested phone width", () => {
    const bare = deviceGeometry("android", 620, false);
    expect(bare.width).toBe(620);
    expect(bare.screen.x).toBe(0);
    expect(bare.screen.y).toBe(0);
    expect(bare.screen.width).toBe(bare.width);
    expect(bare.screen.height).toBe(bare.height);
  });

  it.each(["android", "ios"] as const)(
    "preserves the original portrait %s footprint and image placement",
    (family) => {
      const width = 620;
      for (const frame of [true, false]) {
        const inset = frame ? width * (family === "ios" ? 0.027 : 0.024) : 0;
        const screenWidth = width - inset * 2;
        const screenHeight =
          screenWidth * (family === "ios" ? 19.5 / 9 : 20 / 9);
        expect(deviceGeometry(family, width, frame)).toMatchObject({
          width,
          height: screenHeight + inset * 2,
          screen: {
            x: inset,
            y: inset,
            width: screenWidth,
            height: screenHeight,
          },
        });
      }
    },
  );

  it("makes a simple card with no hardware or camera and optional rounded corners", () => {
    const card = deviceGeometry("card", 800, true, "landscape");
    expect(card.height).toBe(600);
    expect(card.screen).toMatchObject({ x: 0, y: 0, width: 800, height: 600 });
    expect(card.screen.radius).toBeGreaterThan(0);
    expect(card.body).toBeUndefined();
    expect(card.base).toBeUndefined();
    expect(card.camera.width).toBe(0);
    expect(deviceGeometry("card", 800, false, "landscape").screen.radius).toBe(
      0,
    );
  });

  const screenRatios: Record<DeviceFamily, number> = {
    card: 3 / 4,
    android: 9 / 20,
    ios: 9 / 19.5,
    ipad: 3 / 4,
    "android-tablet": 10 / 16,
    monitor: 16 / 9,
    laptop: 16 / 10,
  };

  it.each(Object.keys(screenRatios) as DeviceFamily[])(
    "keeps every %s part in bounds and scales without distorting the screen",
    (family) => {
      for (const width of [32, 160, 620, 2160]) {
        for (const frame of [true, false]) {
          for (const orientation of ["portrait", "landscape"] as const) {
            const geometry = deviceGeometry(family, width, frame, orientation);
            const desktop = family === "monitor" || family === "laptop";
            const ratio =
              !desktop && orientation === "landscape"
                ? 1 / screenRatios[family]
                : screenRatios[family];
            expect(geometry.width).toBe(width);
            expect(geometry.screen.width / geometry.screen.height).toBeCloseTo(
              ratio,
            );
            for (const part of [
              geometry.screen,
              family === "card" ? undefined : geometry.camera,
              geometry.body,
              geometry.stand,
              geometry.base,
              geometry.keyboard,
              geometry.trackpad,
              geometry.handheld?.shell,
              ...(geometry.handheld?.buttons ?? []),
              ...(geometry.handheld?.antennaBands ?? []),
              geometry.handheld?.speaker,
            ]) {
              if (!part) continue;
              expect(part.x).toBeGreaterThanOrEqual(-0.000001);
              expect(part.y).toBeGreaterThanOrEqual(-0.000001);
              expect(part.width).toBeGreaterThan(0);
              expect(part.height).toBeGreaterThan(0);
              expect(part.x + part.width).toBeLessThanOrEqual(
                geometry.width + 0.000001,
              );
              expect(part.y + part.height).toBeLessThanOrEqual(
                geometry.height + 0.000001,
              );
            }
            const fitted = fitImage(2560, 1440, geometry.screen, "contain");
            expect(fitted.width / fitted.height).toBeCloseTo(2560 / 1440);
            expect(fitted.width).toBeLessThanOrEqual(
              geometry.screen.width + 0.000001,
            );
            expect(fitted.height).toBeLessThanOrEqual(
              geometry.screen.height + 0.000001,
            );
            const doubled = deviceGeometry(
              family,
              width * 2,
              frame,
              orientation,
            );
            expect(doubled.height).toBeCloseTo(geometry.height * 2);
            if (!frame) {
              expect(geometry.body).toBeUndefined();
              expect(geometry.stand).toBeUndefined();
              expect(geometry.base).toBeUndefined();
              expect(geometry.handheld).toBeUndefined();
              expect(geometry.screen.width).toBeCloseTo(geometry.width);
              expect(geometry.screen.height).toBeCloseTo(geometry.height);
            }
          }
        }
      }
    },
  );

  it("rotates handheld hardware together with its screen", () => {
    const portrait = deviceGeometry("ipad", 620, true);
    const landscape = deviceGeometry(
      "ipad",
      portrait.height,
      true,
      "landscape",
    );
    expect(landscape.height).toBeCloseTo(portrait.width);
    expect(landscape.screen.width).toBeCloseTo(portrait.screen.height);
    expect(landscape.screen.height).toBeCloseTo(portrait.screen.width);
    expect(landscape.camera.x).toBeCloseTo(portrait.camera.y);
    expect(landscape.camera.width).toBeCloseTo(portrait.camera.height);
    portrait.handheld!.buttons.forEach((button, index) => {
      const turned = landscape.handheld!.buttons[index];
      expect(turned.x).toBeCloseTo(button.y);
      expect(turned.y).toBeCloseTo(portrait.width - button.x - button.width);
      expect(turned.width).toBeCloseTo(button.height);
      expect(turned.height).toBeCloseTo(button.width);
    });
    // The tablet camera belongs to its long bezel, and lands above the screen in landscape.
    expect(portrait.camera.x).toBeGreaterThan(
      portrait.screen.x + portrait.screen.width,
    );
    expect(landscape.camera.y + landscape.camera.height).toBeLessThan(
      landscape.screen.y,
    );
  });

  it("counts desktop hardware as part of the device bounds", () => {
    const monitor = deviceGeometry("monitor", 900, true);
    const laptop = deviceGeometry("laptop", 900, true);
    expect(monitor.height).toBeGreaterThan(monitor.body!.height);
    expect(monitor.base!.y).toBeGreaterThan(monitor.body!.height);
    expect(laptop.body!.width).toBeLessThan(laptop.width);
    expect(laptop.base!.width).toBe(laptop.width);
    expect(laptop.base!.y + laptop.base!.height).toBe(laptop.height);
  });

  it("uses canonical document scaling at thumbnail and editor widths", () => {
    for (const width of [90, 270, 540, 1080]) {
      const preview = previewDimensions(width);
      expect(preview.width / preview.scale).toBe(1080);
      expect(preview.height / preview.scale).toBe(1920);
    }
  });

  it("uses the selected canvas aspect ratio for a preview", () => {
    const landscape = previewDimensions(360, { width: 1080, height: 675 });
    expect(landscape).toEqual({ width: 360, height: 225, scale: 1 / 3 });
    const tablet = previewDimensions(270, { width: 1080, height: 1440 });
    expect(tablet).toEqual({ width: 270, height: 360, scale: 0.25 });
  });

  it("rejects invalid geometry before attempting to draw or allocate an image", () => {
    expect(() => deviceGeometry("ios", 0, true)).toThrow();
    expect(() => deviceGeometry("android", Infinity, true)).toThrow();
    expect(() => previewDimensions(-1)).toThrow();
    expect(() => previewDimensions(100, { width: 1080, height: 0 })).toThrow();
    expect(() =>
      fitImage(0, 100, { x: 0, y: 0, width: 100, height: 200 }, "cover"),
    ).toThrow();
  });
});
