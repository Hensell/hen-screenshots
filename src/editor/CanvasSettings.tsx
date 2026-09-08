import { useT } from "../i18n/react";
import { useId, useState, type ReactNode } from "react";
import { errorMessage, type Project } from "../core/model";
import { changeCustomSize, changeExportProfile } from "../core/templates";
import {
  BANNER_REVIEW_DATE,
  isBannerProfile,
  exportProfiles,
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
  const t = useT();
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
          {t("Width")}{" "}
          <span className="input-unit">
            <input
              type="number"
              aria-label={t("Canvas width")}
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
          {t("Height")}{" "}
          <span className="input-unit">
            <input
              type="number"
              aria-label={t("Canvas height")}
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
          {t(error)}
        </p>
      )}
      <button
        type="submit"
        className="button secondary full"
        disabled={unchanged}
      >
        {t("Apply size")}
      </button>
      <p id={helpId} className="field-help">
        {t("256–4096 px per side. Up to 4:1 in either direction.")}
      </p>
    </form>
  );
}

function OrientationSettings({ project }: { project: Project }) {
  const t = useT();
  const edit = useEditor((state) => state.edit);
  const helpId = useId();
  const orientation = canvasOrientation(project);
  const custom = project.exportProfile === "portfolio-custom";
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
    <fieldset className="canvas-orientation" aria-describedby={helpId}>
      <legend>{t("Canvas orientation")}</legend>
      <p id={helpId} className="orientation-scope">
        {t("Export size · All slides")}
      </p>
      {orientation === "square" ? (
        <div className="canvas-square-note">
          <span className="canvas-shape square" aria-hidden="true" />
          <span>
            {t("Square canvas")}
            <small>{t("Both sides are equal")}</small>
          </span>
        </div>
      ) : (
        <>
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
                  aria-label={t(
                    value === "portrait"
                      ? "Portrait canvas"
                      : "Landscape canvas",
                  )}
                  aria-pressed={orientation === value}
                  disabled={!size}
                  onClick={() => setOrientation(value)}
                >
                  <span
                    className={`canvas-shape ${value}`}
                    aria-hidden="true"
                  />
                  <span>
                    {t(label)}
                    <small>
                      {size
                        ? `${size.width} × ${size.height}`
                        : t("Unavailable")}
                    </small>
                  </span>
                </button>
              );
            })}
          </div>
          {landscapeOnly && (
            <p className="field-help">
              {t("This device uses landscape screenshots.")}
            </p>
          )}
        </>
      )}
    </fieldset>
  );
}

export function CanvasSettings({
  project,
  frameOrientation,
}: {
  project: Project;
  frameOrientation?: ReactNode;
}) {
  const t = useT();
  const edit = useEditor((state) => state.edit);
  const profile = resolveExportProfile(project);
  const portfolio = projectPurpose(project) === "portfolio";
  const orientation = canvasOrientation(project);
  const slot = storeSlotForProfile(project.exportProfile);
  const format = portfolioFormatForProfile(project.exportProfile);
  function select(id: ExportProfileId) {
    edit((draft) => changeExportProfile(draft, id));
  }
  if (isBannerProfile(project.exportProfile))
    return (
      <section className="property-section export-format canvas-settings">
        <h3>{t("Google Play banners")}</h3>
        <label className="field">
          {t("Banner format")}
          <select
            value={profile.id}
            onChange={(event) => select(event.target.value as ExportProfileId)}
          >
            {exportProfiles
              .filter((item) => isBannerProfile(item.id))
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {t(item.name)}
                </option>
              ))}
          </select>
        </label>
        <strong className="format-dimensions">
          {profile.width} × {profile.height}
        </strong>
        <p className="field-help">{t("RGB PNG · No transparency")}</p>
        <p className="field-help">{t(profile.note)}</p>
        <p className="field-help">
          {t(
            "Keep key text and artwork away from the edges. Google Play may crop or overlay parts of the banner.",
          )}
        </p>
        <a
          className="source-link"
          href={profile.source}
          target="_blank"
          rel="noreferrer"
        >
          {t("Google Play requirements")} ↗
        </a>
        <p className="field-help">
          {t("Checked {date}", { date: BANNER_REVIEW_DATE })}
        </p>
      </section>
    );
  return (
    <section className="property-section export-format canvas-settings">
      <h3>{portfolio ? t("Portfolio canvas") : t("Store screenshots")}</h3>
      {portfolio ? (
        <label className="field">
          {t("Canvas format")}
          <select
            value={format?.id}
            onChange={(event) =>
              select(profileForPortfolioFormat(event.target.value, orientation))
            }
          >
            {portfolioFormats.map((item) => (
              <option key={item.id} value={item.id}>
                {t(item.name)}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <>
          <label className="field">
            {t("Store")}
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
            {t("Device size")}
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
                    {t(item.name)}
                  </option>
                ))}
            </select>
          </label>
        </>
      )}
      <div className="orientation-settings">
        <OrientationSettings project={project} />
        {frameOrientation}
      </div>
      {profile.id === "portfolio-custom" && (
        <CustomSize
          key={`${project.id}:${project.customSize.width}:${project.customSize.height}`}
          project={project}
        />
      )}
      <p className="format-dimensions">
        {profile.width} × {profile.height}
        <span>{t("RGB PNG · No transparency")}</span>
      </p>
      <p className="field-help">
        {t("Size changes refit the whole series. Undo anytime.")}
      </p>
      {profile.source && (
        <a
          className="format-source"
          href={profile.source}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("Store size requirements ↗")}
          <span>{t("Checked {date}", { date: PROFILE_REVIEW_DATE })}</span>
        </a>
      )}
    </section>
  );
}
