import { describe, expect, it } from "vitest";
import { deviceGeometry, fitImage, previewDimensions } from "./geometry";

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

  it("uses canonical document scaling at thumbnail and editor widths", () => {
    for (const width of [90, 270, 540, 1080]) {
      const preview = previewDimensions(width);
      expect(preview.width / preview.scale).toBe(1080);
      expect(preview.height / preview.scale).toBe(1920);
    }
  });

  it("rejects invalid geometry before attempting to draw or allocate an image", () => {
    expect(() => deviceGeometry("ios", 0, true)).toThrow();
    expect(() => deviceGeometry("android", Infinity, true)).toThrow();
    expect(() => previewDimensions(-1)).toThrow();
    expect(() =>
      fitImage(0, 100, { x: 0, y: 0, width: 100, height: 200 }, "cover"),
    ).toThrow();
  });
});
