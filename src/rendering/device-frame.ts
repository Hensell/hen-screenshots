import Konva from "konva";
import type { DeviceGeometry } from "./geometry";

/** Paint the hardware behind the screenshot. Shared by the preview and PNG renderer. */
export function drawDeviceFrame(
  group: Konva.Group,
  device: DeviceGeometry,
): void {
  if (!device.body || !device.frame) {
    // Keep the original phone shell and shadow identical for existing projects.
    group.add(
      new Konva.Rect({
        width: device.width,
        height: device.height,
        cornerRadius: device.radius,
        fill: device.frame && device.family !== "card" ? "#252A29" : "#FFFFFF",
        stroke:
          device.frame && device.family !== "card" ? "#626967" : undefined,
        strokeWidth: device.frame ? 1.5 : 0,
        shadowColor: "#18251F",
        shadowBlur: device.width * 0.065,
        shadowOffsetX: 0,
        shadowOffsetY: device.width * 0.042,
        shadowOpacity: 0.2,
      }),
    );
    if (device.frame) {
      group.add(
        new Konva.Rect({
          x: 3,
          y: 3,
          width: device.width - 6,
          height: device.height - 6,
          cornerRadius: Math.max(0, device.radius - 3),
          stroke: "#FFFFFF",
          strokeWidth: 1,
          opacity: 0.13,
          listening: false,
        }),
      );
    }
    return;
  }

  const { width, body, stand, base, keyboard, trackpad } = device;
  if (stand) {
    group.add(
      new Konva.Rect({
        ...stand,
        cornerRadius: width * 0.007,
        fillLinearGradientStartPoint: { x: 0, y: 0 },
        fillLinearGradientEndPoint: { x: stand.width, y: 0 },
        fillLinearGradientColorStops: [
          0,
          "#929B9C",
          0.25,
          "#CBD0CF",
          0.55,
          "#DFE2DF",
          1,
          "#A7AEAC",
        ],
        listening: false,
      }),
    );
  }
  if (base && device.family === "monitor") {
    group.add(
      new Konva.Rect({
        ...base,
        cornerRadius: [
          width * 0.012,
          width * 0.012,
          width * 0.006,
          width * 0.006,
        ],
        fillLinearGradientStartPoint: { x: 0, y: 0 },
        fillLinearGradientEndPoint: { x: 0, y: base.height },
        fillLinearGradientColorStops: [
          0,
          "#E8EAE6",
          0.65,
          "#AEB6B2",
          1,
          "#858F8C",
        ],
        shadowColor: "#18251F",
        shadowBlur: width * 0.026,
        shadowOffsetY: width * 0.011,
        shadowOpacity: 0.23,
        listening: false,
      }),
    );
  }

  group.add(
    new Konva.Rect({
      ...body,
      cornerRadius: body.radius,
      fill: "#232A29",
      stroke: "#7E8883",
      strokeWidth: width * 0.0014,
      shadowColor: "#18251F",
      shadowBlur: width * 0.042,
      shadowOffsetY: width * 0.026,
      shadowOpacity: 0.19,
      listening: false,
    }),
  );
  group.add(
    new Konva.Rect({
      x: body.x + width * 0.002,
      y: width * 0.002,
      width: body.width - width * 0.004,
      height: body.height - width * 0.004,
      cornerRadius: Math.max(0, body.radius - width * 0.002),
      stroke: "#F7F8F0",
      strokeWidth: width * 0.001,
      opacity: 0.22,
      listening: false,
    }),
  );

  if (device.family === "monitor") {
    const chinY = device.screen.y + device.screen.height + width * 0.009;
    group.add(
      new Konva.Rect({
        x: width * 0.002,
        y: chinY,
        width: width * 0.996,
        height: body.height - chinY - width * 0.002,
        cornerRadius: [0, 0, width * 0.02, width * 0.02],
        fillLinearGradientStartPoint: { x: 0, y: 0 },
        fillLinearGradientEndPoint: { x: width, y: 0 },
        fillLinearGradientColorStops: [
          0,
          "#BDC4BF",
          0.5,
          "#D7DCD5",
          1,
          "#BAC2BC",
        ],
        listening: false,
      }),
    );
  }

  if (base && device.family === "laptop") {
    const frontY = base.y + base.height * 0.83;
    group.add(
      new Konva.Line({
        points: [
          width * 0.05,
          base.y,
          width * 0.95,
          base.y,
          width,
          frontY,
          width * 0.985,
          base.y + base.height,
          width * 0.015,
          base.y + base.height,
          0,
          frontY,
        ],
        closed: true,
        lineJoin: "round",
        fillLinearGradientStartPoint: { x: 0, y: base.y },
        fillLinearGradientEndPoint: { x: 0, y: base.y + base.height },
        fillLinearGradientColorStops: [
          0,
          "#A5AFAB",
          0.25,
          "#DDE1D9",
          0.82,
          "#C0C9C1",
          0.84,
          "#9CA9A0",
          1,
          "#718177",
        ],
        stroke: "#86948B",
        strokeWidth: width * 0.0009,
        shadowColor: "#18251F",
        shadowBlur: width * 0.038,
        shadowOffsetY: width * 0.015,
        shadowOpacity: 0.23,
        listening: false,
      }),
    );
    if (keyboard) {
      group.add(
        new Konva.Rect({
          ...keyboard,
          cornerRadius: width * 0.004,
          fill: "#68756C",
          opacity: 0.65,
          listening: false,
        }),
      );
      const gap = width * 0.003;
      const keyWidth = (keyboard.width - gap * 16) / 15;
      const keyHeight = (keyboard.height - gap * 4) / 3;
      for (let row = 0; row < 3; row++) {
        for (let column = 0; column < 15; column++) {
          group.add(
            new Konva.Rect({
              x: keyboard.x + gap + column * (keyWidth + gap),
              y: keyboard.y + gap + row * (keyHeight + gap),
              width: keyWidth,
              height: keyHeight,
              cornerRadius: width * 0.0013,
              fill: "#303D34",
              opacity: 0.73,
              listening: false,
            }),
          );
        }
      }
    }
    if (trackpad) {
      group.add(
        new Konva.Rect({
          ...trackpad,
          cornerRadius: width * 0.003,
          stroke: "#8E9C92",
          strokeWidth: width * 0.001,
          fill: "#CBD3C9",
          listening: false,
        }),
      );
    }
    group.add(
      new Konva.Line({
        points: [width * 0.44, frontY, width * 0.56, frontY],
        stroke: "#697A6D",
        strokeWidth: width * 0.005,
        lineCap: "round",
        listening: false,
      }),
    );
  }
}
