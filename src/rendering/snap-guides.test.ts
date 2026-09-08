import { describe, expect, it } from "vitest";
import {
  canvasGuideTargets,
  objectGuideTargets,
  snapToGuides,
} from "./snap-guides";

describe("smart alignment guides", () => {
  it("snaps a nearby center and extends the guide across the moving object", () => {
    const result = snapToGuides(
      { x: 443, y: -30, width: 200, height: 400 },
      canvasGuideTargets(1080, 1920),
      6,
    );
    expect(result.x).toBe(-3);
    expect(result.y).toBe(0);
    expect(result.guides).toEqual([
      { axis: "x", position: 540, start: -30, end: 1920 },
    ]);
  });

  it("leaves positions outside the threshold untouched", () => {
    expect(
      snapToGuides(
        { x: 455, y: 345, width: 200, height: 400 },
        canvasGuideTargets(1080, 1920),
        6,
      ),
    ).toEqual({ x: 0, y: 0, guides: [] });
  });

  it("aligns text edges with another object on both axes", () => {
    const result = snapToGuides(
      { x: 81, y: 295, width: 300, height: 200 },
      objectGuideTargets({ x: 80, y: 80, width: 600, height: 220 }),
      6,
    );
    expect(result.x).toBe(-1);
    expect(result.y).toBe(5);
    expect(result.guides).toHaveLength(2);
  });

  it("chooses the closest target rather than the first matching target", () => {
    const result = snapToGuides(
      { x: 100, y: 100, width: 200, height: 200 },
      [
        { axis: "x", position: 195, start: 0, end: 1000 },
        { axis: "x", position: 201, start: 0, end: 1000 },
      ],
      6,
    );
    expect(result.x).toBe(1);
    expect(result.guides).toHaveLength(1);
  });

  it("uses the same physical threshold at thumbnail and editor scales", () => {
    for (const scale of [0.1, 0.25, 0.5, 1]) {
      const target = [
        { axis: "x" as const, position: 540, start: 0, end: 1920 },
      ];
      expect(
        snapToGuides(
          { x: 240 + 5 / scale, y: 200, width: 600, height: 300 },
          target,
          6 / scale,
        ).x,
      ).toBeCloseTo(-5 / scale);
      expect(
        snapToGuides(
          { x: 240 + 7 / scale, y: 200, width: 600, height: 300 },
          target,
          6 / scale,
        ).guides,
      ).toEqual([]);
    }
  });

  it("keeps panorama alignment invariant between cropped halves", () => {
    const box = { x: 1517, y: 83, width: 200, height: 400 };
    const left = snapToGuides(box, canvasGuideTargets(1080, 1920, 2), 6);
    const right = snapToGuides(
      { ...box, x: box.x - 1080 },
      canvasGuideTargets(1080, 1920, 2, 1080),
      6,
    );
    expect(left.x).toBe(3);
    expect(left.y).toBe(-3);
    expect(right.x).toBe(left.x);
    expect(right.y).toBe(left.y);
    expect(right.guides).toEqual(
      left.guides.map((guide) =>
        guide.axis === "x"
          ? { ...guide, position: guide.position - 1080 }
          : { ...guide, start: guide.start - 1080, end: guide.end - 1080 },
      ),
    );
  });

  it("scales margins for short landscape canvases", () => {
    expect(canvasGuideTargets(1080, 270)).toContainEqual({
      axis: "y",
      position: 21.6,
      start: -0,
      end: 1080,
    });
  });
});
