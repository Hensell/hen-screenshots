import { useEffect, useState } from "react";
import type { Asset } from "../core/model";
import { errorMessage } from "../core/model";
import { loadImage } from "../assets/import";

export function useImages(assets: Asset[]) {
  const [images, setImages] = useState<Map<string, HTMLImageElement>>(
    new Map(),
  );
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    setError(null);
    Promise.all(
      assets.map(
        async (asset) =>
          [asset.id, images.get(asset.id) ?? (await loadImage(asset))] as const,
      ),
    )
      .then((entries) => {
        if (!cancelled) setImages(new Map(entries));
      })
      .catch((error) => {
        if (!cancelled) setError(errorMessage(error));
      });
    return () => {
      cancelled = true;
    };
    // Assets are immutable; image-cache changes do not start another decode pass.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets]);
  return { images, error };
}
