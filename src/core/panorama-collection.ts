import type { Style, TemplateId } from "./model";
import type { Template } from "./templates";
import { panoramaStart } from "./panorama-families";

const base = {
  backgroundMode: "solid",
  texture: "none",
  accentTitle: false,
  align: "left",
  titleSize: 112,
} as const;

export const collectionPanoramaStyles = {
  atrium: {
    ...base,
    template: "atrium",
    background: "#F3EDE2",
    backgroundEnd: "#C5D0BE",
    textColor: "#303D36",
    accentColor: "#738774",
  },
  obsidian: {
    ...base,
    template: "obsidian",
    background: "#191B20",
    backgroundEnd: "#343A42",
    textColor: "#F4F0E7",
    accentColor: "#A7B5BF",
  },
  offset: {
    ...base,
    template: "offset",
    background: "#EEE9F7",
    backgroundEnd: "#A799C7",
    textColor: "#352E47",
    accentColor: "#D8EB86",
  },
  signal: {
    ...base,
    template: "signal",
    background: "#FAEBDD",
    backgroundEnd: "#EF744C",
    textColor: "#302620",
    accentColor: "#AD352B",
    titleSize: 126,
  },
  mosaic: {
    ...base,
    template: "mosaic",
    background: "#FCEEE9",
    backgroundEnd: "#EAA1A9",
    textColor: "#56273A",
    accentColor: "#BD4565",
  },
  folio: {
    ...base,
    template: "folio",
    background: "#F1F2E9",
    backgroundEnd: "#CFDADC",
    textColor: "#244448",
    accentColor: "#769A9D",
    titleSize: 108,
  },
} as const satisfies Record<string, Partial<Style>>;
export type CollectionPanoramaId = keyof typeof collectionPanoramaStyles;

export function collectionPanoramaId(
  template: TemplateId,
): CollectionPanoramaId | undefined {
  const family = panoramaStart(template);
  return family && family in collectionPanoramaStyles
    ? (family as CollectionPanoramaId)
    : undefined;
}

/** Pose is orthographic 3D: the live screenshot, bezel and camera share the projection. */
export const panoramaPoses = {
  atrium: { yaw: -32, pitch: 22, depth: 0.027 },
  obsidian: { yaw: 38, pitch: 24, depth: 0.032 },
  offset: { yaw: -28, pitch: 32, depth: 0.026 },
} as const;
export function panoramaPose(template: TemplateId) {
  const id = collectionPanoramaId(template);
  return id && id in panoramaPoses
    ? panoramaPoses[id as keyof typeof panoramaPoses]
    : undefined;
}

export const collectionPanoramaLayouts = {
  atrium: { composition: "sides", rotation: -12, centerX: 1080 },
  obsidian: { composition: "reverse", rotation: 18, centerX: 1080 },
  offset: { composition: "top", rotation: -28, centerX: 1080 },
  signal: { composition: "top", rotation: 26, centerX: 1180 },
  mosaic: { composition: "bottom", rotation: -16, centerX: 1080 },
  folio: { composition: "sides", rotation: 0, centerX: 1160 },
} as const;

type Metadata = Pick<
  Template,
  | "name"
  | "category"
  | "appearance"
  | "description"
  | "note"
  | "surfaceLabel"
  | "keywords"
  | "titleFont"
  | "titleWeight"
>;
const metadata: Record<CollectionPanoramaId, Metadata> = {
  atrium: {
    name: "Atrium",
    category: "Editorial",
    appearance: "light",
    titleFont: "Fraunces",
    titleWeight: "600",
    description: "Soft daylight. A sculpted stage for your app.",
    note: "An isometric device floats above a sage pedestal, with architectural shadows joining both slides.",
    surfaceLabel: "Architectural stage · 3D",
    keywords: [
      "3d",
      "isometric",
      "perspective",
      "architecture",
      "sage",
      "cream",
      "pedestal",
      "depth",
    ],
  },
  obsidian: {
    name: "Obsidian",
    category: "Editorial",
    appearance: "dark",
    description: "Graphite, silver edges and a little drama.",
    note: "A device in isometric perspective crosses a dark stone stage. Opposite captions leave the center open.",
    surfaceLabel: "Graphite stage · 3D",
    keywords: [
      "3d",
      "isometric",
      "perspective",
      "graphite",
      "dark",
      "stone",
      "silver",
      "depth",
    ],
  },
  offset: {
    name: "Offset",
    category: "Bold",
    appearance: "colorful",
    description: "Fresh angles. A playful sense of space.",
    note: "Lilac steps and a lime platform support an isometric device, with both headlines above the scene.",
    surfaceLabel: "Stacked steps · 3D",
    keywords: [
      "3d",
      "isometric",
      "perspective",
      "lilac",
      "lime",
      "stairs",
      "blocks",
      "colorful",
    ],
  },
  signal: {
    name: "Signal",
    category: "Bold",
    appearance: "colorful",
    description: "A warm, bold announcement across two slides.",
    note: "Oversized coral bands run behind a diagonally placed device. Two clear headlines anchor the top.",
    surfaceLabel: "Coral bands · 2 slides",
    keywords: [
      "coral",
      "orange",
      "diagonal",
      "bands",
      "graphic",
      "bold",
      "launch",
    ],
  },
  mosaic: {
    name: "Mosaic",
    category: "Bold",
    appearance: "colorful",
    description: "Rose-colored tiles. Your app in the spotlight.",
    note: "A raised device sits above two captions, while rose tiles and rounded insets connect the background.",
    surfaceLabel: "Rose tiles · 2 slides",
    keywords: [
      "pink",
      "rose",
      "tiles",
      "checkerboard",
      "pattern",
      "colorful",
      "rounded",
    ],
  },
  folio: {
    name: "Folio",
    category: "Minimal",
    appearance: "light",
    titleFont: "Fraunces",
    titleWeight: "600",
    description: "Quiet typography. A composition worth keeping.",
    note: "An upright device sits slightly off-center on layered paper, framed by fine rules and generous margins.",
    surfaceLabel: "Layered paper · 2 slides",
    keywords: [
      "paper",
      "editorial",
      "minimal",
      "serif",
      "teal",
      "mint",
      "light",
      "asymmetric",
    ],
  },
};

export const collectionPanoramaTemplates: readonly Template[] = (
  Object.keys(metadata) as CollectionPanoramaId[]
).map((id) => ({
  id,
  ...metadata[id],
  style: collectionPanoramaStyles[id],
  phone: {
    x: 700,
    y: 180,
    width: 740,
    rotation: collectionPanoramaLayouts[id].rotation,
  },
  title: { x: 80, y: 120, width: 500, height: 480 },
  subtitle: { x: 84, y: 640, width: 490, height: 150 },
  lineHeight: 1.04,
}));
