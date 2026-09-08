import Konva from "konva";
import type { Rect } from "./geometry";
import {
  canvasGuideTargets,
  objectGuideTargets,
  snapToGuides,
} from "./snap-guides";

/** Measure the composition box, excluding selection outlines, shadows and camera details. */
function bounds(group: Konva.Group): Rect {
  const box = group.getAttr("guideBounds") as Rect;
  const transform = group.getTransform();
  const corners = [
    { x: box.x, y: box.y },
    { x: box.x + box.width, y: box.y },
    { x: box.x, y: box.y + box.height },
    { x: box.x + box.width, y: box.y + box.height },
  ].map((point) => transform.point(point));
  const x = Math.min(...corners.map((point) => point.x));
  const y = Math.min(...corners.map((point) => point.y));
  return {
    x,
    y,
    width: Math.max(...corners.map((point) => point.x)) - x,
    height: Math.max(...corners.map((point) => point.y)) - y,
  };
}

/** Only installed on interactive scenes. Nothing here is serialized or exported. */
export function attachSceneGuides(
  layer: Konva.Layer,
  canvas: { width: number; height: number },
  tiles: number,
  cropOffset: number,
) {
  const objects = layer
    .getChildren()
    .filter(
      (node): node is Konva.Group =>
        node instanceof Konva.Group && Boolean(node.getAttr("guideBounds")),
    );
  const overlay = new Konva.Group({ name: "smart-guides", listening: false });
  layer.add(overlay);
  const clear = () => {
    overlay.destroyChildren();
    layer.batchDraw();
  };
  for (const object of objects) {
    object.on("dragmove.guides", (event) => {
      overlay.destroyChildren();
      if ("altKey" in event.evt && event.evt.altKey) {
        layer.batchDraw();
        return;
      }
      const scale = Math.max(0.01, Math.abs(layer.getStage()?.scaleX() ?? 1));
      const targets = [
        ...canvasGuideTargets(canvas.width, canvas.height, tiles, cropOffset),
        ...objects
          .filter((other) => other !== object)
          .flatMap((other) => objectGuideTargets(bounds(other))),
      ];
      const snap = snapToGuides(bounds(object), targets, 6 / scale);
      object.position({ x: object.x() + snap.x, y: object.y() + snap.y });
      for (const guide of snap.guides) {
        const points =
          guide.axis === "x"
            ? [guide.position, guide.start, guide.position, guide.end]
            : [guide.start, guide.position, guide.end, guide.position];
        // A white underlay keeps the line visible on dark and busy backgrounds.
        for (const [stroke, strokeWidth] of [
          ["#ffffff", 3],
          ["#a3422d", 1],
        ] as const)
          overlay.add(
            new Konva.Line({
              points,
              stroke,
              strokeWidth,
              strokeScaleEnabled: false,
              listening: false,
            }),
          );
      }
      overlay.moveToTop();
      layer.batchDraw();
    });
    object.on("dragend.guides", clear);
  }
}
