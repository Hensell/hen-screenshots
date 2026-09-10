import { useEffect, useState } from "react";
import type { Asset, Shot } from "../core/model";
import { errorMessage } from "../core/model";
import { loadReferencedImages } from "../assets/project-images";

export function useImages(assets: Asset[], shots: Shot[] = []) {
  const [images, setImages] = useState<Map<string, HTMLImageElement>>(
    new Map(),
  );
  const [error, setError] = useState<string | null>(null);
  // Editing captions or reordering slides must not restart image decoding.
  const references = JSON.stringify(
    [
      ...new Set(
        shots
          .flatMap((shot) => [
            shot.assetId,
            ...(shot.backgroundImage ? [shot.backgroundImage.assetId] : []),
            ...(shot.overlays ?? []).map((item) => item.assetId),
            ...(shot.companions ?? []).map((device) => device.assetId),
          ])
          .filter((id): id is string => id !== null),
      ),
    ].sort(),
  );
  useEffect(() => {
    const controller = new AbortController();
    setError(null);
    loadReferencedImages(
      assets,
      JSON.parse(references),
      images,
      controller.signal,
    )
      .then((loaded) => {
        if (!controller.signal.aborted) setImages(loaded);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(errorMessage(error));
      });
    return () => {
      controller.abort();
    };
    // Assets are immutable; image-cache changes do not start another decode pass.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets, references]);
  return { images, error };
}
