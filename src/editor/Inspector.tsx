import { useEffect, useId, useRef } from "react";
import { resolveStyle, PLACEMENT_LIMITS } from "../core/model";
import type { Project, Shot, Style, CanvasElement } from "../core/model";
import { useEditor } from "./store";
import { Icon } from "../app/Icon";
import {
  applyTemplate,
  getTemplate,
  resetComposition,
} from "../core/templates";
import { linkedShots, panoramaPair } from "../core/panorama";
import { CanvasSettings } from "./CanvasSettings";
import { resetText } from "../core/text-placement";
import { appliedBrand } from "../core/brand-application";
import { BrandBadge } from "./BrandKitDialog";

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
  const helpId = useId();
  const fixed = style.device === "monitor" || style.device === "laptop";
  return (
    <fieldset className="frame-orientation" aria-describedby={helpId}>
      <legend>Frame orientation</legend>
      <p id={helpId} className="orientation-scope">
        {deviceNames[style.device]} ·{" "}
        {linked ? "Both linked slides" : "This slide"}
      </p>
      {fixed ? (
        <div className="frame-fixed-orientation">
          <span className="canvas-shape landscape" aria-hidden="true" />
          <span>
            Landscape <small>Fixed for this frame</small>
          </span>
        </div>
      ) : (
        <div className="segmented">
          {(["portrait", "landscape"] as const).map((orientation) => (
            <button
              type="button"
              key={orientation}
              aria-label={`${orientation === "portrait" ? "Portrait" : "Landscape"} frame`}
              aria-pressed={style.deviceOrientation === orientation}
              onClick={() => onChange(orientation)}
            >
              {orientation === "portrait" ? "Portrait" : "Landscape"}
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
  onTemplates,
  tab,
  onTabChange,
  selectedElement,
  onPreview,
  onBrandKits,
}: {
  project: Project;
  shot: Shot;
  disabled: boolean;
  onReplace: () => void;
  onTemplates: () => void;
  tab: InspectorTab;
  onTabChange: (tab: InspectorTab) => void;
  selectedElement: CanvasElement | null;
  onPreview: () => void;
  onBrandKits: () => void;
}) {
  const panelId = useId();
  const inspectorRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<Partial<Record<InspectorTab, HTMLButtonElement>>>({});
  useEffect(() => {
    if (inspectorRef.current) inspectorRef.current.scrollTop = 0;
  }, [tab]);
  const { edit, endGroup } = useEditor();
  const style = resolveStyle(project, shot);
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
          {label}
          <output>
            {Math.round(shot.phone[key])}
            <span className="unit">{key === "rotation" ? "°" : " px"}</span>
          </output>
        </span>
        <input
          type="range"
          aria-label={label}
          min={min}
          max={max}
          step={1}
          value={shot.phone[key]}
          onChange={(event) =>
            updateShot((shot) => {
              shot.phone[key] = Number(event.target.value);
            }, key)
          }
          onPointerUp={endGroup}
          onBlur={endGroup}
        />
      </label>
    );
  }
  return (
    <aside
      ref={inspectorRef}
      id="slide-inspector"
      className="inspector inspector-tabbed"
      aria-label="Screenshot properties"
      tabIndex={0}
    >
      <div className="inspector-header">
        <div className="panel-heading">
          <div>
            <h2>
              {tab === "canvas"
                ? "Project canvas"
                : `Slide ${String(project.shots.indexOf(shot) + 1).padStart(2, "0")}`}
            </h2>
            <p>
              {tab === "canvas"
                ? "Size and orientation for your series"
                : getTemplate(style.template).name}
            </p>
          </div>
          <button
            type="button"
            className="icon-button mobile-preview-link"
            aria-label="Back to preview"
            onClick={onPreview}
          >
            <Icon name="canvas" size={16} /> Preview
          </button>
          <span className="scope-label desktop-scope">
            {tab === "canvas" ? "All slides" : pair ? "Linked pair" : "Editing"}
          </span>
        </div>
        <div
          className="inspector-tabs"
          role="tablist"
          aria-label="Editing tools"
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
              <Icon name={item.icon} size={17} />
              {item.label}
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
              <span className="eyebrow">TEMPLATE</span>
              <h3>{getTemplate(style.template).name}</h3>
            </div>
            <button
              type="button"
              className="button secondary"
              onClick={onTemplates}
            >
              Change
              <Icon name="layout" size={15} />
            </button>
          </section>
          <section className="property-section">
            <div className="brand-property-heading">
              <h3>Brand kit</h3>
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
                <strong>{brand?.name ?? "Choose your app’s brand"}</strong>
                <small>
                  {brand
                    ? "Applied copy · Manage & reapply"
                    : "Colors and fonts, ready to reuse"}
                </small>
              </span>
              <Icon name="right" size={15} />
            </button>
          </section>
          <section className="property-section">
            <h3>Color story</h3>
            <div
              className="segmented"
              role="group"
              aria-label="Background finish"
            >
              <button
                type="button"
                aria-pressed={style.backgroundMode === "solid"}
                onClick={() => setStyle({ backgroundMode: "solid" })}
              >
                Solid
              </button>
              <button
                type="button"
                aria-pressed={style.backgroundMode === "gradient"}
                onClick={() => setStyle({ backgroundMode: "gradient" })}
              >
                Gradient
              </button>
            </div>
            <div className="swatches" role="group" aria-label="Color palettes">
              {palettes.map((palette) => (
                <button
                  type="button"
                  key={palette.name}
                  title={palette.name}
                  aria-label={`${palette.name} palette`}
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
                Background
                <input
                  type="color"
                  aria-label="Background color"
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
                Text
                <input
                  type="color"
                  aria-label="Text color"
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
                {secondaryLabel}
                <input
                  type="color"
                  aria-label={`${secondaryLabel} color`}
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
                Accent
                <input
                  type="color"
                  aria-label="Accent color"
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
              Subtle dot texture
            </label>
          </section>
          {pair && (
            <section className="property-section panorama-info">
              <h3>Linked panorama</h3>
              <p className="field-help">
                Image, frame, colors and position are shared. Words belong to
                the selected slide.
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
                Separate slides
              </button>
              <p className="field-help">
                Returns both slides to Studio. Undo anytime.
              </p>
            </section>
          )}
          <section className="property-section series-style">
            <h3>Keep the series together</h3>
            <p className="field-help">
              Use these colors, typography and frame across every screenshot.
              Templates and words stay. Devices that change shape are refitted.
            </p>
            <button
              type="button"
              className="button secondary full"
              onClick={() =>
                edit((project) => {
                  const { template: _template, ...shared } = style;
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
              Apply style to all {project.shots.length}
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
                Reset to project style
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
              <h3>Words</h3>
              <span className="scope-label">
                Slide {String(project.shots.indexOf(shot) + 1).padStart(2, "0")}
              </span>
            </div>
            <p className="section-intro">
              Write your story. Drag the text to place it.
            </p>
            <label
              className={`field text-editor ${selectedElement === "title" ? "is-selected" : ""}`}
            >
              Headline
              <textarea
                maxLength={100}
                rows={3}
                value={shot.title}
                onChange={(event) =>
                  updateShot(
                    (shot) => {
                      shot.title = event.target.value;
                    },
                    "title",
                    false,
                  )
                }
                onBlur={endGroup}
              />
            </label>
            <div className="text-field-footer">
              <span>{shot.title.length} / 100</span>
              <button
                type="button"
                className="text-button"
                disabled={!shot.textOffsets?.title}
                aria-label="Reset headline position"
                onClick={() =>
                  updateShot(
                    (target) => resetText(target, "title"),
                    undefined,
                    false,
                  )
                }
              >
                <Icon name="reset" size={13} /> Reset position
              </button>
            </div>
            <label
              className={`field text-editor ${selectedElement === "subtitle" ? "is-selected" : ""}`}
            >
              Supporting text
              <textarea
                maxLength={150}
                rows={2}
                value={shot.subtitle}
                onChange={(event) =>
                  updateShot(
                    (shot) => {
                      shot.subtitle = event.target.value;
                    },
                    "subtitle",
                    false,
                  )
                }
                onBlur={endGroup}
              />
            </label>
            <div className="text-field-footer">
              <span>{shot.subtitle.length} / 150</span>
              <button
                type="button"
                className="text-button"
                disabled={!shot.textOffsets?.subtitle}
                aria-label="Reset supporting text position"
                onClick={() =>
                  updateShot(
                    (target) => resetText(target, "subtitle"),
                    undefined,
                    false,
                  )
                }
              >
                <Icon name="reset" size={13} /> Reset position
              </button>
            </div>
            <div className="segmented" role="group" aria-label="Text alignment">
              <button
                type="button"
                aria-pressed={style.align === "left"}
                onClick={() => setStyle({ align: "left" })}
              >
                Left aligned
              </button>
              <button
                type="button"
                aria-pressed={style.align === "center"}
                onClick={() => setStyle({ align: "center" })}
              >
                Centered
              </button>
            </div>
            <label className="range-field">
              <span>
                Headline size
                <output>
                  {style.titleSize}
                  <span className="unit"> px</span>
                </output>
              </span>
              <input
                type="range"
                aria-label="Headline size"
                min={48}
                max={132}
                step={1}
                value={style.titleSize}
                onChange={(event) =>
                  updateShot((shot) => {
                    shot.style.titleSize = Number(event.target.value);
                  }, "titleSize")
                }
                onPointerUp={endGroup}
                onBlur={endGroup}
              />
            </label>
            <label className="check-field">
              <input
                type="checkbox"
                checked={style.accentTitle}
                onChange={(event) =>
                  setStyle({ accentTitle: event.target.checked })
                }
              />
              Accent the last headline line
            </label>
            <p className="field-help">
              Add a line break to choose where the accent begins. Long headlines
              fit down automatically.
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
          <section className="property-section">
            <h3>Device frame</h3>
            <p className="section-intro">
              {pair
                ? "Frame and placement are shared by both slides."
                : "Choose a frame for this slide."}
            </p>
            <div
              className="device-options"
              role="group"
              aria-label="Device family"
            >
              {Object.entries(deviceNames).map(([device, name]) => (
                <button
                  type="button"
                  key={device}
                  aria-pressed={style.device === device}
                  onClick={() =>
                    setStyle({
                      device: device as Style["device"],
                      ...(device === "card" && style.device !== "card"
                        ? { deviceOrientation: "landscape" as const }
                        : {}),
                    })
                  }
                >
                  <span className={`device-glyph ${device}`} />
                  {name}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="orientation-link"
              onClick={() => {
                onTabChange("canvas");
                tabRefs.current.canvas?.focus({ preventScroll: true });
              }}
            >
              <Icon name="canvas" size={16} /> Canvas &amp; frame orientation{" "}
              <Icon name="right" size={14} />
            </button>
            <label className="check-field">
              <input
                type="checkbox"
                checked={style.frame}
                onChange={(event) => setStyle({ frame: event.target.checked })}
              />{" "}
              {style.device === "card"
                ? "Rounded corners"
                : "Show device frame"}
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
                  ? "Add Dynamic Island"
                  : "Add front camera"}
              </label>
            )}
            <p className="field-help">
              {style.device === "card"
                ? "A simple 4:3 card with a soft shadow. Switch orientation for a vertical card."
                : "Original status and navigation bars stay in your screenshot. Keep the cutout off if one is already visible."}
            </p>
            <label className="field">
              Screenshot fit
              <select
                value={style.fit}
                onChange={(event) =>
                  setStyle({ fit: event.target.value as Style["fit"] })
                }
              >
                <option value="contain">Fit entire screenshot</option>
                <option value="cover">Fill screen · crop edges</option>
              </select>
            </label>
            <button type="button" className="text-button" onClick={onReplace}>
              <Icon name="image" />
              {pair ? "Replace panorama image" : "Replace image"}
            </button>
          </section>
          <section className="property-section">
            <div className="section-heading">
              <h3>Position &amp; size</h3>
              <button
                type="button"
                className="text-button"
                aria-label="Reset device position"
                onClick={() =>
                  updateShot((shot) => {
                    resetComposition(project, shot);
                  })
                }
              >
                Reset
              </button>
            </div>
            {range(
              "Device width",
              "width",
              PLACEMENT_LIMITS.width.min,
              PLACEMENT_LIMITS.width.max,
            )}
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
            {range("Device rotation", "rotation", -20, 20)}
            <p className="field-help">
              You can also drag the device on the canvas.
            </p>
          </section>
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
