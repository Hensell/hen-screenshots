import { reviewImage, type ReviewedImage } from "./image-review";

export function decodeHeif(file: File, signal: AbortSignal): Promise<Blob> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    let worker: Worker;
    try {
      worker = new Worker(new URL("./heif.worker.ts", import.meta.url), {
        type: "module",
      });
    } catch {
      reject(
        new Error(
          "HEIC conversion is unavailable in this browser. Export an SDR PNG or JPEG from Photos and import that copy.",
        ),
      );
      return;
    }
    function finish(error?: Error, blob?: Blob) {
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      worker.terminate();
      if (error) reject(error);
      else resolve(blob!);
    }
    const abort = () => finish(new DOMException("Aborted", "AbortError"));
    const timer = setTimeout(
      () =>
        finish(
          new Error(
            "HEIC conversion took too long. Try again with a smaller image, or export an SDR PNG or JPEG from Photos.",
          ),
        ),
      60_000,
    );
    signal.addEventListener("abort", abort, { once: true });
    worker.onmessage = ({
      data,
    }: MessageEvent<{ blob?: Blob; error?: string }>) => {
      if (
        data.blob instanceof Blob &&
        data.blob.size &&
        data.blob.type === "image/png"
      )
        finish(undefined, data.blob);
      else
        finish(
          new Error(
            data.error ||
              "This HEIC could not be converted. It may be damaged or use an unsupported encoding. Export an SDR PNG or JPEG from Photos and try that copy.",
          ),
        );
    };
    worker.onerror = (event) => {
      event.preventDefault();
      finish(
        new Error(
          "The HEIC converter could not start. Check your connection and try again, or export an SDR PNG or JPEG from Photos.",
        ),
      );
    };
    try {
      worker.postMessage(file);
    } catch {
      finish(
        new Error(
          "HEIC conversion is unavailable in this browser. Export an SDR PNG or JPEG from Photos and import that copy.",
        ),
      );
    }
  });
}

export async function convertHeif(
  row: ReviewedImage,
  maxBytes: number,
  signal: AbortSignal,
): Promise<ReviewedImage> {
  const blob = await decodeHeif(row.file, signal);
  signal.throwIfAborted();
  const file = new File(
    [blob],
    row.file.name.replace(/\.[^.]*$/, "").slice(0, 225) + ".converted.png",
    { type: "image/png" },
  );
  const reviewed = await reviewImage(file, maxBytes);
  signal.throwIfAborted();
  return { ...reviewed, converted: true };
}
