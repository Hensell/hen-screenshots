import "./my-templates.css";
import { BackgroundImageInspector } from "./BackgroundImageInspector";
import { resolveExportProfile } from "../core/export-profiles";
import { OverlayInspector } from "./OverlayInspector";
import type { OverlayElement } from "../core/model";
import { isBannerProfile } from "../core/export-profiles";
import { DeviceCompositionInspector } from "./DeviceCompositionInspector";
import type { DeviceElement } from "../core/model";
import { useT } from "../i18n/react";
import {
  localContent,
  writeText,
  languageName,
  localeStatus,
} from "../core/localization";
import { useEffect, useId, useRef } from "react";
import { resolveStyle, PLACEMENT_LIMITS } from "../core/model";
import type { Project, Shot, Style, CanvasElement } from "../core/model";
import { useEditor } from "./store";
import { Icon } from "../app/Icon";
import {
  applyTemplate,
  getTemplate,
  resetComposition,
  templateLayout,
} from "../core/templates";
import { linkedShots, panoramaPair } from "../core/panorama";
import { CanvasSettings } from "./CanvasSettings";
import { resizeDevice } from "../core/device-placement";
import { DeviceRotationControl } from "./DeviceRotationControl";
import { resetText } from "../core/text-placement";
import { appliedBrand } from "../core/brand-application";
import { BrandBadge } from "./BrandBadge";

export type InspectorTab = "design" | "text" | "device" | "canvas";
const inspectorTabs = [
  { id: "design", label: "Design", icon: "layout" },
  { id: "text", label: "Text", icon: "text" },
  { id: "device", label: "Device", icon: "phone" },
  { id: "canvas", label: "Canvas", icon: "canvas" },
] as const;

export const deviceNames = {
  card: "Screenshot card",
  android: "Android phone",
  ios: "iPhone",
  ipad: "iPad",
  "android-tablet": "Android tablet",
  monitor: "Monitor",
  laptop: "Laptop",
} as const;

const palettes = [
  { name: "Sage", background: "#E3E8DE", textColor: "#202725" },
  { name: "Paper", background: "#F6F4ED", textColor: "#202725" },
  { name: "Peach", background: "#F3D6C6", textColor: "#503023" },
  { name: "Sky", background: "#D8E4EB", textColor: "#263F4C" },
  { name: "Ink", background: "#202725", textColor: "#F6F4ED" },
];

function FrameOrientation({
  style,
  linked,
  onChange,
}: {
  style: Style;
  linked: boolean;
  onChange: (orientation: Style["deviceOrientation"]) => void;
}) {
  const t = useT();
  const helpId = useId();
  const fixed = style.device === "monitor" || style.device === "laptop";
  return (
    <fieldset className="frame-orientation" aria-describedby={helpId}>
      <legend>{t("Frame orientation")}</legend>
      <p id={helpId} className="orientation-scope">
        {t(deviceNames[style.device])} ·{" "}
        {linked ? t("Both linked slides") : t("This slide")}
      </p>
      {fixed ? (
        <div className="frame-fixed-orientation">
          <span className="canvas-shape landscape" aria-hidden="true" />
          <span>
            {t("Landscape")}
            <small>{t("Fixed for this frame")}</small>
          </span>
        </div>
      ) : (
        <div className="segmented">
          {(["portrait", "landscape"] as const).map((orientation) => (
            <button
              type="button"
              key={orientation}
              aria-label={t(
                orientation === "portrait"
                  ? "Portrait frame"
                  : "Landscape frame",
              )}
              aria-pressed={style.deviceOrientation === orientation}
              onClick={() => onChange(orientation)}
            >
              {orientation === "portrait" ? t("Portrait") : t("Landscape")}
            </button>
          ))}
        </div>
      )}
    </fieldset>
  );
}

