import {
  PLACEMENT_LIMITS,
  resolveStyle,
  type CanvasElement,
  type CompanionDevice,
  type DeviceElement,
  type DeviceFamily,
  type DeviceStyle,
  type Project,
  type Shot,
  type Style,
} from "./model";
import { canonicalCanvas } from "./export-profiles";
import { deviceGeometry } from "../rendering/geometry";
import { localContent } from "./localization";

export {
  deviceCompositions,
  compositionId,
  type CompositionId,
} from "./device-composition-spec";
import { deviceCompositions, compositionId } from "./device-composition-spec";
export const isDeviceElement = (
  element: CanvasElement,
): element is DeviceElement =>
  element === "device" || element.startsWith("device:");
export function companionFor(shot: Shot, element: CanvasElement) {
  return shot.companions?.find((device) => `device:${device.id}` === element);
}
export function deviceShot(shot: Shot, element: CanvasElement): Shot {
  const device = companionFor(shot, element);
  return device
    ? {
        ...shot,
        assetId: device.assetId,
        phone: device.phone,
        style: { ...shot.style, ...device.style },
      }
    : shot;
}
export function editDevice(
  shot: Shot,
  element: DeviceElement,
  recipe: (device: Shot) => void,
) {
  const device = companionFor(shot, element);
  if (!device) {
    if (element === "device") recipe(shot);
    return;
  }
  const proxy = deviceShot(shot, element);
  recipe(proxy);
  device.phone = proxy.phone;
  device.assetId = proxy.assetId;
  for (const key of [
    "device",
    "deviceOrientation",
    "frame",
    "camera",
    "fit",
  ] as const)
    Object.assign(device.style, { [key]: proxy.style[key] });
}
export function setDeviceImage(
  shot: Shot,
  element: DeviceElement,
  assetId: string,
  locale: string | null,
) {
  const device = companionFor(shot, element);
  if (device) {
    if (locale)
      (localContent(shot, locale).deviceAssets ??= {})[device.id] = assetId;
    else device.assetId = assetId;
  } else if (element === "device") {
    if (locale) localContent(shot, locale).assetId = assetId;
    else shot.assetId = assetId;
  }
}

const kind = (device: DeviceFamily) =>
  device === "monitor" || device === "laptop"
    ? "desktop"
    : device === "ipad" || device === "android-tablet"
      ? "tablet"
      : device === "card"
        ? "card"
        : "mobile";
function frameStyle(device: DeviceFamily): DeviceStyle {
  return {
    device,
    deviceOrientation: kind(device) === "desktop" ? "landscape" : "portrait",
    frame: true,
    camera: device === "ios",
    fit: "contain",
  };
}

/** Reuse each platform's image when moving between compositions. New slots start with the current capture. */
export function configureDevices(
  project: Project,
  shot: Shot,
  templateId: string,
) {
  const id = compositionId(templateId);
  if (!id) {
    delete shot.companions;
    for (const content of Object.values(shot.translations ?? {}))
      delete content.deviceAssets;
    return;
  }
  const previous = [
    {
      id: "primary",
      assetId: shot.assetId,
      style: resolveStyle(project, shot),
    },
    ...(shot.companions ?? []),
  ];
  const slots = deviceCompositions[id].map(
    (device) =>
      previous.find((old) => kind(old.style.device) === kind(device)) ??
      previous[0],
  );
  // Read all language sources before remapping their slot keys.
  for (const content of Object.values(shot.translations ?? {})) {
    const images = slots.map((slot) =>
      slot.id === "primary"
        ? content.assetId
        : content.deviceAssets?.[slot.id as CompanionDevice["id"]],
    );
    delete content.assetId;
    delete content.deviceAssets;
    images.forEach((asset, index) => {
      if (!asset) return;
      if (index === 0) content.assetId = asset;
      else
        (content.deviceAssets ??= {})[index === 1 ? "secondary" : "tertiary"] =
          asset;
    });
  }
  shot.assetId = slots[0].assetId;
  Object.assign(shot.style, frameStyle(deviceCompositions[id][0]));
  shot.companions = deviceCompositions[id].slice(1).map((device, index) => ({
    id: index === 0 ? "secondary" : "tertiary",
    assetId: slots[index + 1].assetId,
    style: frameStyle(device),
    phone: { ...shot.phone },
  }));
}

