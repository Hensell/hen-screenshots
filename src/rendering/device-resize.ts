import Konva from "konva";
import { PLACEMENT_LIMITS } from "../core/model";
import type { DevicePlacement } from "../core/device-placement";
import type { DeviceGeometry } from "./geometry";

/** Editor-only handles. The rendered device scales live; one placement is committed on release. */
export function attachDeviceResize(
  layer: Konva.Layer,
  phone: Konva.Group,
  device: Pick<DeviceGeometry, "width" | "height">,
  cropOffset: number,
  onCommit: (placement: DevicePlacement) => void,
  onSelect: () => void,
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
    rotateEnabled: false,
    flipEnabled: false,
    keepRatio: true,
    shiftBehavior: "none",
    ignoreStroke: true,
    anchorSize: 14,
    anchorCornerRadius: 3,
    anchorFill: "#FFFEF8",
    anchorStroke: "#547449",
    anchorStrokeWidth: 2,
    anchorStyleFunc: (anchor) => anchor.hitStrokeWidth(30),
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
  phone.on("transformstart.resize", () => {
    onSelect();
    phone.getStage()?.container().parentElement?.focus({ preventScroll: true });
  });
  phone.on("transformend.resize", () => {
    if (Math.abs(phone.scaleX() - 1) < 1e-7) return;
    const width = Math.round(device.width * phone.scaleX());
    const height = (device.height * width) / device.width;
    onCommit({
      x: phone.x() - width / 2 + cropOffset,
      y: phone.y() - height / 2,
      width,
    });
  });
  return handles;
}
