import { useState } from "react";
import { errorMessage, type Project } from "../core/model";
import { changeCustomSize, changeExportProfile } from "../core/templates";
import {
  CUSTOM_SIZE_LIMITS,
  exportProfiles,
  getExportProfile,
  PROFILE_REVIEW_DATE,
  resolveExportProfile,
  type ExportProfileId,
} from "../core/export-profiles";
import { useEditor } from "./store";

const portfolioNames: Partial<Record<ExportProfileId, string>> = {
  "portfolio-card": "Project card · 4:3",
  "portfolio-square": "Square · 1:1",
  "portfolio-portrait": "Portrait card · 4:5",
  "desktop-web": "Widescreen · 16:9",
  "portfolio-custom": "Custom size",
};

function CustomSize({ project }: { project: Project }) {
  const edit = useEditor((state) => state.edit);
  const [width, setWidth] = useState(String(project.customSize.width));
  const [height, setHeight] = useState(String(project.customSize.height));
  const [error, setError] = useState<string | null>(null);
  const unchanged =
    Number(width) === project.customSize.width &&
    Number(height) === project.customSize.height;
  return (
    <form
      className="custom-size"
      onSubmit={(event) => {
        event.preventDefault();
        try {
          edit((draft) =>
            changeCustomSize(draft, {
              width: Number(width),
              height: Number(height),
            }),
          );
          setError(null);
        } catch (cause) {
          setError(errorMessage(cause));
        }
      }}
    >
      <div className="custom-size-fields">
        <label className="field">
          Width{" "}
          <span className="input-unit">
            <input
              type="number"
              aria-label="Canvas width"
              required
              min={CUSTOM_SIZE_LIMITS.min}
              max={CUSTOM_SIZE_LIMITS.max}
              step={1}
              value={width}
              onChange={(event) => {
                setWidth(event.target.value);
                setError(null);
              }}
            />
            <span>px</span>
          </span>
        </label>
        <label className="field">
          Height{" "}
          <span className="input-unit">
            <input
              type="number"
              aria-label="Canvas height"
              required
              min={CUSTOM_SIZE_LIMITS.min}
              max={CUSTOM_SIZE_LIMITS.max}
              step={1}
              value={height}
              onChange={(event) => {
                setHeight(event.target.value);
                setError(null);
              }}
            />
            <span>px</span>
          </span>
        </label>
      </div>
      {error && (
        <p role="alert" className="size-error">
          {error}
        </p>
      )}
      <button
        type="submit"
        className="button secondary full"
        disabled={unchanged}
      >
        Apply size
      </button>
      <p className="field-help">
        256–4096 px per side. Up to 4:1 in either direction.
      </p>
    </form>
  );
}

export function CanvasSettings({ project }: { project: Project }) {
  const edit = useEditor((state) => state.edit);
  const profile = resolveExportProfile(project);
  const portfolio = profile.store === "presentation";
  function select(id: ExportProfileId) {
    edit((draft) => changeExportProfile(draft, id));
  }
  return (
    <section className="property-section export-format">
      <h3>Canvas</h3>
      <div
        className="segmented canvas-purpose"
        role="group"
        aria-label="Canvas purpose"
      >
        <button
          type="button"
          aria-pressed={!portfolio}
          onClick={() => {
            if (portfolio) select("play-phone-portrait");
          }}
        >
          App stores
        </button>
        <button
          type="button"
          aria-pressed={portfolio}
          onClick={() => {
            if (!portfolio) select("portfolio-card");
          }}
        >
          Portfolio
        </button>
      </div>
      <label className="field">
        {portfolio ? "Canvas format" : "Store & size"}
        <select
          value={project.exportProfile}
          onChange={(event) => select(event.target.value as ExportProfileId)}
        >
          {portfolio
            ? Object.entries(portfolioNames).map(([id, label]) => {
                const preset = getExportProfile(id as ExportProfileId);
                return (
                  <option key={id} value={id}>
                    {label}
                    {id !== "portfolio-custom"
                      ? ` · ${preset.width} × ${preset.height}`
                      : ""}
                  </option>
                );
              })
            : (["apple", "google"] as const).map((store) => (
                <optgroup
                  key={store}
                  label={store === "apple" ? "Apple App Store" : "Google Play"}
                >
                  {exportProfiles
                    .filter((item) => item.store === store)
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} · {item.width} × {item.height}
                      </option>
                    ))}
                </optgroup>
              ))}
        </select>
      </label>
      {portfolio && (
        <p className="field-help">
          A canvas for your website, portfolio or case study. Pair it with any
          frame.
        </p>
      )}
      {profile.id === "portfolio-custom" && (
        <CustomSize
          key={`${project.id}:${project.customSize.width}:${project.customSize.height}`}
          project={project}
        />
      )}
      <p className="format-dimensions">
        {profile.width} × {profile.height}
        <span>RGB PNG · No transparency</span>
      </p>
      <p className="field-help">
        Applies to the whole series and refits each layout. Undo anytime.
      </p>
      {profile.source && (
        <a
          className="format-source"
          href={profile.source}
          target="_blank"
          rel="noopener noreferrer"
        >
          Store size requirements ↗ <span>Checked {PROFILE_REVIEW_DATE}</span>
        </a>
      )}
    </section>
  );
}