export function Inspector({
  project,
  shot,
  disabled,
  onReplace,
  onSelectDevice,
  onTemplates,
  onMyTemplates,
  onBackgroundUpload,
  tab,
  onTabChange,
  selectedElement,
  onPreview,
  onBrandKits,
  onLanguages,
  images,
  onOverlaySelect,
  onOverlayUpload,
  locale,
}: {
  project: Project;
  shot: Shot;
  disabled: boolean;
  onReplace: (element?: DeviceElement) => void;
  onSelectDevice: (element: DeviceElement) => void;
  onTemplates: () => void;
  onMyTemplates: (saving: boolean) => void;
  onBackgroundUpload: () => void;
  tab: InspectorTab;
  onTabChange: (tab: InspectorTab) => void;
  selectedElement: CanvasElement | null;
  onPreview: () => void;
  onBrandKits: () => void;
  onLanguages: () => void;
  locale: string | null;
  images: ReadonlyMap<string, HTMLImageElement>;
  onOverlaySelect: (element: OverlayElement) => void;
  onOverlayUpload: (replaceId?: string) => void;
}) {
  const t = useT();
  const banners = isBannerProfile(project.exportProfile);
  const panelId = useId();
  const inspectorRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<Partial<Record<InspectorTab, HTMLButtonElement>>>({});
  useEffect(() => {
    if (inspectorRef.current) inspectorRef.current.scrollTop = 0;
  }, [tab]);
  const { edit, endGroup, project: originalProject } = useEditor();
  const sourceShot =
    originalProject?.shots.find((item) => item.id === shot.id) ?? shot;
  const style = resolveStyle(project, shot);
  const defaultPlacement = templateLayout(project, style).phone;
  const defaultDeviceWidth = defaultPlacement.width;
  const brand = appliedBrand(project, shot);
  const pair = panoramaPair(project, shot.id);
  const surfaceLabel = getTemplate(style.template).surfaceLabel;
  const secondaryLabel =
    style.backgroundMode === "solid" && surfaceLabel
      ? surfaceLabel
      : "Gradient end";
  function updateShot(
    recipe: (draft: Shot) => void,
    group?: string,
    shared = true,
  ) {
    edit(
      (project) => {
        const targets = shared
          ? linkedShots(project, shot.id)
          : project.shots.filter((item) => item.id === shot.id);
        targets.forEach(recipe);
      },
      group && `${shot.id}:${group}`,
    );
  }
  function setStyle(patch: Partial<Style>) {
    updateShot((shot) => {
      Object.assign(shot.style, patch);
      if (
        patch.device ||
        patch.deviceOrientation ||
        (pair && patch.frame !== undefined)
      )
        resetComposition(project, shot);
    });
  }
  function range(
    label: string,
    key: "x" | "y" | "width" | "rotation",
    min: number,
    max: number,
  ) {
    return (
      <label className="range-field">
        <span>
          {t(label)}
          <output>
            {key === "width"
              ? Math.round((shot.phone.width / defaultDeviceWidth) * 100)
              : Math.round(shot.phone[key])}
            <span className="unit">
              {key === "width" ? "%" : key === "rotation" ? "°" : " px"}
            </span>
          </output>
        </span>
        <input
          type="range"
          aria-label={t(label)}
          aria-valuetext={
            key === "width"
              ? t("{percent}% of template size", {
                  percent: Math.round(
                    (shot.phone.width / defaultDeviceWidth) * 100,
                  ),
                })
              : undefined
          }
          min={min}
          max={max}
          step={1}
          value={shot.phone[key]}
          onChange={(event) =>
            updateShot((shot) => {
              if (key === "width")
                resizeDevice(
                  shot,
                  resolveStyle(project, shot),
                  Number(event.target.value),
                );
              else shot.phone[key] = Number(event.target.value);
            }, key)
          }
          onPointerUp={endGroup}
          onBlur={endGroup}
        />
      </label>
    );
  }
  if (resolveExportProfile(project).sourceOnly)
    return (
      <aside
        ref={inspectorRef}
        id="slide-inspector"
        className="inspector inspector-tabbed"
        aria-label={t("Screenshot properties")}
        tabIndex={0}
      >
        <section className="property-section">
          <h3>{t("Original app capture")}</h3>
          <p className="field-help">
            {t(
              "Wear OS shows your square app capture without added text, frames, or graphics. Your design stays saved for other destinations.",
            )}
          </p>
          <button
            className="button secondary full"
            disabled={disabled}
            onClick={() => onReplace("device")}
          >
            {t(shot.assetId === null ? "Add image" : "Replace image")}
          </button>
        </section>
        <CanvasSettings project={project} />
      </aside>
    );
  return (
    <aside
      ref={inspectorRef}
      id="slide-inspector"
      className="inspector inspector-tabbed"
      aria-label={t(banners ? "Banner properties" : "Screenshot properties")}
      tabIndex={0}
    >
      <div className="inspector-header">
        <div className="panel-heading">
          <div>
            <h2>
              {tab === "canvas"
                ? t("Project canvas")
                : t(banners ? "Banner {number}" : "Slide {number}", {
                    number: String(project.shots.indexOf(shot) + 1).padStart(
                      2,
                      "0",
                    ),
                  })}
            </h2>
            <p>
              {tab === "canvas"
                ? t("Size and orientation for your series")
                : getTemplate(style.template).name}
            </p>
          </div>
          <button
            type="button"
            className="icon-button mobile-preview-link"
            aria-label={t("Back to preview")}
            onClick={onPreview}
          >
            <Icon name="canvas" size={16} />
            {t("Preview")}
          </button>
          <span className="scope-label desktop-scope">
            {tab === "canvas"
              ? t("All slides")
              : pair
                ? t("Linked pair")
                : t("Editing")}
          </span>
        </div>
        <div
          className="inspector-tabs"
          role="tablist"
          aria-label={t("Editing tools")}
        >
          {inspectorTabs.map((item, index) => (
            <button
              type="button"
              key={item.id}
              role="tab"
              id={`${panelId}-${item.id}-tab`}
              aria-controls={`${panelId}-${item.id}-panel`}
              aria-selected={tab === item.id}
              tabIndex={tab === item.id ? 0 : -1}
              ref={(node) => {
                if (node) tabRefs.current[item.id] = node;
              }}
              onClick={() => onTabChange(item.id)}
              onKeyDown={(event) => {
                let next = index;
                if (event.key === "ArrowRight")
                  next = (index + 1) % inspectorTabs.length;
                else if (event.key === "ArrowLeft")
                  next =
                    (index + inspectorTabs.length - 1) % inspectorTabs.length;
                else if (event.key === "Home") next = 0;
                else if (event.key === "End") next = inspectorTabs.length - 1;
                else return;
                event.preventDefault();
                onTabChange(inspectorTabs[next].id);
                tabRefs.current[inspectorTabs[next].id]?.focus();
              }}
            >
              <Icon
                name={banners && item.id === "device" ? "image" : item.icon}
                size={17}
              />
              {t(banners && item.id === "device" ? "Image" : item.label)}
            </button>
          ))}
        </div>
      </div>
      <fieldset disabled={disabled} className="inspector-fields">
        <div
          role="tabpanel"
          id={`${panelId}-design-panel`}
          aria-labelledby={`${panelId}-design-tab`}
          hidden={tab !== "design"}
          tabIndex={0}
          className="inspector-tab-panel"
        >
          <section className="property-section template-property">
            <div>
              <span className="eyebrow">{t("TEMPLATE")}</span>
              <h3>{getTemplate(style.template).name}</h3>
            </div>
            <button
              type="button"
              className="button secondary"
              onClick={onTemplates}
            >
              {t("Change")}
              <Icon name="layout" size={15} />
            </button>
          </section>
          <section className="property-section">
            <h3>{t("Make it reusable")}</h3>
            <div className="saved-template-actions">
              <button
                type="button"
                className="text-button"
                onClick={() => onMyTemplates(true)}
              >
                <Icon name="plus" size={14} />
                {t("Save as template")}
              </button>
              <button
                type="button"
                className="text-button"
                onClick={() => onMyTemplates(false)}
              >
                {t("My templates")}
              </button>
            </div>
          </section>
          <BackgroundImageInspector shot={shot} onUpload={onBackgroundUpload} />
          <OverlayInspector
            key={shot.id}
            project={project}
            shot={shot}
            images={images}
            selectedElement={selectedElement}
            onSelect={onOverlaySelect}
            onUpload={onOverlayUpload}
          />
          <section className="property-section">
            <div className="brand-property-heading">
              <h3>{t("Brand kit")}</h3>
              <Icon name="brand" size={17} />
            </div>
            <button
              type="button"
              className="brand-property-selector"
              onClick={onBrandKits}
            >
              {brand ? (
                <BrandBadge kit={brand} />
              ) : (
                <Icon name="brand" size={28} />
              )}
              <span>
                <strong>{brand?.name ?? t("Choose your app’s brand")}</strong>
                <small>
                  {brand
                    ? t("Brand kit applied · Manage & reapply")
                    : t("Colors and fonts, ready to reuse")}
                </small>
              </span>
              <Icon name="right" size={15} />
            </button>
          </section>
          <section className="property-section">
            <h3>{t("Color story")}</h3>
            <div
              className="segmented"
              role="group"
              aria-label={t("Background finish")}
            >
              <button
                type="button"
                aria-pressed={style.backgroundMode === "solid"}
                onClick={() => setStyle({ backgroundMode: "solid" })}
              >
                {t("Solid")}
              </button>
              <button
                type="button"
                aria-pressed={style.backgroundMode === "gradient"}
                onClick={() => setStyle({ backgroundMode: "gradient" })}
              >
                {t("Gradient")}
              </button>
            </div>
            <div
              className="swatches"
              role="group"
              aria-label={t("Color palettes")}
            >
              {palettes.map((palette) => (
                <button
                  type="button"
                  key={palette.name}
                  title={t(palette.name)}
                  aria-label={t("{name} palette", { name: t(palette.name) })}
                  aria-pressed={
                    style.background === palette.background &&
                    style.textColor === palette.textColor
                  }
                  style={{
                    background: palette.background,
                    color: palette.textColor,
                  }}
                  onClick={() =>
                    setStyle({
                      background: palette.background,
                      textColor: palette.textColor,
                      backgroundEnd: palette.background,
                      backgroundMode: "solid",
                      accentColor: palette.textColor,
                    })
                  }
                >
                  {style.background === palette.background &&
                  style.textColor === palette.textColor ? (
                    <Icon name="check" />
                  ) : (
                    <span>Aa</span>
                  )}
                </button>
              ))}
            </div>
            <div className="color-fields">
              <label>
                {t("Background")}
                <input
                  type="color"
                  aria-label={t("Background color")}
                  value={style.background}
                  onChange={(event) =>
                    updateShot((shot) => {
                      shot.style.background = event.target.value;
                    }, "background")
                  }
                  onBlur={endGroup}
                />
              </label>
              <label>
                {t("Text")}
                <input
                  type="color"
                  aria-label={t("Text color")}
                  value={style.textColor}
                  onChange={(event) =>
                    updateShot((shot) => {
                      shot.style.textColor = event.target.value;
                    }, "textColor")
                  }
                  onBlur={endGroup}
                />
              </label>
            </div>
            <div className="color-fields">
              <label>
                {t(secondaryLabel)}
                <input
                  type="color"
                  aria-label={t("{name} color", { name: t(secondaryLabel) })}
                  value={style.backgroundEnd}
                  disabled={
                    disabled ||
                    (style.backgroundMode === "solid" && !surfaceLabel)
                  }
                  onChange={(event) =>
                    updateShot((shot) => {
                      shot.style.backgroundEnd = event.target.value;
                    }, "backgroundEnd")
                  }
                  onBlur={endGroup}
                />
              </label>
              <label>
                {t("Accent")}
                <input
                  type="color"
                  aria-label={t("Accent color")}
                  value={style.accentColor}
                  onChange={(event) =>
                    updateShot((shot) => {
                      shot.style.accentColor = event.target.value;
                    }, "accentColor")
                  }
                  onBlur={endGroup}
                />
              </label>
            </div>
            <label className="check-field">
              <input
                type="checkbox"
                checked={style.texture === "dots"}
                onChange={(event) =>
                  setStyle({ texture: event.target.checked ? "dots" : "none" })
                }
              />
              {t("Subtle dot texture")}
            </label>
          </section>
          {pair && (
            <section className="property-section panorama-info">
              <h3>{t("Linked panorama")}</h3>
              <p className="field-help">
                {t(
                  "The image, frame, colors, and position are shared. Text belongs to the selected slide.",
                )}
              </p>
              <button
                type="button"
                className="text-button"
                onClick={() =>
                  edit((draft) =>
                    applyTemplate(draft, shot.id, "studio", false, true),
                  )
                }
              >
                {t("Separate slides")}
              </button>
              <p className="field-help">
                {t("Returns both slides to Studio. Undo anytime.")}
              </p>
            </section>
          )}
          <section className="property-section series-style">
            <h3>{t("Keep the series together")}</h3>
            <p className="field-help">
              {t(
                banners
                  ? "Use these colors and typography across every banner. Templates, text, and image positions are preserved."
                  : "Use these colors, typography, and frame across every screenshot. Templates and text are preserved. Devices are resized to fit if their shape changes.",
              )}
            </p>
            <button
              type="button"
              className="button secondary full"
              onClick={() =>
                edit((project) => {
                  const { template: _template, ...shared } = resolveStyle(
                    project,
                    project.shots.find((item) => item.id === shot.id)!,
                  );
                  const previous = project.shots.map((item) =>
                    resolveStyle(project, item),
                  );
                  Object.assign(project.style, shared);
                  project.shots.forEach((shot, index) => {
                    shot.style = shot.style.template
                      ? { template: shot.style.template }
                      : {};
                    if (
                      previous[index].device !== shared.device ||
                      previous[index].deviceOrientation !==
                        shared.deviceOrientation ||
                      previous[index].frame !== shared.frame
                    )
                      resetComposition(project, shot);
                  });
                })
              }
            >
              {t(
                project.shots.length === 1
                  ? "Apply style to this slide"
                  : "Apply style to all {count}",
                { count: project.shots.length },
              )}
            </button>
            {Object.keys(shot.style).some((key) => key !== "template") && (
              <button
                type="button"
                className="text-button"
                onClick={() =>
                  updateShot((shot) => {
                    shot.style = shot.style.template
                      ? { template: shot.style.template }
                      : {};
                    resetComposition(project, shot);
                  })
                }
              >
                {t("Reset to project style")}
              </button>
            )}
          </section>
        </div>
        <div
          role="tabpanel"
          id={`${panelId}-text-panel`}
          aria-labelledby={`${panelId}-text-tab`}
          hidden={tab !== "text"}
          tabIndex={0}
          className="inspector-tab-panel"
        >
          <section className="property-section">
            <div className="section-heading">
              <h3>{t("Words")}</h3>
              <span className="scope-label">
                {t("Slide {number}", {
                  number: String(project.shots.indexOf(shot) + 1).padStart(
                    2,
                    "0",
                  ),
                })}
              </span>
            </div>
            <p className="section-intro">
              {locale
                ? t(
                    "Editing {language}. Design changes apply to every language.",
                    { language: languageName(locale) },
                  )
                : t("Write your story. Drag the text to place it.")}
            </p>
            <button
              type="button"
              className="text-button language-text-link"
              onClick={onLanguages}
            >
              <Icon name="languages" size={16} />
              {locale
                ? t("Review translation · {status}", {
                    status: t(localeStatus(sourceShot, locale)),
                  })
                : t("Add a language version")}
            </button>
            <label
              className={`field text-editor ${selectedElement === "title" ? "is-selected" : ""}`}
            >
              {t("Headline")}
              <textarea
                maxLength={locale ? 300 : 100}
                rows={3}
                value={shot.title}
                onChange={(event) =>
                  updateShot(
                    (shot) => {
                      writeText(shot, locale, "title", event.target.value);
                    },
                    "title",
                    false,
                  )
                }
                onBlur={endGroup}
              />
            </label>
            <div className="text-field-footer">
              <span>
                {shot.title.length} / {locale ? 300 : 100}
              </span>
              <button
                type="button"
                className="text-button"
                disabled={
                  locale
                    ? !sourceShot.translations?.[locale]?.textOffsets?.title
                    : !shot.textOffsets?.title
                }
                aria-label={t("Reset headline position")}
                onClick={() =>
                  updateShot(
                    (target) => {
                      if (locale)
                        delete localContent(target, locale).textOffsets?.title;
                      else resetText(target, "title");
                    },
                    undefined,
                    false,
                  )
                }
              >
                <Icon name="reset" size={13} />
                {t("Reset position")}
              </button>
            </div>
            <label
              className={`field text-editor ${selectedElement === "subtitle" ? "is-selected" : ""}`}
            >
              {t("Supporting text")}
              <textarea
                maxLength={locale ? 450 : 150}
                rows={2}
                value={shot.subtitle}
                onChange={(event) =>
                  updateShot(
                    (shot) => {
                      writeText(shot, locale, "subtitle", event.target.value);
                    },
                    "subtitle",
                    false,
                  )
                }
                onBlur={endGroup}
              />
            </label>
            <div className="text-field-footer">
              <span>
                {shot.subtitle.length} / {locale ? 450 : 150}
              </span>
              <button
                type="button"
                className="text-button"
                disabled={
                  locale
                    ? !sourceShot.translations?.[locale]?.textOffsets?.subtitle
                    : !shot.textOffsets?.subtitle
                }
                aria-label={t("Reset supporting text position")}
                onClick={() =>
                  updateShot(
                    (target) => {
                      if (locale)
                        delete localContent(target, locale).textOffsets
                          ?.subtitle;
                      else resetText(target, "subtitle");
                    },
                    undefined,
                    false,
                  )
                }
              >
                <Icon name="reset" size={13} />
                {t("Reset position")}
              </button>
            </div>
            <div
              className="segmented"
              role="group"
              aria-label={t("Text alignment")}
            >
              <button
                type="button"
                aria-pressed={style.align === "left"}
                onClick={() => setStyle({ align: "left" })}
              >
                {t("Left aligned")}
              </button>
              <button
                type="button"
                aria-pressed={style.align === "center"}
                onClick={() => setStyle({ align: "center" })}
              >
                {t("Centered")}
              </button>
            </div>
            <label className="range-field">
              <span>
                {t("Headline size")}
                <output>
                  {style.titleSize}
                  <span className="unit"> px</span>
                </output>
              </span>
              <input
                type="range"
                aria-label={t("Headline size")}
                min={48}
                max={132}
                step={1}
                value={style.titleSize}
                onChange={(event) =>
                  updateShot((shot) => {
                    if (locale)
                      localContent(shot, locale).titleSize = Number(
                        event.target.value,
                      );
                    else shot.style.titleSize = Number(event.target.value);
                  }, "titleSize")
                }
                onPointerUp={endGroup}
                onBlur={endGroup}
              />
            </label>
            {locale && (
              <button
                type="button"
                className="text-button"
                onClick={() =>
                  updateShot((target) => {
                    delete localContent(target, locale).titleSize;
                  })
                }
              >
                {t("Reset to shared headline size")}
              </button>
            )}
            <label className="check-field">
              <input
                type="checkbox"
                checked={style.accentTitle}
                onChange={(event) =>
                  setStyle({ accentTitle: event.target.checked })
                }
              />
              {t("Accent the last headline line")}
            </label>
            <p className="field-help">
              {t(
                "Add a line break to choose where the accent begins. Long headlines shrink to fit automatically.",
              )}
            </p>
          </section>
        </div>
        <div
          role="tabpanel"
          id={`${panelId}-device-panel`}
          aria-labelledby={`${panelId}-device-tab`}
          hidden={tab !== "device"}
          tabIndex={0}
          className="inspector-tab-panel"
        >
          {shot.companions ? (
            <DeviceCompositionInspector
              project={project}
              shot={shot}
              sourceShot={sourceShot}
              locale={locale}
              selectedElement={selectedElement}
              onSelect={onSelectDevice}
              onReplace={onReplace}
              deviceNames={deviceNames}
            />
          ) : (
            <>
              <section className="property-section device-size-section">
                <div className="section-heading">
                  <h3>{t(banners ? "Image size" : "Device size")}</h3>
                  <button
                    type="button"
                    className="text-button"
                    aria-label={t(
                      banners ? "Reset image size" : "Reset device size",
                    )}
                    onClick={() =>
                      updateShot((target) =>
                        resizeDevice(
                          target,
                          resolveStyle(project, target),
                          defaultDeviceWidth,
                        ),
                      )
                    }
                  >
                    <Icon name="reset" size={14} />
                    {t("Reset size")}
                  </button>
                </div>
                {range(
                  banners ? "Image size" : "Device size",
                  "width",
                  PLACEMENT_LIMITS.width.min,
                  PLACEMENT_LIMITS.width.max,
                )}
                <p className="field-help">
                  {t(
                    "Drag a corner on the canvas, or adjust here. 100% is the template’s original size.",
                  )}
                  {pair ? <> {t("Both slides resize together.")}</> : null}
                </p>
              </section>
              <DeviceRotationControl
                angle={shot.phone.rotation}
                label={banners ? "Image rotation" : "Device rotation"}
                onChange={(angle) =>
                  updateShot((target) => {
                    target.phone.rotation = angle;
                  }, "rotation")
                }
                onCommit={endGroup}
                onReset={() =>
                  updateShot((target) => {
                    target.phone.rotation = defaultPlacement.rotation;
                  })
                }
              />
              <section className="property-section">
                {banners ? (
                  <>
                    <h3>{t("Image or icon")}</h3>
                    <p className="field-help">
                      {t(
                        "Your image keeps its proportions and transparency. The exported banner has an opaque background.",
                      )}
                    </p>
                  </>
                ) : (
                  <>
                    <h3>{t("Device frame")}</h3>
                    <p className="section-intro">
                      {pair
                        ? t("Frame and placement are shared by both slides.")
                        : t("Choose a frame for this slide.")}
                    </p>
                    <div
                      className="device-options"
                      role="group"
                      aria-label={t("Device family")}
                    >
                      {Object.entries(deviceNames).map(([device, name]) => (
                        <button
                          type="button"
                          key={device}
                          aria-pressed={style.device === device}
                          onClick={() =>
                            setStyle({
                              device: device as Style["device"],
                            })
                          }
                        >
                          <span className={`device-glyph ${device}`} />
                          {t(name)}
                        </button>
                      ))}
                    </div>
                    <div className="orientation-settings">
                      <FrameOrientation
                        style={style}
                        linked={!!pair}
                        onChange={(deviceOrientation) =>
                          setStyle({ deviceOrientation })
                        }
                      />
                    </div>
                    <label className="check-field">
                      <input
                        type="checkbox"
                        checked={style.frame}
                        onChange={(event) =>
                          setStyle({ frame: event.target.checked })
                        }
                      />{" "}
                      {style.device === "card"
                        ? t("Rounded corners")
                        : t("Show device frame")}
                    </label>
                    {style.device !== "card" && (
                      <label className="check-field">
                        <input
                          type="checkbox"
                          checked={style.camera}
                          onChange={(event) =>
                            setStyle({ camera: event.target.checked })
                          }
                        />{" "}
                        {style.device === "ios"
                          ? t("Add Dynamic Island")
                          : t("Add front camera")}
                      </label>
                    )}
                    <p className="field-help">
                      {style.device === "card"
                        ? t(
                            "A simple 4:3 card with a soft shadow. Switch orientation for a vertical card.",
                          )
                        : t(
                            "Original status and navigation bars stay in your screenshot. Keep the cutout off if one is already visible.",
                          )}
                    </p>
                    <label className="field">
                      {t("Screenshot fit")}
                      <select
                        value={style.fit}
                        onChange={(event) =>
                          setStyle({ fit: event.target.value as Style["fit"] })
                        }
                      >
                        <option value="contain">
                          {t("Fit entire screenshot")}
                        </option>
                        <option value="cover">
                          {t("Fill screen · crop edges")}
                        </option>
                      </select>
                    </label>
                  </>
                )}
                <button
                  type="button"
                  className="text-button"
                  onClick={() => onReplace("device")}
                >
                  <Icon name="image" />
                  {shot.assetId === null
                    ? t("Add image")
                    : pair
                      ? t("Replace panorama image")
                      : t("Replace image")}
                </button>
              </section>
              {locale && (
                <section className="property-section">
                  <p className="field-help">
                    {t(
                      "Replacing the screenshot changes only {language}. Its frame and position stay shared.",
                      { language: languageName(locale) },
                    )}
                  </p>
                  {sourceShot.translations?.[locale]?.assetId && (
                    <button
                      className="text-button"
                      onClick={() =>
                        updateShot((target) => {
                          delete localContent(target, locale).assetId;
                        })
                      }
                    >
                      <Icon name="reset" size={14} />
                      {t("Use original image")}
                    </button>
                  )}
                </section>
              )}
              <section className="property-section">
                <div className="section-heading">
                  <h3>{t("Position & rotation")}</h3>
                  <button
                    type="button"
                    className="text-button"
                    aria-label={t(
                      banners
                        ? "Reset image placement"
                        : "Reset device placement",
                    )}
                    onClick={() =>
                      updateShot((shot) => {
                        resetComposition(project, shot);
                      })
                    }
                  >
                    {t("Reset")}
                  </button>
                </div>
                {range(
                  "Horizontal position",
                  "x",
                  PLACEMENT_LIMITS.x.min,
                  PLACEMENT_LIMITS.x.max,
                )}
                {range(
                  "Vertical position",
                  "y",
                  PLACEMENT_LIMITS.y.min,
                  PLACEMENT_LIMITS.y.max,
                )}
                <p className="field-help">
                  {t(
                    banners
                      ? "Drag the image to move it. Reset restores the template’s size, position, and rotation."
                      : "Drag the device to move it. Reset restores the template’s size, position, and rotation.",
                  )}
                </p>
              </section>
            </>
          )}
        </div>
        <div
          role="tabpanel"
          id={`${panelId}-canvas-panel`}
          aria-labelledby={`${panelId}-canvas-tab`}
          hidden={tab !== "canvas"}
          tabIndex={0}
          className="inspector-tab-panel"
        >
          <CanvasSettings
            project={project}
            frameOrientation={
              <FrameOrientation
                style={style}
                linked={!!pair}
                onChange={(deviceOrientation) =>
                  setStyle({ deviceOrientation })
                }
              />
            }
          />
        </div>
      </fieldset>
    </aside>
  );
}
