import type { DeviceFamily, Style } from "../core/model";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface DeviceGeometry {
  version: 1;
  family: DeviceFamily;
  frame: boolean;
  width: number;
  height: number;
  radius: number;
  screen: Rect & { radius: number };
  camera: Rect & { radius: number };
  /** Desktop parts use the same coordinates as the screen and full device bounds. */
  body?: Rect & { radius: number };
  stand?: Rect;
  base?: Rect;
  keyboard?: Rect;
  trackpad?: Rect;
}

function positive(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0)
    throw new Error(`${name} must be a positive number.`);
}

function handheldGeometry(
  family: DeviceFamily,
  width: number,
  frame: boolean,
): DeviceGeometry {
  const tablet = family === "ipad" || family === "android-tablet";
  const inset = frame
    ? width * (tablet ? 0.035 : family === "ios" ? 0.027 : 0.024)
    : 0;
  const screenWidth = width - inset * 2;
  const screenHeight =
    screenWidth *
    (family === "ipad"
      ? 4 / 3
      : family === "android-tablet"
        ? 16 / 10
        : family === "ios"
          ? 19.5 / 9
          : 20 / 9);
  const radius = tablet
    ? frame
      ? width * (family === "ipad" ? 0.058 : 0.043)
      : 0
    : width * (family === "ios" ? 0.102 : 0.078);
  const screen = {
    x: inset,
    y: inset,
    width: screenWidth,
    height: screenHeight,
    radius: Math.max(0, radius - inset),
  };
  const cameraWidth = tablet
    ? width * 0.009
    : family === "ios"
      ? screenWidth * 0.29
      : screenWidth * 0.032;
  const cameraHeight = family === "ios" ? screenWidth * 0.065 : cameraWidth;
  return {
    version: 1,
    family,
    frame,
    width,
    height: screenHeight + inset * 2,
    radius,
    screen,
    camera: {
      x: (width - cameraWidth) / 2,
      y: tablet
        ? frame
          ? (inset - cameraHeight) / 2
          : width * 0.012
        : inset + screenWidth * (family === "ios" ? 0.016 : 0.022),
      width: cameraWidth,
      height: cameraHeight,
      radius: cameraHeight / 2,
    },
  };
}

/** Generic geometry. Width covers the entire device, including a laptop's base. */
export function deviceGeometry(
  family: DeviceFamily,
  width: number,
  frame: boolean,
  orientation: "portrait" | "landscape" = "portrait",
): DeviceGeometry {
  positive(width, "Device width");
  if (family === "monitor" || family === "laptop") {
    const ratio = family === "monitor" ? 16 / 9 : 16 / 10;
    if (!frame) {
      const height = width / ratio;
      return {
        version: 1,
        family,
        frame,
        width,
        height,
        radius: 0,
        screen: { x: 0, y: 0, width, height, radius: 0 },
        camera: {
          x: width * 0.495,
          y: width * 0.006,
          width: width * 0.01,
          height: width * 0.01,
          radius: width * 0.005,
        },
      };
    }
    if (family === "monitor") {
      const inset = width * 0.014;
      const screenWidth = width - inset * 2;
      const screenHeight = screenWidth / ratio;
      const bodyHeight = inset + screenHeight + width * 0.057;
      const baseY = bodyHeight + width * 0.118;
      return {
        version: 1,
        family,
        frame,
        width,
        height: baseY + width * 0.017,
        radius: width * 0.022,
        screen: {
          x: inset,
          y: inset,
          width: screenWidth,
          height: screenHeight,
          radius: width * 0.006,
        },
        camera: {
          x: width * 0.497,
          y: width * 0.004,
          width: width * 0.006,
          height: width * 0.006,
          radius: width * 0.003,
        },
        body: { x: 0, y: 0, width, height: bodyHeight, radius: width * 0.022 },
        stand: {
          x: width * 0.438,
          y: bodyHeight - width * 0.008,
          width: width * 0.124,
          height: baseY - bodyHeight + width * 0.015,
        },
        base: {
          x: width * 0.345,
          y: baseY,
          width: width * 0.31,
          height: width * 0.017,
        },
      };
    }
    const bodyX = width * 0.05;
    const bodyWidth = width * 0.9;
    const inset = width * 0.014;
    const screenWidth = bodyWidth - inset * 2;
    const screenHeight = screenWidth / ratio;
    const bodyHeight = screenHeight + inset * 2;
    const baseY = bodyHeight - width * 0.003;
    return {
      version: 1,
      family,
      frame,
      width,
      height: baseY + width * 0.088,
      radius: width * 0.024,
      screen: {
        x: bodyX + inset,
        y: inset,
        width: screenWidth,
        height: screenHeight,
        radius: width * 0.007,
      },
      camera: {
        x: width * 0.497,
        y: width * 0.004,
        width: width * 0.006,
        height: width * 0.006,
        radius: width * 0.003,
      },
      body: {
        x: bodyX,
        y: 0,
        width: bodyWidth,
        height: bodyHeight,
        radius: width * 0.024,
      },
      base: { x: 0, y: baseY, width, height: width * 0.088 },
      keyboard: {
        x: width * 0.13,
        y: baseY + width * 0.009,
        width: width * 0.74,
        height: width * 0.028,
      },
      trackpad: {
        x: width * 0.402,
        y: baseY + width * 0.044,
        width: width * 0.196,
        height: width * 0.018,
      },
    };
  }
  if (!["android", "ios", "ipad", "android-tablet"].includes(family))
    throw new Error("This device frame is not supported.");
  if (orientation === "portrait") return handheldGeometry(family, width, frame);

  // Rotate the physical geometry; landscape bezels retain their original proportions.
  const portrait = handheldGeometry(
    family,
    width / handheldGeometry(family, 1, frame).height,
    frame,
  );
  const rotate = (rect: Rect & { radius: number }) => ({
    x: rect.y,
    y: portrait.width - rect.x - rect.width,
    width: rect.height,
    height: rect.width,
    radius: rect.radius,
  });
  return {
    ...portrait,
    width,
    height: portrait.width,
    screen: rotate(portrait.screen),
    camera: rotate(portrait.camera),
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
export function previewDimensions(
  width: number,
  canvas: { width: number; height: number } = { width: 1080, height: 1920 },
): {
  width: number;
  height: number;
  scale: number;
} {
  positive(width, "Preview width");
  positive(canvas.width, "Canvas width");
  positive(canvas.height, "Canvas height");
  return {
    width,
    height: (width * canvas.height) / canvas.width,
    scale: width / canvas.width,
  };
}
