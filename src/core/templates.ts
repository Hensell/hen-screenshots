import { halloweenTemplates } from "./halloween-templates";
import { refitText, resetText } from "./text-placement";
import { panoramaStart } from "./panorama-families";
import {
  resolveStyle,
  legacyTemplateIds,
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
import { showcaseTemplates, showcaseAreas } from "./showcase-templates";
import {
  patternTemplates,
  patternAreas,
  type PatternComposition,
} from "./pattern-templates";

import {
  applyPanorama,
  isPanoramaTemplate,
  linkedShots,
  panoramaLayout,
  panoramaStyle,
  panoramaStyles,
} from "./panorama";

interface TextBox {
  x: number;
  y: number;
  width: number;
  height: number;
}
export const templateCategories = [
  "All",
  "Minimal",
  "Bold",
  "Editorial",
] as const;
export type TemplateCategory = (typeof templateCategories)[number];
export interface Template {
  id: TemplateId;
  name: string;
  description: string;
  note: string;
  category: Exclude<TemplateCategory, "All">;
  keywords?: readonly string[];
  surfaceLabel?: string;
  titleFont?: "Fraunces";
  titleWeight?: string;
  appearance?: "light" | "dark" | "colorful";
  /** Reserve space for decorative artwork around the fitted product. */
  deviceInset?: number;
  composition?:
    | PatternComposition
    | "angled"
    | "masthead"
    | "desk"
    | "caption"
    | "technical"
    | "pedestal"
    | "collage";
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
  ...halloweenTemplates,
  ...patternTemplates,
  ...showcaseTemplates,
  {
    id: "daybreak",
    name: "Daybreak",
    keywords: ["sunrise", "warm", "colorful", "waves", "yellow", "pink"],
    category: "Bold",
    surfaceLabel: "Color waves · 2 slides",
    description: "Warm light. Rolling color. One connected story.",
    note: "A tilted device bridges two slides over continuous, editable color waves.",
    style: panoramaStyles.daybreak,
    phone: { x: 700, y: 150, width: 760, rotation: 16 },
    title: { x: 80, y: 125, width: 520, height: 480 },
    subtitle: { x: 84, y: 634, width: 490, height: 125 },
    lineHeight: 1.04,
  },
  {
    id: "tidal",
    name: "Tidal",
    keywords: ["ocean", "blue", "waves", "serif", "dark"],
    category: "Editorial",
    surfaceLabel: "Flowing lines · 2 slides",
    description: "Deep blue, sculpted waves and expressive serif type.",
    note: "An editorial panorama with one shared device and flowing lines that meet at the seam.",
    style: panoramaStyles.tidal,
    titleFont: "Fraunces",
    titleWeight: "600",
    phone: { x: 700, y: 150, width: 760, rotation: -10 },
    title: { x: 80, y: 125, width: 520, height: 480 },
    subtitle: { x: 84, y: 634, width: 490, height: 125 },
    lineHeight: 1.06,
  },
  {
    id: "bloom",
    name: "Bloom",
    keywords: ["botanical", "nature", "green", "leaves", "serif", "light"],
    category: "Editorial",
    surfaceLabel: "Botanical",
    description: "Leaf silhouettes, soft paper and a little room to grow.",
    note: "An open arch frames your screenshot; a serif headline brings a quieter, editorial rhythm.",
    style: {
      template: "bloom",
      background: "#F2F0E3",
      backgroundEnd: "#D8E2C7",
      textColor: "#294638",
      accentColor: "#708763",
      backgroundMode: "solid",
      texture: "none",
      accentTitle: false,
      align: "center",
      titleSize: 112,
    },
    titleFont: "Fraunces",
    titleWeight: "600",
    phone: { x: 250, y: 653, width: 580, rotation: 0 },
    title: { x: 80, y: 115, width: 920, height: 300 },
    subtitle: { x: 100, y: 460, width: 880, height: 100 },
    lineHeight: 1.04,
  },
  {
    id: "punch",
    name: "Punch",
    keywords: ["coral", "red", "poster", "arch", "colorful"],
    category: "Bold",
    surfaceLabel: "Coral poster",
    description: "Big words. A bold arch. Your app takes the stage.",
    note: "A coral poster with oversized typography and a tilted device on a contrasting stage.",
    style: {
      template: "punch",
      background: "#C34836",
      backgroundEnd: "#F6AE88",
      textColor: "#FFF6E8",
      accentColor: "#843628",
      backgroundMode: "solid",
      texture: "none",
      accentTitle: false,
      align: "left",
      titleSize: 132,
    },
    phone: { x: 250, y: 653, width: 580, rotation: -6 },
    title: { x: 80, y: 115, width: 920, height: 300 },
    subtitle: { x: 84, y: 460, width: 900, height: 100 },
    lineHeight: 1.01,
  },
  {
    id: "classic",
    name: "Classic",
    keywords: ["clean", "simple", "sage", "green", "light"],
    category: "Minimal",
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
    keywords: ["dark", "green", "dots", "close up"],
    category: "Bold",
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
    keywords: ["angled", "diagonal", "warm", "cream"],
    category: "Bold",
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
    keywords: ["warm", "paper", "panel", "peach"],
    surfaceLabel: "Panel",
    category: "Editorial",
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
  {
    id: "studio",
    name: "Studio",
    keywords: ["clean", "simple", "cream", "border", "light"],
    surfaceLabel: "Stage",
    category: "Minimal",
    description: "Quiet space. A product worth looking at.",
    note: "A fine border and generous margins let your interface speak.",
    style: {
      template: "studio",
      background: "#F5F3EC",
      backgroundEnd: "#E6E9DF",
      backgroundMode: "solid",
      textColor: "#27382E",
      accentColor: "#687D64",
      texture: "none",
      accentTitle: false,
      align: "left",
      titleSize: 78,
    },
    phone: { x: 250, y: 500, width: 580, rotation: 0 },
    title: { x: 92, y: 126, width: 896, height: 226 },
    subtitle: { x: 92, y: 375, width: 896, height: 80 },
    lineHeight: 1.12,
  },
  {
    id: "split",
    name: "Split",
    keywords: ["color block", "yellow", "terracotta", "warm"],
    surfaceLabel: "Color block",
    category: "Bold",
    description: "Two tones. One confident statement.",
    note: "A crisp color block puts a bold headline beside your product.",
    style: {
      template: "split",
      background: "#F3D879",
      backgroundEnd: "#B94E37",
      backgroundMode: "solid",
      textColor: "#342A22",
      accentColor: "#79422B",
      texture: "none",
      accentTitle: false,
      align: "left",
      titleSize: 118,
    },
    phone: { x: 245, y: 660, width: 590, rotation: 0 },
    title: { x: 80, y: 100, width: 920, height: 340 },
    subtitle: { x: 84, y: 466, width: 900, height: 88 },
    lineHeight: 1.02,
  },
  {
    id: "halo",
    name: "Halo",
    keywords: ["circle", "dark", "orange", "stage"],
    surfaceLabel: "Halo",
    category: "Bold",
    description: "A circular stage. A moment in the spotlight.",
    note: "A warm halo frames your device against a deep ink background.",
    style: {
      template: "halo",
      background: "#202E35",
      backgroundEnd: "#B9684F",
      backgroundMode: "solid",
      textColor: "#F5EADD",
      accentColor: "#F4C99B",
      texture: "none",
      accentTitle: true,
      align: "center",
      titleSize: 104,
    },
    phone: { x: 240, y: 620, width: 600, rotation: 0 },
    title: { x: 84, y: 120, width: 912, height: 290 },
    subtitle: { x: 90, y: 460, width: 900, height: 90 },
    lineHeight: 1.06,
  },
  {
    id: "gallery",
    name: "Gallery",
    keywords: ["minimal", "caption", "paper", "light"],
    surfaceLabel: "Mat",
    category: "Editorial",
    description: "The work comes first. The story follows.",
    note: "An image-led composition with a caption beneath, made for a closer look.",
    style: {
      template: "gallery",
      background: "#E9E4DA",
      backgroundEnd: "#D5D9D0",
      backgroundMode: "solid",
      textColor: "#333C35",
      accentColor: "#8E4D35",
      texture: "none",
      accentTitle: false,
      align: "left",
      titleSize: 82,
    },
    phone: { x: 250, y: 120, width: 580, rotation: 0 },
    title: { x: 84, y: 1500, width: 912, height: 220 },
    subtitle: { x: 88, y: 1750, width: 904, height: 90 },
    lineHeight: 1.1,
  },
  {
    id: "panorama",
    name: "Panorama",
    keywords: ["ribbon", "warm", "cream", "diagonal"],
    category: "Editorial",
    surfaceLabel: "Ribbon",
    description: "One scene. A story across two slides.",
    note: "A continuous backdrop and one shared device, split into two consecutive slides.",
    style: panoramaStyle,
    phone: { x: 700, y: 150, width: 760, rotation: -8 },
    title: { x: 70, y: 160, width: 450, height: 450 },
    subtitle: { x: 74, y: 670, width: 446, height: 160 },
    lineHeight: 1.07,
  },
];

export function getTemplate(id: TemplateId): Template {
  const template = templates.find(
    (item) => item.id === (panoramaStart(id) ?? id),
  );
  if (!template) throw new Error("This template is not supported.");
  return template;
}

/** Existing portrait phone compositions retain their original coordinates. */
export function templateLayout(project: Project, style: Style) {
  const template = getTemplate(style.template);
  const canvas = canonicalCanvas(project);
  if (isPanoramaTemplate(style.template))
    return { ...template, ...panoramaLayout(project, style) };
  if (!legacyTemplateIds.some((id) => id === style.template))
    return collectionLayout(project, style, template);
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

/** New catalog entries use their own geometry, leaving the original four untouched. */
function collectionLayout(project: Project, style: Style, template: Template) {
  const { height: h } = canonicalCanvas(project);
  const wide = h <= 1080;
  let title: Rect, subtitle: Rect, area: Rect;
  const patterned = patternAreas(template.composition, h);
  if (patterned) {
    ({ title, subtitle, area } = patterned);
  } else if (template.composition) {
    ({ title, subtitle, area } = showcaseAreas(template.composition, h));
  } else if (
    (style.template === "bloom" || style.template === "punch") &&
    !wide
  ) {
    title = { x: 80, y: h * 0.06, width: 920, height: h * 0.155 };
    subtitle = { x: 84, y: h * 0.24, width: 912, height: h * 0.06 };
    area = { x: 70, y: h * 0.34, width: 940, height: h * 0.62 };
  } else if (style.template === "gallery") {
    area = { x: 76, y: h * 0.065, width: 928, height: h * 0.63 };
    title = {
      x: 80,
      y: h * 0.765,
      width: wide ? 526 : 920,
      height: h * (wide ? 0.18 : 0.12),
    };
    subtitle = {
      x: wide ? 650 : 84,
      y: h * (wide ? 0.78 : 0.905),
      width: wide ? 350 : 912,
      height: h * (wide ? 0.15 : 0.06),
    };
  } else if (wide) {
    const reverse = style.template === "halo";
    title = { x: reverse ? 690 : 72, y: h * 0.18, width: 320, height: h * 0.4 };
    subtitle = { x: title.x, y: h * 0.67, width: 320, height: h * 0.19 };
    area = { x: reverse ? 64 : 444, y: h * 0.1, width: 570, height: h * 0.8 };
  } else {
    title = { x: 84, y: h * 0.07, width: 912, height: h * 0.16 };
    subtitle = { x: 88, y: h * 0.25, width: 904, height: h * 0.065 };
    area = { x: 100, y: h * 0.355, width: 880, height: h * 0.575 };
  }
  const panel = { ...area };
  if (template.deviceInset) {
    const inset = template.deviceInset;
    area = {
      x: area.x + area.width * inset,
      y: area.y + area.height * inset,
      width: area.width * (1 - inset * 2),
      height: area.height * (1 - inset * 2),
    };
  }
  const unit = deviceGeometry(
    style.device,
    1000,
    style.frame,
    style.deviceOrientation,
  );
  const rotation = template.composition
    ? template.phone.rotation
    : style.template === "punch"
      ? -6
      : 0;
  const radians = (Math.abs(rotation) * Math.PI) / 180;
  const boundW =
    Math.cos(radians) * unit.width + Math.sin(radians) * unit.height;
  const boundH =
    Math.sin(radians) * unit.width + Math.cos(radians) * unit.height;
  const width = Math.floor(
    rotation === 0
      ? Math.min(area.width, (area.height / unit.height) * 1000)
      : 1000 * Math.min(area.width / boundW, area.height / boundH),
  );
  const height = deviceGeometry(
    style.device,
    width,
    style.frame,
    style.deviceOrientation,
  ).height;
  return {
    ...template,
    title,
    subtitle,
    phone: {
      x: Math.round(area.x + (area.width - width) / 2),
      y: Math.round(area.y + (area.height - height) / 2),
      width,
      rotation,
    },
    fontScale: wide ? 0.62 : 0.96,
    subtitleSize: wide ? 23 : 32,
    panel,
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
  for (const shot of project.shots) {
    resetComposition(project, shot);
    refitText(shot);
  }
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
  for (const shot of project.shots) {
    resetComposition(project, shot);
    refitText(shot);
  }
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
  const family = panoramaStart(id);
  if (family) {
    if (all) throw new Error("Apply Panorama to one screenshot at a time.");
    applyPanorama(project, shotId, keepColors, family);
    return;
  }
  const targets = new Set(linkedShots(project, shotId).map((shot) => shot.id));
  const patch = templateStyle(id, keepColors);
  if (all) Object.assign(project.style, patch);
  for (const shot of project.shots) {
    if (!all && !targets.has(shot.id)) continue;
    if (all) {
      for (const key of Object.keys(patch) as (keyof Style)[])
        delete shot.style[key];
    } else Object.assign(shot.style, patch);
    resetComposition(project, shot);
    refitText(shot, true);
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
  resetText(preview);
  return preview;
}
