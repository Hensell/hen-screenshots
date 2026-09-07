import { isPanoramaEnd, panoramaStart } from "../core/panorama-families";
import Konva from "konva";
import { legacyTemplateIds, resolveStyle } from "../core/model";
import type { Project, Shot, TextElement, CanvasElement } from "../core/model";
import { textOffset } from "../core/text-placement";
import { deviceGeometry, fitImage } from "./geometry";
import { templateLayout } from "../core/templates";
import { canonicalCanvas } from "../core/export-profiles";
import { isPanoramaTemplate, panoramaPair } from "../core/panorama";
import { drawDeviceFrame, drawDeviceDetails } from "./device-frame";
import { drawTemplateDecoration } from "./template-decoration";

interface SceneOptions {
  onMove?: (x: number, y: number) => void;
  onTextMove?: (
    element: TextElement,
    x: number,
    y: number,
    shotId: string,
  ) => void;
  onSelectElement?: (element: CanvasElement, shotId?: string) => void;
}

/** Selection is editor-only; export scenes contain no outlines or event handlers. */
export function selectSceneElement(
  layer: Konva.Layer,
  element: CanvasElement,
  shotId?: string,
) {
  layer.setAttr("selectedElement", element);
  layer.setAttr("selectedShotId", shotId);
  layer
    .find(".selection-outline")
    .forEach((node) =>
      node.visible(
        node.getAttr("element") === element &&
          node.getAttr("shotId") === shotId,
      ),
    );
  layer.batchDraw();
}

function makeMovable(
  group: Konva.Group,
  element: CanvasElement,
  options: SceneOptions,
  shotId?: string,
) {
  group.draggable(true);
  group.on("mouseenter", () => {
    const container = group.getStage()?.container();
    if (container) container.style.cursor = "grab";
    group.findOne(".selection-outline")?.show();
  });
  group.on("mousedown touchstart", () => {
    selectSceneElement(group.getLayer()!, element, shotId);
    options.onSelectElement?.(element, shotId);
    const container = group.getStage()?.container();
    if (container) {
      container.style.cursor = "grabbing";
      container.parentElement?.focus({ preventScroll: true });
    }
  });
  group.on("mouseup touchend", () => {
    const container = group.getStage()?.container();
    if (container) container.style.cursor = "grab";
  });
  group.on("mouseleave", () => {
    const container = group.getStage()?.container();
    if (container) container.style.cursor = "";
    if (
      group.getLayer()?.getAttr("selectedElement") !== element ||
      group.getLayer()?.getAttr("selectedShotId") !== shotId
    )
      group.findOne(".selection-outline")?.hide();
  });
}

/** Keep punctuation with its word while allowing natural breaks in unspaced scripts. */
export function captionWords(text: string): string[] {
  const words: string[] = [];
  for (const part of new Intl.Segmenter(undefined, {
    granularity: "word",
  }).segment(text)) {
    if (part.isWordLike) words.push(part.segment);
    else if (part.segment.trim() && words.length)
      words[words.length - 1] += part.segment;
  }
  return words;
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
    fontFamily?: string;
    color: string;
    align: "left" | "center";
    opacity?: number;
    lineHeight?: number;
    accent?: string;
    fitWords?: boolean;
    element: TextElement;
    shotId: string;
    offset: { x: number; y: number };
    interaction: SceneOptions;
  },
): void {
  if (!text.trim()) return;
  const lines = text.split("\n");
  let last = lines.length - 1;
  while (last > 0 && !lines[last].trim()) last--;
  const nodes = lines.map(
    (line, index) =>
      new Konva.Text({
        x: 0,
        width: options.width,
        text: line || " ",
        fontFamily: options.fontFamily ?? "Manrope",
        fontStyle: options.weight,
        fontSize: options.fontSize,
        lineHeight: options.lineHeight ?? 1.15,
        fill: index === last && options.accent ? options.accent : options.color,
        align: options.align,
        opacity: options.opacity ?? 1,
        wrap: "word",
        listening: Boolean(options.interaction.onTextMove),
      }),
  );
  // Measure the complete text with its final font; never silently truncate a caption.
  const height = () => nodes.reduce((sum, node) => sum + node.height(), 0);
  // New templates fit long words before wrapping; historical exports keep their typography.
  const words = options.fitWords ? captionWords(text) : [];
  const fits = () =>
    height() <= options.height &&
    words.every((word) => nodes[0].measureSize(word).width <= options.width);
  while (!fits() && nodes[0].fontSize() > 8)
    nodes.forEach((node) => node.fontSize(node.fontSize() - 1));
  if (!fits()) {
    nodes.forEach((node) => node.destroy());
    throw new Error(
      "This caption is too long to fit. Shorten it before exporting.",
    );
  }
  const group = new Konva.Group({
    x: options.x + options.offset.x,
    y: options.y + options.offset.y,
    name: `caption-${options.element}`,
    shotId: options.shotId,
  });
  let y = 0;
  for (const node of nodes) {
    node.y(y);
    y += node.height();
    group.add(node);
  }
  if (options.interaction.onTextMove) {
    group.add(
      new Konva.Rect({
        x: -8,
        y: -8,
        width: options.width + 16,
        height: height() + 16,
        stroke: "#547449",
        strokeWidth: 2,
        strokeScaleEnabled: false,
        dash: [7, 5],
        listening: false,
        visible: false,
        name: "selection-outline",
        element: options.element,
        shotId: options.shotId,
      }),
    );
    makeMovable(group, options.element, options.interaction, options.shotId);
    group.on("dragend", () =>
      options.interaction.onTextMove?.(
        options.element,
        group.x() - options.x,
        group.y() - options.y,
        options.shotId,
      ),
    );
  }
  layer.add(group);
}

