import Konva from "konva";
import type { Style } from "../core/model";
import type { Rect } from "./geometry";
import { isPanoramaEnd, panoramaStart } from "../core/panorama-families";

/** Original vector artwork: no remote assets, filters, or export-only effects. */
export function drawShowcaseDecoration(
  layer: Konva.Layer,
  style: Style,
  h: number,
  panel: Rect,
) {
  const { x, y, width: w, height: ph } = panel;
  const group = new Konva.Group({
    x: isPanoramaEnd(style.template) ? -1080 : 0,
    listening: false,
    name: "template-decoration",
  });
  const rect = (attrs: Konva.RectConfig) => group.add(new Konva.Rect(attrs));
  const line = (points: number[], opacity = 0.65, strokeWidth = 2) =>
    group.add(
      new Konva.Line({
        points,
        stroke: style.accentColor,
        strokeWidth,
        opacity,
      }),
    );
  const polygon = (points: number[], fill: string, opacity = 1) =>
    group.add(new Konva.Line({ points, closed: true, fill, opacity }));

  if (style.template === "prism") {
    polygon(
      [
        x - 30,
        y + ph * 0.15,
        x + w * 0.82,
        y - ph * 0.04,
        x + w + 40,
        y + ph * 0.9,
        x + w * 0.22,
        y + ph * 1.06,
      ],
      style.backgroundEnd,
      0.8,
    );
    polygon(
      [
        x + w * 0.3,
        y - ph * 0.08,
        x + w * 0.97,
        y + ph * 0.1,
        x + w * 0.68,
        y + ph * 1.06,
        x - 40,
        y + ph * 0.76,
      ],
      style.background,
      0.65,
    );
    line(
      [
        x - 30,
        y + ph * 0.15,
        x + w * 0.82,
        y - ph * 0.04,
        x + w + 40,
        y + ph * 0.9,
      ],
      0.5,
    );
    line([x + w * 0.3, y - ph * 0.08, x + w * 0.68, y + ph * 1.06], 0.35);
  }
  if (style.template === "nocturne") {
    rect({
      x: x - 20,
      y: y - 20,
      width: w + 40,
      height: ph + 40,
      fill: style.backgroundEnd,
      cornerRadius: 6,
    });
    rect({
      x: x - 6,
      y: y - 6,
      width: w + 12,
      height: ph + 12,
      stroke: style.accentColor,
      strokeWidth: 1,
      opacity: 0.35,
      cornerRadius: 3,
    });
    // Fine margin rules give the caption a deliberate editorial edge.
    if (h > 1080) line([84, h * 0.735, 996, h * 0.735], 0.65);
    else line([608, h * 0.1, 608, h * 0.9], 0.4);
  }
  if (style.template === "paper") {
    rect({
      x: x - 16,
      y: y - 18,
      width: w + 32,
      height: ph + 36,
      fill: style.backgroundEnd,
      opacity: 0.6,
    });
    line([80, h * 0.035, 1000, h * 0.035], 0.85, 3);
    line([80, h * 0.975, 1000, h * 0.975], 0.7, 1.5);
    if (h > 1080) {
      line([80, h * 0.26, 1000, h * 0.26], 0.8, 1.5);
      line([84, h * 0.875, 200, h * 0.875], 0.85, 4);
    }
  }
  if (style.template === "carbon") {
    rect({
      x: x - 12,
      y: y - 12,
      width: w + 24,
      height: ph + 24,
      fill: style.backgroundEnd,
      cornerRadius: 5,
    });
    for (const [cx, cy, sx, sy] of [
      [x - 22, y - 22, 1, 1],
      [x + w + 22, y - 22, -1, 1],
      [x - 22, y + ph + 22, 1, -1],
      [x + w + 22, y + ph + 22, -1, -1],
    ])
      line([cx, cy + 36 * sy, cx, cy, cx + 36 * sx, cy], 0.8, 3);
    for (let i = 0; i < 12; i++)
      line(
        [x + w - 110 + i * 9, y + ph + 37, x + w - 103 + i * 9, y + ph + 28],
        0.4,
        1.5,
      );
  }
  if (style.template === "workbench") {
    rect({
      x: x - 24,
      y: y - 24,
      width: w + 48,
      height: ph + 48,
      fill: style.backgroundEnd,
      opacity: 0.6,
      cornerRadius: 8,
    });
    for (let i = 0; i <= 18; i++)
      line([x + (w * i) / 18, y - 24, x + (w * i) / 18, y + ph + 24], 0.15, 1);
    for (let i = 0; i <= 10; i++)
      line([x - 24, y + (ph * i) / 10, x + w + 24, y + (ph * i) / 10], 0.15, 1);
    line([76, h * 0.235, 1004, h * 0.235], 0.55, 1.5);
    line([80, h * 0.85, 1000, h * 0.85], 0.55, 1.5);
  }
  if (style.template === "ember") {
    const cx = x + w / 2;
    group.add(
      new Konva.Ellipse({
        x: cx,
        y: y + ph * 0.53,
        radiusX: w * 0.48,
        radiusY: ph * 0.54,
        fill: style.backgroundEnd,
        opacity: 0.6,
      }),
    );
    group.add(
      new Konva.Ellipse({
        x: cx,
        y: y + ph * 0.94,
        radiusX: w * 0.57,
        radiusY: ph * 0.075,
        fill: style.accentColor,
        opacity: 0.75,
      }),
    );
    polygon(
      [
        x - w * 0.07,
        y + ph * 0.94,
        x + w * 1.07,
        y + ph * 0.94,
        x + w * 1.18,
        y + ph * 1.09,
        x - w * 0.18,
        y + ph * 1.09,
      ],
      style.backgroundEnd,
    );
    line([x - w * 0.07, y + ph * 0.94, x + w * 1.07, y + ph * 0.94], 0.8, 2);
  }
  if (style.template === "confetti") {
    rect({
      x: x + w * 0.5,
      y: y + ph * 0.5,
      offsetX: w * 0.48,
      offsetY: ph * 0.5,
      width: w * 0.96,
      height: ph,
      rotation: 6,
      cornerRadius: 24,
      fill: style.backgroundEnd,
    });
    group.add(
      new Konva.Circle({
        x: x + w * 0.12,
        y: y + ph * 0.56,
        radius: Math.min(w * 0.27, ph * 0.3),
        fill: style.accentColor,
      }),
    );
    rect({
      x: x + w * 0.78,
      y: y + ph * 0.01,
      width: 62,
      height: 62,
      rotation: 18,
      fill: style.accentColor,
      cornerRadius: 8,
    });
    group.add(
      new Konva.Arc({
        x: x + w * 0.84,
        y: y + ph * 0.86,
        innerRadius: 34,
        outerRadius: 50,
        angle: 260,
        rotation: 15,
        fill: style.textColor,
        opacity: 0.7,
      }),
    );
  }
  if (panoramaStart(style.template) === "orbit") {
    group.add(
      new Konva.Ellipse({
        x: 1080,
        y: h * 0.52,
        radiusX: 650,
        radiusY: h * 0.36,
        fill: style.backgroundEnd,
        opacity: 0.65,
      }),
    );
    for (let i = 0; i < 4; i++)
      group.add(
        new Konva.Ellipse({
          x: 1080,
          y: h * 0.53,
          radiusX: 780 + i * 75,
          radiusY: h * (0.23 + i * 0.045),
          rotation: -24,
          stroke: style.accentColor,
          strokeWidth: i === 2 ? 3 : 1.4,
          opacity: i === 2 ? 0.6 : 0.28,
        }),
      );
    group.add(
      new Konva.Circle({
        x: 350,
        y: h * 0.62,
        radius: Math.min(28, h * 0.025),
        fill: style.accentColor,
      }),
    );
    group.add(
      new Konva.Circle({
        x: 1820,
        y: h * 0.32,
        radius: Math.min(16, h * 0.015),
        fill: style.accentColor,
        opacity: 0.65,
      }),
    );
  }
  if (group.hasChildren()) layer.add(group);
  else group.destroy();
}
