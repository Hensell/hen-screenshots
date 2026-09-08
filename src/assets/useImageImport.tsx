import { useCallback, useEffect, useRef, useState } from "react";
import { LIMITS, type Asset } from "../core/model";
import {
  reviewImages,
  selectionBudget,
  type ReviewedImage,
} from "./image-review";
import { ImageImportDialog } from "./ImageImportDialog";

export interface ImageImportOptions {
  availableBytes: number;
  maxFileBytes?: number;
}
interface Operation {
  controller: AbortController;
  resolve?: (assets: Asset[] | null) => void;
}
interface Request {
  rows: ReviewedImage[];
  options: ImageImportOptions;
  controller: AbortController;
}
export function useImageImport() {
  const [pending, setPending] = useState<Request | null>(null);
  const operation = useRef<Operation | null>(null);
  useEffect(
    () => () => {
      operation.current?.controller.abort();
      operation.current?.resolve?.(null);
      operation.current = null;
    },
    [],
  );
  const finish = useCallback((assets: Asset[] | null) => {
    const current = operation.current;
    operation.current = null;
    current?.controller.abort();
    current?.resolve?.(assets);
    setPending(null);
  }, []);
  const request = useCallback(
    async (
      files: File[],
      options: ImageImportOptions,
    ): Promise<Asset[] | null> => {
      if (operation.current) return null;
      const current: Operation = { controller: new AbortController() };
      operation.current = current;
      try {
        const rows = await reviewImages(
          files,
          options.maxFileBytes ?? LIMITS.assetBytes,
          current.controller.signal,
        );
        if (current.controller.signal.aborted) return null;
        if (
          selectionBudget(
            rows,
            rows.map(() => true),
            options.availableBytes,
          ).valid
        ) {
          operation.current = null;
          return rows.map((row) => row.asset!);
        }
        return await new Promise<Asset[] | null>((resolve) => {
          current.resolve = resolve;
          setPending({ rows, options, controller: current.controller });
        });
      } catch (error) {
        if (operation.current === current) operation.current = null;
        if (current.controller.signal.aborted) return null;
        throw error;
      }
    },
    [],
  );
  return {
    request,
    dialog: pending ? (
      <ImageImportDialog {...pending} onFinish={finish} />
    ) : null,
  };
}
