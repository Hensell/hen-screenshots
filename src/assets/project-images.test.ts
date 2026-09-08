import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Asset } from "../core/model";
import { loadImage } from "./import";
import { loadReferencedImages } from "./project-images";

vi.mock("./import", () => ({ loadImage: vi.fn() }));
const decode = vi.mocked(loadImage);
const asset = (id: string): Asset => ({
  id,
  name: `${id}.png`,
  mime: "image/png",
  width: 1,
  height: 1,
  blob: new Blob([id]),
});
const image = { naturalWidth: 1, naturalHeight: 1 } as HTMLImageElement;
beforeEach(() => {
  decode.mockReset();
});

describe("current project image loading", () => {
  it("recovers after replacing a broken image even though undo retains its bytes", async () => {
    const broken = asset("broken"),
      replacement = asset("replacement");
    decode.mockImplementation(async (source) => {
      if (source.id === broken.id) throw new Error("Could not decode");
      return image;
    });
    const signal = new AbortController().signal;
    await expect(
      loadReferencedImages([broken], [broken.id], new Map(), signal),
    ).rejects.toThrow("Could not decode");
    decode.mockClear();
    const loaded = await loadReferencedImages(
      [broken, replacement],
      [replacement.id],
      new Map(),
      signal,
    );
    expect([...loaded.keys()]).toEqual([replacement.id]);
    expect(decode).toHaveBeenCalledExactlyOnceWith(replacement);
  });

  it("deduplicates panorama images, reuses current images, and reloads images restored by Undo", async () => {
    const original = asset("original"),
      replacement = asset("replacement");
    decode.mockResolvedValue(image);
    const signal = new AbortController().signal;
    const loaded = await loadReferencedImages(
      [original, replacement],
      [replacement.id, replacement.id],
      new Map([
        [replacement.id, image],
        [original.id, image],
      ]),
      signal,
    );
    expect([...loaded.keys()]).toEqual([replacement.id]);
    expect(decode).not.toHaveBeenCalled();
    const undone = await loadReferencedImages(
      [original, replacement],
      [original.id],
      loaded,
      signal,
    );
    expect(undone.get(original.id)).toBe(image);
    expect(decode).toHaveBeenCalledExactlyOnceWith(original);
    expect(await loadReferencedImages([original], [], undone, signal)).toEqual(
      new Map(),
    );
  });

  it("decodes one image at a time and stops a cancelled load before the next image", async () => {
    const first = asset("first"),
      second = asset("second");
    let finish!: (value: HTMLImageElement) => void;
    decode
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      )
      .mockResolvedValue(image);
    const controller = new AbortController();
    const pending = loadReferencedImages(
      [first, second],
      [first.id, second.id],
      new Map(),
      controller.signal,
    );
    expect(decode).toHaveBeenCalledExactlyOnceWith(first);
    controller.abort();
    finish(image);
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(decode).toHaveBeenCalledTimes(1);
    const loaded = await loadReferencedImages(
      [first, second],
      [first.id, second.id],
      new Map(),
      new AbortController().signal,
    );
    expect(loaded.size).toBe(2);
  });

  it("reports a missing current image instead of silently leaving a blank preview", async () => {
    await expect(
      loadReferencedImages(
        [],
        ["missing"],
        new Map(),
        new AbortController().signal,
      ),
    ).rejects.toThrow("image is missing");
  });
});
