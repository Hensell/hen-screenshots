import Konva from "konva";
import type { Style } from "../core/model";
import type { Rect } from "./geometry";

function motif(x: number, y: number, size: number, rotation = 0) {
  return new Konva.Group({
    x,
    y,
    scaleX: size / 100,
    scaleY: size / 100,
    rotation,
  });
}
function line(
  group: Konva.Group,
  points: number[],
  color: string,
  width = 1.5,
  opacity = 1,
) {
  group.add(
    new Konva.Line({
      points,
      stroke: color,
      strokeWidth: width,
      opacity,
      lineCap: "round",
      lineJoin: "round",
    }),
  );
}
function sparkle(
  group: Konva.Group,
  x: number,
  y: number,
  r: number,
  color: string,
) {
  group.add(
    new Konva.Star({
      x,
      y,
      numPoints: 4,
      innerRadius: r * 0.18,
      outerRadius: r,
      fill: color,
    }),
  );
}
function pine(
  group: Konva.Group,
  x: number,
  y: number,
  size: number,
  rotation: number,
  color: string,
) {
  const branch = motif(x, y, size, rotation);
  line(branch, [0, 100, 0, 0], color, 1.4);
  for (let i = 1; i <= 9; i++) {
    const y = i * 10;
    const spread = 8 + i * 2.4;
    for (const d of [-1, 1]) {
      line(branch, [0, y + 5, d * spread, y - 14], color, 1.2, 0.8);
      line(branch, [0, y, d * spread * 0.66, y - 22], color, 0.9, 0.65);
    }
  }
  group.add(branch);
}
function ornament(
  group: Konva.Group,
  x: number,
  y: number,
  r: number,
  style: Style,
) {
  line(group, [x, 0, x, y - r], style.accentColor, 1.3);
  group.add(
    new Konva.Rect({
      x: x - r * 0.2,
      y: y - r * 1.12,
      width: r * 0.4,
      height: r * 0.24,
      cornerRadius: 3,
      fill: style.accentColor,
    }),
  );
  group.add(
    new Konva.Circle({
      x,
      y,
      radius: r,
      fill: style.backgroundEnd,
      stroke: style.accentColor,
      strokeWidth: 2,
    }),
  );
  group.add(
    new Konva.Ellipse({
      x,
      y,
      radiusX: r * 0.48,
      radiusY: r * 0.96,
      stroke: style.accentColor,
      strokeWidth: 1.2,
    }),
  );
  line(group, [x - r * 0.95, y, x + r * 0.95, y], style.accentColor, 1.2);
  sparkle(group, x, y, r * 0.32, style.accentColor);
}
function snowflake(
  group: Konva.Group,
  x: number,
  y: number,
  size: number,
  color: string,
  rotation: number,
) {
  const flake = motif(x, y, size, rotation);
  for (let i = 0; i < 6; i++) {
    const arm = new Konva.Group({ rotation: i * 60 });
    line(arm, [0, 0, 0, -48], color, 2);
    for (const y of [-23, -36])
      line(arm, [-10, y - 8, 0, y, 10, y - 8], color, 2);
    flake.add(arm);
  }
  group.add(flake);
}
function cookie(
  group: Konva.Group,
  x: number,
  y: number,
  size: number,
  style: Style,
  kind: "house" | "tree" | "star",
  rotation: number,
) {
  const shape = motif(x, y, size, rotation);
  const icing = style.background;
  if (kind === "star") {
    shape.add(
      new Konva.Star({
        numPoints: 5,
        innerRadius: 24,
        outerRadius: 49,
        fill: style.accentColor,
        stroke: icing,
        strokeWidth: 3,
      }),
    );
    shape.add(
      new Konva.Star({
        numPoints: 5,
        innerRadius: 15,
        outerRadius: 32,
        stroke: icing,
        strokeWidth: 1.7,
      }),
    );
  } else if (kind === "house") {
    shape.add(
      new Konva.Path({
        data: "M -43 -5 L 0 -47 L 43 -5 L 36 1 L 36 44 L -36 44 L -36 1 Z",
        fill: style.accentColor,
        stroke: icing,
        strokeWidth: 3,
        lineJoin: "round",
      }),
    );
    line(shape, [-39, -4, 0, -41, 39, -4], icing, 3);
    shape.add(
      new Konva.Rect({
        x: -10,
        y: 14,
        width: 20,
        height: 29,
        cornerRadius: [10, 10, 0, 0],
        stroke: icing,
        strokeWidth: 2.5,
      }),
    );
    for (const x of [-25, 13]) {
      shape.add(
        new Konva.Rect({
          x,
          y: -4,
          width: 12,
          height: 12,
          cornerRadius: 2,
          stroke: icing,
          strokeWidth: 2,
        }),
      );
      line(shape, [x + 6, -4, x + 6, 8], icing, 1);
    }
    shape.add(
      new Konva.Circle({ y: -22, radius: 5, stroke: icing, strokeWidth: 2 }),
    );
    for (let i = 0; i < 7; i++)
      shape.add(
        new Konva.Circle({ x: -28 + i * 9.4, y: 37, radius: 1.6, fill: icing }),
      );
  } else {
    shape.add(
      new Konva.Path({
        data: "M 0 -51 L 25 -17 L 15 -17 L 36 13 L 23 13 L 45 43 L 9 43 L 9 51 L -9 51 L -9 43 L -45 43 L -23 13 L -36 13 L -15 -17 L -25 -17 Z",
        fill: style.accentColor,
        stroke: icing,
        strokeWidth: 3,
        lineJoin: "round",
      }),
    );
    for (const y of [-10, 13, 34])
      line(
        shape,
        [-((y + 55) * 0.34), y - 5, 0, y + 1, (y + 55) * 0.34, y - 5],
        icing,
        2.4,
      );
  }
  group.add(shape);
}
function firework(
  group: Konva.Group,
  x: number,
  y: number,
  r: number,
  color: string,
) {
  for (let i = 0; i < 24; i++) {
    const a = (i * Math.PI) / 12;
    const length = r * (i % 2 ? 0.8 : 1);
    const dx = Math.cos(a),
      dy = Math.sin(a);
    line(
      group,
      [x + dx * r * 0.22, y + dy * r * 0.22, x + dx * length, y + dy * length],
      color,
      i % 2 ? 1.7 : 2.7,
      0.85,
    );
    group.add(
      new Konva.Circle({
        x: x + dx * length * 1.14,
        y: y + dy * length * 1.14,
        radius: r * 0.018,
        fill: color,
      }),
    );
  }
  sparkle(group, x, y, r * 0.09, color);
}

