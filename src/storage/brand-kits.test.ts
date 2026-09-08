import "fake-indexeddb/auto";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  newBrandKit,
  validateBrandKit,
  validateBrandLogo,
  BRAND_FILE_LIMIT,
} from "../core/brand-kit";
import { deleteBrandKit, listBrandKits, saveBrandKit } from "./repository";
import { exportBrandKit, importBrandKit } from "./brand-backup";

const logo =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=";
afterEach(async () => {
  vi.restoreAllMocks();
  for (const kit of await listBrandKits())
    await deleteBrandKit(kit.id, kit.revision);
});

describe("local and portable brand kits", () => {
  it("round-trips a logo, colors and fonts through local storage and a standalone file", async () => {
    const kit = { ...newBrandKit("FrogHappy"), logo };
    kit.fonts.title = "Fraunces";
    const saved = await saveBrandKit(kit, 0);
    expect(await listBrandKits()).toEqual([saved]);
    const imported = await importBrandKit(
      new File([exportBrandKit(saved)], "brand.henbrand"),
    );
    expect(imported.id).not.toBe(saved.id);
    expect(imported.revision).toBe(1);
    expect(imported.colors).toEqual(saved.colors);
    expect(imported.fonts).toEqual(saved.fonts);
    expect(imported.logo).toBe(logo);
    await saveBrandKit(imported, 0);
    expect(await listBrandKits()).toHaveLength(2);
  });
  it("allows one writer and rejects stale updates and deletions", async () => {
    const original = await saveBrandKit(newBrandKit(), 0);
    const results = await Promise.allSettled([
      saveBrandKit({ ...original, name: "One" }, 1),
      saveBrandKit({ ...original, name: "Two" }, 1),
    ]);
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    await expect(deleteBrandKit(original.id, 1)).rejects.toThrow("another tab");
    const [updated] = await listBrandKits();
    expect(updated.revision).toBe(2);
    await deleteBrandKit(updated.id, 2);
    await expect(saveBrandKit(original, 1)).rejects.toThrow("another tab");
  });
  it("keeps the saved revision when a write fails", async () => {
    const saved = await saveBrandKit(newBrandKit(), 0);
    vi.spyOn(IDBObjectStore.prototype, "put").mockImplementation(() => {
      throw new DOMException("Disk full", "QuotaExceededError");
    });
    await expect(
      saveBrandKit({ ...saved, name: "Unsaved" }, 1),
    ).rejects.toThrow();
    vi.restoreAllMocks();
    expect(await listBrandKits()).toEqual([saved]);
  });
  it.each([
    { name: " " },
    { schemaVersion: 2 },
    { revision: 0 },
    { colors: { background: "red" } },
    { fonts: { title: "https://fonts.invalid/font.woff", body: "Manrope" } },
    { logo: "https://example.com/tracker.png" },
    { logo: "data:image/svg+xml;base64,PHN2Zy8+" },
    { remoteUrl: "https://example.com" },
  ])("rejects unsupported or malformed brand fields: %j", (patch) => {
    expect(() => validateBrandKit({ ...newBrandKit(), ...patch })).toThrow();
  });
  it("rejects a logo with oversized declared dimensions before rendering", () => {
    const bytes = Uint8Array.from(atob(logo.slice(22)), (char) =>
      char.charCodeAt(0),
    );
    new DataView(bytes.buffer).setUint32(16, 100000);
    expect(() =>
      validateBrandLogo(
        `data:image/png;base64,${btoa(String.fromCharCode(...bytes))}`,
      ),
    ).toThrow();
  });
  it("bounds import size before reading and rejects unknown file formats", async () => {
    const huge = new File(
      [new Uint8Array(BRAND_FILE_LIMIT + 1)],
      "huge.henbrand",
    );
    const read = vi.spyOn(huge, "text");
    await expect(importBrandKit(huge)).rejects.toThrow("128 KB");
    expect(read).not.toHaveBeenCalled();
    await expect(
      importBrandKit(new File(["not json"], "bad.henbrand")),
    ).rejects.toThrow("JSON");
    await expect(
      importBrandKit(
        new File(
          [JSON.stringify({ format: "other", kit: newBrandKit() })],
          "bad.henbrand",
        ),
      ),
    ).rejects.toThrow("valid Hen Screenshots");
  });
});
