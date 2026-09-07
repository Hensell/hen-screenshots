import Konva from "konva";
import type { DeviceGeometry } from "./geometry";

function drawHandheld(group: Konva.Group, device: DeviceGeometry): void {
  const { shell, buttons, antennaBands, speaker } = device.handheld!;
  const scale = Math.min(device.width, device.height);
  const apple = device.family === "ios" || device.family === "ipad";
  const metal = apple
    ? [
        0,
        "#77736D",
        0.18,
        "#D6D2C9",
        0.44,
        "#99958E",
        0.72,
        "#E1DED7",
        1,
        "#7C7872",
      ]
    : [
        0,
        "#454950",
        0.2,
        "#A4A9B0",
        0.5,
        "#60666F",
        0.8,
        "#C1C5CB",
        1,
        "#4A5058",
      ];
  for (const button of buttons) {
    group.add(
      new Konva.Rect({
        ...button,
        cornerRadius: button.radius,
        fillLinearGradientStartPoint: { x: 0, y: 0 },
        fillLinearGradientEndPoint: { x: button.width, y: button.height },
        fillLinearGradientColorStops: metal,
        stroke: "#55565A",
        strokeWidth: scale * 0.0007,
        listening: false,
      }),
    );
  }
  group.add(
    new Konva.Rect({
      ...shell,
      cornerRadius: shell.radius,
      fillLinearGradientStartPoint: { x: 0, y: 0 },
      fillLinearGradientEndPoint: { x: shell.width, y: shell.height * 0.55 },
      fillLinearGradientColorStops: metal,
      stroke: "#464749",
      strokeWidth: scale * 0.0014,
      shadowColor: "#0D1118",
      shadowBlur: scale * 0.06,
      shadowOffsetY: scale * 0.035,
      shadowOpacity: 0.24,
    }),
  );
  const rim =
    scale * (device.family === "ios" ? 0.007 : apple ? 0.006 : 0.0045);
  group.add(
    new Konva.Rect({
      x: shell.x + rim,
      y: shell.y + rim,
      width: shell.width - rim * 2,
      height: shell.height - rim * 2,
      cornerRadius: shell.radius - rim,
      fill: "#101114",
      stroke: "#08090B",
      strokeWidth: scale * 0.0015,
      listening: false,
    }),
  );
  group.add(
    new Konva.Rect({
      x: shell.x + rim * 0.35,
      y: shell.y + rim * 0.35,
      width: shell.width - rim * 0.7,
      height: shell.height - rim * 0.7,
      cornerRadius: shell.radius - rim * 0.35,
      stroke: "#F4F0E9",
      strokeWidth: scale * 0.0009,
      opacity: 0.55,
      listening: false,
    }),
  );
  for (const band of antennaBands) {
    group.add(new Konva.Rect({ ...band, fill: "#5B5A58", listening: false }));
  }
  if (speaker) {
    group.add(
      new Konva.Rect({
        ...speaker,
        cornerRadius: speaker.radius,
        fill: "#050608",
        listening: false,
      }),
    );
  }
}

/** Glass lip and optional camera sit above the screenshot, using the same rotated geometry. */
export function drawDeviceDetails(
  group: Konva.Group,
  device: DeviceGeometry,
  camera: boolean,
): void {
  if (device.frame && device.family !== "card") {
    group.add(
      new Konva.Rect({
        ...device.screen,
        cornerRadius: device.screen.radius,
        stroke: "#050608",
        strokeWidth: Math.min(device.width, device.height) * 0.0015,
        listening: false,
      }),
    );
  }
  if (!camera || device.family === "card") return;
  const cutout = device.camera;
  const diameter = Math.min(cutout.width, cutout.height);
  const island = device.family === "ios";
  group.add(
    new Konva.Rect({
      ...cutout,
      cornerRadius: cutout.radius,
      fill: "#050608",
      stroke: "#24262B",
      strokeWidth: diameter * 0.035,
      listening: false,
    }),
  );
  const horizontal = cutout.width > cutout.height;
  const x =
    island && horizontal
      ? cutout.x + cutout.width - diameter * 0.65
      : cutout.x + cutout.width / 2;
  const y =
    island && !horizontal
      ? cutout.y + diameter * 0.65
      : cutout.y + cutout.height / 2;
  const radius = diameter * (island ? 0.235 : 0.32);
  group.add(
    new Konva.Circle({
      x,
      y,
      radius,
      fill: "#111925",
      stroke: "#202938",
      strokeWidth: diameter * 0.04,
      listening: false,
    }),
  );
  group.add(
    new Konva.Circle({
      x: x - radius * 0.22,
      y: y - radius * 0.23,
      radius: radius * 0.43,
      fill: "#314157",
      opacity: 0.75,
      listening: false,
    }),
  );
}

/** Paint the hardware behind the screenshot. Shared by the preview and PNG renderer. */
export function drawDeviceFrame(
  group: Konva.Group,
  device: DeviceGeometry,
): void {
  if (device.handheld && device.frame) {
    drawHandheld(group, device);
    return;
  }
  if (!device.body || !device.frame) {
    // Bare screenshots and cards retain their original surface and shadow.
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
