import {
  getExportProfile,
  isBannerProfile,
  resolveExportProfile,
  type ExportProfileId,
} from "./export-profiles";
import type { Project } from "./model";

export type ProjectPurpose = "stores" | "portfolio" | "banners";
export type CanvasOrientation = "portrait" | "landscape" | "square";
export type Store = "apple" | "google";
type OrientationProfiles = Partial<Record<CanvasOrientation, ExportProfileId>>;

interface StoreSlot {
  id: string;
  name: string;
  store: Store;
  category: "phone" | "tablet" | "desktop";
  profiles: OrientationProfiles;
}

export const storeSlots: readonly StoreSlot[] = [
  {
    id: "apple-iphone69",
    name: "iPhone · 6.9-inch",
    store: "apple",
    category: "phone",
    profiles: {
      portrait: "apple-iphone69-portrait",
      landscape: "apple-iphone69-landscape",
    },
  },
  {
    id: "apple-iphone65",
    name: "iPhone · 6.5-inch",
    store: "apple",
    category: "phone",
    profiles: {
      portrait: "apple-iphone65-portrait",
      landscape: "apple-iphone65-landscape",
    },
  },
  {
    id: "apple-ipad13",
    name: "iPad · 13-inch",
    store: "apple",
    category: "tablet",
    profiles: {
      portrait: "apple-ipad13-portrait",
      landscape: "apple-ipad13-landscape",
    },
  },
  {
    id: "apple-mac",
    name: "Mac",
    store: "apple",
    category: "desktop",
    profiles: { landscape: "apple-mac" },
  },
  {
    id: "play-phone",
    name: "Phone",
    store: "google",
    category: "phone",
    profiles: {
      portrait: "play-phone-portrait",
      landscape: "play-phone-landscape",
    },
  },
  {
    id: "play-tablet7",
    name: "Tablet · 7-inch",
    store: "google",
    category: "tablet",
    profiles: {
      portrait: "play-tablet7-portrait",
      landscape: "play-tablet7-landscape",
    },
  },
  {
    id: "play-tablet10",
    name: "Tablet · 10-inch",
    store: "google",
    category: "tablet",
    profiles: {
      portrait: "play-tablet10-portrait",
      landscape: "play-tablet10-landscape",
    },
  },
  {
    id: "play-chromebook",
    name: "Chromebook",
    store: "google",
    category: "desktop",
    profiles: { landscape: "play-chromebook" },
  },
];

interface PortfolioFormat {
  id: string;
  name: string;
  defaultProfile: ExportProfileId;
  profiles: OrientationProfiles;
}

export const portfolioFormats: readonly PortfolioFormat[] = [
  {
    id: "card",
    name: "Card · 4:3",
    defaultProfile: "portfolio-card",
    profiles: {
      landscape: "portfolio-card",
      portrait: "portfolio-card-portrait",
    },
  },
  {
    id: "square",
    name: "Square · 1:1",
    defaultProfile: "portfolio-square",
    profiles: { square: "portfolio-square" },
  },
  {
    id: "editorial",
    name: "Editorial · 5:4",
    defaultProfile: "portfolio-portrait",
    profiles: {
      portrait: "portfolio-portrait",
      landscape: "portfolio-landscape",
    },
  },
  {
    id: "wide",
    name: "Wide · 16:9",
    defaultProfile: "desktop-web",
    profiles: { landscape: "desktop-web", portrait: "desktop-web-portrait" },
  },
  {
    id: "custom",
    name: "Custom size",
    defaultProfile: "portfolio-custom",
    profiles: {},
  },
];

export function projectPurpose(
  project: Pick<Project, "exportProfile">,
): ProjectPurpose {
  if (isBannerProfile(project.exportProfile)) return "banners";
  return getExportProfile(project.exportProfile).store === "presentation"
    ? "portfolio"
    : "stores";
}

export function dimensionsOrientation(size: {
  width: number;
  height: number;
}): CanvasOrientation {
  return size.width === size.height
    ? "square"
    : size.width > size.height
      ? "landscape"
      : "portrait";
}

export function canvasOrientation(project: Project): CanvasOrientation {
  return dimensionsOrientation(resolveExportProfile(project));
}

export function storeSlotForProfile(
  id: ExportProfileId,
): StoreSlot | undefined {
  return storeSlots.find((slot) => Object.values(slot.profiles).includes(id));
}

export function portfolioFormatForProfile(
  id: ExportProfileId,
): PortfolioFormat | undefined {
  return portfolioFormats.find(
    (format) =>
      format.defaultProfile === id ||
      Object.values(format.profiles).includes(id),
  );
}

/** A device slot owns its exact accepted portrait/landscape sizes. */
export function profileForSlot(
  slotId: string,
  orientation: CanvasOrientation,
): ExportProfileId {
  const slot = storeSlots.find((item) => item.id === slotId);
  if (!slot) throw new Error("This device category is not supported.");
  return (
    slot.profiles[orientation] ??
    slot.profiles.portrait ??
    slot.profiles.landscape!
  );
}

/** Keep the device category and orientation when moving between stores. */
export function profileForStore(
  current: ExportProfileId,
  store: Store,
): ExportProfileId {
  const currentSlot = storeSlotForProfile(current);
  if (!currentSlot)
    throw new Error("Choose an App stores project before changing the store.");
  if (currentSlot.store === store) return current;
  const target = storeSlots.find(
    (slot) => slot.store === store && slot.category === currentSlot.category,
  )!;
  return profileForSlot(
    target.id,
    dimensionsOrientation(getExportProfile(current)),
  );
}

export function profileForPortfolioFormat(
  formatId: string,
  orientation: CanvasOrientation,
): ExportProfileId {
  const format = portfolioFormats.find((item) => item.id === formatId);
  if (!format) throw new Error("This portfolio format is not supported.");
  return format.profiles[orientation] ?? format.defaultProfile;
}

/** Undefined means the chosen orientation is unavailable for this fixed format. */
export function profileForOrientation(
  id: ExportProfileId,
  orientation: CanvasOrientation,
): ExportProfileId | undefined {
  return (storeSlotForProfile(id) ?? portfolioFormatForProfile(id))?.profiles[
    orientation
  ];
}

/** Custom sizes rotate by exchanging committed sides, preserving the same pixels. */
export function customSizeForOrientation(
  size: { width: number; height: number },
  orientation: Exclude<CanvasOrientation, "square">,
) {
  if (
    dimensionsOrientation(size) === "square" ||
    dimensionsOrientation(size) === orientation
  )
    return { ...size };
  return { width: size.height, height: size.width };
}
