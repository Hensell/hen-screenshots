import type { DeviceFamily, Style } from "../core/model";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface DeviceGeometry {
  version: 1;
  width: number;
  height: number;
  radius: number;
  screen: Rect & { radius: number };
  camera: Rect & { radius: number };
}

function positive(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0)
    throw new Error(`${name} must be a positive number.`);
}

/** Generic, versioned geometry. Dimensions describe the phone, never the export. */
export function deviceGeometry(
  family: DeviceFamily,
  width: number,
  frame: boolean,
): DeviceGeometry {
  positive(width, "Phone width");
  const inset = frame ? width * (family === "ios" ? 0.027 : 0.024) : 0;
  const screenWidth = width - inset * 2;
  const screenHeight = screenWidth * (family === "ios" ? 19.5 / 9 : 20 / 9);
  const radius = width * (family === "ios" ? 0.102 : 0.078);
  const screen = {
    x: inset,
    y: inset,
    width: screenWidth,
    height: screenHeight,
    radius: Math.max(0, radius - inset),
  };
  const cameraWidth =
    family === "ios" ? screenWidth * 0.29 : screenWidth * 0.032;
  const cameraHeight = family === "ios" ? screenWidth * 0.065 : cameraWidth;
  return {
    version: 1,
    width,
    height: screenHeight + inset * 2,
    radius,
    screen,
    camera: {
      x: (width - cameraWidth) / 2,
      y: inset + screenWidth * (family === "ios" ? 0.016 : 0.022),
      width: cameraWidth,
      height: cameraHeight,
      radius: cameraHeight / 2,
    },
  };
}

/** Destination is centered; cover extends beyond the screen and is clipped there. */
export function fitImage(
  sourceWidth: number,
  sourceHeight: number,
  target: Rect,
  mode: Style["fit"],
): Rect {
  positive(sourceWidth, "Image width");
  positive(sourceHeight, "Image height");
  positive(target.width, "Screen width");
  positive(target.height, "Screen height");
  const scale = (mode === "contain" ? Math.min : Math.max)(
    target.width / sourceWidth,
    target.height / sourceHeight,
  );
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;
  return {
    x: target.x + (target.width - width) / 2,
    y: target.y + (target.height - height) / 2,
    width,
    height,
  };
}

/** Canonical document coordinates are independent of the preview's zoom. */
export function previewDimensions(width: number): {
  width: number;
  height: number;
  scale: number;
} {
  positive(width, "Preview width");
  return { width, height: (width * 1920) / 1080, scale: width / 1080 };
}
