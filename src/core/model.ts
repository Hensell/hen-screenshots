export const SCHEMA_VERSION = 1 as const;
export const CANVAS = { width: 1080, height: 1920 } as const;
export const LIMITS = {
  shots: 20,
  assetBytes: 20 * 1024 * 1024,
  totalBytes: 120 * 1024 * 1024,
  imagePixels: 24_000_000,
} as const;

export type DeviceFamily = "android" | "ios";
export interface Style {
  background: string;
  textColor: string;
  device: DeviceFamily;
  frame: boolean;
  camera: boolean;
  fit: "contain" | "cover";
  align: "left" | "center";
}
export interface Shot {
  id: string;
  assetId: string;
  title: string;
  subtitle: string;
  style: Partial<Style>;
  phone: { x: number; y: number; width: number };
}
export interface Project {
  schemaVersion: 1;
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
  frame: true,
  camera: false,
  fit: "contain",
  align: "center",
};
export function createProject(name = "Untitled app"): Project {
  const now = Date.now();
  return {
    schemaVersion: SCHEMA_VERSION,
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
    phone: { x: 230, y: 485, width: 620 },
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
