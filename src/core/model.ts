import { compositionId, deviceCompositions } from "./device-composition-spec";
import {
  isPanoramaTemplate,
  isPanoramaEnd,
  panoramaStart,
  panoramaFamilies,
} from "./panorama-families";
import {
  DEFAULT_CUSTOM_SIZE,
  isBannerProfile,
  DEFAULT_EXPORT_PROFILE,
  exportProfiles,
  validateCustomSize,
} from "./export-profiles";
import type { ExportProfileId } from "./export-profiles";
import {
  brandFonts,
  brandSnapshotKey,
  validateBrandKit,
  type BrandKit,
  type BrandFont,
} from "./brand-kit";

import { isLanguage, MAX_LANGUAGES, type LocalizedShot } from "./localization";

export const SCHEMA_VERSION = 10 as const;
export const CANVAS = { width: 1080, height: 1920 } as const;
export const DEVICE_ROTATION_LIMITS = { min: -180, max: 180 } as const;
export const PLACEMENT_LIMITS = {
  x: { min: -1080, max: 2160 },
  y: { min: -2160, max: 4096 },
  width: { min: 32, max: 2160 },
} as const;
export const LIMITS = {
  shots: 20,
  overlays: 8,
  assetBytes: 50 * 1024 * 1024,
  totalBytes: 120 * 1024 * 1024,
  imagePixels: 24_000_000,
} as const;

export type DeviceFamily =
  "android" | "ios" | "ipad" | "android-tablet" | "monitor" | "laptop" | "card";
export type DeviceOrientation = "portrait" | "landscape";
export const legacyTemplateIds = [
  "classic",
  "spotlight",
  "tilt",
  "editorial",
] as const;
export const templateIds = [
  ...legacyTemplateIds,
  "studio",
  "split",
  "halo",
  "gallery",
  "panorama",
  "panorama-end",
  "daybreak",
  "daybreak-end",
  "tidal",
  "tidal-end",
  "atrium",
  "atrium-end",
  "obsidian",
  "obsidian-end",
  "offset",
  "offset-end",
  "signal",
  "signal-end",
  "mosaic",
  "mosaic-end",
  "folio",
  "folio-end",
  "bloom",
  "punch",
  "prism",
  "paper",
  "orbit",
  "orbit-end",
  "workbench",
  "nocturne",
  "carbon",
  "ember",
  "confetti",
  "zest",
  "cabana",
  "contour",
  "cherry",
  "terracotta",
  "blueprint",
  "stitch",
  "parade",
  "jack-o-lantern",
  "cobweb",
  "boo",
  "witching-hour",
  "candy-club",
  "moonlight",
  "moonlight-end",
  "sidekick",
  "handoff",
  "companion",
  "duet",
  "workspace",
  "desktop-suite",
  "ecosystem",
  "constellation",
  "evergreen",
  "snowfall",
  "gift-wrap",
  "gingerbread",
  "midnight",
  "firework",
  "countdown",
  "first-light",
  "banner-signal",
  "banner-orbit",
  "banner-editorial",
  "banner-ribbon",
  "banner-dusk",
  "banner-confetti",
] as const;
export type TemplateId = (typeof templateIds)[number];
export type TextElement = "title" | "subtitle";
export type CompanionId = "secondary" | "tertiary";
export type DeviceElement = "device" | `device:${CompanionId}`;
export type OverlayElement = `overlay:${string}`;
export type CanvasElement = DeviceElement | TextElement | OverlayElement;
export interface ImageOverlay {
  id: string;
  assetId: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}
export type DeviceStyle = Pick<
  Style,
  "device" | "deviceOrientation" | "frame" | "camera" | "fit"
