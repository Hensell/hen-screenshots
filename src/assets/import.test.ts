import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LIMITS } from "../core/model";
import { importImages } from "./import";

function png(width = 1, height = 1): File {
  const bytes = new Uint8Array(24);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10], 0);
  bytes.set([73, 72, 68, 82], 12);
  new DataView(bytes.buffer).setUint32(16, width);
  new DataView(bytes.buffer).setUint32(20, height);
  return new File([bytes], "screen.png", { type: "image/png" });
}
let broken = false;
class FakeImage {
  naturalWidth = 1;
  naturalHeight = 1;
  decoding = "";
  onload: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  set src(_value: string) {
    queueMicrotask(() =>
      broken
        ? this.onerror?.(new Event("error"))
        : this.onload?.(new Event("load")),
    );
  }
}
beforeEach(() => {
  broken = false;
  vi.stubGlobal("Image", FakeImage);
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("image import boundaries", () => {
  it("preserves the original file and releases the decoder URL", async () => {
    const file = png();
    const [asset] = await importImages([file]);
    expect(asset.blob).toBe(file);
    expect(asset).toMatchObject({ mime: "image/png", width: 1, height: 1 });
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test");
  });
  it("rejects unsupported bytes even if the declared MIME is PNG", async () => {
    await expect(
      importImages([new File(["<svg/>"], "fake.png", { type: "image/png" })]),
    ).rejects.toThrow("valid PNG");
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
  it("rejects dangerous pixel dimensions before asking the browser to decode", async () => {
    await expect(importImages([png(6000, 5000)])).rejects.toThrow(
      "24 megapixels",
    );
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
  it("releases URLs on decode failure and rejects the whole batch", async () => {
    broken = true;
    await expect(importImages([png()])).rejects.toThrow("Could not decode");
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test");
  });
  it("enforces count, per-image size and aggregate size before reading files", async () => {
    await expect(
      importImages(Array.from({ length: 21 }, () => png())),
    ).rejects.toThrow("20 images");
    const large = png();
    Object.defineProperty(large, "size", { value: LIMITS.assetBytes + 1 });
    await expect(importImages([large])).rejects.toThrow("20 MB");
    const batch = Array.from({ length: 7 }, () => {
      const file = png();
      Object.defineProperty(file, "size", { value: LIMITS.assetBytes });
      return file;
    });
    await expect(importImages(batch)).rejects.toThrow("120 MB");
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
});
