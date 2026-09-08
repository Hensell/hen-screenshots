import {
  BRAND_FILE_LIMIT,
  validateBrandKit,
  type BrandKit,
} from "../core/brand-kit";

export function exportBrandKit(kit: BrandKit): Blob {
  validateBrandKit(kit);
  return new Blob([JSON.stringify({ format: "hen-brand-kit", kit }, null, 2)], {
    type: "application/json",
  });
}

/** Import as a new library entry so a file cannot silently replace an existing brand. */
export async function importBrandKit(file: File): Promise<BrandKit> {
  if (!file.size || file.size > BRAND_FILE_LIMIT)
    throw new Error("Choose a .henbrand file no larger than 128 KB.");
  let raw: unknown;
  try {
    raw = JSON.parse(await file.text());
  } catch {
    throw new Error("This brand kit file is not valid JSON.");
  }
  if (
    !raw ||
    typeof raw !== "object" ||
    Array.isArray(raw) ||
    Object.keys(raw).length !== 2 ||
    !("format" in raw) ||
    raw.format !== "hen-brand-kit" ||
    !("kit" in raw)
  )
    throw new Error("Choose a valid Hen Screenshots brand kit file.");
  validateBrandKit(raw.kit);
  const now = Date.now();
  return {
    ...raw.kit,
    id: crypto.randomUUID(),
    revision: 1,
    createdAt: now,
    updatedAt: now,
  };
}
