import { loadImage } from "./import";
import type { Asset } from "../core/model";
import { validateBrandLogo } from "../core/brand-kit";

/** Keep the app-identification icon small and portable, without stretching its artwork. */
export async function importBrandLogo(asset: Asset): Promise<string> {
  const image = await loadImage(asset);
  const scale = Math.min(
    1,
    128 / image.naturalWidth,
    128 / image.naturalHeight,
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("The browser could not prepare this logo.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const logo = canvas.toDataURL("image/png");
  validateBrandLogo(logo);
  return logo;
}
