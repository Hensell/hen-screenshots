import Konva from "konva";
import { CANVAS, resolveStyle } from "../core/model";
import type { Project, Shot } from "../core/model";
import { deviceGeometry, fitImage } from "./geometry";

interface SceneOptions {
  onMove?: (x: number, y: number) => void;
}

function addText(
  layer: Konva.Layer,
  text: string,
  options: {
    y: number;
    height: number;
    fontSize: number;
    weight: string;
    color: string;
    align: "left" | "center";
    opacity?: number;
  },
): void {
  if (!text.trim()) return;
  const node = new Konva.Text({
    x: 92,
    y: options.y,
    width: CANVAS.width - 184,
    text,
    fontFamily: "Manrope",
    fontStyle: options.weight,
    fontSize: options.fontSize,
    lineHeight: 1.15,
    fill: options.color,
    align: options.align,
    opacity: options.opacity ?? 1,
    wrap: "word",
    listening: false,
  });
  // Measure the complete text with its final font; never silently truncate a caption.
  while (node.height() > options.height && node.fontSize() > 8)
    node.fontSize(node.fontSize() - 1);
  if (node.height() > options.height) {
    node.destroy();
    throw new Error(
      "This caption is too long to fit. Shorten it before exporting.",
    );
  }
  layer.add(node);
}

/** Shared by Artboard and PNG export. All coordinates are the 1080 × 1920 document. */
export function createScene(
  project: Project,
  shot: Shot,
  image: HTMLImageElement,
  options: SceneOptions = {},
): Konva.Layer {
  const style = resolveStyle(project, shot);
  const imageWidth = image.naturalWidth;
  const imageHeight = image.naturalHeight;
  if (!image.complete || imageWidth <= 0 || imageHeight <= 0)
    throw new Error("The screenshot has not finished loading.");
  if (!Number.isFinite(shot.phone.x) || !Number.isFinite(shot.phone.y))
    throw new Error("The phone position is invalid.");
  const device = deviceGeometry(style.device, shot.phone.width, style.frame);
  const layer = new Konva.Layer({ listening: Boolean(options.onMove) });
  try {
    // The base remains opaque even if a restored project contains a translucent color.
    layer.add(new Konva.Rect({ ...CANVAS, fill: "#F4F1E9", listening: false }));
    layer.add(
      new Konva.Rect({ ...CANVAS, fill: style.background, listening: false }),
    );
    addText(layer, shot.title, {
      y: 126,
      height: 226,
      fontSize: 84,
      weight: "700",
      color: style.textColor,
      align: style.align,
    });
    addText(layer, shot.subtitle, {
      y: 375,
      height: 80,
      fontSize: 34,
      weight: "400",
      color: style.textColor,
      align: style.align,
      opacity: 0.78,
    });

    const phone = new Konva.Group({
      x: shot.phone.x,
      y: shot.phone.y,
      width: device.width,
      height: device.height,
      draggable: Boolean(options.onMove),
      name: "phone",
    });
    phone.add(
      new Konva.Rect({
        width: device.width,
        height: device.height,
        cornerRadius: device.radius,
        fill: style.frame ? "#252A29" : "#FFFFFF",
        stroke: style.frame ? "#626967" : undefined,
        strokeWidth: style.frame ? 1.5 : 0,
        shadowColor: "#18251F",
        shadowBlur: device.width * 0.065,
        shadowOffsetX: 0,
        shadowOffsetY: device.width * 0.042,
        shadowOpacity: 0.2,
      }),
    );
    if (style.frame) {
      phone.add(
        new Konva.Rect({
          x: 3,
          y: 3,
          width: device.width - 6,
          height: device.height - 6,
          cornerRadius: device.radius - 3,
          stroke: "#FFFFFF",
          strokeWidth: 1,
          opacity: 0.13,
          listening: false,
        }),
      );
    }

    const screen = new Konva.Group({
      clipFunc(context) {
        context.beginPath();
        context.roundRect(
          device.screen.x,
          device.screen.y,
          device.screen.width,
          device.screen.height,
          device.screen.radius,
        );
        context.closePath();
      },
    });
    screen.add(new Konva.Rect({ ...device.screen, fill: "#FFFFFF" }));
    screen.add(
      new Konva.Image({
        image,
        ...fitImage(imageWidth, imageHeight, device.screen, style.fit),
      }),
    );
    phone.add(screen);

    // Imported status/navigation bars stay in their original pixels. No synthetic bars.
    if (style.camera) {
      phone.add(
        new Konva.Rect({
          x: device.camera.x,
          y: device.camera.y,
          width: device.camera.width,
          height: device.camera.height,
          cornerRadius: device.camera.radius,
          fill: "#111514",
          listening: false,
        }),
      );
    }
    if (options.onMove) {
      phone.on("dragend", () =>
        options.onMove?.(Math.round(phone.x()), Math.round(phone.y())),
      );
      phone.on("mouseenter", () => {
        const container = phone.getStage()?.container();
        if (container) container.style.cursor = "grab";
      });
      phone.on("mousedown touchstart", () => {
        const container = phone.getStage()?.container();
        if (container) container.style.cursor = "grabbing";
      });
      phone.on("mouseup touchend", () => {
        const container = phone.getStage()?.container();
        if (container) container.style.cursor = "grab";
      });
      phone.on("mouseleave", () => {
        const container = phone.getStage()?.container();
        if (container) container.style.cursor = "";
      });
    }
    layer.add(phone);
    return layer;
  } catch (error) {
    layer.destroy();
    throw error;
  }
}
