import Konva from "konva";
import type { Style } from "../core/model";
import type { Rect } from "./geometry";

const patternIds = new Set([
  "zest",
  "cabana",
  "contour",
  "cherry",
  "terracotta",
  "blueprint",
  "stitch",
  "parade",
]);

/** Bounded, deterministic vector patterns stay behind the product, clear of captions. */
export function drawPatternDecoration(
  layer: Konva.Layer,
  style: Style,
  h: number,
  panel: Rect,
) {
  if (!patternIds.has(style.template)) return;
  const verticalPadding = Math.min(28, h * 0.02);
  const x = Math.max(0, panel.x - 28),
    y = Math.max(0, panel.y - verticalPadding);
  const w = Math.min(1080 - x, panel.width + 56),
    ph = Math.min(h - y, panel.height + verticalPadding * 2);
  const group = new Konva.Group({
    x,
    y,
    listening: false,
    name: "template-decoration",
    clipX: 0,
    clipY: 0,
    clipWidth: w,
    clipHeight: ph,
  });
  const rect = (attrs: Konva.RectConfig) => group.add(new Konva.Rect(attrs));
  const line = (points: number[], opacity = 0.7, strokeWidth = 2) =>
    group.add(
      new Konva.Line({
        points,
        stroke: style.accentColor,
        opacity,
        strokeWidth,
      }),
    );

  switch (style.template) {
    case "zest": {
      rect({
        width: w,
        height: ph,
        fill: style.backgroundEnd,
        cornerRadius: [80, 0, 0, 0],
      });
      // Diagonal ribbons create a different rhythm from Cabana's vertical awning.
      for (let i = -5; i <= 10; i++) {
        const sx = (i * w) / 5;
        group.add(
          new Konva.Line({
            points: [
              sx,
              0,
              sx + w * 0.1,
              0,
              sx - w * 0.7,
              ph,
              sx - w * 0.8,
              ph,
            ],
            closed: true,
            fill: style.background,
            opacity: 0.72,
          }),
        );
      }
      break;
    }
    case "cabana": {
      rect({
        width: w,
        height: ph,
        fill: style.backgroundEnd,
        cornerRadius: 12,
      });
      for (let i = 0; i < 7; i++)
        rect({
          x: (i * w) / 7,
          width: w / 14,
          height: ph,
          fill: style.background,
          opacity: 0.8,
        });
      line([0, ph - 10, w, ph - 10], 0.6, 3);
      break;
    }
    case "contour": {
      rect({
        width: w,
        height: ph,
        fill: style.backgroundEnd,
        cornerRadius: [90, 12, 90, 12],
      });
      for (let i = 0; i < 21; i++) {
        const t = 0.15 + i * 0.055;
        group.add(
          new Konva.Shape({
            stroke: style.accentColor,
            strokeWidth: i % 4 === 0 ? 2.5 : 1.5,
            opacity: 0.42,
            sceneFunc(ctx, shape) {
              ctx.beginPath();
              ctx.moveTo(w * (0.5 - 0.42 * t), ph * 0.55);
              ctx.bezierCurveTo(
                w * (0.5 - 0.7 * t),
                ph * (0.55 - 0.3 * t),
                w * (0.5 + 0.1 * t),
                ph * (0.55 - 0.65 * t),
                w * (0.5 + 0.38 * t),
                ph * (0.55 - 0.3 * t),
              );
              ctx.bezierCurveTo(
                w * (0.5 + 0.7 * t),
                ph * (0.55 - 0.08 * t),
                w * (0.5 + 0.25 * t),
                ph * (0.55 + 0.52 * t),
                w * (0.5 - 0.08 * t),
                ph * (0.55 + 0.43 * t),
              );
              ctx.bezierCurveTo(
                w * (0.5 - 0.55 * t),
                ph * (0.55 + 0.45 * t),
                w * (0.5 - 0.25 * t),
                ph * (0.55 + 0.12 * t),
                w * (0.5 - 0.42 * t),
                ph * 0.55,
              );
              ctx.closePath();
              ctx.strokeShape(shape);
            },
          }),
        );
      }
      break;
    }
    case "cherry": {
      rect({ width: w, height: ph, fill: style.backgroundEnd });
      const tile = Math.max(w / 7, ph / 14);
      for (let row = 0; row < Math.ceil(ph / tile); row++)
        for (let column = 0; column < Math.ceil(w / tile); column++)
          if ((row + column) % 2 === 0)
            rect({
              x: column * tile,
              y: row * tile,
              width: tile,
              height: tile,
              fill: style.background,
            });
      break;
    }
    case "terracotta": {
      for (const [cx, cy, rotation] of [
        [w * 0.16, ph * 0.95, -160],
        [w * 0.86, ph * 0.05, 20],
      ]) {
        const radius = Math.min(w * 0.95, ph * 0.7);
        group.add(
          new Konva.Wedge({
            x: cx,
            y: cy,
            radius,
            angle: 160,
            rotation,
            fill: style.backgroundEnd,
          }),
        );
        for (let i = 0; i < 16; i++)
          group.add(
            new Konva.Wedge({
              x: cx,
              y: cy,
              radius,
              angle: 4,
              rotation: rotation + i * 10,
              fill: style.accentColor,
              opacity: 0.75,
            }),
          );
      }
      break;
    }
    case "blueprint": {
      rect({ width: w, height: ph, fill: style.backgroundEnd });
      const grid = Math.max(40, Math.min(w, ph) / 10);
      for (let i = 0; i <= Math.ceil(w / grid); i++)
        line([i * grid, 0, i * grid, ph], i % 5 === 0 ? 0.45 : 0.2, 1.5);
      for (let i = 0; i <= Math.ceil(ph / grid); i++)
        line([0, i * grid, w, i * grid], i % 5 === 0 ? 0.45 : 0.2, 1.5);
      line([18, 34, w - 18, 34], 0.85);
      line([w - 34, 18, w - 34, ph - 18], 0.85);
      for (const cx of [22, w - 22]) line([cx - 8, 46, cx + 8, 22], 0.9, 3);
      for (const cy of [22, ph - 22])
        line([w - 46, cy + 8, w - 22, cy - 8], 0.9, 3);
      break;
    }
    case "stitch": {
      rect({
        width: w,
        height: ph,
        fill: style.backgroundEnd,
        cornerRadius: 28,
        opacity: 0.55,
      });
      const step = Math.max(22, ph / 28);
      for (const center of [w * 0.08, w * 0.92]) {
        for (const direction of [-1, 1]) {
          const points: number[] = [];
          for (let i = -1; i <= Math.ceil(ph / step); i++)
            points.push(center + (i % 2 ? 1 : -1) * 13 * direction, i * step);
          line(points, 0.85, 3);
        }
        line([center, 0, center, ph], 0.25, 1);
      }
      break;
    }
    case "parade": {
      for (let row = 0; row < 6; row++) {
        const top = ph * (0.03 + row * 0.17);
        group.add(
          new Konva.Shape({
            fill: row % 2 ? style.accentColor : style.backgroundEnd,
            opacity: row % 2 ? 0.78 : 1,
            sceneFunc(ctx, shape) {
              ctx.beginPath();
              ctx.moveTo(-w * 0.3, top);
              for (let column = -1; column < 4; column++) {
                const sx = (column * w) / 3;
                ctx.bezierCurveTo(
                  sx + w / 12,
                  top + ph * 0.11,
                  sx + w / 4,
                  top + ph * 0.11,
                  sx + w / 3,
                  top,
                );
              }
              ctx.lineTo(w * 1.3, ph + 10);
              ctx.lineTo(-w * 0.3, ph + 10);
              ctx.closePath();
              ctx.fillStrokeShape(shape);
            },
          }),
        );
      }
      break;
    }
  }
  layer.add(group);
}
