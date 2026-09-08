import Konva from "konva";
import type { Style } from "../core/model";
import type { Rect } from "./geometry";
import { isPanoramaEnd, panoramaStart } from "../core/panorama-families";

function motif(x: number, y: number, size: number, rotation = 0) {
  return new Konva.Group({
    x,
    y,
    scaleX: size / 100,
    scaleY: size / 100,
    rotation,
  });
}
function star(
  group: Konva.Group,
  x: number,
  y: number,
  size: number,
  fill: string,
) {
  group.add(
    new Konva.Star({
      x,
      y,
      numPoints: 4,
      innerRadius: size * 0.2,
      outerRadius: size,
      fill,
    }),
  );
}
function pumpkin(
  group: Konva.Group,
  x: number,
  y: number,
  size: number,
  style: Style,
  rotation = 0,
) {
  const shape = motif(x, y, size, rotation);
  shape.add(
    new Konva.Path({
      data: "M -7 -36 Q -11 -55 6 -64 L 14 -58 Q 0 -49 3 -34 Z",
      fill: style.accentColor,
    }),
  );
  for (const [cx, rx] of [
    [-21, 30],
    [21, 30],
    [0, 29],
  ])
    shape.add(
      new Konva.Ellipse({
        x: cx,
        y: 0,
        radiusX: rx,
        radiusY: 40,
        fill: style.backgroundEnd,
        stroke: style.accentColor,
        strokeWidth: 1.8,
      }),
    );
  shape.add(
    new Konva.Path({
      data: "M -30 -5 L -16 -20 L -8 -3 Z M 8 -3 L 16 -20 L 30 -5 Z M -28 10 L -12 16 L -8 10 L 1 18 L 8 11 L 13 17 L 28 10 Q 20 34 0 31 Q -20 32 -28 10 Z",
      fill: style.textColor,
    }),
  );
  group.add(shape);
}
function ghost(
  group: Konva.Group,
  x: number,
  y: number,
  size: number,
  style: Style,
  rotation: number,
) {
  const shape = motif(x, y, size, rotation);
  shape.add(
    new Konva.Path({
      data: "M -38 43 L -36 -10 C -35 -54 34 -58 38 -12 L 46 43 Q 30 22 17 43 Q 3 22 -10 43 Q -24 23 -38 43 Z",
      fill: style.background,
      stroke: style.accentColor,
      strokeWidth: 1.5,
    }),
  );
  for (const x of [-13, 14])
    shape.add(
      new Konva.Ellipse({
        x,
        y: -8,
        radiusX: 4,
        radiusY: 7,
        fill: style.textColor,
      }),
    );
  shape.add(
    new Konva.Ellipse({
      x: 2,
      y: 11,
      radiusX: 4,
      radiusY: 5,
      fill: style.accentColor,
    }),
  );
  group.add(shape);
}
function bat(
  group: Konva.Group,
  x: number,
  y: number,
  size: number,
  color: string,
  rotation: number,
) {
  const shape = motif(x, y, size, rotation);
  shape.add(
    new Konva.Path({
      data: "M 0 7 C -8 -12 -32 -10 -50 -27 Q -42 -2 -38 5 Q -24 -3 -20 17 Q -7 9 0 29 Q 7 9 20 17 Q 24 -3 38 5 Q 42 -2 50 -27 C 32 -10 8 -12 0 7 Z M -7 9 L -8 -10 L -2 -5 L 3 -10 L 8 -6 L 7 12 Z",
      fill: color,
    }),
  );
  group.add(shape);
}
function web(
  group: Konva.Group,
  x: number,
  y: number,
  size: number,
  rotation: number,
  color: string,
) {
  const shape = motif(x, y, size, rotation);
  const spokes = 6;
  for (let i = 0; i <= spokes; i++) {
    const angle = ((i / spokes) * Math.PI) / 2;
    shape.add(
      new Konva.Line({
        points: [0, 0, Math.cos(angle) * 100, Math.sin(angle) * 100],
        stroke: color,
        strokeWidth: 0.7,
        opacity: 0.7,
      }),
    );
  }
  for (let ring = 1; ring <= 5; ring++) {
    const r = ring * 19;
    shape.add(
      new Konva.Shape({
        stroke: color,
        strokeWidth: 0.6,
        opacity: 0.6,
        sceneFunc(ctx, node) {
          ctx.beginPath();
          ctx.moveTo(r, 0);
          for (let i = 1; i <= spokes; i++) {
            const end = ((i / spokes) * Math.PI) / 2;
            const mid = (((i - 0.5) / spokes) * Math.PI) / 2;
            ctx.quadraticCurveTo(
              Math.cos(mid) * r * 0.89,
              Math.sin(mid) * r * 0.89,
              Math.cos(end) * r,
              Math.sin(end) * r,
            );
          }
          ctx.strokeShape(node);
        },
      }),
    );
  }
  group.add(shape);
}
function candy(
  group: Konva.Group,
  x: number,
  y: number,
  size: number,
  style: Style,
  rotation: number,
) {
  const shape = motif(x, y, size, rotation);
  for (const direction of [-1, 1]) {
    shape.add(
      new Konva.Line({
        points: [
          direction * 22,
          0,
          direction * 48,
          -23,
          direction * 44,
          0,
          direction * 48,
          23,
        ],
        closed: true,
        fill: style.accentColor,
      }),
    );
  }
  shape.add(
    new Konva.Rect({
      x: -28,
      y: -23,
      width: 56,
      height: 46,
      cornerRadius: 15,
      fill: style.background,
      stroke: style.textColor,
      strokeWidth: 1.2,
    }),
  );
  const bands = new Konva.Group({
    clipX: -22,
    clipY: -20,
    clipWidth: 44,
    clipHeight: 40,
  });
  for (let i = -2; i <= 2; i++)
    bands.add(
      new Konva.Line({
        points: [i * 21 - 15, -30, i * 21 + 20, 30],
        stroke: style.backgroundEnd,
        strokeWidth: 8,
      }),
    );
  shape.add(bands);
  group.add(shape);
}

