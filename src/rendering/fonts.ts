import manropeUrl from "../../brand/fonts/Manrope.ttf?url";

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
