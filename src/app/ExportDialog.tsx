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
          aria-label="Close export"
          disabled={!!busy}
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </div>
      <p className="eyebrow">READY FOR A FIRST IMPRESSION</p>
      <h2 id="export-heading">
        {file ? (
          "Your export is ready."
        ) : (
          <>
            Take your work
            <br />
            out into the world.
          </>
        )}
      </h2>
      <p className="dialog-copy" id="export-description">
        {profile.width} × {profile.height} pixels · RGB PNG without
        transparency.
        <br />
        {profile.name}
      </p>
      {busy ? (
        <div className="export-progress">
          <p role="status">
            <span className="spinner" />
            {busy}
          </p>
          <button className="button secondary full" onClick={onCancel}>
            Cancel export
          </button>
        </div>
      ) : file ? (
        <div className="export-result">
          {file.image && (
            <img
              className="export-preview"
              src={file.url}
              alt="Exported screenshot"
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
            Save {file.image ? "PNG" : "ZIP"}
          </a>
          <button className="button secondary full" onClick={onClose}>
            Back to editing
          </button>
        </div>
      ) : (
        <div className="export-options">
          {languages.length > 1 && (
            <fieldset className="export-languages">
              <legend>Languages to export</legend>
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
                A folder per language inside the ZIP. Review every translation
                before publishing.
              </p>
            </fieldset>
          )}
          <button
            className="button primary full"
            disabled={!exportLanguages.length}
            onClick={() => void onExport(false, exportLanguages)}
          >
            <Icon name="image" />
            {pair ? "Export this panorama" : "Export this screenshot"}
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
            Export all {count} screenshots<span>ZIP</span>
          </button>
        </div>
      )}
      {!file && (
        <p className="field-help export-guidance">
          {profile.note}{" "}
          {count > profile.maxCount && (
            <strong>
              This series has {count} screenshots; the selected destination
              allows {profile.maxCount}. Export one at a time or reduce the
              series.
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
                View store requirements ↗
              </a>
            </>
          )}
        </p>
      )}
      <p className="field-help">
        Your source images and saved project stay editable.
      </p>
    </dialog>
  );
}
