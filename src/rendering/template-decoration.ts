import Konva from "konva";
import { drawHalloweenDecoration } from "./halloween-decoration";
import type { Style } from "../core/model";
import type { Rect } from "./geometry";
import { isPanoramaEnd, panoramaStart } from "../core/panorama-families";
import { drawShowcaseDecoration } from "./showcase-decoration";
import { drawPatternDecoration } from "./pattern-decoration";

/** All paths use spread coordinates, including the off-canvas half of a panorama. */
function drawExpressiveDecoration(
  layer: Konva.Layer,
  style: Style,
  h: number,
  panel: Rect,
) {
  const family = panoramaStart(style.template);
  const group = new Konva.Group({
    x: isPanoramaEnd(style.template) ? -1080 : 0,
    listening: false,
    name: "template-decoration",
  });
  const wide = h <= 1080;
  if (family === "daybreak") {
    group.add(
      new Konva.Circle({
        x: 260,
        y: h * 0.52,
        radius: Math.min(140, h * 0.085),
        fill: style.backgroundEnd,
        opacity: 0.28,
      }),
    );
    for (let i = 0; i < 4; i++) {
      group.add(
        new Konva.Shape({
          fillLinearGradientStartPoint: { x: 0, y: 0 },
          fillLinearGradientEndPoint: { x: 2160, y: h },
          fillLinearGradientColorStops: [
            0,
            i < 2 ? style.backgroundEnd : style.accentColor,
            1,
            i === 0 ? style.backgroundEnd : style.accentColor,
          ],
          opacity: [0.68, 0.82, 0.48, 1][i],
          sceneFunc(ctx, shape) {
            const y = h * (0.6 + i * 0.1);
            ctx.beginPath();
            ctx.moveTo(-10, y);
            for (let segment = 0; segment < 4; segment++) {
              const x = segment * 600 - 10;
              const swing =
                (segment % 2 === 0 ? -1 : 1) * h * (0.18 - i * 0.025);
              ctx.bezierCurveTo(
                x + 180,
                y + swing,
                x + 420,
                y + swing,
                x + 600,
                y,
              );
            }
            ctx.lineTo(2400, h + 10);
            ctx.lineTo(-10, h + 10);
            ctx.closePath();
            ctx.fillStrokeShape(shape);
          },
        }),
      );
    }
  }
  if (family === "tidal") {
    group.add(
      new Konva.Shape({
        fill: style.backgroundEnd,
        sceneFunc(ctx, shape) {
          ctx.beginPath();
          ctx.moveTo(0, h * 0.64);
          ctx.bezierCurveTo(680, h * 0.27, 1420, h * 1.04, 2160, h * 0.46);
          ctx.lineTo(2160, h);
          ctx.lineTo(0, h);
          ctx.closePath();
          ctx.fillStrokeShape(shape);
        },
      }),
    );
    for (let i = 0; i < 22; i++)
      group.add(
        new Konva.Shape({
          stroke: style.accentColor,
          strokeWidth: i % 5 === 0 ? 2.2 : 1.2,
          opacity: 0.22 + (i % 4) * 0.04,
          sceneFunc(ctx, shape) {
            const y = h * (0.51 + i * 0.024);
            ctx.beginPath();
            ctx.moveTo(-20, y);
            ctx.bezierCurveTo(
              640,
              y - h * 0.4,
              1450,
              y + h * 0.45,
              2180,
              y - h * 0.13,
            );
            ctx.strokeShape(shape);
          },
        }),
      );
  }
  if (style.template === "bloom") {
    const x = wide ? panel.x - 12 : 145;
    const width = wide ? panel.width + 24 : 790;
    const y = wide ? h * 0.065 : h * 0.305;
    group.add(
      new Konva.Rect({
        x,
        y,
        width,
        height: h - y + 20,
        cornerRadius: [width / 2, width / 2, 0, 0],
        fill: style.backgroundEnd,
      }),
    );
    // A pair of curved stems with individually shaped leaves, kept away from captions.
    for (const mirror of [false, true]) {
      const branch = new Konva.Group({
        x: mirror ? 1080 : wide ? panel.x - 60 : 0,
        y: h,
        scaleX: mirror ? -1 : 1,
        scaleY: Math.min(1.5, h / 1920),
      });
      branch.add(
        new Konva.Path({
          data: "M 15 50 C 230 -210 50 -410 195 -670",
          stroke: style.accentColor,
          strokeWidth: 3,
          opacity: 0.7,
        }),
      );
      for (let i = 0; i < 6; i++) {
        const leaf = new Konva.Group({
          x: 65 + i * 20,
          y: -70 - i * 100,
          rotation: i % 2 ? -38 : 53,
        });
        leaf.add(
          new Konva.Path({
            data: "M 0 0 C -76 -30 -84 -110 -20 -178 C 46 -134 62 -59 0 0 Z",
            fill: style.accentColor,
            opacity: i % 2 ? 0.44 : 0.72,
          }),
        );
        leaf.add(
          new Konva.Path({
            data: "M 0 0 Q -17 -81 -20 -160",
            stroke: style.background,
            strokeWidth: 1.5,
            opacity: 0.5,
          }),
        );
        branch.add(leaf);
      }
      group.add(branch);
    }
  }
  if (style.template === "punch") {
    const x = wide ? panel.x - 10 : 60;
    const width = wide ? panel.width + 20 : 960;
    const y = wide ? h * 0.04 : h * 0.32;
    group.add(
      new Konva.Rect({
        x: x + 22,
        y: y + 22,
        width,
        height: h - y + 20,
        cornerRadius: [width / 2, width / 2, 0, 0],
        fill: style.accentColor,
      }),
    );
    group.add(
      new Konva.Rect({
        x,
        y,
        width,
        height: h - y + 20,
        cornerRadius: [width / 2, width / 2, 0, 0],
        fill: style.backgroundEnd,
      }),
    );
    group.add(
      new Konva.Rect({
        x: x + 22,
        y: y + 24,
        width: width - 44,
        height: h - y,
        cornerRadius: [(width - 44) / 2, (width - 44) / 2, 0, 0],
        stroke: style.background,
        strokeWidth: 2.5,
      }),
    );
  }
  if (group.hasChildren()) layer.add(group);
  else group.destroy();
}

/** Vector-only decoration shares the export scene and stays crisp at every size. */
export function drawTemplateDecoration(
  layer: Konva.Layer,
  style: Style,
  canvas: { width: number; height: number },
  panel: Rect,
) {
  const h = canvas.height;
  drawHalloweenDecoration(layer, style, h, panel);
  drawShowcaseDecoration(layer, style, h, panel);
  drawPatternDecoration(layer, style, h, panel);
  drawExpressiveDecoration(layer, style, h, panel);
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
