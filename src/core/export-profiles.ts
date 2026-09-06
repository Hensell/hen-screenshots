import type { Project } from "./model";

export const APPLE_SCREENSHOTS =
  "https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/";
export const PLAY_SCREENSHOTS =
  "https://support.google.com/googleplay/android-developer/answer/9866151?hl=en";
export const PROFILE_REVIEW_DATE = "2026-09-06";
interface ProfileDefinition {
  id: string;
  name: string;
  store: "apple" | "google" | "presentation";
  category: "phone" | "tablet" | "desktop";
  width: number;
  height: number;
  maxCount: number;
  note: string;
  source?: string;
}

// Fixed, dated store presets. IDs include their device slot, not just an aspect ratio.
export const exportProfiles = [
  {
    id: "play-phone-portrait",
    name: "Google Play · Phone · Portrait",
    store: "google",
    category: "phone",
    width: 1080,
    height: 1920,
    maxCount: 8,
    note: "At least 2 screenshots across device types to publish; 4 are recommended for apps.",
    source: PLAY_SCREENSHOTS,
  },
  {
    id: "play-phone-landscape",
    name: "Google Play · Phone · Landscape",
    store: "google",
    category: "phone",
    width: 1920,
    height: 1080,
    maxCount: 8,
    note: "16:9 landscape. Up to 8 screenshots in the phone slot.",
    source: PLAY_SCREENSHOTS,
  },
  {
    id: "play-tablet7-portrait",
    name: "Google Play · 7-inch tablet · Portrait",
    store: "google",
    category: "tablet",
    width: 1440,
    height: 2560,
    maxCount: 8,
    note: "For large screens, provide at least 4 captures of the actual app and exclude extra promotional text.",
    source: PLAY_SCREENSHOTS,
  },
  {
    id: "play-tablet7-landscape",
    name: "Google Play · 7-inch tablet · Landscape",
    store: "google",
    category: "tablet",
    width: 2560,
    height: 1440,
    maxCount: 8,
    note: "For large screens, provide at least 4 captures of the actual app and exclude extra promotional text.",
    source: PLAY_SCREENSHOTS,
  },
  {
    id: "play-tablet10-portrait",
    name: "Google Play · 10-inch tablet · Portrait",
    store: "google",
    category: "tablet",
    width: 1440,
    height: 2560,
    maxCount: 8,
    note: "For large screens, provide at least 4 captures of the actual app and exclude extra promotional text.",
    source: PLAY_SCREENSHOTS,
  },
  {
    id: "play-tablet10-landscape",
    name: "Google Play · 10-inch tablet · Landscape",
    store: "google",
    category: "tablet",
    width: 2560,
    height: 1440,
    maxCount: 8,
    note: "For large screens, provide at least 4 captures of the actual app and exclude extra promotional text.",
    source: PLAY_SCREENSHOTS,
  },
  {
    id: "play-chromebook",
    name: "Google Play · Chromebook",
    store: "google",
    category: "desktop",
    width: 1920,
    height: 1080,
    maxCount: 8,
    note: "For large screens, provide at least 4 captures of the actual app and exclude extra promotional text.",
    source: PLAY_SCREENSHOTS,
  },
  {
    id: "apple-iphone69-portrait",
    name: "App Store · iPhone 6.9-inch · Portrait",
    store: "apple",
    category: "phone",
    width: 1320,
    height: 2868,
    maxCount: 10,
    note: "An accepted size for the 6.9-inch iPhone slot. Use screenshots from the iOS app.",
    source: APPLE_SCREENSHOTS,
  },
  {
    id: "apple-iphone69-landscape",
    name: "App Store · iPhone 6.9-inch · Landscape",
    store: "apple",
    category: "phone",
    width: 2868,
    height: 1320,
    maxCount: 10,
    note: "An accepted size for the 6.9-inch iPhone slot. Use screenshots from the iOS app.",
    source: APPLE_SCREENSHOTS,
  },
  {
    id: "apple-iphone65-portrait",
    name: "App Store · iPhone 6.5-inch · Portrait",
    store: "apple",
    category: "phone",
    width: 1242,
    height: 2688,
    maxCount: 10,
    note: "An accepted 6.5-inch size; this slot is required when 6.9-inch screenshots are not supplied.",
    source: APPLE_SCREENSHOTS,
  },
  {
    id: "apple-iphone65-landscape",
    name: "App Store · iPhone 6.5-inch · Landscape",
    store: "apple",
    category: "phone",
    width: 2688,
    height: 1242,
    maxCount: 10,
    note: "An accepted 6.5-inch size; this slot is required when 6.9-inch screenshots are not supplied.",
    source: APPLE_SCREENSHOTS,
  },
  {
    id: "apple-ipad13-portrait",
    name: "App Store · iPad 13-inch · Portrait",
    store: "apple",
    category: "tablet",
    width: 2064,
    height: 2752,
    maxCount: 10,
    note: "An accepted size for the 13-inch iPad slot, required for apps that run on iPad.",
    source: APPLE_SCREENSHOTS,
  },
  {
    id: "apple-ipad13-landscape",
    name: "App Store · iPad 13-inch · Landscape",
    store: "apple",
    category: "tablet",
    width: 2752,
    height: 2064,
    maxCount: 10,
    note: "An accepted size for the 13-inch iPad slot, required for apps that run on iPad.",
    source: APPLE_SCREENSHOTS,
  },
  {
    id: "apple-mac",
    name: "App Store · Mac",
    store: "apple",
    category: "desktop",
    width: 2880,
    height: 1800,
    maxCount: 10,
    note: "An accepted 16:10 Mac size. Use screenshots of the actual macOS app.",
    source: APPLE_SCREENSHOTS,
  },
  {
    id: "desktop-web",
    name: "Presentation · Desktop & web",
    store: "presentation",
    category: "desktop",
    width: 1920,
    height: 1080,
    maxCount: 20,
    note: "A widescreen composition for your website or portfolio. No store slot is selected.",
  },
] as const satisfies readonly ProfileDefinition[];
export type ExportProfileId = (typeof exportProfiles)[number]["id"];
export type ExportProfile = ProfileDefinition & { id: ExportProfileId };
export const DEFAULT_EXPORT_PROFILE: ExportProfileId = "play-phone-portrait";
export function getExportProfile(id: ExportProfileId): ExportProfile {
  const profile = exportProfiles.find((item) => item.id === id);
  if (!profile) throw new Error("This export preset is not supported.");
  return profile;
}
export function canonicalCanvas(project: Project) {
  const profile = getExportProfile(project.exportProfile);
  return { width: 1080, height: (1080 * profile.height) / profile.width };
}

