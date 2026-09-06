import Konva from "konva";
import { resolveStyle } from "../core/model";
import type { Project, Shot } from "../core/model";
import { deviceGeometry, fitImage } from "./geometry";
import { templateLayout } from "../core/templates";
import { canonicalCanvas } from "../core/export-profiles";
import { drawDeviceFrame } from "./device-frame";

interface SceneOptions {
  onMove?: (x: number, y: number) => void;
}

function addText(
  layer: Konva.Layer,
  text: string,
  options: {
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize: number;
    weight: string;
    color: string;
    align: "left" | "center";
    opacity?: number;
    lineHeight?: number;
    accent?: string;
  },
): void {
  if (!text.trim()) return;
  const lines = text.split("\n");
  let last = lines.length - 1;
  while (last > 0 && !lines[last].trim()) last--;
  const nodes = lines.map(
    (line, index) =>
      new Konva.Text({
        x: options.x,
        width: options.width,
        text: line || " ",
        fontFamily: "Manrope",
        fontStyle: options.weight,
        fontSize: options.fontSize,
        lineHeight: options.lineHeight ?? 1.15,
        fill: index === last && options.accent ? options.accent : options.color,
        align: options.align,
        opacity: options.opacity ?? 1,
        wrap: "word",
        listening: false,
      }),
  );
  // Measure the complete text with its final font; never silently truncate a caption.
  const height = () => nodes.reduce((sum, node) => sum + node.height(), 0);
  while (height() > options.height && nodes[0].fontSize() > 8)
    nodes.forEach((node) => node.fontSize(node.fontSize() - 1));
  if (height() > options.height) {
    nodes.forEach((node) => node.destroy());
    throw new Error(
      "This caption is too long to fit. Shorten it before exporting.",
    );
  }
  let y = options.y;
  for (const node of nodes) {
    node.y(y);
    y += node.height();
    layer.add(node);
  }
}

/** Shared by Artboard and PNG export. Coordinates use a 1080-wide document at the selected export aspect ratio. */
export function createScene(
  project: Project,
  shot: Shot,
  image: HTMLImageElement,
  options: SceneOptions = {},
): Konva.Layer {
  const style = resolveStyle(project, shot);
  const template = templateLayout(project, style);
  const canvas = canonicalCanvas(project);
  const imageWidth = image.naturalWidth;
  const imageHeight = image.naturalHeight;
  if (!image.complete || imageWidth <= 0 || imageHeight <= 0)
    throw new Error("The screenshot has not finished loading.");
  if (!Number.isFinite(shot.phone.x) || !Number.isFinite(shot.phone.y))
    throw new Error("The device position is invalid.");
  const device = deviceGeometry(
    style.device,
    shot.phone.width,
    style.frame,
    style.deviceOrientation,
  );
  const layer = new Konva.Layer({ listening: Boolean(options.onMove) });
  try {
    // The base remains opaque even if a restored project contains a translucent color.
    layer.add(new Konva.Rect({ ...canvas, fill: "#F4F1E9", listening: false }));
    layer.add(
      new Konva.Rect({
        ...canvas,
        ...(style.backgroundMode === "gradient"
          ? {
              fillLinearGradientStartPoint: { x: 0, y: 0 },
              fillLinearGradientEndPoint: { x: 880, y: canvas.height },
              fillLinearGradientColorStops: [
                0,
                style.background,
                1,
                style.backgroundEnd,
              ],
            }
          : { fill: style.background }),
        listening: false,
      }),
    );
    if (style.texture === "dots")
      layer.add(
        new Konva.Shape({
          listening: false,
          fill: style.textColor,
          opacity: 0.1,
          sceneFunc(context, shape) {
            context.beginPath();
            for (let x = 28; x < canvas.width; x += 44) {
              for (let y = 26; y < canvas.height; y += 44) {
                context.moveTo(x + 1.8, y);
                context.arc(x, y, 1.8, 0, Math.PI * 2);
              }
            }
            context.fillStrokeShape(shape);
          },
        }),
      );
    if (style.template === "tilt")
      layer.add(
        new Konva.Line({
          points: [
            -90,
            canvas.height * 0.625,
            1170,
            canvas.height * (940 / 1920),
            1170,
            canvas.height * (1540 / 1920),
            -90,
            canvas.height * 0.9375,
          ],
          closed: true,
          fill: style.accentColor,
          opacity: 0.09,
          listening: false,
        }),
      );
    if (style.template === "editorial")
      layer.add(
        new Konva.Rect({
          ...template.panel,
          cornerRadius: [
            Math.min(160, canvas.height * 0.1),
            Math.min(160, canvas.height * 0.1),
            32,
            32,
          ],
          fill: style.backgroundEnd,
          listening: false,
        }),
      );

    const phone = new Konva.Group({
      x: shot.phone.x + device.width / 2,
      y: shot.phone.y + device.height / 2,
      offsetX: device.width / 2,
      offsetY: device.height / 2,
      rotation: shot.phone.rotation,
      width: device.width,
      height: device.height,
      draggable: Boolean(options.onMove),
      name: "phone",
    });
    drawDeviceFrame(phone, device);

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
        options.onMove?.(
          Math.round(phone.x() - device.width / 2),
          Math.round(phone.y() - device.height / 2),
        ),
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
    // Captions remain above a deliberately enlarged/rotated device.
    addText(layer, shot.title, {
      ...template.title,
      fontSize: style.titleSize * template.fontScale,
      weight: style.template === "classic" ? "700" : "800",
      lineHeight: template.lineHeight,
      color: style.textColor,
      accent: style.accentTitle ? style.accentColor : undefined,
      align: style.align,
    });
    addText(layer, shot.subtitle, {
      ...template.subtitle,
      fontSize: template.subtitleSize,
      weight: "400",
      color: style.textColor,
      align: style.align,
      opacity: style.template === "classic" ? 0.78 : 0.88,
    });
    if (style.template === "classic") phone.moveToTop();
    return layer;
  } catch (error) {
    layer.destroy();
    throw error;
  }
}
