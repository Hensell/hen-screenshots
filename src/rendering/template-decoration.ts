import Konva from "konva";
import type { Style } from "../core/model";
import type { Rect } from "./geometry";

/** Vector-only decoration shares the export scene and stays crisp at every size. */
export function drawTemplateDecoration(
  layer: Konva.Layer,
  style: Style,
  canvas: { width: number; height: number },
  panel: Rect,
) {
  const h = canvas.height;
  if (style.template === "studio") {
    const inset = Math.min(32, h * 0.04);
    layer.add(
      new Konva.Rect({
        x: inset,
        y: inset,
        width: canvas.width - inset * 2,
        height: h - inset * 2,
        stroke: style.accentColor,
        strokeWidth: 1.5,
        opacity: 0.5,
        listening: false,
      }),
    );
    layer.add(
      new Konva.Rect({
        x: panel.x,
        y: panel.y + panel.height * 0.28,
        width: panel.width,
        height: panel.height * 0.72,
        fill: style.backgroundEnd,
        cornerRadius: Math.min(24, h * 0.025),
        listening: false,
      }),
    );
  }
  if (style.template === "split") {
    layer.add(
      new Konva.Line({
        points:
          h <= 1080
            ? [420, 0, 1080, 0, 1080, h, 530, h]
            : [0, h * 0.39, 1080, h * 0.345, 1080, h, 0, h],
        fill: style.backgroundEnd,
        closed: true,
        listening: false,
      }),
    );
  }
  if (style.template === "halo") {
    const radius = Math.min(panel.width * 0.54, panel.height * 0.5);
    const center = {
      x: panel.x + panel.width / 2,
      y: panel.y + panel.height / 2,
    };
    layer.add(
      new Konva.Circle({
        ...center,
        radius,
        fill: style.backgroundEnd,
        listening: false,
      }),
    );
    layer.add(
      new Konva.Circle({
        ...center,
        radius: radius * 1.1,
        stroke: style.accentColor,
        strokeWidth: 1.5,
        opacity: 0.45,
        listening: false,
      }),
    );
  }
  if (style.template === "gallery") {
    layer.add(
      new Konva.Rect({
        x: panel.x - 20,
        y: panel.y - h * 0.015,
        width: panel.width + 40,
        height: panel.height + h * 0.03,
        fill: style.backgroundEnd,
        listening: false,
      }),
    );
    layer.add(
      new Konva.Line({
        points: [80, h * 0.735, 1000, h * 0.735],
        stroke: style.accentColor,
        strokeWidth: 2,
        listening: false,
      }),
    );
  }
}
