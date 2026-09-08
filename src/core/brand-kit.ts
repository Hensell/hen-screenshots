export const brandFonts = ["Manrope", "Fraunces"] as const;
export type BrandFont = (typeof brandFonts)[number];
export const BRAND_LOGO_LIMIT = 100 * 1024;
export const BRAND_FILE_LIMIT = 128 * 1024;

export interface BrandKit {
  schemaVersion: 1;
  id: string;
  revision: number;
  name: string;
  createdAt: number;
  updatedAt: number;
  colors: {
    background: string;
    text: string;
    accent: string;
    secondary: string;
  };
  fonts: { title: BrandFont; body: BrandFont };
  logo?: string;
}

function invalid(): never {
  throw new Error("This brand kit is invalid or unsupported.");
}
function record(
  value: unknown,
  keys: string[],
  optional: string[] = [],
): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid();
  const raw = value as Record<string, unknown>;
  if (
    Object.keys(raw).some(
      (key) => !keys.includes(key) && !optional.includes(key),
    ) ||
    keys.some((key) => !Object.hasOwn(raw, key))
  )
    invalid();
  return raw;
}

/** Only bounded raster thumbnails can be embedded in portable brand snapshots. */
export function validateBrandLogo(value: unknown): asserts value is string {
  if (
    typeof value !== "string" ||
    value.length > BRAND_LOGO_LIMIT ||
    !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(value)
  )
    invalid();
  let binary: string;
  try {
    binary = atob(value.slice(22));
  } catch {
    invalid();
  }
  if (
    binary.length < 33 ||
    binary.slice(0, 8) !== "\x89PNG\r\n\x1a\n" ||
    binary.slice(12, 16) !== "IHDR"
  )
    invalid();
  const bytes = Uint8Array.from(binary.slice(16, 24), (char) =>
    char.charCodeAt(0),
  );
  const view = new DataView(bytes.buffer);
  if (
    [view.getUint32(0), view.getUint32(4)].some(
      (size) => size < 1 || size > 128,
    )
  )
    invalid();
}

export function validateBrandKit(value: unknown): asserts value is BrandKit {
  const raw = record(
    value,
    [
      "schemaVersion",
      "id",
      "revision",
      "name",
      "createdAt",
      "updatedAt",
      "colors",
      "fonts",
    ],
    ["logo"],
  );
  if (
    raw.schemaVersion !== 1 ||
    typeof raw.id !== "string" ||
    !/^[a-zA-Z0-9_-]{1,100}$/.test(raw.id)
  )
    invalid();
  if (
    typeof raw.name !== "string" ||
    !raw.name.trim() ||
    raw.name.length > 80 ||
    raw.name.includes("\0")
  )
    invalid();
  for (const key of ["revision", "createdAt", "updatedAt"])
    if (
      !Number.isSafeInteger(raw[key]) ||
      (raw[key] as number) < (key === "revision" ? 1 : 0)
    )
      invalid();
  const colors = record(raw.colors, [
    "background",
    "text",
    "accent",
    "secondary",
  ]);
  if (
    Object.values(colors).some(
      (color) => typeof color !== "string" || !/^#[\da-f]{6}$/i.test(color),
    )
  )
    invalid();
  const fonts = record(raw.fonts, ["title", "body"]);
  if (
    Object.values(fonts).some((font) => !brandFonts.includes(font as BrandFont))
  )
    invalid();
  if (Object.hasOwn(raw, "logo")) validateBrandLogo(raw.logo);
}

export function brandSnapshotKey(kit: BrandKit): string {
  return `${kit.id}_r${kit.revision}`;
}

export function newBrandKit(name = "My app"): BrandKit {
  const now = Date.now();
  return {
    schemaVersion: 1,
    id: crypto.randomUUID(),
    revision: 1,
    name,
    createdAt: now,
    updatedAt: now,
    colors: {
      background: "#E3E8DE",
      text: "#202725",
      accent: "#47755B",
      secondary: "#C4D1BE",
    },
    fonts: { title: "Manrope", body: "Manrope" },
  };
}
