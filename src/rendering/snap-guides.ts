import type { Rect } from "./geometry";

export interface GuideTarget {
  axis: "x" | "y";
  position: number;
  start: number;
  end: number;
}

/** All positions are in scene coordinates, including the cropped half of a panorama. */
export function canvasGuideTargets(
  width: number,
  height: number,
  tiles = 1,
  cropOffset = 0,
): GuideTarget[] {
  const margin = Math.min(80, width * 0.08, height * 0.08);
  const targets: GuideTarget[] = [];
  for (let tile = 0; tile < tiles; tile++) {
    for (const x of [width / 2, margin, width - margin, 0, width])
      targets.push({
        axis: "x",
        position: tile * width + x - cropOffset,
        start: 0,
        end: height,
      });
  }
  for (const y of [height / 2, margin, height - margin, 0, height])
    targets.push({
      axis: "y",
      position: y,
      start: -cropOffset,
      end: width * tiles - cropOffset,
    });
  return targets;
}

export function objectGuideTargets(rect: Rect): GuideTarget[] {
  return [
    ...[rect.x + rect.width / 2, rect.x, rect.x + rect.width].map(
      (position) => ({
        axis: "x" as const,
        position,
        start: rect.y,
        end: rect.y + rect.height,
      }),
    ),
    ...[rect.y + rect.height / 2, rect.y, rect.y + rect.height].map(
      (position) => ({
        axis: "y" as const,
        position,
        start: rect.x,
        end: rect.x + rect.width,
      }),
    ),
  ];
}

/** At most one match per axis, nearest first. Threshold is supplied in scene units. */
export function snapToGuides(
  rect: Rect,
  targets: GuideTarget[],
  threshold: number,
) {
  const result = { x: 0, y: 0, guides: [] as GuideTarget[] };
  for (const axis of ["x", "y"] as const) {
    const size = axis === "x" ? rect.width : rect.height;
    const anchors = [rect[axis] + size / 2, rect[axis], rect[axis] + size];
    let match: { delta: number; target: GuideTarget } | undefined;
    for (const target of targets) {
      if (target.axis !== axis) continue;
      for (const anchor of anchors) {
        const delta = target.position - anchor;
        if (
          Math.abs(delta) <= threshold &&
          (!match || Math.abs(delta) < Math.abs(match.delta))
        )
          match = { delta, target };
      }
    }
    if (match) {
      result[axis] = match.delta;
      const cross = axis === "x" ? rect.y : rect.x;
      const span = axis === "x" ? rect.height : rect.width;
      result.guides.push({
        ...match.target,
        start: Math.min(match.target.start, cross),
        end: Math.max(match.target.end, cross + span),
      });
    }
  }
  return result;
}
