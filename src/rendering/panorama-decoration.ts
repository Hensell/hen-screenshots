import Konva from "konva";
import type { Style } from "../core/model";
import { collectionPanoramaId } from "../core/panorama-collection";
import { isPanoramaEnd } from "../core/panorama-families";

function polygon(
  group: Konva.Group,
  points: number[],
  fill: string,
  opacity = 1,
) {
  group.add(
    new Konva.Line({ points, closed: true, fill, opacity, listening: false }),
  );
}

/** A shallow solid with a lit top, shaded front and darker side. */
function block(
  group: Konva.Group,
  x: number,
  y: number,
  w: number,
  depth: number,
  rise: number,
  color: string,
) {
  polygon(
    group,
    [
      x,
      y,
      x + w,
      y,
      x + w + depth,
      y - depth * 0.45,
      x + depth,
      y - depth * 0.45,
    ],
    color,
  );
  polygon(group, [x, y, x + w, y, x + w, y + rise, x, y + rise], color);
  polygon(
    group,
    [x, y, x + w, y, x + w, y + rise, x, y + rise],
    "#101820",
    0.17,
  );
  polygon(
    group,
    [
      x + w,
      y,
      x + w + depth,
      y - depth * 0.45,
      x + w + depth,
      y + rise - depth * 0.45,
      x + w,
      y + rise,
    ],
    color,
  );
  polygon(
    group,
    [
      x + w,
      y,
      x + w + depth,
      y - depth * 0.45,
      x + w + depth,
      y + rise - depth * 0.45,
      x + w,
      y + rise,
    ],
    "#101820",
    0.32,
  );
  group.add(
    new Konva.Line({
      points: [x, y, x + w, y, x + w + depth, y - depth * 0.45],
      stroke: "#FFFFFF",
      opacity: 0.35,
      strokeWidth: 2,
    }),
  );
}

