import type { ExportProfile } from "../core/export-profiles";

export type ExportImageFormat = "png" | "jpeg";
// A product recommendation, NOT a universal store upload limit. Only XR has a
// published per-image cap in the linked screenshot specifications.
export const RECOMMENDED_IMAGE_BYTES = 8_000_000;
export interface ExportedImageReview {
  name: string;
  bytes: number;
  width: number;
  height: number;
  format: ExportImageFormat;
  overLimit: boolean;
  large: boolean;
}
export interface ExportReview {
  files: ExportedImageReview[];
  format: ExportImageFormat;
  blocked: boolean;
}
export function reviewExportedImage(
  blob: Blob,
  name: string,
  profile: ExportProfile,
  format: ExportImageFormat,
): ExportedImageReview {
  return {
    name,
    bytes: blob.size,
    width: profile.width,
    height: profile.height,
    format,
    overLimit: profile.maxBytes !== undefined && blob.size > profile.maxBytes,
    large: blob.size > RECOMMENDED_IMAGE_BYTES,
  };
}

export function publicationAdvice(
  profile: ExportProfile,
  count: number,
): string[] {
  if (profile.store === "presentation") return [];
  const advice: string[] = [];
  if (profile.store === "google" && profile.category !== "banner") {
    if (profile.id === "play-xr" && count < 4)
      advice.push(
        "Android XR needs at least 4 screenshots. You can export individual files while preparing the set.",
      );
    else if (profile.id.startsWith("play-auto"))
      advice.push(
        "Prepare both Automotive orientations: at least 2 portrait and 2 landscape screenshots in the complete listing.",
      );
    else if (!profile.sourceOnly && profile.id !== "play-tv" && count < 2)
      advice.push(
        "Google Play needs at least 2 screenshots in the complete listing. A single exported file is only part of that set.",
      );
    if (
      ["phone", "tablet", "desktop"].includes(profile.category) &&
      !profile.sourceOnly &&
      !profile.id.startsWith("play-auto") &&
      !["play-xr", "play-tv"].includes(profile.id) &&
      count < 4
    )
      advice.push(
        "For promotional placements, Google Play recommends at least 4 screenshots of your app.",
      );
  }
  if (profile.sourceOnly)
    advice.push(
      "This destination exports only the original app capture. Design, text, frames, and overlays are kept in your project but excluded here. Use a square capture without transparent masking.",
    );
  else if (profile.store === "google")
    advice.push(
      "Review Google Play content guidance: avoid rankings, testimonials, awards, prices, and promotional claims. Tablet and Chromebook captures should show the app interface without extra promotional text.",
    );
  else
    advice.push(
      "Use captures from the actual Apple app. Review every language and provide iPad screenshots if the app supports iPad.",
    );
  return advice;
}