/** Fit one cluster as a unit; its slots remain independent after the initial layout. */
export function compositionLayout(
  project: Project,
  style: Style,
  companions?: readonly CompanionDevice[],
) {
  const id = compositionId(style.template)!;
  const h = canonicalCanvas(project).height;
  const wide = h <= 1080;
  const panel = wide
    ? { x: 350, y: h * 0.1, width: 665, height: h * 0.8 }
    : { x: 60, y: h * 0.34, width: 960, height: h * 0.59 };
  const families = deviceCompositions[id];
  const frames = [
    style,
    ...families.slice(1).map((device, index) => ({
      ...style,
      ...(companions?.[index]?.style ?? frameStyle(device)),
    })),
  ];
  const poses =
    families.length === 3
      ? [
          { x: 110, y: 10, width: 780, rotation: 0 },
          { x: 0, y: 290, width: 390, rotation: -8 },
          { x: 740, y: 280, width: 220, rotation: 7 },
        ]
      : kind(families[0]) === "tablet"
        ? [
            { x: 100, y: 10, width: 590, rotation: -5 },
            { x: 610, y: 350, width: 245, rotation: 7 },
          ]
        : kind(families[1]) === "tablet"
          ? [
              { x: 40, y: 20, width: 790, rotation: -2 },
              { x: 590, y: 250, width: 380, rotation: 6 },
            ]
          : [
              { x: 30, y: 30, width: 820, rotation: -2 },
              { x: 740, y: 170, width: 230, rotation: 6 },
            ];
  const mirrored = [
    "handoff",
    "duet",
    "desktop-suite",
    "constellation",
  ].includes(id);
  const boxes = frames.map((frame, index) => {
    const pose = { ...poses[index] };
    const size = deviceGeometry(
      frame.device,
      pose.width,
      frame.frame,
      frame.deviceOrientation,
    );
    if (mirrored) {
      pose.x = 1000 - pose.x - size.width;
      pose.rotation *= -1;
    }
    const a = (Math.abs(pose.rotation) * Math.PI) / 180;
    const w = Math.cos(a) * size.width + Math.sin(a) * size.height;
    const h = Math.sin(a) * size.width + Math.cos(a) * size.height;
    return {
      ...pose,
      height: size.height,
      left: pose.x + size.width / 2 - w / 2,
      top: pose.y + size.height / 2 - h / 2,
      w,
      h,
    };
  });
  const left = Math.min(...boxes.map((box) => box.left));
  const top = Math.min(...boxes.map((box) => box.top));
  const clusterWidth = Math.max(...boxes.map((box) => box.left + box.w)) - left;
  const height = Math.max(...boxes.map((box) => box.top + box.h)) - top;
  const scale = Math.min(
    (panel.width - 8) / clusterWidth,
    (panel.height - 8) / height,
  );
  const devices = boxes.map((box, index) => {
    // Tiny custom canvases still need a usable minimum width after changing a frame.
    const width = Math.max(PLACEMENT_LIMITS.width.min, box.width * scale);
    const frame = frames[index];
    const geometry = deviceGeometry(
      frame.device,
      width,
      frame.frame,
      frame.deviceOrientation,
    );
    const angle = (Math.abs(box.rotation) * Math.PI) / 180;
    const rotatedWidth =
      Math.cos(angle) * geometry.width + Math.sin(angle) * geometry.height;
    const rotatedHeight =
      Math.sin(angle) * geometry.width + Math.cos(angle) * geometry.height;
    const cx =
      panel.x +
      panel.width / 2 +
      (box.x + box.width / 2 - left - clusterWidth / 2) * scale;
    const cy =
      panel.y +
      panel.height / 2 +
      (box.y + box.height / 2 - top - height / 2) * scale;
    return {
      x:
        Math.max(
          panel.x + rotatedWidth / 2,
          Math.min(panel.x + panel.width - rotatedWidth / 2, cx),
        ) -
        geometry.width / 2,
      y:
        Math.max(
          panel.y + rotatedHeight / 2,
          Math.min(panel.y + panel.height - rotatedHeight / 2, cy),
        ) -
        geometry.height / 2,
      width,
      rotation: box.rotation,
    };
  });
  return {
    phone: devices[0],
    devices,
    panel,
    title: wide
      ? { x: 70, y: h * 0.13, width: 260, height: h * 0.43 }
      : { x: 90, y: h * 0.065, width: 900, height: h * 0.17 },
    subtitle: wide
      ? { x: 74, y: h * 0.65, width: 252, height: h * 0.18 }
      : { x: 94, y: h * 0.255, width: 860, height: h * 0.06 },
    fontScale: wide ? 0.62 : 0.96,
    subtitleSize: wide ? 23 : 32,
  };
}
