import type { DeviceFamily, Style } from "../core/model";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
type RoundedRect = Rect & { radius: number };
export interface DeviceGeometry {
  version: 1;
  family: DeviceFamily;
  frame: boolean;
  width: number;
  height: number;
  radius: number;
  screen: Rect & { radius: number };
  camera: Rect & { radius: number };
  /** Physical details stay inside the same footprint and rotate with the frame. */
  handheld?: {
    shell: RoundedRect;
    buttons: RoundedRect[];
    antennaBands: RoundedRect[];
    speaker?: RoundedRect;
  };
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
    : width * (family === "ios" ? (frame ? 0.13 : 0.102) : 0.078);
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
  const cameraHeight = family === "ios" ? screenWidth * 0.081 : cameraWidth;
  const height = screenHeight + inset * 2;
  const edge = width * (family === "ios" ? 0.006 : 0.004);
  const sideButton = (
    right: boolean,
    y: number,
    length: number,
  ): RoundedRect => ({
    x: right ? width - edge * 1.5 : 0,
    y: height * y,
    width: edge * 1.5,
    height: height * length,
    radius: edge * 0.65,
  });
  const buttons: RoundedRect[] = tablet
    ? [
        {
          x: width * 0.79,
          y: 0,
          width: width * 0.075,
          height: edge * 1.5,
          radius: edge * 0.65,
        },
        sideButton(true, 0.075, 0.045),
        sideButton(true, 0.132, 0.045),
      ]
    : family === "ios"
      ? [
          sideButton(false, 0.135, 0.028),
          sideButton(false, 0.205, 0.052),
          sideButton(false, 0.272, 0.052),
          sideButton(true, 0.235, 0.085),
          sideButton(true, 0.65, 0.06),
        ]
      : [sideButton(true, 0.15, 0.085), sideButton(true, 0.27, 0.05)];
  return {
    version: 1,
    family,
    frame,
    width,
    height,
    radius,
    screen,
    camera: {
      x:
        tablet && frame
          ? width - (inset + cameraWidth) / 2
          : (width - cameraWidth) / 2,
      y: tablet
        ? frame
          ? (height - cameraHeight) / 2
          : width * 0.012
        : inset + screenWidth * (family === "ios" ? 0.026 : 0.022),
      width: cameraWidth,
      height: cameraHeight,
      radius: cameraHeight / 2,
    },
    ...(frame
      ? {
          handheld: {
            shell: {
              x: edge,
              y: tablet ? edge : 0,
              width: width - edge * 2,
              height: height - (tablet ? edge : 0),
              radius,
            },
            buttons,
            antennaBands: tablet
              ? []
              : [0.085, 0.88].flatMap((y) =>
                  [edge, width - edge * 2.5].map((x) => ({
                    x,
                    y: height * y,
                    width: edge * 1.5,
                    height: width * 0.0035,
                    radius: 0,
                  })),
                ),
            ...(!tablet
              ? {
                  speaker: {
                    x: width * 0.435,
                    y: inset * 0.27,
                    width: width * 0.13,
                    height: width * 0.0035,
                    radius: width * 0.00175,
                  },
                }
              : {}),
          },
        }
      : {}),
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
  if (family === "card") {
    const height = width * (orientation === "landscape" ? 3 / 4 : 4 / 3);
    const radius = frame ? Math.min(width, height) * 0.035 : 0;
    return {
      version: 1,
      family,
      frame,
      width,
      height,
      radius,
      screen: { x: 0, y: 0, width, height, radius },
      camera: { x: 0, y: 0, width: 0, height: 0, radius: 0 },
    };
  }
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
    ...(portrait.handheld
      ? {
          handheld: {
            shell: rotate(portrait.handheld.shell),
            buttons: portrait.handheld.buttons.map(rotate),
            antennaBands: portrait.handheld.antennaBands.map(rotate),
            ...(portrait.handheld.speaker
              ? { speaker: rotate(portrait.handheld.speaker) }
              : {}),
          },
        }
      : {}),
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