/** Size rules are separate from the allowlisted preset values, so bad edits fail closed. */
export function validateDimensions(
  profile: ExportProfile,
  width: number,
  height: number,
): void {
  if (
    width !== profile.width ||
    height !== profile.height ||
    !Number.isInteger(width) ||
    !Number.isInteger(height)
  )
    throw new Error(
      "The exported image does not match the selected preset dimensions.",
    );
  if (profile.store === "google") {
    const short = Math.min(width, height),
      long = Math.max(width, height);
    if (short < 320 || long > 3840 || long > short * 2)
      throw new Error(
        "These dimensions do not satisfy Google Play screenshot rules.",
      );
    if (
      profile.category !== "phone" &&
      (short < 1080 || long * 9 !== short * 16)
    )
      throw new Error(
        "Google Play large-screen presets require 16:9 or 9:16 and at least 1080 pixels.",
      );
  } else if (profile.store === "apple") {
    const allowed: Record<string, [number, number][]> = {
      phone: profile.id.includes("iphone65")
        ? [
            [1242, 2688],
            [2688, 1242],
            [1284, 2778],
            [2778, 1284],
          ]
        : [
            [1320, 2868],
            [2868, 1320],
            [1290, 2796],
            [2796, 1290],
            [1260, 2736],
            [2736, 1260],
          ],
      tablet: [
        [2064, 2752],
        [2752, 2064],
        [2048, 2732],
        [2732, 2048],
      ],
      desktop: [
        [1280, 800],
        [1440, 900],
        [2560, 1600],
        [2880, 1800],
      ],
    };
    if (
      !allowed[profile.category].some(([w, h]) => w === width && h === height)
    )
      throw new Error(
        "These dimensions are not accepted in the selected App Store slot.",
      );
  }
}

export async function validateExportPng(
  blob: Blob,
  profile: ExportProfile,
): Promise<void> {
  const bytes = new Uint8Array(await blob.slice(0, 33).arrayBuffer());
  if (
    blob.type !== "image/png" ||
    bytes.length < 33 ||
    ![137, 80, 78, 71, 13, 10, 26, 10].every(
      (value, index) => bytes[index] === value,
    ) ||
    String.fromCharCode(...bytes.slice(12, 16)) !== "IHDR"
  )
    throw new Error("The browser did not create a valid PNG.");
  const header = new DataView(bytes.buffer);
  validateDimensions(profile, header.getUint32(16), header.getUint32(20));
  if (bytes[24] !== 8 || bytes[25] !== 2)
    throw new Error(
      "The exported PNG must be 24-bit RGB without transparency. Please export in a browser that supports opaque PNGs.",
    );
}
