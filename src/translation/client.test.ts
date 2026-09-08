import { afterEach, describe, expect, it, vi } from "vitest";
import {
  translateLocally,
  downloadedPacks,
  clearTranslationCache,
} from "./client";
import { TRANSLATION_CACHE, translationRoute } from "./catalog";
class FakeWorker {
  static latest: FakeWorker;
  onmessage?: (event: { data: unknown }) => void;
  onerror?: (event: { message: string }) => void;
  terminate = vi.fn();
  postMessage = vi.fn();
  constructor() {
    FakeWorker.latest = this;
  }
}
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
describe("optional translator lifecycle", () => {
  it("terminates the worker on cancellation and ignores late results", async () => {
    vi.stubGlobal("Worker", FakeWorker);
    const controller = new AbortController();
    const promise = translateLocally(
      { packs: translationRoute("en", "es")!, entries: [] },
      controller.signal,
      vi.fn(),
    );
    const outcome = expect(promise).rejects.toMatchObject({
      name: "AbortError",
    });
    controller.abort();
    FakeWorker.latest.onmessage?.({ data: { type: "done", entries: [] } });
    await outcome;
    expect(FakeWorker.latest.terminate).toHaveBeenCalled();
  });
  it("returns only completed batches and releases worker resources", async () => {
    vi.stubGlobal("Worker", FakeWorker);
    const progress = vi.fn();
    const pending = translateLocally(
      { packs: translationRoute("en", "es")!, entries: [] },
      new AbortController().signal,
      progress,
    );
    FakeWorker.latest.onmessage?.({
      data: {
        type: "progress",
        value: { phase: "download", message: "Downloading", percent: 30 },
      },
    });
    expect(progress).toHaveBeenCalledWith({
      phase: "download",
      message: "Downloading",
      percent: 30,
    });
    FakeWorker.latest.onmessage?.({
      data: { type: "error", message: "Download failed" },
    });
    await expect(pending).rejects.toThrow("Download failed");
    expect(FakeWorker.latest.terminate).toHaveBeenCalled();
  });
  it("reports unavailable caching without blocking manual work and clears only its own cache", async () => {
    vi.stubGlobal("caches", {
      open: vi.fn().mockRejectedValue(new Error("unavailable")),
      delete: vi.fn(),
    });
    expect(await downloadedPacks(translationRoute("en", "es")!)).toEqual([
      false,
    ]);
    await clearTranslationCache();
    expect(caches.delete).toHaveBeenCalledWith(TRANSLATION_CACHE);
  });
  it("times out a stalled worker without touching project data", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("Worker", FakeWorker);
    const pending = translateLocally(
      { packs: translationRoute("en", "es")!, entries: [] },
      new AbortController().signal,
      vi.fn(),
    );
    const outcome = expect(pending).rejects.toThrow("stopped responding");
    await vi.advanceTimersByTimeAsync(180_000);
    await outcome;
    expect(FakeWorker.latest.terminate).toHaveBeenCalled();
  });
});
