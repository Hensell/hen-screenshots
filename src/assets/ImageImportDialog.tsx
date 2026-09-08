import { useEffect, useRef, useState } from "react";
import { Icon } from "../app/Icon";
import { LIMITS, errorMessage, type Asset } from "../core/model";
import { useT } from "../i18n/react";
import type { ImageImportOptions } from "./useImageImport";
import {
  compressionTarget,
  megabytes,
  selectionBudget,
  type ReviewedImage,
} from "./image-review";
import { compressImage } from "./compress";
import "./image-import.css";

const formatBytes = (bytes: number) =>
  bytes < 1024
    ? `${bytes} B`
    : bytes < 1024 * 1024
      ? `${Math.ceil(bytes / 1024)} KB`
      : `${megabytes(bytes)} MB`;

export function ImageImportDialog({
  rows: initial,
  options,
  controller,
  onFinish,
}: {
  rows: ReviewedImage[];
  options: ImageImportOptions;
  controller: AbortController;
  onFinish: (assets: Asset[] | null) => void;
}) {
  const t = useT();
  const ref = useRef<HTMLDialogElement>(null),
    cancel = useRef<HTMLButtonElement>(null);
  const [rows, setRows] = useState(initial),
    [selected, setSelected] = useState(initial.map(() => true));
  const [working, setWorking] = useState<string | null>(null);
  const budget = selectionBudget(rows, selected, options.availableBytes);
  const maxFile = options.maxFileBytes ?? LIMITS.assetBytes;
  const needsCompression = rows.flatMap((row, index) =>
    selected[index] &&
    row.canOptimize &&
    (row.error || budget.bytes > options.availableBytes)
      ? [index]
      : [],
  );
  useEffect(() => {
    const dialog = ref.current!,
      opener = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    cancel.current?.focus({ preventScroll: true });
    dialog.scrollTop = 0;
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);
  async function compress(indices: number[]) {
    if (working) return;
    const next = [...rows];
    try {
      for (const [position, index] of indices.entries()) {
        const row = next[index];
        if (!row.canOptimize) continue;
        controller.signal.throwIfAborted();
        setWorking(row.file.name);
        try {
          next[index] = await compressImage(
            row,
            compressionTarget(
              next,
              selected,
              indices.slice(position),
              options.availableBytes,
              maxFile,
            ),
            controller.signal,
          );
        } catch (error) {
          if (controller.signal.aborted) return;
          const detail = errorMessage(error);
          // A failed optional optimization must not discard an already valid source.
          next[index] = {
            ...row,
            canOptimize: false,
            error: detail.startsWith("Could not decode")
              ? "This browser could not optimize the image. Save a smaller copy as JPEG or PNG and try again."
              : detail,
          };
        }
        if (controller.signal.aborted) return;
        setRows([...next]);
      }
    } finally {
      if (!controller.signal.aborted) setWorking(null);
    }
  }
  return (
    <dialog
      ref={ref}
      className="image-import-dialog"
      aria-labelledby="image-import-heading"
      aria-describedby="image-import-description"
      onCancel={(event) => {
        event.preventDefault();
        onFinish(null);
      }}
    >
      <header className="dialog-heading">
        <Icon name="image" size={25} />
        <button
          type="button"
          className="icon-button"
          aria-label={t("Cancel image import")}
          onClick={() => onFinish(null)}
        >
          <Icon name="close" />
        </button>
      </header>
      <h2 id="image-import-heading">{t("Review your images")}</h2>
      <p id="image-import-description" className="dialog-copy">
        {t(
          "Some files need attention. Compress a copy or uncheck files to leave them out.",
        )}
      </p>
      <div className="image-import-limits">
        <span>
          {t("{size} MB per image · 24 megapixels", {
            size: megabytes(maxFile),
          })}
        </span>
        <span>
          {t("{size} MB available", {
            size: megabytes(Math.max(0, options.availableBytes)),
          })}
        </span>
      </div>
      <ul className="image-import-files" aria-label={t("Selected image files")}>
        {rows.map((row, index) => (
          <li
            key={index}
            className={!selected[index] ? "is-excluded" : undefined}
          >
            <label className="image-import-file">
              <input
                type="checkbox"
                checked={selected[index]}
                disabled={!!working}
                onChange={(event) =>
                  setSelected((current) =>
                    current.map((value, i) =>
                      i === index ? event.target.checked : value,
                    ),
                  )
                }
                aria-label={t("Include {name}", { name: row.file.name })}
              />
              <span>
                <strong>{row.file.name}</strong>
                <small>
                  {formatBytes(row.asset?.blob.size ?? row.file.size)}
                  {row.info
                    ? ` · ${row.info.width} × ${row.info.height} · ${row.info.mime.replace("image/", "").toUpperCase()}`
                    : ""}
                </small>
              </span>
            </label>
            {row.optimized && row.before && (
              <p className="image-import-success">
                <Icon name="check" size={14} />
                {t("Optimized copy: {before} → {after}", {
                  before: formatBytes(row.before.size),
                  after: formatBytes(row.asset!.blob.size),
                })}
              </p>
            )}
            {row.error ? (
              <p className="image-import-error">{t(row.error)}</p>
            ) : (
              <p className="image-import-success">{t("Ready to import")}</p>
            )}
            {row.canOptimize && selected[index] && (
              <button
                type="button"
                className="text-button image-import-compress"
                disabled={!!working}
                onClick={() => void compress([index])}
              >
                {t(row.asset ? "Compress copy" : "Try optimized copy")}
              </button>
            )}
          </li>
        ))}
      </ul>
      <div className="image-import-summary" aria-live="polite">
        {working ? (
          <p role="status">{t("Optimizing {name}…", { name: working })}</p>
        ) : (
          <p>
            {t("Selected: {count} · {size}", {
              count: budget.chosen.length,
              size: formatBytes(budget.bytes),
            })}
          </p>
        )}
        {budget.bytes > options.availableBytes && (
          <p className="image-import-error">
            {t(
              "These files exceed the remaining space by {size} MB. Compress them, uncheck files, or free up space in the project.",
              { size: megabytes(budget.bytes - options.availableBytes) },
            )}
          </p>
        )}
      </div>
      <p className="image-import-note">
        {t(
          "Compression runs on your device and may reduce quality or resolution. Original files stay unchanged. Transparency is preserved.",
        )}
      </p>
      <footer className="image-import-actions">
        <button
          ref={cancel}
          type="button"
          className="button secondary"
          onClick={() => onFinish(null)}
        >
          {t("Cancel")}
        </button>
        <button
          type="button"
          className="button secondary"
          disabled={!!working || !needsCompression.length}
          onClick={() => void compress(needsCompression)}
        >
          {t("Compress to fit")}
        </button>
        <button
          type="button"
          className="button primary"
          disabled={!!working || !budget.valid}
          onClick={() => onFinish(budget.chosen.map((row) => row.asset!))}
        >
          {t(
            budget.chosen.length === 1
              ? "Import image"
              : "Import {count} images",
            { count: budget.chosen.length },
          )}
        </button>
      </footer>
    </dialog>
  );
}
