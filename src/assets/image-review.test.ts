import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { imageHeader } from "./image-header";
import {
  compressionTarget,
  reviewImage,
  reviewImages,
  selectionBudget,
} from "./image-review";
import { loadImage } from "./import";
import { LIMITS } from "../core/model";

function png(width = 1, height = 1) {
  const bytes = new Uint8Array(45);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
  bytes.set([73, 72, 68, 82], 12);
  const view = new DataView(bytes.buffer);
  view.setUint32(8, 13);
  bytes.set(new TextEncoder().encode("IDAT"), 37);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return new File([bytes], "a-very-long-filename.png", { type: "image/png" });
}
let broken = false;
class FakeImage {
  naturalWidth = 1;
  naturalHeight = 1;
  decoding = "";
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  set src(_s: string) {
    queueMicrotask(() => (broken ? this.onerror?.() : this.onload?.()));
  }
}
beforeEach(() => {
  broken = false;
  vi.stubGlobal("Image", FakeImage);
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:review");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("image upload recovery", () => {
  it("accepts 50 MB screenshots unchanged and offers compression above the limit", async () => {
    const file = png();
    Object.defineProperty(file, "size", { value: 50 * 1024 * 1024 });
    const accepted = await reviewImage(file);
    expect(accepted.asset?.blob).toBe(file);
    expect(accepted.error).toBeUndefined();
    const larger = png();
    Object.defineProperty(larger, "size", { value: 50 * 1024 * 1024 + 1 });
    expect(await reviewImage(larger)).toMatchObject({
      canOptimize: true,
      error: expect.stringContaining("50.0 MB"),
    });
    expect(LIMITS.totalBytes).toBe(120 * 1024 * 1024);
  });
  it("distinguishes empty files, disguised HEIC, invalid content, and unreadable valid headers", async () => {
    expect(await reviewImage(new File([], "empty.jpg"))).toMatchObject({
      canOptimize: false,
      error: expect.stringContaining("empty"),
    });
    const heic = new Uint8Array(24);
    heic.set(new TextEncoder().encode("ftypheic"), 4);
    expect(
      await reviewImage(new File([heic], "fake.jpg", { type: "image/jpeg" })),
    ).toMatchObject({
      canOptimize: false,
      canConvert: true,
    });
    expect(await reviewImage(new File(["<svg/>"], "fake.png"))).toMatchObject({
      canOptimize: false,
      error: expect.stringContaining("signature"),
    });
    broken = true;
    expect(await reviewImage(png())).toMatchObject({
      canOptimize: true,
      error: expect.stringContaining("encoding this browser cannot read"),
    });
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:review");
  });
  it("offers bounded compression before decoding oversized files or pixel data", async () => {
    const oversized = png();
    Object.defineProperty(oversized, "size", { value: 51 * 1024 * 1024 });
    expect(await reviewImage(oversized)).toMatchObject({
      canOptimize: true,
      error: expect.stringContaining("50.0 MB"),
    });
    expect(await reviewImage(png(6000, 5000))).toMatchObject({
      canOptimize: true,
      error: expect.stringContaining("24 megapixels"),
    });
    expect(await reviewImage(png(9000, 9000))).toMatchObject({
      canOptimize: false,
      error: expect.stringContaining("64 megapixels"),
    });
    const huge = png();
    Object.defineProperty(huge, "size", { value: 81 * 1024 * 1024 });
    expect(await reviewImage(huge)).toMatchObject({
      canOptimize: false,
      error: expect.stringContaining("80 MB"),
    });
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
  it("supports the logo limit and keeps valid selections when another file needs attention", async () => {
    const logo = png();
    Object.defineProperty(logo, "size", { value: 6 * 1024 * 1024 });
    expect(await reviewImage(logo, 5 * 1024 * 1024)).toMatchObject({
      canOptimize: true,
      error: expect.stringContaining("5.0 MB"),
    });
    const rows = await reviewImages([png(), new File([], "bad.jpg")]);
    expect(selectionBudget(rows, [true, true], 1000).valid).toBe(false);
    expect(selectionBudget(rows, [true, false], 1000).valid).toBe(true);
    expect(selectionBudget(rows, [false, false], 1000).valid).toBe(false);
    expect(selectionBudget(rows, [true, false], 1).valid).toBe(false);
    expect(selectionBudget(rows, [true, false], rows[0].file.size).valid).toBe(
      true,
    );
  });
  it("keeps large HEIC logo sources non-importable until their PNG copy fits the logo limit", async () => {
    const header = new Uint8Array(24);
    header.set(new TextEncoder().encode("ftypheic"), 4);
    const source = new File([header], "large-logo.heic");
    Object.defineProperty(source, "size", { value: 50 * 1024 * 1024 });
    const pending = await reviewImage(source, 5 * 1024 * 1024);
    expect(pending.canConvert).toBe(true);
    expect(selectionBudget([pending], [true], LIMITS.totalBytes).valid).toBe(
      false,
    );
    const copy = png();
    Object.defineProperty(copy, "size", { value: 6 * 1024 * 1024 });
    const oversized = await reviewImage(copy, 5 * 1024 * 1024);
    expect(oversized.asset).toBeUndefined();
    expect(oversized.canOptimize).toBe(true);
    expect(oversized.error).toContain("5.0 MB");
  });
  it("validates individually even when a selected batch needs total-size compression", async () => {
    const files = Array.from({ length: 7 }, () => {
      const file = png();
      Object.defineProperty(file, "size", { value: 20 * 1024 * 1024 });
      return file;
    });
    const rows = await reviewImages(files);
    expect(rows.every((row) => !!row.asset)).toBe(true);
    expect(
      selectionBudget(
        rows,
        files.map(() => true),
        LIMITS.totalBytes,
      ).valid,
    ).toBe(false);
    expect(
      selectionBudget(
        rows,
        files.map((_, i) => i < 6),
        LIMITS.totalBytes,
      ).valid,
    ).toBe(true);
  });
  it("stops cancelled work before reading files and rejects excess counts", async () => {
    const c = new AbortController();
    c.abort();
    await expect(
      reviewImages([png()], LIMITS.assetBytes, c.signal),
    ).rejects.toMatchObject({ name: "AbortError" });
    await expect(
      reviewImages(Array.from({ length: 21 }, () => png())),
    ).rejects.toThrow("21 files");
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
  it("times out a stalled decoder and releases its URL", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "Image",
      class {
        onload = null;
        onerror = null;
        src = "";
      },
    );
    const task = loadImage({
      id: "a",
      name: "stuck.jpg",
      mime: "image/jpeg",
      width: 1,
      height: 1,
      blob: png(),
    });
    const rejected = expect(task).rejects.toThrow("took too long");
    await vi.advanceTimersByTimeAsync(25000);
    await rejected;
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:review");
  });
});

describe("image signatures and display orientation", () => {
  it("recognizes PNG data independently of a misleading filename", async () => {
    const original = png();
    const file = new File([original], "camera.jpg", { type: "image/jpeg" });
    expect((await reviewImage(file)).asset?.mime).toBe("image/png");
  });
  it("reads the displayed axes of a portrait JPEG with EXIF rotation", () => {
    const exif = new Uint8Array(32);
    exif.set(new TextEncoder().encode("Exif\0\0"));
    const v = new DataView(exif.buffer);
    v.setUint16(6, 0x4949);
    v.setUint16(8, 42, true);
    v.setUint32(10, 8, true);
    v.setUint16(14, 1, true);
    v.setUint16(16, 0x112, true);
    v.setUint16(18, 3, true);
    v.setUint32(20, 1, true);
    v.setUint16(24, 6, true);
    const bytes = new Uint8Array([
      255,
      216,
      255,
      225,
      0,
      34,
      ...exif,
      255,
      192,
      0,
      8,
      8,
      0,
      20,
      0,
      40,
      1,
    ]);
    expect(imageHeader(bytes)).toEqual({
      mime: "image/jpeg",
      width: 20,
      height: 40,
    });
  });
  it("rejects animation and zero dimensions without a full decoder", async () => {
    const bytes = new Uint8Array(45);
    bytes.set(new Uint8Array(await png().arrayBuffer()));
    new DataView(bytes.buffer).setUint32(8, 13);
    bytes.set(new TextEncoder().encode("acTL"), 37);
    expect(() => imageHeader(bytes)).toThrow("Animated PNG");
    expect(await reviewImage(png(0, 5))).toMatchObject({
      canOptimize: false,
      error: expect.stringContaining("dimensions are invalid"),
    });
  });
});

describe("metadata and mixed-selection regressions", () => {
  it("accepts a JPEG whose dimensions follow more than 1 MiB of APP metadata", async () => {
    const segment = new Uint8Array(65537);
    segment.set([255, 226, 255, 255]);
    const file = new File(
      [
        new Uint8Array([255, 216]),
        ...Array(17).fill(segment),
        new Uint8Array([255, 192, 0, 8, 8, 0, 20, 0, 40, 1]),
      ],
      "metadata-heavy.jpg",
      { type: "image/jpeg" },
    );
    expect(await reviewImage(file)).toMatchObject({
      canOptimize: true,
      info: { mime: "image/jpeg", width: 40, height: 20 },
      asset: { mime: "image/jpeg" },
    });
  });
  it("identifies AVIF before its generic HEIF compatibility brand", async () => {
    const bytes = new Uint8Array(32);
    bytes.set(new TextEncoder().encode("ftypavif"), 4);
    bytes.set(new TextEncoder().encode("mif1"), 16);
    expect(
      (await reviewImage(new File([bytes], "photo.avif"))).conversion,
    ).toBe("avif");
  });
  it("reserves valid selections without unnecessarily shrinking the one oversized file", async () => {
    const mb = 1024 * 1024;
    const small = await reviewImage(png());
    const oneMb = {
      ...small,
      asset: { ...small.asset!, blob: new Blob([new Uint8Array(mb)]) },
    };
    const large = new File(
      [await png().arrayBuffer(), new Uint8Array(21 * mb)],
      "large.png",
    );
    const oversized = await reviewImage(large);
    const rows = [...Array(6).fill(oneMb), oversized];
    expect(
      compressionTarget(
        rows,
        rows.map(() => true),
        [6],
        27 * mb,
        20 * mb,
      ),
    ).toBe(20 * mb);
    expect(
      compressionTarget(
        rows,
        rows.map(() => true),
        [6],
        9 * mb,
        20 * mb,
      ),
    ).toBe(3 * mb);
    expect(
      compressionTarget(
        rows,
        rows.map(() => true),
        [6],
        5 * mb,
        20 * mb,
      ),
    ).toBe(0);
    expect(
      compressionTarget(
        [oversized, oversized],
        [true, true],
        [0, 1],
        30 * mb,
        20 * mb,
      ),
    ).toBe(15 * mb);
    // When the batch itself is over budget, small valid sources reserve less than large ones.
    const targets = rows.map((_, index) => index);
    expect(
      compressionTarget(
        rows,
        rows.map(() => true),
        targets,
        26 * mb,
        20 * mb,
      ),
    ).toBe(mb);
    expect(
      compressionTarget(
        [oversized, oneMb],
        [true, true],
        [0, 1],
        21 * mb,
        20 * mb,
      ),
    ).toBe(20 * mb);
  });
});

it("checks PNG animation after large ancillary metadata without decoding pixel data", async () => {
  const header = new Uint8Array(33);
  header.set(new Uint8Array(await png().arrayBuffer()).subarray(0, 24));
  new DataView(header.buffer).setUint32(8, 13);
  const metadata = new Uint8Array(1024 * 1024 + 140);
  new DataView(metadata.buffer).setUint32(0, metadata.length - 12);
  metadata.set(new TextEncoder().encode("tEXt"), 4);
  const control = new Uint8Array(20);
  new DataView(control.buffer).setUint32(0, 8);
  control.set(new TextEncoder().encode("acTL"), 4);
  const file = new File([header, metadata, control], "metadata-animation.png");
  expect(await reviewImage(file)).toMatchObject({
    canOptimize: false,
    error: expect.stringContaining("Animated PNG"),
  });
  expect(URL.createObjectURL).not.toHaveBeenCalled();
  // The same sequence inside IDAT is pixel data, not an animation declaration.
  metadata.set(new TextEncoder().encode("IDAT"), 4);
  expect(
    (await reviewImage(new File([header, metadata, control], "still.png")))
      .asset?.mime,
  ).toBe("image/png");
});
