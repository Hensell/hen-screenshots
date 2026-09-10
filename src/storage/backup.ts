import { referencedAssetIds, MAX_LANGUAGES } from "../core/localization";
import { strToU8, unzipSync, zipSync } from "fflate";
import type { UnzipFileInfo } from "fflate";
import { importImages } from "../assets/import";
import {
  LIMITS,
  SCHEMA_VERSION,
  migrateProject,
  validateProject,
} from "../core/model";
import type { Asset, LoadedProject, Project } from "../core/model";

const MANIFEST_LIMIT = 3 * 1024 * 1024;
const ARCHIVE_LIMIT = LIMITS.totalBytes + MANIFEST_LIMIT + 1024 * 1024;
const extensions: Record<Asset["mime"], string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};
type RecordValue = Record<string, unknown>;
interface AssetInfo {
  id: string;
  name: string;
  mime: Asset["mime"];
  width: number;
  height: number;
  size: number;
  path: string;
}
interface Manifest {
  format: "hen-screenshots";
  schemaVersion: typeof SCHEMA_VERSION;
  project: Project;
  assets: AssetInfo[];
}

function fail(
  message = "This project backup is invalid or unsupported.",
): never {
  throw new Error(message);
}
function record(value: unknown, keys: string[], required = keys): RecordValue {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail();
  const result = value as RecordValue;
  if (
    Object.keys(result).some((key) => !keys.includes(key)) ||
    required.some((key) => !Object.hasOwn(result, key))
  )
    fail();
  return result;
}
function string(value: unknown, maximum: number, minimum = 0): string {
  if (
    typeof value !== "string" ||
    value.length < minimum ||
    value.length > maximum ||
    value.includes("\0")
  )
    fail();
  return value;
}
function id(value: unknown): string {
  const result = string(value, 100, 1);
  if (!/^[a-zA-Z0-9_-]+$/.test(result)) fail();
  return result;
}
function number(
  value: unknown,
  minimum: number,
  maximum: number,
  integer = false,
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < minimum ||
    value > maximum ||
    (integer && !Number.isSafeInteger(value))
  )
    fail();
  return value;
}
function manifest(value: unknown): Manifest {
  const raw = record(value, ["format", "schemaVersion", "project", "assets"]);
  if (
    raw.format !== "hen-screenshots" ||
    (raw.schemaVersion !== 1 &&
      raw.schemaVersion !== 2 &&
      raw.schemaVersion !== 3 &&
      raw.schemaVersion !== 4 &&
      raw.schemaVersion !== 5 &&
      raw.schemaVersion !== 6 &&
      raw.schemaVersion !== 7 &&
      raw.schemaVersion !== 8 &&
      raw.schemaVersion !== 9 &&
      raw.schemaVersion !== SCHEMA_VERSION)
  )
    fail("This backup uses an unsupported project version.");
  validateProject(raw.project);
  if (raw.project.schemaVersion !== raw.schemaVersion)
    fail("The backup and project versions do not match.");
  const document = migrateProject(raw.project);
  if (
    !Array.isArray(raw.assets) ||
    raw.assets.length > LIMITS.shots * (3 * MAX_LANGUAGES + LIMITS.overlays)
  )
    fail();
  const assets: AssetInfo[] = raw.assets.map((value) => {
    const entry = record(value, [
      "id",
      "name",
      "mime",
      "width",
      "height",
      "size",
      "path",
    ]);
    const assetId = id(entry.id);
    if (
      typeof entry.mime !== "string" ||
      !Object.hasOwn(extensions, entry.mime)
    )
      fail();
    const mime = entry.mime as Asset["mime"];
    const width = number(entry.width, 1, LIMITS.imagePixels, true);
    const height = number(entry.height, 1, LIMITS.imagePixels, true);
    if (width * height > LIMITS.imagePixels)
      fail("An image exceeds 24 megapixels.");
    const path = string(entry.path, 130, 1);
    if (path !== `assets/${assetId}.${extensions[mime]}`) fail();
    return {
      id: assetId,
      name: string(entry.name, 255, 1),
      mime,
      width,
      height,
      path,
      size: number(entry.size, 1, LIMITS.assetBytes, true),
    };
  });
  if (
    new Set(assets.map((asset) => asset.id)).size !== assets.length ||
    assets.reduce((sum, asset) => sum + asset.size, 0) > LIMITS.totalBytes
  )
    fail();
  const references = new Set(referencedAssetIds(document));
  if (
    assets.length !== references.size ||
    assets.some((asset) => !references.has(asset.id))
  )
    fail("The backup is missing screenshot images or contains unused images.");
  return {
    format: "hen-screenshots",
    schemaVersion: SCHEMA_VERSION,
    project: document,
    assets,
  };
}

