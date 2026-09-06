import { resolveStyle } from "../core/model";
import type { Project, Shot, Style } from "../core/model";
import { useEditor } from "./store";
import { Icon } from "../app/Icon";
import { getTemplate } from "../core/templates";

const palettes = [
  { name: "Sage", background: "#E3E8DE", textColor: "#202725" },
  { name: "Paper", background: "#F6F4ED", textColor: "#202725" },
  { name: "Peach", background: "#F3D6C6", textColor: "#503023" },
  { name: "Sky", background: "#D8E4EB", textColor: "#263F4C" },
  { name: "Ink", background: "#202725", textColor: "#F6F4ED" },
];
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
  function updateShot(recipe: (draft: Shot) => void, group?: string) {
    edit(
      (project) => {
        const selected = project.shots.find((item) => item.id === shot.id);
        if (selected) recipe(selected);
      },
      group && `${shot.id}:${group}`,
    );
  }
  function setStyle(patch: Partial<Style>) {
    updateShot((shot) => {
      Object.assign(shot.style, patch);
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
    <aside className="inspector" aria-label="Screenshot properties">
      <div className="panel-heading">
        <h2>Make it yours</h2>
        <span>
          {String(
            project.shots.findIndex((s) => s.id === shot.id) + 1,
          ).padStart(2, "0")}
        </span>
      </div>
      <fieldset disabled={disabled} className="inspector-fields">
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
                updateShot((shot) => {
                  shot.title = event.target.value;
                }, "title")
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
                updateShot((shot) => {
                  shot.subtitle = event.target.value;
                }, "subtitle")
              }
              onBlur={endGroup}
            />
          </label>
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
              {style.template === "editorial" &&
              style.backgroundMode === "solid"
                ? "Panel"
                : "Gradient end"}
              <input
                type="color"
                aria-label={
                  style.template === "editorial" &&
                  style.backgroundMode === "solid"
                    ? "Panel color"
                    : "Gradient end color"
                }
                value={style.backgroundEnd}
                disabled={
                  disabled ||
                  (style.backgroundMode === "solid" &&
                    style.template !== "editorial")
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
          <h3>Device frame</h3>
          <div
            className="segmented device-options"
            role="group"
            aria-label="Device family"
          >
            <button
              type="button"
              aria-pressed={style.device === "android"}
              onClick={() => setStyle({ device: "android" })}
            >
              <span className="device-glyph android" />
              Android
            </button>
            <button
              type="button"
              aria-pressed={style.device === "ios"}
              onClick={() => setStyle({ device: "ios" })}
            >
              <span className="device-glyph ios" />
              iOS
            </button>
          </div>
          <label className="check-field">
            <input
              type="checkbox"
              checked={style.frame}
              onChange={(event) => setStyle({ frame: event.target.checked })}
            />{" "}
            Show device frame
          </label>
          <label className="check-field">
            <input
              type="checkbox"
              checked={style.camera}
              onChange={(event) => setStyle({ camera: event.target.checked })}
            />{" "}
            Add camera cutout
          </label>
          <p className="field-help">
            Original status and navigation bars stay in your screenshot. Keep
            the cutout off if one is already visible.
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
            Replace screenshot
          </button>
        </section>
        <section className="property-section">
          <div className="section-heading">
            <h3>Composition</h3>
            <button
              type="button"
              className="text-button"
              onClick={() =>
                updateShot((shot) => {
                  shot.phone = { ...getTemplate(style.template).phone };
                })
              }
            >
              Reset
            </button>
          </div>
          {range("Phone width", "width", 320, 900)}
          {range("Horizontal position", "x", -200, 900)}
          {range("Vertical position", "y", 100, 1500)}
          {range("Phone rotation", "rotation", -20, 20)}
          <p className="field-help">
            You can also drag the phone on the canvas.
          </p>
        </section>
        <section className="property-section series-style">
          <h3>Keep the series together</h3>
          <p className="field-help">
            Use these colors, typography and frame across every screenshot.
            Templates, words and positions stay as they are.
          </p>
          <button
            type="button"
            className="button secondary full"
            onClick={() =>
              edit((project) => {
                const { template: _template, ...shared } = style;
                Object.assign(project.style, shared);
                project.shots.forEach((shot) => {
                  shot.style = shot.style.template
                    ? { template: shot.style.template }
                    : {};
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
