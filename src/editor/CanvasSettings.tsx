import { useId, useState } from "react";
import { errorMessage, type Project } from "../core/model";
import { changeCustomSize, changeExportProfile } from "../core/templates";
import {
  CUSTOM_SIZE_LIMITS,
  getExportProfile,
  PROFILE_REVIEW_DATE,
  resolveExportProfile,
  type ExportProfileId,
} from "../core/export-profiles";
import {
  canvasOrientation,
  customSizeForOrientation,
  portfolioFormatForProfile,
  portfolioFormats,
  profileForOrientation,
  profileForPortfolioFormat,
  profileForSlot,
  profileForStore,
  projectPurpose,
  storeSlotForProfile,
  storeSlots,
  type CanvasOrientation,
  type Store,
} from "../core/canvas-formats";
import { useEditor } from "./store";
import "./canvas-settings.css";

function CustomSize({ project }: { project: Project }) {
  const edit = useEditor((state) => state.edit);
  const [width, setWidth] = useState(String(project.customSize.width));
  const [height, setHeight] = useState(String(project.customSize.height));
  const [error, setError] = useState<string | null>(null);
  const errorId = useId();
  const helpId = useId();
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
              aria-describedby={`${helpId}${error ? ` ${errorId}` : ""}`}
              aria-invalid={error ? true : undefined}
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
              aria-describedby={`${helpId}${error ? ` ${errorId}` : ""}`}
              aria-invalid={error ? true : undefined}
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
        <p id={errorId} role="alert" className="size-error">
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
      <p id={helpId} className="field-help">
        256–4096 px per side. Up to 4:1 in either direction.
      </p>
    </form>
  );
}

function OrientationSettings({ project }: { project: Project }) {
  const edit = useEditor((state) => state.edit);
  const orientation = canvasOrientation(project);
  const custom = project.exportProfile === "portfolio-custom";
  if (orientation === "square")
    return (
      <div className="canvas-square-note">
        <span className="canvas-shape square" aria-hidden="true" />
        <span>
          Square canvas <small>Both sides are equal</small>
        </span>
      </div>
    );
  const landscapeOnly =
    !custom && !profileForOrientation(project.exportProfile, "portrait");
  function setOrientation(next: Exclude<CanvasOrientation, "square">) {
    if (next === orientation) return;
    if (custom) {
      edit((draft) =>
        changeCustomSize(
          draft,
          customSizeForOrientation(draft.customSize, next),
        ),
      );
    } else {
      const id = profileForOrientation(project.exportProfile, next);
      if (id) edit((draft) => changeExportProfile(draft, id));
    }
  }
  return (
    <fieldset className="canvas-orientation">
      <legend>Canvas orientation</legend>
      <div className="canvas-orientation-options">
        {(["portrait", "landscape"] as const).map((value) => {
          const id = profileForOrientation(project.exportProfile, value);
          const size = custom
            ? customSizeForOrientation(project.customSize, value)
            : id
              ? getExportProfile(id)
              : undefined;
          const label = value === "portrait" ? "Portrait" : "Landscape";
          return (
            <button
              key={value}
              type="button"
              aria-label={`${label} canvas`}
              aria-pressed={orientation === value}
              disabled={!size}
              onClick={() => setOrientation(value)}
            >
              <span className={`canvas-shape ${value}`} aria-hidden="true" />
              <span>
                {label}
                <small>
                  {size ? `${size.width} × ${size.height}` : "Unavailable"}
                </small>
              </span>
            </button>
          );
        })}
      </div>
      {landscapeOnly && (
        <p className="field-help">This device uses landscape screenshots.</p>
      )}
    </fieldset>
  );
}

export function CanvasSettings({ project }: { project: Project }) {
  const edit = useEditor((state) => state.edit);
  const profile = resolveExportProfile(project);
  const portfolio = projectPurpose(project) === "portfolio";
  const orientation = canvasOrientation(project);
  const slot = storeSlotForProfile(project.exportProfile);
  const format = portfolioFormatForProfile(project.exportProfile);
  function select(id: ExportProfileId) {
    edit((draft) => changeExportProfile(draft, id));
  }
  return (
    <section className="property-section export-format canvas-settings">
      <h3>{portfolio ? "Portfolio canvas" : "Store screenshots"}</h3>
      {portfolio ? (
        <label className="field">
          Canvas format
          <select
            value={format?.id}
            onChange={(event) =>
              select(profileForPortfolioFormat(event.target.value, orientation))
            }
          >
            {portfolioFormats.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <>
          <label className="field">
            Store
            <select
              value={profile.store}
              onChange={(event) =>
                select(
                  profileForStore(
                    project.exportProfile,
                    event.target.value as Store,
                  ),
                )
              }
            >
              <option value="apple">Apple App Store</option>
              <option value="google">Google Play</option>
            </select>
          </label>
          <label className="field">
            Device size
            <select
              value={slot?.id}
              onChange={(event) =>
                select(profileForSlot(event.target.value, orientation))
              }
            >
              {storeSlots
                .filter((item) => item.store === profile.store)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
            </select>
          </label>
        </>
      )}
      <OrientationSettings project={project} />
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
        Size changes refit the whole series. Undo anytime.
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