>;
export interface CompanionDevice {
  id: CompanionId;
  assetId: string | null;
  style: DeviceStyle;
  phone: Shot["phone"];
}
export const TEXT_OFFSET_LIMITS = { x: 2160, y: 4320 } as const;
export interface Style {
  titleFont?: BrandFont;
  bodyFont?: BrandFont;
  background: string;
  textColor: string;
  device: DeviceFamily;
  deviceOrientation: DeviceOrientation;
  frame: boolean;
  camera: boolean;
  fit: "contain" | "cover";
  align: "left" | "center";
  template: TemplateId;
  backgroundMode: "solid" | "gradient";
  backgroundEnd: string;
  accentColor: string;
  texture: "none" | "dots";
  accentTitle: boolean;
  titleSize: number;
}
export interface Shot {
  overlays?: ImageOverlay[];
  companions?: CompanionDevice[];
  translations?: Record<string, LocalizedShot>;
  brand?: string;
  id: string;
  /** Null is an intentional empty device slot, never a missing file. */
  assetId: string | null;
  title: string;
  subtitle: string;
  style: Partial<Style>;
  phone: { x: number; y: number; width: number; rotation: number };
  textOffsets?: Partial<Record<TextElement, { x: number; y: number }>>;
}
export interface Project {
  schemaVersion: 10;
  localization?: { source: string; targets: string[] };
  brands?: Record<string, BrandKit>;
  brand?: string;
  exportProfile: ExportProfileId;
  customSize: { width: number; height: number };
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  style: Style;
  shots: Shot[];
}
export interface Asset {
  id: string;
  name: string;
  mime: "image/png" | "image/jpeg" | "image/webp";
  width: number;
  height: number;
  blob: Blob;
}
export interface LoadedProject {
  project: Project;
  assets: Asset[];
  revision: number;
}
export const defaultStyle: Style = {
  background: "#E3E8DE",
  textColor: "#202725",
  device: "android",
  deviceOrientation: "portrait",
  frame: true,
  camera: false,
  fit: "contain",
  align: "center",
  template: "classic",
  backgroundMode: "solid",
  backgroundEnd: "#E3E8DE",
  accentColor: "#47755B",
  texture: "none",
  accentTitle: false,
  titleSize: 84,
};
const v3ExportProfiles = [
  "play-phone-portrait",
  "play-phone-landscape",
  "play-tablet7-portrait",
  "play-tablet7-landscape",
  "play-tablet10-portrait",
  "play-tablet10-landscape",
  "play-chromebook",
  "apple-iphone69-portrait",
  "apple-iphone69-landscape",
  "apple-iphone65-portrait",
  "apple-iphone65-landscape",
  "apple-ipad13-portrait",
  "apple-ipad13-landscape",
  "apple-mac",
  "desktop-web",
] as const;
export type V3Style = Omit<Style, "device" | "template"> & {
  template: (typeof legacyTemplateIds)[number];
  device: "android" | "ios" | "ipad" | "android-tablet" | "monitor" | "laptop";
};
export interface V9Project extends Omit<Project, "schemaVersion"> {
  schemaVersion: 9;
}
export interface V8Project extends Omit<Project, "schemaVersion" | "shots"> {
  schemaVersion: 8;
  shots: Omit<Shot, "overlays">[];
}
export interface V7Project extends Omit<V8Project, "schemaVersion" | "shots"> {
  schemaVersion: 7;
  shots: Omit<Shot, "companions" | "overlays">[];
}
export interface V6Project extends Omit<
  V7Project,
  "schemaVersion" | "localization"
> {
  schemaVersion: 6;
}
export interface V5Project extends Omit<
  V6Project,
  "schemaVersion" | "brands" | "brand"
> {
  schemaVersion: 5;
}
export interface V4Project extends Omit<V5Project, "schemaVersion" | "shots"> {
  schemaVersion: 4;
  shots: Omit<Shot, "textOffsets">[];
}
export interface V3Project extends Omit<
  Project,
  "schemaVersion" | "customSize" | "exportProfile" | "style" | "shots"
> {
  schemaVersion: 3;
  exportProfile: (typeof v3ExportProfiles)[number];
  style: V3Style;
  shots: (Omit<Shot, "style"> & { style: Partial<V3Style> })[];
}
export type V2Style = Omit<V3Style, "deviceOrientation" | "device"> & {
  device: "android" | "ios";
};
export interface V2Project extends Omit<
  Project,
  "schemaVersion" | "customSize" | "exportProfile" | "style" | "shots"
> {
  schemaVersion: 2;
  style: V2Style;
  shots: (Omit<Shot, "style"> & { style: Partial<V2Style> })[];
}
export type LegacyStyle = Omit<
  V2Style,
  | "template"
  | "backgroundMode"
  | "backgroundEnd"
  | "accentColor"
  | "texture"
  | "accentTitle"
  | "titleSize"
>;
export interface LegacyProject extends Omit<
  Project,
  "schemaVersion" | "customSize" | "exportProfile" | "style" | "shots"
