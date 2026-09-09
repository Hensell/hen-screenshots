import { describe, expect, it, vi, afterEach } from "vitest";
import { getExportProfile } from "../core/export-profiles";
import { publicationAdvice, reviewExportedImage } from "./review";
import { encodeExportCanvas } from "./images";
const sized = (size: number, type = "image/png") =>
  Object.defineProperty(new Blob([], { type }), "size", { value: size });
afterEach(() => vi.restoreAllMocks());
describe("export review and compression", () => {
  it("separates product recommendations from the published XR limit", () => {
    const blob = sized(8_000_001);
    expect(
      reviewExportedImage(
        blob,
        "01.png",
        getExportProfile("apple-iphone69-portrait"),
        "png",
      ),
    ).toMatchObject({ large: true, overLimit: false });
    expect(
      reviewExportedImage(blob, "01.png", getExportProfile("play-xr"), "png"),
    ).toMatchObject({ large: true, overLimit: true });
    expect(
      reviewExportedImage(
        sized(8_000_000),
        "01.jpg",
        getExportProfile("play-xr"),
        "jpeg",
      ).overLimit,
    ).toBe(false);
  });
  it("provides destination-specific count and content guidance", () => {
    expect(publicationAdvice(getExportProfile("portfolio-card"), 1)).toEqual(
      [],
    );
    expect(
      publicationAdvice(getExportProfile("play-xr"), 1).join(" "),
    ).toContain("at least 4");
    expect(
      publicationAdvice(getExportProfile("play-auto-landscape"), 4).join(" "),
    ).toContain("2 portrait and 2 landscape");
    expect(
      publicationAdvice(getExportProfile("play-wear"), 1).join(" "),
    ).toContain("original app capture");
  });
  it("compresses JPEGs without changing the canvas dimensions", async () => {
    const toBlob = vi
      .fn()
      .mockImplementationOnce((cb) => cb(sized(9_000_000, "image/jpeg")))
      .mockImplementationOnce((cb) => cb(sized(5_000_000, "image/jpeg")));
    const canvas = {
      width: 1320,
      height: 2868,
      toBlob,
    } as unknown as HTMLCanvasElement;
    expect((await encodeExportCanvas(canvas, "jpeg")).size).toBe(5_000_000);
    expect(toBlob.mock.calls.map((call) => call.slice(1))).toEqual([
      ["image/jpeg", 0.94],
      ["image/jpeg", 0.88],
    ]);
    expect([canvas.width, canvas.height]).toEqual([1320, 2868]);
  });
  it("rejects a silent encoder fallback and stops after cancellation", async () => {
    const canvas = {
      toBlob: (cb: BlobCallback) => cb(sized(123)),
    } as HTMLCanvasElement;
    await expect(encodeExportCanvas(canvas, "jpeg")).rejects.toThrow(/encode/);
    const controller = new AbortController();
    controller.abort();
    await expect(
      encodeExportCanvas(canvas, "png", controller.signal),
    ).rejects.toThrow();
  });
});
