import { useId } from "react";
import { resolveStyle, PLACEMENT_LIMITS } from "../core/model";
import type { Project, Shot, Style } from "../core/model";
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
}: {
  project: Project;
  shot: Shot;
  disabled: boolean;
  onReplace: () => void;
  onTemplates: () => void;
}) {
  const { edit, endGroup } = useEditor();
  const style = resolveStyle(project, shot);
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
      className="inspector"
      aria-label="Screenshot properties"
      tabIndex={0}
    >
      <div className="panel-heading">
        <h2>Make it yours</h2>
        <span>
          {String(
            project.shots.findIndex((s) => s.id === shot.id) + 1,
          ).padStart(2, "0")}
        </span>
      </div>
      <fieldset disabled={disabled} className="inspector-fields">
        <CanvasSettings
          project={project}
          frameOrientation={
            <FrameOrientation
              style={style}
              linked={!!pair}
              onChange={(deviceOrientation) => setStyle({ deviceOrientation })}
            />
          }
        />
        {pair && (
          <section className="property-section panorama-info">
            <h3>Two slides, one scene</h3>
            <p className="field-help">
              Image, frame, colors and position are shared. Words belong to the
              selected slide.
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
        <section className="property-section">
          <h3>Device frame</h3>
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
          <label className="check-field">
            <input
              type="checkbox"
              checked={style.frame}
              onChange={(event) => setStyle({ frame: event.target.checked })}
            />{" "}
            {style.device === "card" ? "Rounded corners" : "Show device frame"}
          </label>
          {style.device !== "card" && (
            <label className="check-field">
              <input
                type="checkbox"
                checked={style.camera}
                onChange={(event) => setStyle({ camera: event.target.checked })}
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
          <h3>Words</h3>
          <label className="field">
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
          <label className="field">
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
          <div className="text-position-actions">
            <button
              type="button"
              className="text-button"
              disabled={!shot.textOffsets?.title}
              onClick={() =>
                updateShot(
                  (target) => resetText(target, "title"),
                  undefined,
                  false,
                )
              }
            >
              Reset headline position
            </button>
            <button
              type="button"
              className="text-button"
              disabled={!shot.textOffsets?.subtitle}
              onClick={() =>
                updateShot(
                  (target) => resetText(target, "subtitle"),
                  undefined,
                  false,
                )
              }
            >
              Reset supporting text position
            </button>
          </div>
          <p className="field-help">
            Drag either text on the canvas. Each reset restores its template
            position on this slide.
          </p>
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
        <section className="property-section">
          <div className="section-heading">
            <h3>Composition</h3>
            <button
              type="button"
              className="text-button"
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
      </fieldset>
    </aside>
  );
}
