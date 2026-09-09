import { reviewImage, type ReviewedImage } from "./image-review";
import { checkConversionSize, validateAvif } from "./extra-formats";
import { convertHeif } from "./heif";

/** Rasterize a self-contained SVG as an image, never insert it into the page DOM. */
export function prepareSvg(source: string) {
  if (/<!DOCTYPE|<!ENTITY|<\?xml-stylesheet/i.test(source))
    throw new Error(
      "This SVG contains document declarations or external styles. Export a self-contained SVG or PNG from your design tool.",
    );
  const doc = new DOMParser().parseFromString(source, "image/svg+xml"),
    root = doc.documentElement;
  if (
    root.localName !== "svg" ||
    root.namespaceURI !== "http://www.w3.org/2000/svg" ||
    doc.querySelector("parsererror")
  )
    throw new Error(
      "This SVG is not valid. Export a new SVG or PNG from your design tool.",
    );
  const elements = [root, ...root.querySelectorAll("*")];
  if (elements.length > 10000)
    throw new Error(
      "This SVG is too complex to convert here. Export it as PNG from your design tool.",
    );
  const allowed = new Set(
    "svg g defs title desc metadata path rect circle ellipse line polyline polygon text tspan textPath linearGradient radialGradient stop clipPath mask pattern use symbol".split(
      " ",
    ),
  );
  for (const el of elements) {
    if (!allowed.has(el.localName) || el.namespaceURI !== root.namespaceURI)
      throw new Error(
        "This SVG uses embedded images, styles, filters, animation, or active content. Export a flattened PNG from your design tool.",
      );
    for (const attr of el.attributes) {
      if (attr.namespaceURI === "http://www.w3.org/2000/xmlns/") continue;
      const value = attr.value.trim();
      if (
        /^on/i.test(attr.localName) ||
        attr.localName === "base" ||
        (attr.localName === "href" && !/^#[\w.:-]+$/.test(value)) ||
        /(?:@import|@font-face|expression\s*\(|javascript:|data:|https?:|\\)/i.test(
          value,
        ) ||
        [...value.matchAll(/url\s*\(([^)]*)\)/gi)].some(
          (match) => !/^\s*["']?#[\w.:-]+["']?\s*$/.test(match[1]),
        )
      )
        throw new Error(
          "This SVG references external resources or active content. Export a self-contained SVG or a flattened PNG.",
        );
    }
  }
  const box = root
    .getAttribute("viewBox")
    ?.trim()
    .split(/[\s,]+/)
    .map(Number);
  const viewBox =
    box?.length === 4 && box.every(Number.isFinite) && box[2] > 0 && box[3] > 0
      ? box
      : undefined;
  const dimension = (key: string, fallback: number | undefined) => {
    const value = root.getAttribute(key);
    if (!value || value === "100%") return fallback;
    return /^\d+(?:\.\d+)?(?:px)?$/.test(value)
      ? Number.parseFloat(value)
      : undefined;
  };
  const width = Math.ceil(dimension("width", viewBox?.[2]) ?? 0),
    height = Math.ceil(dimension("height", viewBox?.[3]) ?? 0);
  if (!width || !height)
    throw new Error(
      "This SVG needs a valid viewBox or width and height in pixels. Set its artboard size and export it again.",
    );
  checkConversionSize(width, height);
  root.setAttribute("width", String(width));
  root.setAttribute("height", String(height));
  return {
    blob: new Blob([new XMLSerializer().serializeToString(root)], {
      type: "image/svg+xml",
    }),
    width,
    height,
  };
}

export function decodeRaster(
  blob: Blob,
  signal: AbortSignal,
): Promise<HTMLImageElement> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const image = new Image(),
      url = URL.createObjectURL(blob);
    const finish = (error?: Error) => {
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      URL.revokeObjectURL(url);
      image.onload = null;
      image.onerror = null;
      if (error) {
        image.src = "";
        reject(error);
      } else resolve(image);
    };
    const abort = () => finish(new DOMException("Aborted", "AbortError"));
    const timer = setTimeout(
      () =>
        finish(
          new Error(
            "Image conversion took too long. Export a smaller PNG or JPEG copy and try again.",
          ),
        ),
      30000,
    );
    signal.addEventListener("abort", abort, { once: true });
    image.onload = () => finish();
    image.onerror = () =>
      finish(
        new Error(
          "This browser could not decode the image. It may be damaged or use an unsupported encoding. Export a PNG or JPEG from your image editor.",
        ),
      );
    image.src = url;
  });
}

export async function convertImage(
  row: ReviewedImage,
  maxBytes: number,
  signal: AbortSignal,
): Promise<ReviewedImage> {
  if (!row.conversion || row.conversion === "heif")
    return convertHeif(row, maxBytes, signal);
  signal.throwIfAborted();
  if (row.file.size > 80 * 1024 * 1024)
    throw new Error(
      "This file exceeds the 80 MB limit for local compression. Resize or compress it outside the editor first.",
    );
  let blob: Blob;
  if (row.conversion === "svg") {
    if (row.file.size > 5 * 1024 * 1024)
      throw new Error(
        "SVG conversion supports files up to 5 MB. Simplify the artwork or export it as PNG.",
      );
    blob = prepareSvg(await row.file.text()).blob;
  } else {
    validateAvif(new Uint8Array(await row.file.arrayBuffer()));
    blob = new Blob([row.file], { type: "image/avif" });
  }
  signal.throwIfAborted();
  const image = await decodeRaster(blob, signal);
  signal.throwIfAborted();
  checkConversionSize(image.naturalWidth, image.naturalHeight);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  try {
    const context = canvas.getContext("2d", { colorSpace: "srgb" });
    if (!context)
      throw new Error("The browser could not prepare the export canvas.");
    context.drawImage(image, 0, 0);
    const png = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (result) =>
          result?.size && result.type === "image/png"
            ? resolve(result)
            : reject(
                new Error(
                  "The browser could not create a PNG. Try exporting again.",
                ),
              ),
        "image/png",
      ),
    );
    signal.throwIfAborted();
    const file = new File(
      [png],
      row.file.name.replace(/\.[^.]*$/, "").slice(0, 225) + ".converted.png",
      { type: "image/png" },
    );
    const reviewed = await reviewImage(file, maxBytes);
    signal.throwIfAborted();
    return { ...reviewed, converted: true, conversion: row.conversion };
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}
