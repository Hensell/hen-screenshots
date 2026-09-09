import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { decodeHeif, convertHeif } from "./heif";
import { reviewImage } from "./image-review";
vi.mock("./image-review", () => ({ reviewImage: vi.fn() }));
const workers: FakeWorker[] = [];
class FakeWorker {
  terminate = vi.fn();
  postMessage = vi.fn();
  onmessage?: (event: { data: { blob?: Blob; error?: string } }) => void;
  onerror?: (event: { preventDefault(): void }) => void;
  constructor() {
    workers.push(this);
  }
}
const file = new File(["heic"], "iPhone.jpg", { type: "image/jpeg" });
beforeEach(() => {
  workers.length = 0;
  vi.stubGlobal("Worker", FakeWorker);
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});

describe("on-demand HEIC worker lifecycle", () => {
  it("does not start cancelled work and stops active conversion immediately", async () => {
    const controller = new AbortController();
    controller.abort();
    expect(() => decodeHeif(file, controller.signal)).toThrow();
    expect(workers).toHaveLength(0);
    const active = new AbortController();
    const pending = decodeHeif(file, active.signal);
    const rejected = expect(pending).rejects.toMatchObject({
      name: "AbortError",
    });
    active.abort();
    await rejected;
    expect(workers[0].terminate).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("releases a stalled decoder and gives recovery instructions", async () => {
    const pending = decodeHeif(file, new AbortController().signal);
    const rejected = expect(pending).rejects.toThrow("took too long");
    await vi.advanceTimersByTimeAsync(60_000);
    await rejected;
    expect(workers[0].terminate).toHaveBeenCalledOnce();
  });
  it("cleans up on load errors and rejects unexpected output", async () => {
    const pending = decodeHeif(file, new AbortController().signal);
    workers[0].onerror?.({ preventDefault() {} });
    await expect(pending).rejects.toThrow("Check your connection");
    expect(workers[0].terminate).toHaveBeenCalledOnce();
    const invalid = decodeHeif(file, new AbortController().signal);
    workers[1].onmessage?.({
      data: { blob: new Blob(["oops"], { type: "image/jpeg" }) },
    });
    await expect(invalid).rejects.toThrow("could not be converted");
    expect(workers[1].terminate).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("revalidates the PNG against the caller's budget without resizing the original", async () => {
    vi.mocked(reviewImage).mockImplementation(async (copy) => ({
      file: copy,
      canOptimize: true,
      error: "Compress a copy",
    }));
    const converted = convertHeif(
      { file, canOptimize: false, canConvert: true },
      5_000,
      new AbortController().signal,
    );
    const png = new Blob(["encoded png"], { type: "image/png" });
    workers[0].onmessage?.({ data: { blob: png } });
    const result = await converted;
    expect(result.converted).toBe(true);
    expect(result.canOptimize).toBe(true);
    expect(result.canConvert).toBeUndefined();
    expect(result.file.name).toBe("iPhone.converted.png");
    expect(result.file.type).toBe("image/png");
    expect(reviewImage).toHaveBeenCalledWith(result.file, 5_000);
    expect(await file.text()).toBe("heic");
    expect(workers[0].terminate).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
});