function drawMoonlight(layer: Konva.Layer, style: Style, h: number) {
  const group = new Konva.Group({
    x: isPanoramaEnd(style.template) ? -1080 : 0,
    listening: false,
    name: "template-decoration",
  });
  const radius = Math.min(205, h * 0.2);
  group.add(
    new Konva.Circle({ x: 1480, y: h * 0.24, radius, fill: style.textColor }),
  );
  for (const [dx, dy, r] of [
    [-0.3, -0.22, 0.18],
    [0.32, 0.17, 0.23],
    [-0.12, 0.44, 0.09],
  ])
    group.add(
      new Konva.Circle({
        x: 1480 + dx * radius,
        y: h * 0.24 + dy * radius,
        radius: radius * r,
        fill: style.accentColor,
        opacity: 0.2,
      }),
    );
  for (let i = 0; i < 3; i++) {
    group.add(
      new Konva.Shape({
        fill: i === 1 ? style.accentColor : style.backgroundEnd,
        opacity: i === 1 ? 0.12 : 0.7,
        sceneFunc(ctx, shape) {
          const y = h * (0.76 + i * 0.085);
          ctx.beginPath();
          ctx.moveTo(-20, y);
          ctx.bezierCurveTo(
            450,
            y - h * 0.13,
            730,
            y + h * 0.2,
            1130,
            y - h * 0.015,
          );
          ctx.bezierCurveTo(
            1640,
            y - h * 0.22,
            1770,
            y + h * 0.1,
            2180,
            y - h * 0.05,
          );
          ctx.lineTo(2180, h + 10);
          ctx.lineTo(-20, h + 10);
          ctx.closePath();
          ctx.fillStrokeShape(shape);
        },
      }),
    );
  }
  // The moon and bats occupy the upper-right opening; left captions stay on clear sky.
  bat(group, 1450, h * 0.24, radius * 0.7, style.background, -12);
  bat(group, 1600, h * 0.46, Math.min(130, h * 0.1), style.accentColor, 8);
  bat(group, 620, h * 0.52, Math.min(110, h * 0.085), style.accentColor, -18);
  for (const [x, y] of [
    [800, 0.05],
    [1210, 0.08],
    [1610, 0.075],
    [1350, 0.51],
    [210, 0.59],
    [490, 0.69],
  ])
    star(group, x, y * h, Math.min(9, h * 0.012), style.accentColor);
  // Branches live below the left caption, and continue over the same shared hills.
  const branch = new Konva.Group({ x: 110, y: h, scaleY: h / 1920 });
  branch.add(
    new Konva.Path({
      data: "M 0 80 Q 80 -190 40 -520 M 52 -300 L -28 -390 M 47 -375 L 129 -474 M 70 -188 L 162 -315 M 115 -250 L 168 -241 M 13 -343 L 17 -427",
      stroke: style.background,
      strokeWidth: 16,
      lineCap: "round",
      lineJoin: "round",
    }),
  );
  group.add(branch);
  layer.add(group);
}

