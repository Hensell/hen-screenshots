import { useT } from "../i18n/react";
import { useEffect, useRef, useState } from "react";
import { languageName } from "../core/localization";
import type { ExportProfile } from "../core/export-profiles";
import type { ReadyFile } from "./types";
import { Icon } from "./Icon";

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
}: {
  languages: string[];
  currentLanguage: string;
  count: number;
  pair: boolean;
  profile: ExportProfile;
  busy: string | null;
  file: ReadyFile | null;
  onClose: () => void;
  onExport: (all: boolean, locales?: string[]) => Promise<void>;
  onCancel: () => void;
}) {
  const [exportLanguages, setExportLanguages] = useState([currentLanguage]);
  const t = useT();
  const banners = profile.category === "banner";
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
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
        <Icon name="download" size={26} />
        <button
          className="icon-button"
          aria-label={t("Close export")}
          disabled={!!busy}
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </div>
      <p className="eyebrow">{t("READY FOR A FIRST IMPRESSION")}</p>
      <h2 id="export-heading">
        {file ? (
          t("Your export is ready.")
        ) : (
          <>
            {t("Take your work")}
            <br />
            {t("out into the world.")}
          </>
        )}
      </h2>
      <p className="dialog-copy" id="export-description">
        {t("{width} × {height} pixels · RGB PNG without transparency.", {
          width: profile.width,
          height: profile.height,
        })}
        <br />
        {t(profile.name)}
      </p>
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
          {file.image && (
            <img
              className="export-preview"
              src={file.url}
              alt={t(banners ? "Exported banner" : "Exported screenshot")}
              width={profile.width}
              height={profile.height}
            />
          )}
          <a
            className="button primary full"
            href={file.url}
            download={file.name}
          >
            <Icon name="download" />
            {t("Save {format}", { format: file.image ? "PNG" : "ZIP" })}
          </a>
          <button className="button secondary full" onClick={onClose}>
            {t("Back to editing")}
          </button>
        </div>
      ) : (
        <div className="export-options">
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
                  "A folder per language inside the ZIP. Review every translation before publishing.",
                )}
              </p>
            </fieldset>
          )}
          <button
            className="button primary full"
            disabled={!exportLanguages.length}
            onClick={() => void onExport(false, exportLanguages)}
          >
            <Icon name="image" />
            {t(
              banners
                ? "Export this banner"
                : pair
                  ? "Export this panorama"
                  : "Export this screenshot",
            )}
            <span>
              {exportLanguages.length > 1
                ? "ZIP"
                : pair
                  ? "ZIP · 2 PNGs"
                  : "PNG"}
            </span>
          </button>
          <button
            className="button secondary full"
            disabled={count > profile.maxCount || !exportLanguages.length}
            onClick={() => void onExport(true, exportLanguages)}
          >
            <Icon name="download" />
            {t(
              banners
                ? count === 1
                  ? "Export {count} banner"
                  : "Export all {count} banners"
                : count === 1
                  ? "Export {count} screenshot"
                  : "Export all {count} screenshots",
              { count },
            )}
            <span>ZIP</span>
          </button>
        </div>
      )}
      {!file && (
        <p className="field-help export-guidance">
          {t(profile.note)}{" "}
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
