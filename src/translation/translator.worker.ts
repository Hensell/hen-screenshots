import {
  pipeline,
  env,
  type TranslationPipeline,
} from "@huggingface/transformers";
import { TRANSLATION_CACHE } from "./catalog";
import type { TranslationJob, TranslationProgress } from "./client";

// WASM in a dedicated worker keeps manual editing usable, without a GPU or Chrome-only API.
// A single thread also works without cross-origin isolation (SharedArrayBuffer).
env.allowLocalModels = false;
env.cacheKey = TRANSLATION_CACHE;
env.backends.onnx.wasm!.numThreads = 1;
env.backends.onnx.wasm!.proxy = false;
const report = (value: TranslationProgress) =>
  self.postMessage({ type: "progress", value });
self.onmessage = async (event: MessageEvent<TranslationJob>) => {
  const { packs, entries } = event.data;
  let translator: TranslationPipeline | undefined;
  try {
    const result = structuredClone(entries);
    // Complete one language pair, release its memory, then load the next for routes through English.
    for (const [packIndex, pack] of packs.entries()) {
      const downloads = new Map<string, number>();
      report({
        phase: "download",
        message: `Preparing language pack ${packIndex + 1} of ${packs.length}…`,
      });
      translator = await pipeline("translation", pack.id, {
        revision: pack.revision,
        device: "wasm",
        dtype: "q8",
        // ORT's QDQ fusion rejects these published Marian weights. Keep the original
        // graph; correctness is verified with the real quantized model in the browser.
        session_options: { graphOptimizationLevel: "disabled" },
        progress_callback: (progress) => {
          if (progress.status === "progress") {
            downloads.set(progress.file, progress.loaded);
            const loaded = [...downloads.values()].reduce((a, b) => a + b, 0);
            report({
              phase: "download",
              message: `Downloading language pack ${packIndex + 1} of ${packs.length}…`,
              percent: Math.min(99, Math.round((loaded / pack.bytes) * 100)),
            });
          } else if (progress.status === "done") {
            report({
              phase: "download",
              message: `Loading language pack ${packIndex + 1} of ${packs.length}…`,
            });
          }
        },
      });
      for (const [index, entry] of result.entries()) {
        report({
          phase: "translate",
          message: `Translating slide ${index + 1} of ${result.length}${packs.length > 1 ? ` · pass ${packIndex + 1} of ${packs.length}` : ""}…`,
          percent: Math.round(
            ((packIndex * result.length + index) /
              (packs.length * result.length)) *
              100,
          ),
        });
        for (const key of ["title", "subtitle"] as const) {
          const input = entry[key].trim();
          if (!input) {
            entry[key] = "";
            continue;
          }
          const output = await translator(input.replace(/\s*\n\s*/g, " "), {
            max_new_tokens: 192,
            num_beams: 2,
          });
          const first = output[0];
          if (
            !first ||
            !("translation_text" in first) ||
            typeof first.translation_text !== "string" ||
            !first.translation_text.trim()
          )
            throw new Error(
              "The translator returned an empty result. Try again or edit this slide manually.",
            );
          entry[key] = first.translation_text.trim();
        }
      }
      await translator.dispose();
      translator = undefined;
    }
    self.postMessage({ type: "done", entries: result });
  } catch (error) {
    console.error("Local translation failed", error);
    self.postMessage({
      type: "error",
      message:
        "The local translator could not finish. Check your connection and free device storage, then retry or continue manually. Your existing text is safe.",
    });
  } finally {
    await translator?.dispose();
  }
};
