import { resolveStyle } from "../core/model";
import type { Project, Shot, Style } from "../core/model";
import { useEditor } from "./store";
import { Icon } from "../app/Icon";

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
}: {
  project: Project;
  shot: Shot;
  disabled: boolean;
  onReplace: () => void;
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
    key: "x" | "y" | "width",
    min: number,
    max: number,
  ) {
    return (
      <label className="range-field">
        <span>
          {label}
          <output>
            {Math.round(shot.phone[key])}
            <span className="unit"> px</span>
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
        </section>
        <section className="property-section">
          <h3>Color story</h3>
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
                  shot.phone = { x: 230, y: 485, width: 620 };
                })
              }
            >
              Reset
            </button>
          </div>
          {range("Phone width", "width", 320, 900)}
          {range("Horizontal position", "x", -200, 900)}
          {range("Vertical position", "y", 100, 1500)}
          <p className="field-help">
            You can also drag the phone on the canvas.
          </p>
        </section>
        <section className="property-section series-style">
          <h3>Keep the series together</h3>
          <p className="field-help">
            Use these colors, alignment and frame across every screenshot. Words
            and positions stay as they are.
          </p>
          <button
            type="button"
            className="button secondary full"
            onClick={() =>
              edit((project) => {
                project.style = style;
                project.shots.forEach((shot) => {
                  shot.style = {};
                });
              })
            }
          >
            Apply style to all {project.shots.length}
          </button>
          {Object.keys(shot.style).length > 0 && (
            <button
              type="button"
              className="text-button"
              onClick={() =>
                updateShot((shot) => {
                  shot.style = {};
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
