import Konva from "konva";
import { PLACEMENT_LIMITS } from "../core/model";
import {
  normalizeDeviceRotation,
  type DevicePlacement,
} from "../core/device-placement";
import type { DeviceGeometry } from "./geometry";

/** Editor-only handles. The rendered device scales live; one placement is committed on release. */
export function attachDeviceResize(
  layer: Konva.Layer,
  phone: Konva.Group,
  device: Pick<DeviceGeometry, "width" | "height">,
  cropOffset: number,
  onCommit: (placement: DevicePlacement) => void,
  onSelect: () => void,
  rotationEnabled = false,
) {
  // Use the document footprint, independent of metal edges, cameras and shadows.
  const footprint = new Konva.Rect({
    width: device.width,
    height: device.height,
    fill: "rgba(0,0,0,0)",
    name: "device-hitbox",
  });
  phone.add(footprint);
  // clipFunc does not constrain Konva's measured child bounds. A cover image may
  // extend well beyond its screen, but the handles must follow the device itself.
  phone.getClientRect = (config) => footprint.getClientRect(config);
  const handles = new Konva.Transformer({
    name: "device-transformer",
    visible: false,
    nodes: [phone],
    enabledAnchors: ["top-left", "top-right", "bottom-left", "bottom-right"],
    rotateEnabled: rotationEnabled,
    rotateAnchorOffset: 32,
    rotateAnchorCursor: "grab",
    rotationSnaps: [0, 45, 90, 135, 180, 225, 270, 315],
    rotationSnapTolerance: 3,
    flipEnabled: false,
    keepRatio: true,
    shiftBehavior: "none",
    ignoreStroke: true,
    anchorSize: 14,
    anchorCornerRadius: 3,
    anchorFill: "#FFFEF8",
    anchorStroke: "#547449",
    anchorStrokeWidth: 2,
    anchorStyleFunc: (anchor) => {
      anchor.hitStrokeWidth(30);
      if (anchor.hasName("rotater")) anchor.cornerRadius(7);
    },
    borderStroke: "#547449",
    borderStrokeWidth: 1.5,
    boundBoxFunc(oldBox, box) {
      const scale = Math.abs(phone.getStage()?.scaleX() ?? 1);
      const width = box.width / scale;
      return Number.isFinite(width) &&
        width >= PLACEMENT_LIMITS.width.min &&
        width <= PLACEMENT_LIMITS.width.max &&
        box.height > 0
        ? box
        : oldBox;
    },
  });
  layer.add(handles);
  // Keep the grip reachable when templates place a device near a canvas edge.
  // Choose its side on selection, never midway through a pointer gesture.
  handles.on("visibleChange.rotation", () => {
    const stage = phone.getStage();
    if (!rotationEnabled || !handles.visible() || !stage) return;
    const scale = Math.abs(phone.getAbsoluteScale().x);
    if (!scale) return;
    const transform = phone.getAbsoluteTransform();
    let best = { angle: 0, offset: 32, clearance: -Infinity };
    for (const offset of [32, -24]) {
      const distance = offset / scale;
      const candidates = [
        { angle: 0, x: device.width / 2, y: -distance },
        { angle: 90, x: device.width + distance, y: device.height / 2 },
        { angle: 180, x: device.width / 2, y: device.height + distance },
        { angle: 270, x: -distance, y: device.height / 2 },
      ];
      for (const candidate of candidates) {
        const point = transform.point(candidate);
        const clearance =
          Math.min(
            point.x,
            point.y,
            stage.width() - point.x,
            stage.height() - point.y,
          ) - 22;
        if (clearance > best.clearance)
          best = { angle: candidate.angle, offset, clearance };
        if (clearance >= 0) break;
      }
      if (best.clearance >= 0) break;
    }
    handles.rotateAnchorAngle(best.angle);
    handles.rotateAnchorOffset(best.offset);
  });
  let initialRotation = phone.rotation();
  phone.on("transformstart.resize", () => {
    initialRotation = phone.rotation();
    onSelect();
    phone.getStage()?.container().parentElement?.focus({ preventScroll: true });
  });
  phone.on("transformend.resize", () => {
    const resized = Math.abs(phone.scaleX() - 1) >= 1e-7;
    const rotated =
      rotationEnabled &&
      Math.abs(normalizeDeviceRotation(phone.rotation() - initialRotation)) >=
        1e-7;
    if (!resized && !rotated) return;
    const width = resized
      ? Math.round(device.width * phone.scaleX())
      : device.width;
    const height = (device.height * width) / device.width;
    onCommit({
      x: phone.x() - width / 2 + cropOffset,
      y: phone.y() - height / 2,
      width,
      ...(rotated
        ? { rotation: normalizeDeviceRotation(Math.round(phone.rotation())) }
        : {}),
    });
  });
  return handles;
}
