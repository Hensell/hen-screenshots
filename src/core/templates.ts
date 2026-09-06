import type { Project, Shot, Style, TemplateId } from "./model";

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
    note: "An oversized phone extends beyond the canvas for a closer look.",
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
    note: "A tilted phone and an oversized headline, with a deliberate crop below.",
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
    note: "A full phone above the headline, like a considered magazine cover.",
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
  const preset = getTemplate(id);
  const patch = templateStyle(id, keepColors);
  if (all) Object.assign(project.style, patch);
  for (const shot of project.shots) {
    if (!all && shot.id !== shotId) continue;
    if (all) {
      for (const key of Object.keys(patch) as (keyof Style)[])
        delete shot.style[key];
    } else Object.assign(shot.style, patch);
    shot.phone = { ...preset.phone };
  }
}

export function templatePreview(
  project: Project,
  shot: Shot,
  id: TemplateId,
  keepColors: boolean,
): Shot {
  return {
    ...shot,
    style: {
      ...project.style,
      ...shot.style,
      ...templateStyle(id, keepColors),
    },
    phone: { ...getTemplate(id).phone },
  };
}