> {
  schemaVersion: 1;
  style: LegacyStyle;
  shots: (Omit<Shot, "style" | "phone"> & {
    style: Partial<LegacyStyle>;
    phone: Omit<Shot["phone"], "rotation">;
  })[];
}

/** Add presentation defaults without changing an existing project's content or identity. */
export function migrateProject(
  project:
    | Project
    | V9Project
    | V8Project
    | V7Project
    | V6Project
    | V5Project
    | V4Project
    | V3Project
    | V2Project
    | LegacyProject,
): Project {
  validateProject(project);
  if (project.schemaVersion === SCHEMA_VERSION) return project;
  if (
    project.schemaVersion === 4 ||
    project.schemaVersion === 5 ||
    project.schemaVersion === 6 ||
    project.schemaVersion === 7 ||
    project.schemaVersion === 8 ||
    project.schemaVersion === 9
  )
    return { ...structuredClone(project), schemaVersion: SCHEMA_VERSION };
  return {
    ...project,
    schemaVersion: SCHEMA_VERSION,
    exportProfile:
      project.schemaVersion === 3
        ? project.exportProfile
        : DEFAULT_EXPORT_PROFILE,
    customSize: { ...DEFAULT_CUSTOM_SIZE },
    style: { ...defaultStyle, ...project.style },
    shots: project.shots.map((shot) => ({
      ...shot,
      style: { ...shot.style },
      phone: {
        ...shot.phone,
        rotation: "rotation" in shot.phone ? shot.phone.rotation : 0,
      },
    })),
  };
}
export function createProject(name = "Untitled app"): Project {
  const now = Date.now();
  return {
    schemaVersion: SCHEMA_VERSION,
    exportProfile: DEFAULT_EXPORT_PROFILE,
    customSize: { ...DEFAULT_CUSTOM_SIZE },
    id: crypto.randomUUID(),
    name,
    createdAt: now,
    updatedAt: now,
    style: { ...defaultStyle },
    shots: [],
  };
}
export function createShot(assetId: string | null, index: number): Shot {
  return {
    id: crypto.randomUUID(),
    assetId,
    title:
      index === 0
        ? "Your app.\nBeautifully presented."
        : "Make every detail count.",
    subtitle: "A little more to love, every day.",
    style: {},
    phone: { x: 230, y: 485, width: 620, rotation: 0 },
  };
}
export function createEmptyShot(): Shot {
  return { ...createShot(null, 0), title: "", subtitle: "" };
}
export function resolveStyle(project: Project, shot: Shot): Style {
  const style = { ...project.style, ...shot.style };
  // Banners contain artwork, never a device shell, including after applying a brand kit.
  if (isBannerProfile(project.exportProfile)) {
    style.device = "card";
    style.deviceOrientation = "landscape";
    style.frame = false;
    style.camera = false;
    style.fit = "contain";
  }
  return style;
}
export function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

const legacyStyleKeys = [
  "background",
  "textColor",
  "device",
  "frame",
  "camera",
  "fit",
  "align",
];
const v2StyleKeys = [
  ...legacyStyleKeys,
  "template",
  "backgroundMode",
  "backgroundEnd",
  "accentColor",
  "texture",
  "accentTitle",
  "titleSize",
];
const styleKeys = [...v2StyleKeys, "deviceOrientation"];
type StoredProject =
  | Project
  | V9Project
  | V8Project
  | V7Project
  | V6Project
  | V5Project
  | V4Project
  | V3Project
  | V2Project
  | LegacyProject;
type RecordValue = Record<string, unknown>;

