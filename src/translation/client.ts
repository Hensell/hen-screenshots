import {
  TRANSLATION_CACHE,
  modelFileNames,
  packFileUrl,
  type TranslationPack,
} from "./catalog";
import type { TranslationDraft } from "../core/localization";

export type TranslationProgress = {
  phase: "download" | "translate";
  message: string;
  percent?: number;
};
export interface TranslationJob {
  packs: TranslationPack[];
  entries: TranslationDraft[];
}
export function translateLocally(
  job: TranslationJob,
  signal: AbortSignal,
  progress: (value: TranslationProgress) => void,
): Promise<TranslationDraft[]> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Cancelled", "AbortError"));
      return;
    }
    const worker = new Worker(
      new URL("./translator.worker.ts", import.meta.url),
      { type: "module" },
    );
    let timer: ReturnType<typeof setTimeout>;
    const cleanup = () => {
      worker.terminate();
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
    };
    const abort = () => {
      cleanup();
      reject(new DOMException("Cancelled", "AbortError"));
    };
    const resetTimeout = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        cleanup();
        reject(
          new Error(
            "The translator stopped responding. Try again or continue manually.",
          ),
        );
      }, 180_000);
    };
    signal.addEventListener("abort", abort, { once: true });
    worker.onmessage = (event) => {
      const message = event.data;
      resetTimeout();
      if (message.type === "progress") progress(message.value);
      else if (message.type === "done") {
        cleanup();
        resolve(message.entries);
      } else if (message.type === "error") {
        cleanup();
        reject(new Error(message.message));
      }
    };
    worker.onerror = (event) => {
      cleanup();
      reject(
        new Error(
          event.message ||
            "The translator could not start in this browser. Continue manually or try again.",
        ),
      );
    };
    resetTimeout();
    worker.postMessage(job);
  });
}
export async function downloadedPacks(
  packs: TranslationPack[],
): Promise<boolean[]> {
  if (!("caches" in globalThis)) return packs.map(() => false);
  try {
    const cache = await caches.open(TRANSLATION_CACHE);
    return await Promise.all(
      packs.map(async (pack) =>
        (
          await Promise.all(
            modelFileNames.map((file) => cache.match(packFileUrl(pack, file))),
          )
        ).every(Boolean),
      ),
    );
  } catch {
    return packs.map(() => false);
  }
}
export async function clearTranslationCache() {
  if ("caches" in globalThis) await caches.delete(TRANSLATION_CACHE);
}
