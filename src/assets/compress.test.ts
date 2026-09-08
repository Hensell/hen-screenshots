import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { compressImage } from "./compress";
import { reviewImage, type ReviewedImage } from "./image-review";
import { loadImage } from "./import";
vi.mock("./import", () => ({ loadImage: vi.fn() }));
vi.mock("./image-review", async (original) => ({
  ...(await original<typeof import("./image-review")>()),
  reviewImage: vi.fn(),
}));
let encoded: Blob;
const close = vi.fn(),
  drawImage = vi.fn(),
  canvas = {
    width: 0,
    height: 0,
    getContext: () => ({ drawImage }),
    toBlob: (callback: (blob: Blob | null) => void) => callback(encoded),
  };
const row = (): ReviewedImage => ({
  file: new File(["png"], "transparent-logo.png", { type: "image/png" }),
  info: { mime: "image/png", width: 6000, height: 5000 },
  canOptimize: true,
  error: "24 megapixels",
});
beforeEach(() => {
  vi.resetAllMocks();
  encoded = new Blob(["compressed"], { type: "image/webp" });
  vi.stubGlobal("document", { createElement: () => canvas });
  vi.stubGlobal(
    "createImageBitmap",
    vi.fn(async (_blob, options) => ({
      width: options.resizeWidth,
      height: options.resizeHeight,
      close,
    })),
  );
  vi.mocked(reviewImage).mockImplementation(async (file) => ({
    file,
    canOptimize: true,
    info: { mime: "image/webp", width: 100, height: 100 },
    asset: {
      id: "optimized",
      name: file.name,
      mime: "image/webp",
      width: 100,
      height: 100,
      blob: file,
    },
  }));
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
describe("local compression", () => {
  it("bounds decoder dimensions, preserves transparent format and validates output", async () => {
    const source = row(),
      result = await compressImage(source, 10000, new AbortController().signal);
    const opts = vi.mocked(createImageBitmap).mock
      .calls[0][1] as ImageBitmapOptions;
    expect(opts.resizeWidth! * opts.resizeHeight!).toBeLessThanOrEqual(
      12_000_000,
    );
    expect(opts.imageOrientation).toBe("from-image");
    expect(result).toMatchObject({
      optimized: true,
      before: { width: 6000, height: 5000 },
    });
    expect(result.asset!.mime).toBe("image/webp");
    expect(result.file.name).toBe("transparent-logo.optimized.webp");
    expect(source.file.name).toBe("transparent-logo.png");
    expect(close).toHaveBeenCalledOnce();
    expect(canvas.width).toBe(0);
  });
  it("accepts the PNG fallback when WebP encoding is unavailable", async () => {
    encoded = new Blob(["png"], { type: "image/png" });
    const result = await compressImage(
      row(),
      10000,
      new AbortController().signal,
    );
    expect(result.file.name).toBe("transparent-logo.optimized.png");
  });
  it("releases bitmaps on cancellation and never validates/imports cancelled output", async () => {
    const c = new AbortController();
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => {
        c.abort();
        return { width: 100, height: 100, close };
      }),
    );
    await expect(compressImage(row(), 10000, c.signal)).rejects.toMatchObject({
      name: "AbortError",
    });
    expect(close).toHaveBeenCalledOnce();
    expect(reviewImage).not.toHaveBeenCalled();
  });
  it("does not fall back to a full decoder for oversized pixel data", async () => {
    vi.stubGlobal("createImageBitmap", undefined);
    await expect(
      compressImage(row(), 10000, new AbortController().signal),
    ).rejects.toThrow("could not resize");
    expect(loadImage).not.toHaveBeenCalled();
  });
  it("rejects too little capacity and files that cannot be decoded", async () => {
    await expect(
      compressImage(row(), 500, new AbortController().signal),
    ).rejects.toThrow("not enough room");
    await expect(
      compressImage(
        { ...row(), canOptimize: false },
        10000,
        new AbortController().signal,
      ),
    ).rejects.toThrow("cannot be compressed");
    expect(createImageBitmap).not.toHaveBeenCalled();
  });
});