function invalid(): never {
  throw new Error("This project document is invalid or unsupported.");
}
function object(value: unknown, keys: string[], partial = false): RecordValue {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid();
  const result = value as RecordValue;
  if (
    Object.keys(result).some((key) => !keys.includes(key)) ||
    (!partial && keys.some((key) => !Object.hasOwn(result, key)))
  )
    invalid();
  return result;
}
function textValue(value: unknown, maximum: number, minimum = 0): string {
  if (
    typeof value !== "string" ||
    value.length < minimum ||
    value.length > maximum ||
    value.includes("\0")
  )
    invalid();
  return value;
}
function identifier(value: unknown): string {
  const result = textValue(value, 100, 1);
  if (!/^[a-zA-Z0-9_-]+$/.test(result)) invalid();
  return result;
}
function numeric(
  value: unknown,
  minimum: number,
  maximum: number,
  integer = false,
): void {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < minimum ||
    value > maximum ||
    (integer && !Number.isSafeInteger(value))
  )
    invalid();
}
function validateStyle(
  value: unknown,
  version: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10,
  partial = false,
): void {
  const entries = object(
    value,
    version === 1
      ? legacyStyleKeys
      : version === 2
        ? v2StyleKeys
        : [
            ...styleKeys,
            ...(version >= 6
              ? ["titleFont", "bodyFont"].filter(
                  (key) =>
                    value &&
                    typeof value === "object" &&
                    Object.hasOwn(value, key),
                )
              : []),
          ],
    partial,
  );
  for (const [key, item] of Object.entries(entries)) {
    if (
      ["background", "textColor", "backgroundEnd", "accentColor"].includes(key)
    ) {
      if (typeof item !== "string" || !/^#[\da-f]{6}$/i.test(item)) invalid();
    } else if (["frame", "camera", "accentTitle"].includes(key)) {
      if (typeof item !== "boolean") invalid();
    } else if (key === "titleSize") {
      numeric(item, 48, 132);
    } else {
      const allowed: Record<string, string[]> = {
        device:
          version >= 4
            ? [
                "android",
                "ios",
                "ipad",
                "android-tablet",
                "monitor",
                "laptop",
                "card",
              ]
            : version === 3
              ? [
                  "android",
                  "ios",
                  "ipad",
                  "android-tablet",
                  "monitor",
                  "laptop",
                ]
              : ["android", "ios"],
        deviceOrientation: ["portrait", "landscape"],
        fit: ["contain", "cover"],
        align: ["left", "center"],
        template: [...(version >= 4 ? templateIds : legacyTemplateIds)],
        backgroundMode: ["solid", "gradient"],
        texture: ["none", "dots"],
        titleFont: [...brandFonts],
        bodyFont: [...brandFonts],
      };
      if (typeof item !== "string" || !allowed[key]?.includes(item)) invalid();
    }
  }
}

/** Validate the original schema before migration, including local database rows. */
export function validateProject(
  value: unknown,
): asserts value is StoredProject {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid();
  const version = (value as RecordValue).schemaVersion;
  if (
    version !== 1 &&
    version !== 2 &&
    version !== 3 &&
    version !== 4 &&
    version !== 5 &&
    version !== 6 &&
    version !== 7 &&
    version !== 8 &&
    version !== 9 &&
    version !== SCHEMA_VERSION
  )
    throw new Error("This project uses an unsupported project version.");
  const raw = object(value, [
    "schemaVersion",
    "id",
    "name",
    "createdAt",
    "updatedAt",
    "style",
    "shots",
    ...(version >= 3 ? ["exportProfile"] : []),
    ...(version >= 4 ? ["customSize"] : []),
    ...(version >= 7 && Object.hasOwn(value, "localization")
      ? ["localization"]
      : []),
    ...(version >= 6
      ? ["brands", "brand"].filter((key) => Object.hasOwn(value, key))
      : []),
  ]);
  identifier(raw.id);
  textValue(raw.name, 80, 1);
  numeric(raw.createdAt, 0, Number.MAX_SAFE_INTEGER, true);
  numeric(raw.updatedAt, 0, Number.MAX_SAFE_INTEGER, true);
  if (
    version >= 3 &&
    !(
      version === 3
        ? v3ExportProfiles
        : exportProfiles.map((profile) => profile.id)
    ).some((profile) => profile === raw.exportProfile)
  )
    invalid();
  if (version >= 4) {
    const size = object(raw.customSize, ["width", "height"]);
    validateCustomSize({
      width: size.width as number,
      height: size.height as number,
    });
  }
  if (Object.hasOwn(raw, "localization")) {
    const locale = object(raw.localization, ["source", "targets"]);
    if (
      !isLanguage(locale.source) ||
      !Array.isArray(locale.targets) ||
      locale.targets.length >= MAX_LANGUAGES ||
      new Set(locale.targets).size !== locale.targets.length ||
      locale.targets.some((code) => !isLanguage(code) || code === locale.source)
    )
      invalid();
  }
  validateStyle(raw.style, version);
  if (Object.hasOwn(raw, "brands")) {
    if (
      !raw.brands ||
      typeof raw.brands !== "object" ||
      Array.isArray(raw.brands)
    )
      invalid();
    const entries = Object.entries(raw.brands);
    if (entries.length > LIMITS.shots + 1) invalid();
    for (const [key, kit] of entries) {
      validateBrandKit(kit);
      if (key !== brandSnapshotKey(kit)) invalid();
    }
  }
  const validateBrandReference = (key: unknown) => {
    if (
      typeof key !== "string" ||
      !raw.brands ||
      !Object.hasOwn(raw.brands, key)
    )
      invalid();
  };
  if (Object.hasOwn(raw, "brand")) validateBrandReference(raw.brand);
  if (!Array.isArray(raw.shots) || raw.shots.length > LIMITS.shots) invalid();
  const ids = new Set<string>();
  for (const value of raw.shots) {
    const shot = object(value, [
      "id",
      "assetId",
      "title",
      "subtitle",
      "style",
      "phone",
      ...(version >= 9 &&
      value &&
      typeof value === "object" &&
      Object.hasOwn(value, "overlays")
        ? ["overlays"]
        : []),
      ...(version >= 8 &&
      value &&
      typeof value === "object" &&
      Object.hasOwn(value, "companions")
        ? ["companions"]
        : []),
      ...(version >= 7 &&
      value &&
      typeof value === "object" &&
      Object.hasOwn(value, "translations")
        ? ["translations"]
        : []),
      ...(version >= 5 &&
      value &&
      typeof value === "object" &&
      Object.hasOwn(value, "textOffsets")
        ? ["textOffsets"]
        : []),
      ...(version >= 6 &&
      value &&
      typeof value === "object" &&
      Object.hasOwn(value, "brand")
        ? ["brand"]
        : []),
    ]);
    if (Object.hasOwn(shot, "overlays")) {
      if (
        !Array.isArray(shot.overlays) ||
        !shot.overlays.length ||
        shot.overlays.length > LIMITS.overlays
      )
        invalid();
      const overlayIds = new Set<string>();
      for (const entry of shot.overlays) {
        const overlay = object(entry, [
          "id",
          "assetId",
          "name",
          "x",
          "y",
          "width",
          "height",
          "rotation",
        ]);
        const id = identifier(overlay.id);
        if (overlayIds.has(id)) invalid();
        overlayIds.add(id);
        identifier(overlay.assetId);
        textValue(overlay.name, 255);
        for (const key of ["x", "y"] as const)
          numeric(
            overlay[key],
            PLACEMENT_LIMITS[key].min,
            PLACEMENT_LIMITS[key].max,
          );
        for (const key of ["width", "height"] as const)
          numeric(overlay[key], 1e-9, 8640);
        numeric(overlay.rotation, -180, 180);
      }
    }
    const composition = compositionId(
      (shot.style as Partial<Style>).template ?? (raw.style as Style).template,
    );
    if (composition) {
      if (
        version < 8 ||
        !Array.isArray(shot.companions) ||
        shot.companions.length !== deviceCompositions[composition].length - 1
      )
        invalid();
    } else if (Object.hasOwn(shot, "companions")) invalid();
    const companions = new Set<string>();
    if (Object.hasOwn(shot, "companions")) {
      if (
        !Array.isArray(shot.companions) ||
        shot.companions.length < 1 ||
        shot.companions.length > 2
      )
        invalid();
      for (const [index, value] of shot.companions.entries()) {
        const device = object(value, ["id", "assetId", "style", "phone"]);
        if (device.id !== (index === 0 ? "secondary" : "tertiary")) invalid();
        companions.add(device.id as string);
        if (version < 10 || device.assetId !== null) identifier(device.assetId);
        object(device.style, [
          "device",
          "deviceOrientation",
          "frame",
          "camera",
          "fit",
        ]);
        validateStyle(device.style, version, true);
        const placement = object(device.phone, ["x", "y", "width", "rotation"]);
        for (const key of ["x", "y", "width"] as const)
          numeric(
            placement[key],
            PLACEMENT_LIMITS[key].min,
            PLACEMENT_LIMITS[key].max,
          );
        numeric(
          placement.rotation,
          DEVICE_ROTATION_LIMITS.min,
          DEVICE_ROTATION_LIMITS.max,
        );
      }
    }
    if (Object.hasOwn(shot, "translations")) {
      const targets =
        (raw.localization as Project["localization"])?.targets ?? [];
      const entries = object(shot.translations, targets, true);
      for (const item of Object.values(entries)) {
        const content = object(item, [
          "title",
          "subtitle",
          "sourceTitle",
          "sourceSubtitle",
          "status",
          ...[
            "textOffsets",
            "titleSize",
            "assetId",
            ...(version >= 8 ? ["deviceAssets"] : []),
          ].filter(
            (key) =>
              item && typeof item === "object" && Object.hasOwn(item, key),
          ),
        ]);
        textValue(content.title, 300);
        textValue(content.subtitle, 450);
        textValue(content.sourceTitle, 100);
        textValue(content.sourceSubtitle, 150);
        if (
          !["untranslated", "draft", "reviewed"].includes(
            content.status as string,
          )
        )
          invalid();
        if (Object.hasOwn(content, "titleSize"))
          numeric(content.titleSize, 48, 132);
        if (Object.hasOwn(content, "assetId")) identifier(content.assetId);
        if (Object.hasOwn(content, "deviceAssets")) {
          const assets = object(content.deviceAssets, [...companions], true);
          Object.values(assets).forEach(identifier);
        }
        if (Object.hasOwn(content, "textOffsets")) {
          const offsets = object(
            content.textOffsets,
            ["title", "subtitle"],
            true,
          );
          for (const offset of Object.values(offsets)) {
            const position = object(offset, ["x", "y"]);
            for (const key of ["x", "y"] as const)
              numeric(
                position[key],
                -TEXT_OFFSET_LIMITS[key],
                TEXT_OFFSET_LIMITS[key],
              );
          }
        }
      }
    }
    if (Object.hasOwn(shot, "brand")) validateBrandReference(shot.brand);
    if (Object.hasOwn(shot, "textOffsets")) {
      const offsets = object(shot.textOffsets, ["title", "subtitle"], true);
      for (const offset of Object.values(offsets)) {
        const position = object(offset, ["x", "y"]);
        for (const key of ["x", "y"] as const)
          numeric(
            position[key],
            -TEXT_OFFSET_LIMITS[key],
            TEXT_OFFSET_LIMITS[key],
          );
      }
    }
    const shotId = identifier(shot.id);
    if (ids.has(shotId))
      throw new Error("The project has duplicate screenshot IDs.");
    ids.add(shotId);
    if (version < 10 || shot.assetId !== null) identifier(shot.assetId);
    textValue(shot.title, 100);
    textValue(shot.subtitle, 150);
    validateStyle(shot.style, version, true);
    const phone = object(
      shot.phone,
      version === 1 ? ["x", "y", "width"] : ["x", "y", "width", "rotation"],
    );
    const bounds =
      version >= 4
        ? PLACEMENT_LIMITS
        : version === 3
          ? { ...PLACEMENT_LIMITS, width: { min: 160, max: 2160 } }
          : {
              x: { min: -200, max: 900 },
              y: { min: 100, max: 1500 },
              width: { min: 320, max: 900 },
            };
    for (const key of ["x", "y", "width"] as const)
      numeric(phone[key], bounds[key].min, bounds[key].max);
    if (version !== 1)
      numeric(
        phone.rotation,
        DEVICE_ROTATION_LIMITS.min,
        DEVICE_ROTATION_LIMITS.max,
      );
  }
  if (version >= 4) {
    const project = value as Project;
    if (isPanoramaTemplate(project.style.template)) invalid();
    for (let index = 0; index < project.shots.length; index++) {
      const left = project.shots[index];
      const style = resolveStyle(project, left);
      if (isPanoramaEnd(style.template)) invalid();
      const start = panoramaStart(style.template);
      if (!start) continue;
      const right = project.shots[++index];
      if (!right) invalid();
      if (left.companions || right.companions) invalid();
      const other = resolveStyle(project, right);
      if (
        version >= 7 &&
        project.localization?.targets.some(
          (locale) =>
            (left.translations?.[locale]?.assetId ?? left.assetId) !==
            (right.translations?.[locale]?.assetId ?? right.assetId),
        )
      )
        invalid();
      if (
        other.template !== panoramaFamilies[start] ||
        left.assetId !== right.assetId ||
        ([...styleKeys, "titleFont", "bodyFont"] as (keyof Style)[]).some(
          (key) => key !== "template" && style[key] !== other[key],
        ) ||
        (["x", "y", "width", "rotation"] as const).some(
          (key) => left.phone[key] !== right.phone[key],
        )
      )
        throw new Error(
          "This panorama has disconnected slides. Restore a complete linked pair.",
        );
    }
  }
}