/** Shared by Artboard and PNG export. Coordinates use a 1080-wide document at the selected export aspect ratio. */
export function createScene(
  project: Project,
  shot: Shot,
  image: HTMLImageElement,
  options: SceneOptions = {},
): Konva.Layer {
  const style = resolveStyle(project, shot);
  const fitWords = !legacyTemplateIds.some((id) => id === style.template);
  const template = templateLayout(project, style);
  const canvas = canonicalCanvas(project);
  const panoramic = isPanoramaTemplate(style.template);
  const cropOffset = isPanoramaEnd(style.template) ? canvas.width : 0;
  const spreadWidth = panoramic ? canvas.width * 2 : canvas.width;
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
  const layer = new Konva.Layer({
    listening: Boolean(options.onMove || options.onTextMove),
  });
  try {
    // The base remains opaque even if a restored project contains a translucent color.
    layer.add(new Konva.Rect({ ...canvas, fill: "#F4F1E9", listening: false }));
    layer.add(
      new Konva.Rect({
        ...canvas,
        x: -cropOffset,
        width: spreadWidth,
        ...(style.backgroundMode === "gradient"
          ? {
              fillLinearGradientStartPoint: { x: 0, y: 0 },
              fillLinearGradientEndPoint: {
                x: panoramic ? spreadWidth : 880,
                y: canvas.height,
              },
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
          x: -cropOffset,
          opacity: 0.1,
          sceneFunc(context, shape) {
            context.beginPath();
            for (let x = 28; x < spreadWidth; x += 44) {
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

    if (panoramaStart(style.template) === "panorama") {
      layer.add(
        new Konva.Line({
          x: -cropOffset,
          points: [
            -120,
            canvas.height * 0.72,
            2280,
            canvas.height * 0.2,
            2280,
            canvas.height * 0.45,
            -120,
            canvas.height * 0.97,
          ],
          closed: true,
          fill: style.backgroundEnd,
          listening: false,
        }),
      );
      layer.add(
        new Konva.Line({
          x: -cropOffset,
          points: [
            -120,
            canvas.height * 0.72 - 24,
            2280,
            canvas.height * 0.2 - 24,
          ],
          stroke: style.accentColor,
          strokeWidth: 2,
          opacity: 0.4,
          listening: false,
        }),
      );
    }
    drawTemplateDecoration(layer, style, canvas, template.panel);

    const phone = new Konva.Group({
      x: shot.phone.x + device.width / 2 - cropOffset,
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
    drawDeviceDetails(phone, device, style.camera);
    if (options.onMove) {
      makeMovable(phone, "device", options);
      phone.on("dragend", () =>
        options.onMove?.(
          Math.round(phone.x() - device.width / 2 + cropOffset),
          Math.round(phone.y() - device.height / 2),
        ),
      );
    }
    layer.add(phone);
    // Both crops draw the same captions, so freely moved text can cross the join.
    for (const owner of (panoramic ? panoramaPair(project, shot.id) : null) ?? [
      shot,
    ]) {
      const ownerStyle = resolveStyle(project, owner);
      const ownerOrigin = isPanoramaEnd(ownerStyle.template) ? canvas.width : 0;
      const captionLayout = templateLayout(project, ownerStyle);
      // Captions remain above a deliberately enlarged/rotated device.
      addText(layer, owner.title, {
        ...captionLayout.title,
        x: captionLayout.title.x + ownerOrigin - cropOffset,
        shotId: owner.id,
        element: "title",
        offset: textOffset(owner, "title"),
        interaction: options,
        fitWords,
        fontSize: style.titleSize * template.fontScale,
        weight:
          template.titleWeight ??
          (style.template === "classic" ? "700" : "800"),
        fontFamily: template.titleFont,
        lineHeight: template.lineHeight,
        color: style.textColor,
        accent: style.accentTitle ? style.accentColor : undefined,
        align: style.align,
      });
      addText(layer, owner.subtitle, {
        ...captionLayout.subtitle,
        x: captionLayout.subtitle.x + ownerOrigin - cropOffset,
        shotId: owner.id,
        element: "subtitle",
        offset: textOffset(owner, "subtitle"),
        interaction: options,
        fitWords,
        fontSize: template.subtitleSize,
        weight: "400",
        color: style.textColor,
        align: style.align,
        opacity: style.template === "classic" ? 0.78 : 0.88,
      });
    }
    if (style.template === "classic") {
      phone.moveToTop();
      // Keep historical layering until the author explicitly repositions text.
      for (const element of ["title", "subtitle"] as const)
        if (shot.textOffsets?.[element])
          layer.findOne(`.caption-${element}`)?.moveToTop();
    }
    return layer;
  } catch (error) {
    layer.destroy();
    throw error;
  }
}
