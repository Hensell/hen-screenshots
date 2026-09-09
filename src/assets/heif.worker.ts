import { LIMITS } from "../core/model";
import { primaryHeifProfile } from "./heif-format";
import { withPngProfile } from "./png-profile";

interface HeifImage {
  get_width(): number;
  get_height(): number;
  is_primary(): boolean;
  display(data: ImageData, callback: (data: ImageData | null) => void): void;
  free(): void;
}
interface Decoder {
  decoder: unknown;
  decode(data: Uint8Array): HeifImage[];
}
interface LibHeif {
  HeifDecoder: new () => Decoder;
  heif_context_free(context: unknown): void;
}

// The vetted upstream decoder is served locally and loaded only after explicit conversion.
self.onmessage = async (event: MessageEvent<File>) => {
  let lib: LibHeif | undefined,
    decoder: Decoder | undefined,
    images: HeifImage[] = [];
  try {
    const file = event.data;
    if (!file.size || file.size > 80 * 1024 * 1024)
      throw new Error("Invalid HEIF size");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const profile = primaryHeifProfile(bytes);
    const url = new URL("/vendor/heif/libheif-1.22.2.mjs", self.location.origin)
      .href;
    const { default: createLib } = (await import(/* @vite-ignore */ url)) as {
      default: () => LibHeif;
    };
    lib = createLib();
    decoder = new lib.HeifDecoder();
    images = decoder.decode(bytes);
    const primary = images.find((image) => image.is_primary());
    if (!primary) throw new Error("Invalid HEIF primary image");
    const width = primary.get_width(),
      height = primary.get_height();
    if (
      width <= 0 ||
      height <= 0 ||
      width * height > LIMITS.imagePixels ||
      Math.max(width, height) > 32768
    )
      throw new Error(
        "This HEIC exceeds 24 megapixels or 32,768 pixels per side. Export a smaller SDR PNG or JPEG before importing it.",
      );
    // Metadata is inspected before allocating RGBA pixels or decoding HEVC.
    const pixels = await new Promise<ImageData>((resolve, reject) =>
      primary.display(new ImageData(width, height), (data) =>
        data ? resolve(data) : reject(new Error("HEIF pixel decoding failed")),
      ),
    );
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas unavailable");
    context.putImageData(pixels, 0, 0);
    let png = await canvas.convertToBlob({ type: "image/png" });
    canvas.width = canvas.height = 0;
    if (profile) png = await withPngProfile(png, profile);
    self.postMessage({ blob: png });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    self.postMessage({
      error: message.startsWith("This HEIC")
        ? message
        : "This HEIC could not be converted. It may be damaged or use an unsupported encoding. Export an SDR PNG or JPEG from Photos and try that copy.",
    });
  } finally {
    for (const image of images) image.free();
    if (decoder?.decoder) lib?.heif_context_free(decoder.decoder);
  }
};
