import manropeUrl from "../../brand/fonts/Manrope.ttf?url";
import frauncesUrl from "../../brand/fonts/Fraunces-Semibold.ttf?url";
import type { Project, Shot } from "../core/model";
import { resolveStyle } from "../core/model";
import { getTemplate } from "../core/templates";

let loading: Promise<void> | undefined;

/** Explicit loading keeps canvas metrics identical in previews and downloaded PNGs. */
export function ensureManrope(): Promise<void> {
  if (!loading) {
    loading = (async () => {
      if (typeof FontFace === "undefined" || !document.fonts) {
        throw new Error(
          "This browser cannot load the font needed to render your screenshots.",
        );
      }
      const face = new FontFace("Manrope", `url(${manropeUrl})`, {
        style: "normal",
        weight: "200 800",
      });
      await face.load();
      document.fonts.add(face);
      await Promise.all([
        document.fonts.load("700 84px Manrope"),
        document.fonts.load("400 34px Manrope"),
      ]);
    })().catch((error: unknown) => {
      loading = undefined;
      throw new Error(
        "Manrope could not load. Check your connection and try again.",
        { cause: error },
      );
    });
  }
  return loading;
}

let loadingSerif: Promise<void> | undefined;
export async function ensureSceneFonts(
  project: Project,
  shot: Shot,
): Promise<void> {
  await ensureManrope();
  const style = resolveStyle(project, shot);
  if (
    (style.titleFont ?? getTemplate(style.template).titleFont) !== "Fraunces" &&
    style.bodyFont !== "Fraunces"
  )
    return;
  loadingSerif ??= (async () => {
    const face = new FontFace("Fraunces", `url(${frauncesUrl})`, {
      weight: "600",
      style: "normal",
    });
    await face.load();
    document.fonts.add(face);
    await document.fonts.load("600 112px Fraunces");
  })().catch((cause: unknown) => {
    loadingSerif = undefined;
    throw new Error(
      "The headline font could not load. Check your connection and try again.",
      { cause },
    );
  });
  await loadingSerif;
}