/** Deterministic spread coordinates keep decorative edges continuous across exports. */
export function drawPanoramaDecoration(
  layer: Konva.Layer,
  style: Style,
  h: number,
) {
  const id = collectionPanoramaId(style.template);
  if (!id) return;
  const group = new Konva.Group({
    x: isPanoramaEnd(style.template) ? -1080 : 0,
    listening: false,
    name: "panorama-collection-decoration",
  });
  const wide = h <= 1080;
  if (id === "atrium") {
    group.add(
      new Konva.Rect({
        x: 0,
        y: h * 0.58,
        width: 2160,
        height: h * 0.42,
        fill: style.backgroundEnd,
        opacity: 0.3,
      }),
    );
    polygon(group, [800, 0, 1450, 0, 1050, h, 220, h], "#FFFFFF", 0.24);
    polygon(
      group,
      [1430, h * 0.63, 1970, h, 790, h, 660, h * 0.85],
      style.accentColor,
      0.14,
    );
    const x = 1100,
      y = h * 0.86,
      rx = 470,
      ry = h * 0.07,
      rise = h * 0.07;
    group.add(
      new Konva.Ellipse({
        x,
        y: y + rise,
        radiusX: rx,
        radiusY: ry,
        fill: style.accentColor,
      }),
    );
    group.add(
      new Konva.Rect({
        x: x - rx,
        y,
        width: rx * 2,
        height: rise,
        fillLinearGradientStartPoint: { x: 0, y: 0 },
        fillLinearGradientEndPoint: { x: rx * 2, y: 0 },
        fillLinearGradientColorStops: [
          0,
          style.backgroundEnd,
          0.6,
          style.accentColor,
          1,
          style.backgroundEnd,
        ],
      }),
    );
    group.add(
      new Konva.Ellipse({
        x,
        y,
        radiusX: rx,
        radiusY: ry,
        fill: style.backgroundEnd,
        stroke: "#FFFFFF",
        strokeWidth: 2,
      }),
    );
    group.add(
      new Konva.Ellipse({
        x: x + 15,
        y: y - 10,
        radiusX: 270,
        radiusY: ry * 0.4,
        fill: style.textColor,
        opacity: 0.1,
      }),
    );
    group.add(
      new Konva.Line({
        points: [0, h * 0.58, 2160, h * 0.58],
        stroke: style.accentColor,
        opacity: 0.2,
        strokeWidth: 2,
      }),
    );
  } else if (id === "obsidian") {
    // Architectural planes keep the dark scene readable without a neon glow.
    polygon(
      group,
      [450, 0, 1600, 0, 1340, h, 740, h],
      style.backgroundEnd,
      0.22,
    );
    polygon(
      group,
      [980, h * 0.72, 1910, h, 910, h, 520, h * 0.93],
      "#000000",
      0.35,
    );
    block(
      group,
      620,
      h * 0.86,
      720,
      Math.min(280, h * 0.25),
      h * 0.065,
      style.backgroundEnd,
    );
    for (let i = 0; i < 6; i++)
      group.add(
        new Konva.Line({
          points: [720 + i * 180, h * 0.67, 250 + i * 330, h],
          stroke: style.accentColor,
          opacity: 0.08,
          strokeWidth: 1.5,
        }),
      );
    group.add(
      new Konva.Line({
        points: [80, h * 0.52, 420, h * 0.52],
        stroke: style.accentColor,
        opacity: 0.65,
        strokeWidth: 3,
      }),
    );
  } else if (id === "offset") {
    const start = wide ? 0.64 : 0.75;
    for (let i = 0; i < 3; i++)
      block(
        group,
        220 + i * 130,
        h * (start + i * 0.07),
        (wide ? 1200 : 1270) - i * 160,
        Math.min(240, h * 0.22),
        h * 0.09,
        i === 0 ? style.accentColor : style.backgroundEnd,
      );
    group.add(
      new Konva.Circle({
        x: 1870,
        y: h * (wide ? 0.2 : 0.52),
        radius: Math.min(88, h * 0.065),
        fill: style.accentColor,
      }),
    );
    group.add(
      new Konva.Circle({
        x: 1870,
        y: h * (wide ? 0.2 : 0.52),
        radius: Math.min(88, h * 0.065),
        fillRadialGradientStartPoint: { x: -30, y: -30 },
        fillRadialGradientStartRadius: 0,
        fillRadialGradientEndPoint: { x: 12, y: 12 },
        fillRadialGradientEndRadius: 120,
        fillRadialGradientColorStops: [
          0,
          "#FFFFFF80",
          0.4,
          "#FFFFFF00",
          1,
          "#10182050",
        ],
      }),
    );
  } else if (id === "signal") {
    polygon(
      group,
      [-100, h * 0.78, 2260, h * 0.37, 2260, h * 0.98, -100, h * 1.39],
      style.backgroundEnd,
    );
    polygon(
      group,
      [-100, h * 0.98, 2260, h * 0.57, 2260, h * 0.62, -100, h * 1.03],
      style.accentColor,
    );
    group.add(
      new Konva.Circle({
        x: 310,
        y: h * (wide ? 0.77 : 0.55),
        radius: Math.min(150, h * 0.09),
        stroke: style.accentColor,
        strokeWidth: Math.min(22, h * 0.013),
      }),
    );
    for (let i = 0; !wide && i < 4; i++)
      group.add(
        new Konva.Line({
          points: [1760 + i * 42, h * 0.79, 1810 + i * 42, h * 0.73],
          stroke: style.textColor,
          strokeWidth: 10,
          opacity: 0.65,
        }),
      );
  } else if (id === "mosaic") {
    const tile = 240,
      top = h * (wide ? 0.03 : 0.045),
      tileH = h * (wide ? 0.16 : 0.13);
    for (let row = 0; row < 5; row++)
      for (let col = 0; col < 10; col++) {
        if ((row + col) % 2 === 0)
          group.add(
            new Konva.Rect({
              x: col * tile - 120,
              y: top + row * tileH,
              width: tile,
              height: tileH,
              fill: style.backgroundEnd,
              opacity: row % 2 ? 0.24 : 0.42,
              cornerRadius: (row + col) % 4 ? [0, 80, 0, 80] : 0,
            }),
          );
      }
    group.add(
      new Konva.Ellipse({
        x: 1080,
        y: h * 0.4,
        radiusX: 560,
        radiusY: h * 0.34,
        fill: style.background,
      }),
    );
    group.add(
      new Konva.Line({
        points: [80, h * 0.73, 2080, h * 0.73],
        stroke: style.accentColor,
        strokeWidth: 2,
        opacity: 0.35,
      }),
    );
  } else if (id === "folio") {
    const paper = { x: 710, y: h * 0.07, width: 860, height: h * 0.86 };
    group.add(
      new Konva.Rect({
        ...paper,
        x: paper.x + 38,
        y: paper.y + 34,
        fill: style.accentColor,
        opacity: 0.22,
        rotation: -4,
      }),
    );
    group.add(
      new Konva.Rect({ ...paper, fill: style.backgroundEnd, rotation: 2 }),
    );
    group.add(
      new Konva.Line({
        points: [80, h * 0.05, 2080, h * 0.05],
        stroke: style.accentColor,
        strokeWidth: 2,
        opacity: 0.6,
      }),
    );
    group.add(
      new Konva.Line({
        points: [80, h * 0.955, 2080, h * 0.955],
        stroke: style.accentColor,
        strokeWidth: 2,
        opacity: 0.6,
      }),
    );
    group.add(
      new Konva.Circle({
        x: 1920,
        y: h * 0.3,
        radius: Math.min(100, h * 0.1),
        stroke: style.accentColor,
        strokeWidth: 2,
        opacity: 0.5,
      }),
    );
  }
  layer.add(group);
}
