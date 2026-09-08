import Konva from "konva";
import type { Style } from "../core/model";
import type { Rect } from "./geometry";

/** Vector artwork stays crisp in both Play banner sizes. */
export function drawBannerDecoration(
  layer: Konva.Layer,
  style: Style,
  panel: Rect,
) {
  if (!style.template.startsWith("banner-")) return;
  const group = new Konva.Group({
    listening: false,
    name: "banner-decoration",
  });
  const { x, y, width: w, height: h } = panel;
  const center = { x: x + w / 2, y: y + h / 2 };
  switch (style.template) {
    case "banner-signal":
      group.add(
        new Konva.Rect({
          ...panel,
          fill: style.backgroundEnd,
          cornerRadius: 56,
        }),
      );
      group.add(
        new Konva.Circle({
          x: x + w - 12,
          y: y + 12,
          radius: 16,
          fill: style.accentColor,
        }),
      );
      group.add(
        new Konva.Line({
          points: [x - 24, y + h - 26, x - 24, y + h + 8, x + 10, y + h + 8],
          stroke: style.accentColor,
          strokeWidth: 2,
        }),
      );
      break;
    case "banner-orbit":
      group.add(
        new Konva.Circle({
          ...center,
          radius: Math.min(w, h) * 0.46,
          fill: style.backgroundEnd,
        }),
      );
      for (const scale of [0.55, 0.63])
        group.add(
          new Konva.Ellipse({
            ...center,
            radiusX: w * scale,
            radiusY: h * 0.43,
            rotation: -28,
            stroke: style.accentColor,
            strokeWidth: 1,
            opacity: 0.65,
          }),
        );
      group.add(
        new Konva.Circle({
          x: x + w - 10,
          y: y + 46,
          radius: 8,
          fill: style.textColor,
        }),
      );
      break;
    case "banner-editorial":
      group.add(
        new Konva.Rect({
          ...panel,
          fill: style.backgroundEnd,
          cornerRadius: [w / 2, w / 2, 12, 12],
        }),
      );
      for (const lineY of [y - 18, y + h + 18])
        group.add(
          new Konva.Line({
            points: [110, lineY, 970, lineY],
            stroke: style.accentColor,
            strokeWidth: 1,
            opacity: 0.55,
          }),
        );
      break;
    case "banner-ribbon":
      group.add(
        new Konva.Rect({
          x: x - 28,
          y: y + 8,
          width: w + 36,
          height: h - 10,
          cornerRadius: 36,
          fill: style.backgroundEnd,
          rotation: -5,
        }),
      );
      group.add(
        new Konva.Line({
          points: [
            x - 150,
            y + h * 0.76,
            x + w + 30,
            y + h * 0.33,
            x + w + 30,
            y + h * 0.64,
            x - 150,
            y + h * 1.07,
          ],
          closed: true,
          fill: style.accentColor,
          opacity: 0.48,
        }),
      );
      break;
    case "banner-dusk":
      group.add(
        new Konva.Rect({
          ...panel,
          cornerRadius: [w / 2, w / 2, 12, 12],
          fill: style.backgroundEnd,
        }),
      );
      group.add(
        new Konva.Rect({
          x: x - 16,
          y: y - 16,
          width: w + 32,
          height: h + 32,
          cornerRadius: [w / 2 + 16, w / 2 + 16, 16, 16],
          stroke: style.accentColor,
          strokeWidth: 1,
          opacity: 0.7,
        }),
      );
      group.add(
        new Konva.Circle({
          x: x + w - 12,
          y: y + 26,
          radius: 20,
          fill: style.accentColor,
        }),
      );
      break;
    case "banner-confetti":
      group.add(
        new Konva.Rect({
          ...panel,
          fill: style.backgroundEnd,
          cornerRadius: 40,
          rotation: 4,
        }),
      );
      group.add(
        new Konva.Circle({
          x: x + w - 14,
          y: y + h - 20,
          radius: 48,
          fill: style.accentColor,
        }),
      );
      group.add(
        new Konva.Wedge({
          x: x + 20,
          y: y + 18,
          radius: 65,
          angle: 180,
          rotation: -35,
          fill: style.accentColor,
        }),
      );
      group.add(
        new Konva.Rect({
          x: x + w - 32,
          y: y + 6,
          width: 18,
          height: 42,
          rotation: 28,
          fill: style.textColor,
          opacity: 0.6,
        }),
      );
      break;
  }
  layer.add(group);
}
