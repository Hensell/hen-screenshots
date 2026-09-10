import { useT } from "../i18n/react";
import { useEffect, useRef, useState } from "react";
import { languageName } from "../core/localization";
import type { ExportProfile } from "../core/export-profiles";
import type { ReadyFile } from "./types";
import { Icon } from "./Icon";
import { ExportChecks } from "./ExportChecks";
import type { ExportImageFormat } from "../export/review";

export function ExportDialog({
  languages,
  currentLanguage,
  count,
  pair,
  profile,
  busy,
  file,
  onClose,
  onExport,
  onCancel,
  error,
}: {
  languages: string[];
  currentLanguage: string;
  count: number;
  pair: boolean;
  profile: ExportProfile;
  busy: string | null;
  file: ReadyFile | null;
  onClose: () => void;
  onExport: (
    all: boolean,
    locales?: string[],
    format?: ExportImageFormat,
  ) => Promise<void>;
  onCancel: () => void;
  error?: string | null;
}) {
  const [exportLanguages, setExportLanguages] = useState([currentLanguage]);
  const [format, setFormat] = useState<ExportImageFormat>("png");
  const lastRequest = useRef({ all: false, locales: [currentLanguage] });
  const prepare = (
    all: boolean,
    locales = exportLanguages,
    encoding = format,
  ) => {
    lastRequest.current = { all, locales: [...locales] };
    return onExport(all, locales, encoding);
  };
  const t = useT();
  const banners = profile.category === "banner";
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const opener = document.activeElement as HTMLElement | null;
    dialog.showModal();
    return () => {
      dialog.close();
      opener?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="export-dialog"
      aria-labelledby="export-heading"
      aria-describedby="export-description"
      onCancel={(event) => {
        event.preventDefault();
        if (busy) onCancel();
        else onClose();
      }}
    >
      <div className="dialog-heading">
        <span className="export-header-label">
          <Icon name="download" size={20} />
          {t("Export")}
        </span>
        <button
          className="icon-button"
          aria-label={t("Close export")}
          disabled={!!busy}
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </div>
      <h2 id="export-heading">
        {t(
          file && !file.review?.blocked
            ? "Your export is ready."
            : "Review and export",
        )}
      </h2>
      <p className="dialog-copy" id="export-description">
        {t(profile.name)}
      </p>
      <p className="export-output-summary">
        {profile.width} × {profile.height} px{" "}
        <span>
          ·{" "}
          {file
            ? file.image
              ? (file.review?.format ?? "png").toUpperCase()
              : "ZIP"
            : exportLanguages.length > 1 || pair
              ? "ZIP"
              : format.toUpperCase()}
        </span>
      </p>
      {file?.review && (
        <p className="export-size-summary">
          {file.review.files.length}{" "}
          {t(file.review.files.length === 1 ? "file" : "files")} ·{" "}
          {(
            file.review.files.reduce((sum, item) => sum + item.bytes, 0) /
            1_000_000
          ).toFixed(2)}{" "}
          MB
        </p>
      )}
      {file?.review &&
        !file.review.blocked &&
        file.review.files.some((item) => item.large) && (
          <p className="export-file-warning">
            {t(
              "Some files are larger than the suggested size. Check the file details before publishing.",
            )}
          </p>
        )}
      {error && (
        <p className="export-file-warning" role="alert">
          {t(error)}
        </p>
      )}
      {busy ? (
        <div className="export-progress">
          <p role="status">
            <span className="spinner" />
            {t(busy)}
          </p>
          <button className="button secondary full" onClick={onCancel}>
            {t("Cancel export")}
          </button>
        </div>
      ) : file ? (
        <div className="export-result">
          {file.review?.blocked && (
            <p className="export-file-warning" role="alert">
              {t(
                "Some images exceed this destination’s 8 MB limit. Prepare smaller JPEGs before saving.",
              )}
            </p>
          )}
          <details
            className="export-validation"
            open={file.review?.blocked || undefined}
          >
            <summary>{t("File checks and store requirements")}</summary>
            <ExportChecks
              profile={profile}
              count={count}
              review={file.review}
            />
          </details>
          {file.image && (
            <img
              className="export-preview"
              src={file.url}
              alt={t(banners ? "Exported banner" : "Exported screenshot")}
              width={profile.width}
              height={profile.height}
            />
          )}
          {!file.review?.blocked && (
            <a
              className="button primary full"
              href={file.url}
              download={file.name}
            >
              <Icon name="download" />
              {t("Download {format}", {
                format: file.image
                  ? (file.review?.format ?? "png").toUpperCase()
                  : "ZIP",
              })}
            </a>
          )}
          {file.review?.format === "png" && (
            <>
              <button
                className="button secondary full"
                onClick={() => {
                  setFormat("jpeg");
                  void prepare(
                    lastRequest.current.all,
                    lastRequest.current.locales,
                    "jpeg",
                  );
                }}
              >
                {t("Prepare smaller JPEGs")}
              </button>
              <p className="field-help">
                {t(
                  "JPEG keeps the same pixel dimensions with some quality loss. Original images and designs stay unchanged.",
                )}
              </p>
            </>
          )}
          <button className="button secondary full" onClick={onClose}>
            {t("Back to editing")}
          </button>
        </div>
      ) : (
        <div className="export-options">
          <label className="export-encoding">
            {t("Image format")}
            <select
              value={format}
              onChange={(event) =>
                setFormat(event.target.value as ExportImageFormat)
              }
            >
              <option value="png">{t("PNG · Best for sharp text")}</option>
              <option value="jpeg">
                {t("JPEG · Smaller files, same resolution")}
              </option>
            </select>
          </label>
          <details className="export-validation">
            <summary>{t("File checks and store requirements")}</summary>
            <ExportChecks profile={profile} count={count} format={format} />
          </details>
          {languages.length > 1 && (
            <fieldset className="export-languages">
              <legend>{t("Languages to export")}</legend>
              {languages.map((code) => (
                <label className="check-field" key={code}>
                  <input
                    type="checkbox"
                    checked={exportLanguages.includes(code)}
                    onChange={(event) =>
                      setExportLanguages((previous) =>
                        event.target.checked
                          ? [...previous, code]
                          : previous.filter((item) => item !== code),
                      )
                    }
                  />
                  {languageName(code)}
                </label>
              ))}
              <p className="field-help">
                {t(
                  "ZIP exports include a folder per language. Review translations before publishing.",
                )}
              </p>
            </fieldset>
          )}
          <button
            className="button primary full"
            disabled={!exportLanguages.length}
            onClick={() => void prepare(false)}
          >
            <Icon name="image" />
            {t("Prepare {format}", {
              format:
                exportLanguages.length > 1 || pair
                  ? "ZIP"
                  : format.toUpperCase(),
            })}
            <span>{t(pair ? "Selected panorama" : "Selected slide")}</span>
          </button>
          <button
            className="button secondary full"
            disabled={count > profile.maxCount || !exportLanguages.length}
            onClick={() => void prepare(true)}
          >
            <Icon name="download" />
            {t("Prepare series ZIP")}
            <span>
              {t(count === 1 ? "{count} slide" : "{count} slides", { count })}
            </span>
          </button>
        </div>
      )}
      {!file && count > profile.maxCount && (
        <p className="field-help export-guidance">
          {count > profile.maxCount && (
            <strong>
              {t(
                banners
                  ? "Google Play uses one banner per format and language. Select the design you want and export it individually."
                  : "This series has {count} screenshots; the selected destination allows {max}. Export one at a time or reduce the series.",
                { count, max: profile.maxCount },
              )}
            </strong>
          )}
          {profile.source && (
            <>
              {" "}
              <a
                href={profile.source}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("View store requirements ↗")}
              </a>
            </>
          )}
        </p>
      )}
      <p className="field-help">
        {t("Your source images and saved project stay editable.")}
      </p>
    </dialog>
  );
}
