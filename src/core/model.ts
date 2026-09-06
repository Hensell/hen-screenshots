import { DEFAULT_EXPORT_PROFILE, exportProfiles } from "./export-profiles";
import type { ExportProfileId } from "./export-profiles";

export const SCHEMA_VERSION = 3 as const;
export const CANVAS = { width: 1080, height: 1920 } as const;
export const PLACEMENT_LIMITS = {
  x: { min: -1080, max: 2160 },
  y: { min: -2160, max: 4096 },
  width: { min: 160, max: 2160 },
} as const;
export const LIMITS = {
  shots: 20,
  assetBytes: 20 * 1024 * 1024,
  totalBytes: 120 * 1024 * 1024,
  imagePixels: 24_000_000,
} as const;

export type DeviceFamily =
  "android" | "ios" | "ipad" | "android-tablet" | "monitor" | "laptop";
export type DeviceOrientation = "portrait" | "landscape";
export type TemplateId = "classic" | "spotlight" | "tilt" | "editorial";
export interface Style {
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
  id: string;
  assetId: string;
  title: string;
  subtitle: string;
  style: Partial<Style>;
  phone: { x: number; y: number; width: number; rotation: number };
}
export interface Project {
  schemaVersion: 3;
  exportProfile: ExportProfileId;
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
export type V2Style = Omit<Style, "deviceOrientation" | "device"> & {
  device: "android" | "ios";
};
export interface V2Project extends Omit<
  Project,
  "schemaVersion" | "exportProfile" | "style" | "shots"
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
  "schemaVersion" | "exportProfile" | "style" | "shots"
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
  project: Project | V2Project | LegacyProject,
): Project {
  validateProject(project);
  if (project.schemaVersion === SCHEMA_VERSION) return project;
  return {
    ...project,
    schemaVersion: SCHEMA_VERSION,
    exportProfile: DEFAULT_EXPORT_PROFILE,
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
    id: crypto.randomUUID(),
    name,
    createdAt: now,
    updatedAt: now,
    style: { ...defaultStyle },
    shots: [],
  };
}
export function createShot(assetId: string, index: number): Shot {
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
export function resolveStyle(project: Project, shot: Shot): Style {
  return { ...project.style, ...shot.style };
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
type StoredProject = Project | V2Project | LegacyProject;
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
  version: 1 | 2 | 3,
  partial = false,
): void {
  const entries = object(
    value,
    version === 1 ? legacyStyleKeys : version === 2 ? v2StyleKeys : styleKeys,
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
          version === 3
            ? ["android", "ios", "ipad", "android-tablet", "monitor", "laptop"]
            : ["android", "ios"],
        deviceOrientation: ["portrait", "landscape"],
        fit: ["contain", "cover"],
        align: ["left", "center"],
        template: ["classic", "spotlight", "tilt", "editorial"],
        backgroundMode: ["solid", "gradient"],
        texture: ["none", "dots"],
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
  if (version !== 1 && version !== 2 && version !== SCHEMA_VERSION)
    throw new Error("This project uses an unsupported project version.");
  const raw = object(value, [
    "schemaVersion",
    "id",
    "name",
    "createdAt",
    "updatedAt",
    "style",
    "shots",
    ...(version === 3 ? ["exportProfile"] : []),
  ]);
  identifier(raw.id);
  textValue(raw.name, 80, 1);
  numeric(raw.createdAt, 0, Number.MAX_SAFE_INTEGER, true);
  numeric(raw.updatedAt, 0, Number.MAX_SAFE_INTEGER, true);
  if (
    version === 3 &&
    !exportProfiles.some((profile) => profile.id === raw.exportProfile)
  )
    invalid();
  validateStyle(raw.style, version);
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
    ]);
    const shotId = identifier(shot.id);
    if (ids.has(shotId))
      throw new Error("The project has duplicate screenshot IDs.");
    ids.add(shotId);
    identifier(shot.assetId);
    textValue(shot.title, 100);
    textValue(shot.subtitle, 150);
    validateStyle(shot.style, version, true);
    const phone = object(
      shot.phone,
      version === 1 ? ["x", "y", "width"] : ["x", "y", "width", "rotation"],
    );
    const bounds =
      version === 3
        ? PLACEMENT_LIMITS
        : {
            x: { min: -200, max: 900 },
            y: { min: 100, max: 1500 },
            width: { min: 320, max: 900 },
          };
    for (const key of ["x", "y", "width"] as const)
      numeric(phone[key], bounds[key].min, bounds[key].max);
    if (version !== 1) numeric(phone.rotation, -20, 20);
  }
}
