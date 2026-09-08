import type { Template } from "./templates";
import { panoramaStyles } from "./panorama";

/** Only new IDs use these defaults; saved compositions keep their existing geometry. */
export function defineTemplate(
  meta: Pick<
    Template,
    | "id"
    | "name"
    | "description"
    | "note"
    | "category"
    | "keywords"
    | "surfaceLabel"
    | "appearance"
    | "composition"
  > &
    Partial<Pick<Template, "titleFont" | "titleWeight">>,
  colors: [string, string, string, string],
  options: {
    rotation?: number;
    size?: number;
    align?: "left" | "center";
    gradient?: boolean;
  } = {},
): Template {
  return {
    ...meta,
    style: {
      template: meta.id,
      background: colors[0],
      backgroundEnd: colors[1],
      textColor: colors[2],
      accentColor: colors[3],
      backgroundMode: options.gradient ? "gradient" : "solid",
      texture: "none",
      accentTitle: false,
      align: options.align ?? "left",
      titleSize: options.size ?? 108,
    },
    phone: { x: 250, y: 640, width: 580, rotation: options.rotation ?? 0 },
    title: { x: 80, y: 120, width: 920, height: 300 },
    subtitle: { x: 84, y: 480, width: 912, height: 110 },
    lineHeight: meta.titleFont ? 1.06 : 1.04,
  };
}

export const showcaseTemplates: readonly Template[] = [
  defineTemplate(
    {
      id: "prism",
      name: "Prism",
      category: "Bold",
      appearance: "colorful",
      composition: "angled",
      surfaceLabel: "Folded color",
      keywords: ["pastel", "mint", "blue", "angled", "fold", "colorful"],
      description: "Folded color. A fresh perspective.",
      note: "Translucent planes and an angled device bring depth to your app, with every color editable.",
    },
    ["#E5F0F1", "#B4C9E0", "#233C4B", "#708CA0"],
    { rotation: 9, size: 116, gradient: true },
  ),
  defineTemplate(
    {
      id: "nocturne",
      name: "Nocturne",
      category: "Editorial",
      appearance: "dark",
      composition: "caption",
      surfaceLabel: "Inset panel",
      keywords: ["dark", "plum", "serif", "quiet", "luxury", "portfolio"],
      titleFont: "Fraunces",
      titleWeight: "600",
      description: "Rich plum. A quiet, confident finish.",
      note: "An inset product panel and a serif caption turn your screenshot into an editorial feature.",
    },
    ["#241E2A", "#39303F", "#F5EBDF", "#C7A998"],
    { size: 108 },
  ),
  {
    ...defineTemplate(
      {
        id: "orbit",
        name: "Orbit",
        category: "Bold",
        appearance: "dark",
        surfaceLabel: "Orbital arcs · 2 slides",
        keywords: ["dark", "midnight", "navy", "rings", "space"],
        description: "One device. A whole new orbit.",
        note: "A midnight panorama with elliptical arcs flowing across two slides and a shared tilted device.",
      },
      ["#171D32", "#303D60", "#F1F0E9", "#B9C9F2"],
    ),
    style: panoramaStyles.orbit,
  },
  defineTemplate(
    {
      id: "paper",
      name: "Paper",
      category: "Editorial",
      appearance: "light",
      composition: "masthead",
      surfaceLabel: "Paper margin",
      keywords: ["light", "cream", "serif", "print", "journal", "portfolio"],
      titleFont: "Fraunces",
      titleWeight: "600",
      description: "A considered story, set on warm paper.",
      note: "A serif masthead, a fine rule and a separate caption give your work the feel of a printed feature.",
    },
    ["#F5EEE2", "#E5D9C5", "#3D362D", "#96714F"],
    { size: 116 },
  ),
  defineTemplate(
    {
      id: "carbon",
      name: "Carbon",
      category: "Minimal",
      appearance: "dark",
      composition: "technical",
      surfaceLabel: "Precision lines",
      keywords: ["dark", "graphite", "technical", "minimal", "desktop"],
      description: "Sharp detail. Nothing competing with your app.",
      note: "Graphite surfaces, precise corner marks and a restrained accent suit detailed interfaces and desktop tools.",
    },
    ["#202522", "#323B35", "#F0F2E8", "#B8CA9F"],
    { size: 106 },
  ),
  defineTemplate(
    {
      id: "workbench",
      name: "Workbench",
      category: "Minimal",
      appearance: "light",
      composition: "desk",
      surfaceLabel: "Drafting grid",
      keywords: [
        "light",
        "blue",
        "grid",
        "desktop",
        "laptop",
        "monitor",
        "portfolio",
        "case study",
      ],
      description: "Give the work room to speak.",
      note: "An expansive product area on a subtle drafting grid, with a headline above and a caption below. Made for portfolio cards.",
    },
    ["#EAF0EE", "#CFDCD8", "#2F4844", "#71938A"],
    { size: 100 },
  ),
  defineTemplate(
    {
      id: "ember",
      name: "Ember",
      category: "Bold",
      appearance: "dark",
      composition: "pedestal",
      surfaceLabel: "Copper stage",
      keywords: ["dark", "warm", "copper", "espresso", "stage"],
      description: "A warm stage after dark.",
      note: "Copper planes and an elliptical stage frame the device against espresso, with clean, centered typography.",
    },
    ["#251D1A", "#674435", "#F9EAD9", "#D4A478"],
    { align: "center", size: 114 },
  ),
  defineTemplate(
    {
      id: "confetti",
      name: "Confetti",
      category: "Bold",
      appearance: "colorful",
      composition: "collage",
      surfaceLabel: "Cut paper",
      keywords: [
        "colorful",
        "peach",
        "green",
        "playful",
        "collage",
        "cut paper",
      ],
      description: "A little playful. Entirely yours.",
      note: "Layered paper shapes and a gentle tilt bring energy to a launch, without getting in the way of your words.",
    },
    ["#F6EADB", "#E8AA8E", "#34463D", "#628373"],
    { rotation: -7, size: 120 },
  ),
];

/** Caption and product regions never overlap; the shared fitter handles every device family. */
export function showcaseAreas(
  composition: NonNullable<Template["composition"]>,
  h: number,
) {
  const rect = (x: number, y: number, width: number, height: number) => ({
    x,
    y: h * y,
    width,
    height: h * height,
  });
  const wide = h <= 1080;
  if (composition === "desk")
    return {
      title: rect(76, 0.055, 928, 0.15),
      subtitle: rect(80, 0.885, 920, 0.07),
      area: rect(80, 0.27, 920, 0.54),
    };
  if (composition === "caption")
    return wide
      ? {
          title: rect(638, 0.2, 362, 0.36),
          subtitle: rect(642, 0.7, 358, 0.18),
          area: rect(68, 0.09, 494, 0.82),
        }
      : {
          title: rect(84, 0.77, 912, 0.13),
          subtitle: rect(88, 0.925, 904, 0.05),
          area: rect(100, 0.06, 880, 0.64),
        };
  if (composition === "masthead" && !wide)
    return {
      title: rect(80, 0.055, 920, 0.175),
      subtitle: rect(84, 0.905, 912, 0.055),
      area: rect(100, 0.3, 880, 0.535),
    };
  if (wide)
    return {
      title: rect(72, 0.13, 340, 0.39),
      subtitle: rect(76, 0.7, 332, 0.18),
      area: rect(470, 0.1, 538, 0.8),
    };
  return {
    title: rect(84, 0.065, 912, 0.185),
    subtitle: rect(88, 0.275, 904, 0.06),
    area: rect(90, 0.37, 900, 0.575),
  };
}