/** Original image bytes are stored without additional ZIP compression. */
export async function exportProject(
  document: Project,
  sourceAssets: Asset[],
): Promise<Blob> {
  const assetsById = new Map(sourceAssets.map((asset) => [asset.id, asset]));
  const referenced = [...new Set(referencedAssetIds(document))].map(
    (assetId) => {
      const asset = assetsById.get(assetId);
      if (!asset)
        fail("A screenshot image is missing. Re-import it before exporting.");
      return asset;
    },
  );
  const metadata: Manifest = manifest({
    format: "hen-screenshots",
    schemaVersion: SCHEMA_VERSION,
    project: document,
    assets: referenced.map((asset) => ({
      id: asset.id,
      name: asset.name,
      mime: asset.mime,
      width: asset.width,
      height: asset.height,
      size: asset.blob.size,
      path: `assets/${asset.id}.${extensions[asset.mime]}`,
    })),
  });
  const encoded = strToU8(JSON.stringify(metadata));
  if (encoded.byteLength > MANIFEST_LIMIT)
    fail("The project document is too large to export.");
  const files: Record<string, Uint8Array> = { "project.json": encoded };
  for (let index = 0; index < referenced.length; index++)
    files[metadata.assets[index].path] = new Uint8Array(
      await referenced[index].blob.arrayBuffer(),
    );
  return new Blob([new Uint8Array(zipSync(files, { level: 0 }))], {
    type: "application/zip",
  });
}

/** Read a bounded app backup, validate its real images, and return a new unsaved project. */
export async function importProject(
  file: File,
  decodeImages: typeof importImages = importImages,
): Promise<LoadedProject> {
  if (file.size < 22 || file.size > ARCHIVE_LIMIT)
    fail("Choose a valid project backup no larger than 124 MB.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const entries = new Map<string, UnzipFileInfo>();
  let total = 0;
  try {
    // fflate calls this filter before allocating or extracting each file. Reject
    // every unexpected entry before a second pass extracts stored bytes.
    unzipSync(bytes, {
      filter: (entry) => {
        if (
          entries.size >=
            LIMITS.shots * (3 * MAX_LANGUAGES + LIMITS.overlays) + 1 ||
          entries.has(entry.name)
        )
          fail("The backup contains too many files or duplicate filenames.");
        if (
          entry.name !== "project.json" &&
          !/^assets\/[a-zA-Z0-9_-]+\.(png|jpg|webp)$/.test(entry.name)
        )
          fail("The backup contains an unsupported file path.");
        if (entry.compression !== 0 || entry.size !== entry.originalSize)
          fail(
            "This backup uses unsupported compression. Use an original Hen Screenshots backup.",
          );
        const maximum =
          entry.name === "project.json" ? MANIFEST_LIMIT : LIMITS.assetBytes;
        if (entry.originalSize < 1 || entry.originalSize > maximum)
          fail("A file in the backup exceeds its size limit.");
        total += entry.originalSize;
        if (total > LIMITS.totalBytes + MANIFEST_LIMIT)
          fail("The backup exceeds the image size limit.");
        entries.set(entry.name, entry);
        return false;
      },
    });
  } catch (error) {
    if (error instanceof Error) throw error;
    fail();
  }
  if (!entries.has("project.json")) fail("The backup is missing project.json.");
  const extracted = unzipSync(bytes);
  for (const [name, entry] of entries)
    if (extracted[name]?.byteLength !== entry.originalSize)
      fail("The backup is truncated.");
  let metadata: Manifest;
  try {
    metadata = manifest(
      JSON.parse(
        new TextDecoder("utf-8", { fatal: true }).decode(
          extracted["project.json"],
        ),
      ),
    );
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof TypeError)
      fail("The backup document is invalid.");
    throw error;
  }
  if (entries.size !== metadata.assets.length + 1)
    fail("The backup contains unexpected files.");
  const imported: Asset[] = [];
  // The archive's global limits were validated above. Language variants may
  // reference more images than the editor's 20-image interactive import limit.
  for (let start = 0; start < metadata.assets.length; start += LIMITS.shots) {
    const files = metadata.assets
      .slice(start, start + LIMITS.shots)
      .map((asset) => {
        const data = extracted[asset.path];
        if (!data || data.byteLength !== asset.size)
          fail("A screenshot image is missing or truncated.");
        return new File([new Uint8Array(data)], asset.name, {
          type: asset.mime,
        });
      });
    imported.push(...(await decodeImages(files)));
  }
  const ids = new Map<string, string>();
  imported.forEach((asset, index) => {
    const original = metadata.assets[index];
    if (
      asset.mime !== original.mime ||
      asset.width !== original.width ||
      asset.height !== original.height
    )
      fail("Image contents do not match the project metadata.");
    ids.set(original.id, asset.id);
  });
  const now = Date.now();
  return {
    revision: 0,
    assets: imported,
    project: {
      ...metadata.project,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      shots: metadata.project.shots.map((shot) => ({
        ...shot,
        id: crypto.randomUUID(),
        assetId: shot.assetId === null ? null : ids.get(shot.assetId)!,
        ...(shot.overlays
          ? {
              overlays: shot.overlays.map((item) => ({
                ...item,
                id: crypto.randomUUID(),
                assetId: ids.get(item.assetId)!,
              })),
            }
          : {}),
        ...(shot.companions
          ? {
              companions: shot.companions.map((device) => ({
                ...device,
                assetId:
                  device.assetId === null ? null : ids.get(device.assetId)!,
              })),
            }
          : {}),
        ...(shot.translations
          ? {
              translations: Object.fromEntries(
                Object.entries(shot.translations).map(([locale, content]) => [
                  locale,
                  {
                    ...content,
                    ...(content.deviceAssets
                      ? {
                          deviceAssets: Object.fromEntries(
                            Object.entries(content.deviceAssets).map(
                              ([id, asset]) => [id, ids.get(asset)!],
                            ),
                          ),
                        }
                      : {}),
                    ...(content.assetId
                      ? { assetId: ids.get(content.assetId)! }
                      : {}),
                  },
                ]),
              ),
            }
          : {}),
      })),
    },
  };
}
