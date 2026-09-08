import Konva from "konva";
import { compositionId } from "../core/device-composition";
import type { Style } from "../core/model";
import type { Rect } from "./geometry";

/** A quiet stage keeps mixed screen sizes readable, with a distinct motif per pairing. */
export function drawCompositionDecoration(
  layer: Konva.Layer,
  style: Style,
  panel: Rect,
) {
  const id = compositionId(style.template);
  if (!id) return;
  const group = new Konva.Group({
    name: "composition-decoration",
    listening: false,
    clip: panel,
  });
  group.add(
    new Konva.Rect({
      ...panel,
      cornerRadius: 32,
      fill: style.backgroundEnd,
      opacity: 0.55,
    }),
  );
  const cx = panel.x + panel.width / 2,
    cy = panel.y + panel.height / 2;
  if (id === "sidekick" || id === "workspace") {
    for (let i = 0; i < 5; i++)
      group.add(
        new Konva.Line({
          points: [
            panel.x,
            panel.y + panel.height * (0.6 + i * 0.12),
            panel.x + panel.width,
            panel.y + panel.height * (0.25 + i * 0.12),
          ],
          stroke: style.accentColor,
          strokeWidth: i === 0 ? 36 : 1.5,
          opacity: i === 0 ? 0.12 : 0.2,
        }),
      );
  } else if (id === "handoff" || id === "desktop-suite") {
    for (let i = 1; i < 12; i++) {
      group.add(
        new Konva.Line({
          points: [
            panel.x + (panel.width * i) / 12,
            panel.y,
            panel.x + (panel.width * i) / 12,
            panel.y + panel.height,
          ],
          stroke: style.accentColor,
          strokeWidth: 1,
          opacity: 0.14,
        }),
      );
      group.add(
        new Konva.Line({
          points: [
            panel.x,
            panel.y + (panel.height * i) / 12,
            panel.x + panel.width,
            panel.y + (panel.height * i) / 12,
          ],
          stroke: style.accentColor,
          strokeWidth: 1,
          opacity: 0.14,
        }),
      );
    }
  } else if (id === "companion" || id === "duet") {
    for (let i = 0; i < 3; i++)
      group.add(
        new Konva.Circle({
          x: cx + (i - 1) * panel.width * 0.35,
          y: cy + (i - 1) * panel.height * 0.18,
          radius: Math.min(panel.width, panel.height) * 0.42,
          fill: style.accentColor,
          opacity: 0.09,
        }),
      );
  } else {
    for (let i = 0; i < 4; i++)
      group.add(
        new Konva.Ellipse({
          x: cx,
          y: cy,
          radiusX: panel.width * (0.2 + i * 0.12),
          radiusY: panel.height * (0.18 + i * 0.11),
          stroke: style.accentColor,
          strokeWidth: 1.5,
          opacity: 0.3,
          rotation: -12,
        }),
      );
    for (const [x, y] of [
      [0.12, 0.22],
      [0.84, 0.16],
      [0.91, 0.68],
      [0.23, 0.91],
    ])
      group.add(
        new Konva.Circle({
          x: panel.x + panel.width * x,
          y: panel.y + panel.height * y,
          radius: 4,
          fill: style.accentColor,
          opacity: 0.65,
        }),
      );
  }
  layer.add(group);
}
