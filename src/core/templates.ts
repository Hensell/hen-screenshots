import {
  resolveStyle,
  type Project,
  type Shot,
  type Style,
  type TemplateId,
} from "./model";
import {
  canonicalCanvas,
  validateCustomSize,
  type ExportProfileId,
} from "./export-profiles";
import { deviceGeometry, type Rect } from "../rendering/geometry";

interface TextBox {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface Template {
  id: TemplateId;
  name: string;
  description: string;
  note: string;
  style: Pick<
    Style,
    | "template"
    | "background"
    | "backgroundEnd"
    | "backgroundMode"
    | "textColor"
    | "accentColor"
    | "texture"
    | "accentTitle"
    | "align"
    | "titleSize"
  >;
  phone: Shot["phone"];
  title: TextBox;
  subtitle: TextBox;
  lineHeight: number;
}

/** IDs and geometry are part of document v2. Add new IDs for incompatible designs. */
export const templates: readonly Template[] = [
  {
    id: "classic",
    name: "Classic",
    description: "A little framing. Plenty of breathing room.",
    note: "The original Hen look, with your full screenshot in view.",
    style: {
      template: "classic",
      background: "#E3E8DE",
      backgroundEnd: "#E3E8DE",
      backgroundMode: "solid",
      textColor: "#202725",
      accentColor: "#47755B",
      texture: "none",
      accentTitle: false,
      align: "center",
      titleSize: 84,
    },
    phone: { x: 230, y: 485, width: 620, rotation: 0 },
    title: { x: 92, y: 126, width: 896, height: 226 },
    subtitle: { x: 92, y: 375, width: 896, height: 80 },
    lineHeight: 1.15,
  },
  {
    id: "spotlight",
    name: "Spotlight",
    description: "Big words. A closer look at your app.",
    note: "A generous product view with a bold headline.",
    style: {
      template: "spotlight",
      background: "#142E29",
      backgroundEnd: "#366753",
      backgroundMode: "gradient",
      textColor: "#FAF6EB",
      accentColor: "#C5E9AD",
      texture: "dots",
      accentTitle: true,
      align: "center",
      titleSize: 106,
    },
    phone: { x: 120, y: 622, width: 840, rotation: 0 },
    title: { x: 82, y: 142, width: 916, height: 276 },
    subtitle: { x: 110, y: 456, width: 860, height: 94 },
    lineHeight: 1.06,
  },
  {
    id: "tilt",
    name: "Tilt",
    description: "An unexpected angle. A confident entrance.",
    note: "A considered angle and an oversized headline.",
    style: {
      template: "tilt",
      background: "#F4EADA",
      backgroundEnd: "#CDBFA4",
      backgroundMode: "gradient",
      textColor: "#29372F",
      accentColor: "#9B4D30",
      texture: "none",
      accentTitle: true,
      align: "left",
      titleSize: 116,
    },
    phone: { x: 190, y: 680, width: 740, rotation: -9 },
    title: { x: 86, y: 130, width: 908, height: 310 },
    subtitle: { x: 90, y: 482, width: 820, height: 94 },
    lineHeight: 1.04,
  },
  {
    id: "editorial",
    name: "Editorial",
    description: "Let your product lead. Then make your point.",
    note: "A framed product view and an editorial headline.",
    style: {
      template: "editorial",
      background: "#F1E2D6",
      backgroundEnd: "#DFBDA7",
      backgroundMode: "solid",
      textColor: "#3C2926",
      accentColor: "#975239",
      texture: "none",
      accentTitle: true,
      align: "left",
      titleSize: 102,
    },
    phone: { x: 253, y: 114, width: 574, rotation: 0 },
    title: { x: 84, y: 1446, width: 912, height: 246 },
    subtitle: { x: 88, y: 1740, width: 904, height: 100 },
    lineHeight: 1.05,
  },
];

export function getTemplate(id: TemplateId): Template {
  const template = templates.find((item) => item.id === id);
  if (!template) throw new Error("This template is not supported.");
  return template;
}

/** Existing portrait phone compositions retain their original coordinates. */
export function templateLayout(project: Project, style: Style) {
  const template = getTemplate(style.template);
  const canvas = canonicalCanvas(project);
  const legacy =
    canvas.height === 1920 &&
    (style.device === "android" || style.device === "ios") &&
    style.deviceOrientation === "portrait";
  if (legacy)
    return {
      ...template,
      fontScale: 1,
      subtitleSize: 34,
      panel: { x: 48, y: 52, width: 984, height: 1332 },
    };
  const h = canvas.height;
  const wide = h <= 1080;
  const editorial = style.template === "editorial";
  const spotlight = style.template === "spotlight";
  let title: Rect, subtitle: Rect, area: Rect;
  if (
    wide &&
    (!spotlight ||
      ((style.device === "ios" || style.device === "android") &&
        style.deviceOrientation === "portrait"))
  ) {
    const textX = editorial ? 700 : 60;
    title = { x: textX, y: h * 0.21, width: 320, height: h * 0.4 };
    subtitle = { x: textX, y: h * 0.67, width: 320, height: h * 0.19 };
    area = { x: editorial ? 48 : 430, y: h * 0.1, width: 602, height: h * 0.8 };
  } else if (wide) {
    title = { x: 90, y: h * 0.065, width: 900, height: h * 0.2 };
    subtitle = { x: 150, y: h * 0.28, width: 780, height: h * 0.08 };
    area = { x: 100, y: h * 0.4, width: 880, height: h * 0.55 };
  } else {
    title = {
      x: 84,
      y: editorial ? h * 0.76 : h * 0.055,
      width: 912,
      height: h * 0.16,
    };
    subtitle = {
      x: 88,
      y: editorial ? h * 0.93 : h * 0.235,
      width: 904,
      height: h * 0.06,
    };
    area = {
      x: 80,
      y: editorial ? h * 0.05 : h * 0.335,
      width: 920,
      height: h * (editorial ? 0.65 : 0.61),
    };
  }
  const rotation = style.template === "tilt" ? -6 : 0;
  const unit = deviceGeometry(
    style.device,
    1000,
    style.frame,
    style.deviceOrientation,
  );
  const radians = (Math.abs(rotation) * Math.PI) / 180;
  const boundW =
    Math.cos(radians) * unit.width + Math.sin(radians) * unit.height;
  const boundH =
    Math.sin(radians) * unit.width + Math.cos(radians) * unit.height;
  const scale = Math.min(area.width / boundW, area.height / boundH);
  const width = Math.round(unit.width * scale);
  const height = deviceGeometry(
    style.device,
    width,
    style.frame,
    style.deviceOrientation,
  ).height;
  const phone = {
    width,
    x: Math.round(area.x + (area.width - width) / 2),
    y: Math.round(area.y + (area.height - height) / 2),
    rotation,
  };
  return {
    ...template,
    title,
    subtitle,
    phone,
    fontScale: wide ? 0.6 : 0.92,
    subtitleSize: wide ? 23 : 30,
    panel: {
      x: area.x - 16,
      y: area.y - 20,
      width: area.width + 32,
      height: area.height + 40,
    },
  };
}

export function resetComposition(project: Project, shot: Shot): void {
  shot.phone = {
    ...templateLayout(project, resolveStyle(project, shot)).phone,
  };
}

/** The caller wraps this in one history edit, so format and reflow undo together. */
export function changeExportProfile(
  project: Project,
  id: ExportProfileId,
): void {
  if (project.exportProfile === id) return;
  project.exportProfile = id;
  for (const shot of project.shots) resetComposition(project, shot);
}

/** Commit a complete size, never partially typed input, and reflow once. */
export function changeCustomSize(
  project: Project,
  size: { width: number; height: number },
): void {
  validateCustomSize(size);
  if (project.exportProfile !== "portfolio-custom") return;
  if (
    project.customSize.width === size.width &&
    project.customSize.height === size.height
  )
    return;
  project.customSize = { ...size };
  for (const shot of project.shots) resetComposition(project, shot);
}

const colorKeys = [
  "background",
  "backgroundEnd",
  "textColor",
  "accentColor",
] as const;
export function templateStyle(
  id: TemplateId,
  keepColors = false,
): Partial<Style> {
  const patch: Partial<Style> = { ...getTemplate(id).style };
  if (keepColors) for (const key of colorKeys) delete patch[key];
  return patch;
}

/** One store edit wraps a complete application, including every phone position. */
export function applyTemplate(
  project: Project,
  shotId: string,
  id: TemplateId,
  all = false,
  keepColors = false,
): void {
  if (!project.shots.some((shot) => shot.id === shotId)) return;
  const patch = templateStyle(id, keepColors);
  if (all) Object.assign(project.style, patch);
  for (const shot of project.shots) {
    if (!all && shot.id !== shotId) continue;
    if (all) {
      for (const key of Object.keys(patch) as (keyof Style)[])
        delete shot.style[key];
    } else Object.assign(shot.style, patch);
    resetComposition(project, shot);
  }
}

export function templatePreview(
  project: Project,
  shot: Shot,
  id: TemplateId,
  keepColors: boolean,
): Shot {
  const preview = {
    ...shot,
    style: {
      ...project.style,
      ...shot.style,
      ...templateStyle(id, keepColors),
    },
    phone: { ...shot.phone },
  };
  resetComposition(project, preview);
  return preview;
}