/** Original, bounded vector motifs use only the four editable template colors. */
export function drawHalloweenDecoration(
  layer: Konva.Layer,
  style: Style,
  h: number,
  panel: Rect,
) {
  if (panoramaStart(style.template) === "moonlight") {
    drawMoonlight(layer, style, h);
    return;
  }
  if (
    ![
      "jack-o-lantern",
      "cobweb",
      "boo",
      "witching-hour",
      "candy-club",
    ].includes(style.template)
  )
    return;
  const pad = Math.min(36, h * 0.025);
  const x = Math.max(0, panel.x - pad),
    y = Math.max(0, panel.y - pad);
  const w = Math.min(1080 - x, panel.width + pad * 2),
    height = Math.min(h - y, panel.height + pad * 2);
  const group = new Konva.Group({
    x,
    y,
    listening: false,
    name: "template-decoration",
    clipX: 0,
    clipY: 0,
    clipWidth: w,
    clipHeight: height,
  });
  const unit = Math.min(w, height);
  switch (style.template) {
    case "jack-o-lantern": {
      group.add(
        new Konva.Rect({
          x: w * 0.08,
          y: height * 0.06,
          width: w * 0.88,
          height: height * 0.9,
          cornerRadius: [unit * 0.43, unit * 0.43, 24, 24],
          fill: style.backgroundEnd,
          opacity: 0.2,
        }),
      );
      pumpkin(group, w * 0.2, height * 0.78, unit * 0.38, style, -14);
      pumpkin(group, w * 0.81, height * 0.91, unit * 0.29, style, 12);
      pumpkin(group, w * 0.87, height * 0.16, unit * 0.22, style, 18);
      for (const [cx, cy] of [
        [0.1, 0.32],
        [0.86, 0.54],
        [0.38, 0.97],
      ])
        star(group, w * cx, height * cy, unit * 0.023, style.accentColor);
      break;
    }
    case "cobweb": {
      group.add(
        new Konva.Rect({
          x: 20,
          y: 20,
          width: w - 40,
          height: height - 40,
          cornerRadius: 18,
          fill: style.backgroundEnd,
          opacity: 0.45,
        }),
      );
      web(group, w - 10, 10, unit * 0.62, 90, style.accentColor);
      web(group, 10, height - 10, unit * 0.5, -90, style.accentColor);
      group.add(
        new Konva.Line({
          points: [w * 0.9, 0, w * 0.9, height * 0.55],
          stroke: style.accentColor,
          opacity: 0.65,
          strokeWidth: 1.5,
        }),
      );
      const spider = motif(w * 0.9, height * 0.57, unit * 0.13);
      for (const d of [-1, 1])
        for (let i = 0; i < 4; i++)
          spider.add(
            new Konva.Line({
              points: [0, i * 8 - 12, d * 24, i * 12 - 30, d * 35, i * 15 - 28],
              stroke: style.accentColor,
              strokeWidth: 3,
              lineCap: "round",
            }),
          );
      spider.add(
        new Konva.Ellipse({
          radiusX: 12,
          radiusY: 18,
          fill: style.accentColor,
        }),
      );
      spider.add(
        new Konva.Circle({ y: -18, radius: 8, fill: style.accentColor }),
      );
      group.add(spider);
      break;
    }
    case "boo": {
      group.add(
        new Konva.Rect({
          x: 12,
          y: 12,
          width: w - 24,
          height: height - 24,
          cornerRadius: unit * 0.16,
          fill: style.backgroundEnd,
        }),
      );
      ghost(group, w * 0.13, height * 0.24, unit * 0.29, style, -12);
      ghost(group, w * 0.8, height * 0.84, unit * 0.28, style, 12);
      ghost(group, w * 0.82, height * 0.11, unit * 0.2, style, 8);
      for (const [cx, cy] of [
        [0.1, 0.63],
        [0.85, 0.46],
        [0.38, 0.07],
      ])
        star(group, w * cx, height * cy, unit * 0.021, style.accentColor);
      break;
    }
    case "witching-hour": {
      const r = unit * 0.44;
      for (const offset of [0, 12])
        group.add(
          new Konva.Circle({
            x: w / 2,
            y: height / 2,
            radius: r + offset,
            stroke: style.accentColor,
            strokeWidth: offset ? 1 : 2.5,
            opacity: offset ? 0.4 : 0.85,
          }),
        );
      group.add(
        new Konva.Circle({
          x: w * 0.16,
          y: height * 0.16,
          radius: unit * 0.085,
          fill: style.accentColor,
        }),
      );
      group.add(
        new Konva.Circle({
          x: w * 0.18,
          y: height * 0.14,
          radius: unit * 0.081,
          fill: style.background,
        }),
      );
      const hat = motif(w * 0.16, height * 0.84, unit * 0.32, -15);
      hat.add(
        new Konva.Path({
          data: "M -35 25 Q -18 -14 -8 -58 Q 0 -41 29 -38 L 11 -30 Q 19 1 34 25 Z",
          fill: style.backgroundEnd,
          stroke: style.accentColor,
          strokeWidth: 1.7,
        }),
      );
      hat.add(
        new Konva.Ellipse({
          y: 26,
          radiusX: 50,
          radiusY: 12,
          fill: style.backgroundEnd,
          stroke: style.accentColor,
          strokeWidth: 1.7,
        }),
      );
      hat.add(
        new Konva.Path({
          data: "M -23 7 L 24 7 L 29 19 L -29 19 Z",
          fill: style.accentColor,
        }),
      );
      group.add(hat);
      for (const [cx, cy, size] of [
        [0.86, 0.19, 0.035],
        [0.88, 0.76, 0.04],
        [0.31, 0.1, 0.018],
        [0.66, 0.92, 0.024],
      ])
        star(group, w * cx, height * cy, unit * size, style.accentColor);
      break;
    }
    case "candy-club": {
      group.add(
        new Konva.Rect({
          x: w * 0.05,
          width: w * 0.9,
          height,
          cornerRadius: unit * 0.12,
          fill: style.backgroundEnd,
          opacity: 0.7,
        }),
      );
      for (const cx of [w * 0.07, w * 0.91]) {
        group.add(
          new Konva.Rect({
            x: cx - 8,
            width: 16,
            height,
            fill: style.accentColor,
            opacity: 0.35,
          }),
        );
      }
      candy(group, w * 0.17, height * 0.2, unit * 0.29, style, -30);
      candy(group, w * 0.82, height * 0.79, unit * 0.31, style, 32);
      candy(group, w * 0.86, height * 0.06, unit * 0.22, style, -22);
      candy(group, w * 0.14, height * 0.94, unit * 0.23, style, 24);
      break;
    }
  }
  layer.add(group);
}