/** Clip artwork to the device region so every export ratio keeps its captions clear. */
export function drawHolidayDecoration(
  layer: Konva.Layer,
  style: Style,
  h: number,
  panel: Rect,
) {
  if (
    ![
      "evergreen",
      "snowfall",
      "gift-wrap",
      "gingerbread",
      "midnight",
      "firework",
      "countdown",
      "first-light",
    ].includes(style.template)
  )
    return;
  const pad = Math.min(30, h * 0.02);
  const x = Math.max(0, panel.x - pad),
    y = Math.max(0, panel.y - pad);
  const w = Math.min(1080 - x, panel.width + 2 * pad),
    height = Math.min(h - y, panel.height + 2 * pad);
  const u = Math.min(w, height);
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
  switch (style.template) {
    case "evergreen": {
      group.add(
        new Konva.Rect({
          x: w * 0.08,
          y: height * 0.035,
          width: w * 0.84,
          height: height * 0.94,
          cornerRadius: [u * 0.4, u * 0.4, 12, 12],
          fill: style.backgroundEnd,
          opacity: 0.5,
        }),
      );
      pine(group, w * 0.13, height * 0.53, u * 0.59, -22, style.accentColor);
      pine(group, w * 0.87, height * 0.95, u * 0.5, 156, style.accentColor);
      ornament(group, w * 0.82, height * 0.17, u * 0.09, style);
      ornament(group, w * 0.13, height * 0.19, u * 0.062, style);
      ornament(group, w * 0.91, height * 0.39, u * 0.065, style);
      break;
    }
    case "snowfall": {
      group.add(
        new Konva.Rect({
          x: 10,
          y: 10,
          width: w - 20,
          height: height - 20,
          cornerRadius: u * 0.15,
          fill: style.backgroundEnd,
          opacity: 0.6,
        }),
      );
      for (const [cx, cy, r] of [
        [0.09, 0.24, 0.26],
        [0.89, 0.72, 0.32],
        [0.81, 0.08, 0.19],
        [0.16, 0.91, 0.2],
      ])
        snowflake(
          group,
          w * cx,
          height * cy,
          u * r,
          style.accentColor,
          cx * 100,
        );
      for (let i = 0; i < 22; i++)
        group.add(
          new Konva.Circle({
            x: w * ((i * 0.381 + 0.07) % 1),
            y: height * ((i * 0.617 + 0.12) % 1),
            radius: u * (i % 3 ? 0.004 : 0.007),
            fill: style.background,
          }),
        );
      group.add(
        new Konva.Ellipse({
          x: w * 0.25,
          y: height,
          radiusX: w * 0.65,
          radiusY: u * 0.16,
          fill: style.background,
          opacity: 0.75,
        }),
      );
      break;
    }
    case "gift-wrap": {
      const plaid = new Konva.Group({
        clipX: w * 0.05,
        clipY: height * 0.04,
        clipWidth: w * 0.9,
        clipHeight: height * 0.92,
      });
      plaid.add(
        new Konva.Rect({
          width: w,
          height,
          fill: style.backgroundEnd,
          opacity: 0.5,
        }),
      );
      const step = u * 0.14;
      for (let x = 0; x < w; x += step) {
        line(plaid, [x, 0, x, height], style.accentColor, step * 0.32, 0.22);
        line(
          plaid,
          [x + step * 0.35, 0, x + step * 0.35, height],
          style.accentColor,
          1.3,
          0.35,
        );
      }
      for (let y = 0; y < height; y += step) {
        line(plaid, [0, y, w, y], style.accentColor, step * 0.32, 0.22);
        line(
          plaid,
          [0, y + step * 0.35, w, y + step * 0.35],
          style.accentColor,
          1.3,
          0.35,
        );
      }
      group.add(plaid);
      line(
        group,
        [w * 0.16, height * 0.04, w * 0.16, height * 0.96],
        style.accentColor,
        u * 0.042,
      );
      line(
        group,
        [w * 0.05, height * 0.8, w * 0.95, height * 0.8],
        style.accentColor,
        u * 0.045,
      );
      const bow = motif(w * 0.17, height * 0.8, u * 0.32, -12);
      bow.add(
        new Konva.Path({
          data: "M 0 0 C -80 -85 -68 41 0 0 C 78 -81 73 39 0 0 Z M -7 3 L -36 60 L -15 53 L -5 65 L 6 5 M 7 3 L 35 60 L 16 53 L 6 64 L -5 5",
          fill: style.accentColor,
          stroke: style.background,
          strokeWidth: 1.2,
        }),
      );
      bow.add(
        new Konva.Rect({
          x: -7,
          y: -8,
          width: 14,
          height: 18,
          cornerRadius: 5,
          fill: style.textColor,
        }),
      );
      group.add(bow);
      break;
    }
    case "gingerbread": {
      group.add(
        new Konva.Rect({
          x: 10,
          y: 10,
          width: w - 20,
          height: height - 20,
          cornerRadius: u * 0.12,
          fill: style.backgroundEnd,
          opacity: 0.6,
        }),
      );
      cookie(group, w * 0.15, height * 0.22, u * 0.32, style, "house", -12);
      cookie(group, w * 0.85, height * 0.77, u * 0.32, style, "tree", 12);
      cookie(group, w * 0.84, height * 0.09, u * 0.18, style, "star", 10);
      cookie(group, w * 0.13, height * 0.9, u * 0.2, style, "star", -15);
      for (const [cx, cy] of [
        [0.9, 0.4],
        [0.12, 0.62],
        [0.47, 0.95],
      ])
        sparkle(group, w * cx, height * cy, u * 0.02, style.accentColor);
      break;
    }
    case "midnight": {
      group.add(
        new Konva.Rect({
          x: w * 0.07,
          y: height * 0.04,
          width: w * 0.86,
          height: height * 0.92,
          cornerRadius: u * 0.42,
          fill: style.backgroundEnd,
          opacity: 0.48,
        }),
      );
      for (const mirror of [false, true]) {
        const fan = new Konva.Group({
          x: mirror ? w * 0.97 : w * 0.03,
          y: mirror ? height * 0.96 : height * 0.04,
          rotation: mirror ? 180 : 0,
        });
        const radius = u * 0.42;
        for (let i = 0; i <= 12; i++) {
          const a = (i * Math.PI) / 24;
          line(
            fan,
            [0, 0, Math.cos(a) * radius, Math.sin(a) * radius],
            style.accentColor,
            i % 3 ? 1 : 2,
            0.85,
          );
        }
        for (const r of [0.6, 0.84, 1])
          fan.add(
            new Konva.Arc({
              innerRadius: radius * r,
              outerRadius: radius * r + 1.5,
              angle: 90,
              fill: style.accentColor,
            }),
          );
        group.add(fan);
      }
      for (const [cx, cy, r] of [
        [0.88, 0.17, 0.03],
        [0.12, 0.79, 0.038],
        [0.81, 0.48, 0.018],
      ])
        sparkle(group, w * cx, height * cy, u * r, style.accentColor);
      break;
    }
    case "firework": {
      group.add(
        new Konva.Ellipse({
          x: w * 0.5,
          y: height * 0.62,
          radiusX: w * 0.47,
          radiusY: height * 0.43,
          fill: style.backgroundEnd,
          opacity: 0.55,
        }),
      );
      firework(group, w * 0.83, height * 0.18, u * 0.22, style.accentColor);
      firework(group, w * 0.12, height * 0.69, u * 0.2, style.textColor);
      firework(group, w * 0.86, height * 0.88, u * 0.15, style.accentColor);
      for (const [cx, cy] of [
        [0.09, 0.25],
        [0.68, 0.05],
        [0.92, 0.52],
        [0.45, 0.96],
      ])
        sparkle(group, w * cx, height * cy, u * 0.012, style.textColor);
      break;
    }
    case "countdown": {
      const cx = w * 0.22,
        cy = height * 0.2,
        r = u * 0.21;
      group.add(
        new Konva.Circle({
          x: cx,
          y: cy,
          radius: r,
          fill: style.backgroundEnd,
          opacity: 0.6,
        }),
      );
      group.add(
        new Konva.Circle({
          x: cx,
          y: cy,
          radius: r * 0.94,
          stroke: style.accentColor,
          strokeWidth: 2,
        }),
      );
      for (let i = 0; i < 60; i++) {
        const a = (i * Math.PI) / 30;
        const inner = i % 5 ? 0.87 : 0.8;
        line(
          group,
          [
            cx + Math.sin(a) * r * inner,
            cy - Math.cos(a) * r * inner,
            cx + Math.sin(a) * r * 0.9,
            cy - Math.cos(a) * r * 0.9,
          ],
          style.accentColor,
          i % 5 ? 1 : 3,
        );
      }
      line(
        group,
        [cx - r * 0.13, cy - r * 0.59, cx, cy, cx - r * 0.38, cy - r * 0.63],
        style.textColor,
        4,
      );
      for (const [x, y, rotation] of [
        [w * 0.12, height * 0.78, -20],
        [w * 0.86, height * 0.81, 160],
      ]) {
        const ribbon = motif(x, y, u * 0.3, rotation);
        ribbon.add(
          new Konva.Path({
            data: "M 10 -60 C -45 -45 46 -20 1 -1 C -40 16 37 38 -7 60",
            stroke: style.accentColor,
            strokeWidth: 7,
            lineCap: "round",
          }),
        );
        group.add(ribbon);
      }
      for (let i = 0; i < 16; i++)
        group.add(
          new Konva.Rect({
            x: w * ((i * 0.618 + 0.03) % 1),
            y: height * ((i * 0.382 + 0.08) % 1),
            width: u * 0.011,
            height: u * 0.026,
            rotation: i * 37,
            fill: style.accentColor,
            opacity: 0.75,
          }),
        );
      break;
    }
    case "first-light": {
      group.add(
        new Konva.Rect({
          x: w * 0.08,
          y: height * 0.04,
          width: w * 0.84,
          height: height * 0.94,
          cornerRadius: [u * 0.42, u * 0.42, 8, 8],
          fill: style.backgroundEnd,
          opacity: 0.7,
        }),
      );
      const cx = w * 0.74,
        cy = height * 0.16,
        r = u * 0.145;
      group.add(
        new Konva.Circle({ x: cx, y: cy, radius: r, fill: style.background }),
      );
      for (let i = 0; i <= 20; i++) {
        const a = Math.PI * (1 + i / 20);
        line(
          group,
          [
            cx + Math.cos(a) * r * 1.18,
            cy + Math.sin(a) * r * 1.18,
            cx + Math.cos(a) * r * 1.68,
            cy + Math.sin(a) * r * 1.68,
          ],
          style.accentColor,
          1.4,
          0.7,
        );
      }
      for (let i = 0; i < 5; i++)
        line(
          group,
          [
            w * 0.02,
            height * (0.77 + i * 0.045),
            w * 0.98,
            height * (0.77 + i * 0.045),
          ],
          style.accentColor,
          1.2,
          0.42,
        );
      break;
    }
  }
  layer.add(group);
}
