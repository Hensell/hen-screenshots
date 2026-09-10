import Konva from "konva";
import { panoramaPose } from "../core/panorama-collection";
import type { TemplateId } from "../core/model";
import type { DeviceGeometry } from "./geometry";

/** Fits an orthographic yaw/pitch projection inside the existing editable footprint. */
export function deviceProjection(
  device: Pick<DeviceGeometry, "width" | "height" | "frame">,
  pose: { yaw: number; pitch: number; depth: number },
) {
  const yaw = (pose.yaw * Math.PI) / 180,
    pitch = (pose.pitch * Math.PI) / 180;
  const a = Math.cos(yaw),
    b = Math.sin(yaw) * Math.sin(pitch),
    d = Math.cos(pitch);
  const depth = device.frame ? device.width * pose.depth : 0;
  const dx = depth * (yaw < 0 ? 1 : -1),
    dy = depth * 0.6;
  const scale = Math.min(
    device.width / (a * device.width + Math.abs(dx)),
    device.height / (Math.abs(b) * device.width + d * device.height + dy),
  );
  return {
    x:
      (device.width - (a * device.width + Math.abs(dx)) * scale) / 2 -
      Math.min(0, dx) * scale,
    y:
      (device.height -
        (Math.abs(b) * device.width + d * device.height + dy) * scale) /
        2 -
      Math.min(0, b * device.width) * scale,
    scaleX: a * scale,
    scaleY: d * scale,
    skewY: b / a,
    dx: dx * scale,
    dy: dy * scale,
  };
}

/** Only collection templates opt in. Handles and document placement remain on the outer group. */
export function deviceFace(
  parent: Konva.Group,
  device: DeviceGeometry,
  template: TemplateId,
): Konva.Group {
  const pose = panoramaPose(template);
  if (!pose) return parent;
  const { dx, dy, ...transform } = deviceProjection(device, pose);
  // Layered, projected shell sections form a visible edge, not a flattened screen image.
  if (device.frame) {
    const shell = device.handheld?.shell ??
      device.body ?? {
        x: 0,
        y: 0,
        width: device.width,
        height: device.height,
        radius: device.radius,
      };
    for (let i = 10; i >= 1; i--) {
      const slice = new Konva.Group({
        ...transform,
        x: transform.x + (dx * i) / 10,
        y: transform.y + (dy * i) / 10,
        listening: false,
      });
      slice.add(
        new Konva.Rect({
          ...shell,
          cornerRadius: shell.radius,
          fill: i === 10 ? "#2A3035" : i % 3 === 0 ? "#97A2A9" : "#55616A",
          ...(i === 10
            ? {
                shadowColor: "#151B24",
                shadowBlur: device.width * 0.08,
                shadowOpacity: 0.25,
                shadowOffsetX: device.width * 0.025,
                shadowOffsetY: device.width * 0.055,
              }
            : {}),
        }),
      );
      parent.add(slice);
    }
  }
  const face = new Konva.Group({ ...transform, name: "projected-device-face" });
  parent.add(face);
  return face;
}
